require 'jekyll'
require 'jekyll-terser'
require 'tmpdir'
require 'fileutils'
require 'json'
require 'open3'
require 'tempfile'

plugin = File.expand_path('../_plugins/terser-cache.rb', __dir__)
require plugin if File.file?(plugin)

# Count actual compiler invocations while retaining the real Terser implementation.
class CountingTerser < ::Terser
  attr_reader :calls

  def initialize(options)
    super
    @calls = 0
  end

  def compile(source)
    @calls += 1
    super
  end
end

FixtureSite = Struct.new(:source, :cache_dir, :config)
SOURCE = "const message = '∥x∥'; console.log(message); window.answer = 6 * 7;\n"

def assert(condition, message)
  raise message unless condition
end

def site_for(root)
  FixtureSite.new(root, File.join(root, '.jekyll-cache'),
                  'terser' => { 'compress' => { 'drop_console' => true } })
end

def with_fixture
  Dir.mktmpdir('terser-cache-test-') do |root|
    FileUtils.mkdir_p(File.join(root, 'assets/js'))
    File.write(File.join(root, 'assets/js/example.js'), SOURCE)
    File.write(File.join(root, 'Gemfile.lock'), "terser (1.2.4)\n")
    yield site_for(root)
  end
end

def write_js(site)
  compiler = CountingTerser.new(site.config['terser'].transform_keys(&:to_sym))
  file = Jekyll::Terser::JSFile.new(site, site.source, 'assets/js', 'example.js', compiler)
  destination = File.join(site.source, '_site')
  file.write(destination)
  [compiler, File.join(destination, 'assets/js/example.js')]
end

if ARGV.first == '--cache-worker'
  compiler, output = write_js(site_for(ARGV.fetch(1)))
  puts JSON.generate(calls: compiler.calls, output: File.binread(output))
  exit
end

ENV['JEKYLL_ENV'] = 'development'

with_fixture do |site|
  expected = ::Terser.new(site.config['terser'].transform_keys(&:to_sym)).compile(SOURCE)
  first, output = write_js(site)
  second, = write_js(site)
  assert(first.calls == 1 && second.calls == 0, 'Unchanged JavaScript must reuse compilation with a fresh compiler')
  assert(File.binread(output) == expected.b, 'Cached JavaScript must match the real compiler byte for byte')

  stdout, stderr, status = Open3.capture3({ 'JEKYLL_ENV' => 'development' },
                                        RbConfig.ruby, __FILE__, '--cache-worker', site.source)
  assert(status.success?, "Fresh-process fixture failed: #{stderr}")
  result = JSON.parse(stdout)
  assert(result['calls'] == 0 && result['output'].b == expected.b, 'A fresh Ruby process must reuse the persisted exact output')

  File.delete(output)
  restored, = write_js(site)
  assert(restored.calls == 0 && File.binread(output) == expected.b, 'Deleted output must be restored from cache without recompiling')
  puts 'PASS: exact JavaScript survives fresh compilers, process restarts, and deleted output'
end

with_fixture do |site|
  _, output = write_js(site)
  source_path = File.join(site.source, 'assets/js/example.js')
  original_time = File.mtime(source_path)
  changed_source = SOURCE.sub('6 * 7', '6 * 8')
  File.write(source_path, changed_source)
  File.utime(original_time, original_time, source_path)
  changed, = write_js(site)
  expected = ::Terser.new(site.config['terser'].transform_keys(&:to_sym)).compile(changed_source)
  assert(changed.calls == 1 && File.binread(output) == expected.b, 'Changed content must invalidate cache even when its mtime is preserved')
  puts 'PASS: content changes invalidate JavaScript with preserved mtimes'
end

with_fixture do |site|
  write_js(site)
  site.config['terser']['compress']['drop_console'] = false
  changed, output = write_js(site)
  expected = ::Terser.new(site.config['terser'].transform_keys(&:to_sym)).compile(SOURCE)
  assert(changed.calls == 1 && File.binread(output) == expected.b, 'Changed compiler options must invalidate the output cache')
  File.write(File.join(site.source, 'Gemfile.lock'), "terser (next-version)\n")
  changed_version, = write_js(site)
  assert(changed_version.calls == 1, 'Dependency changes must invalidate the output cache')
  puts 'PASS: compiler options and dependency changes invalidate JavaScript'
end

with_fixture do |site|
  _, output = write_js(site)
  entries = Dir[File.join(site.cache_dir, 'terser', '*')].select { |path| File.file?(path) }
  assert(entries.length == 1, 'A successful compilation must persist one cache entry')
  File.binwrite(entries.first, File.binread(entries.first)[0...-1])
  recovered, = write_js(site)
  expected = ::Terser.new(site.config['terser'].transform_keys(&:to_sym)).compile(SOURCE)
  assert(recovered.calls == 1 && File.binread(output) == expected.b, 'Truncated cache entries must be discarded and recompiled')
  puts 'PASS: corrupted cache entries recover through real compilation'
end

with_fixture do |site|
  FileUtils.mkdir_p(site.cache_dir)
  File.write(File.join(site.cache_dir, 'terser'), 'a file blocks the cache directory')
  first, output = write_js(site)
  second, = write_js(site)
  expected = ::Terser.new(site.config['terser'].transform_keys(&:to_sym)).compile(SOURCE)
  assert(first.calls == 1 && second.calls == 1 && File.binread(output) == expected.b, 'Unavailable cache storage must preserve normal compilation')
  puts 'PASS: unavailable cache storage preserves compiler output'
end

with_fixture do |site|
  File.write(File.join(site.source, 'assets/js/example.js'), 'function broken( {')
  original_stderr = STDERR.dup
  Tempfile.create('terser-errors-') do |errors|
    begin
      STDERR.reopen(errors)
      first, output = write_js(site)
      second, = write_js(site)
    ensure
      STDERR.reopen(original_stderr)
      original_stderr.close
    end
    assert(first.calls == 1 && second.calls == 1 && !File.exist?(output), 'Malformed JavaScript must fail compilation each time and never be cached')
    assert(File.read(errors.path).scan('Terser Exception:').length == 2, 'Upstream compiler error reporting must remain intact')
    assert(Dir[File.join(site.cache_dir, 'terser', '*')].empty?, 'Failed compilation must not leave cache entries')
  end
  puts 'PASS: malformed JavaScript is never cached and retains upstream errors'
end

['production', 'development'].each do |environment|
  with_fixture do |site|
    ENV['JEKYLL_ENV'] = environment
    site.config['disable_disk_cache'] = true if environment == 'development'
    first, = write_js(site)
    second, = write_js(site)
    assert(first.calls == 1 && second.calls == 1, 'Production and disabled disk caching must retain normal compilation')
    assert(!File.exist?(File.join(site.cache_dir, 'terser')), 'Production and disabled disk caching must not create a cache')
  end
end
puts 'PASS: production and disable_disk_cache retain existing compilation behavior'

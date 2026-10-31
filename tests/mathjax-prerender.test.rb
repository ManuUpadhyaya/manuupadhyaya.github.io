require 'jekyll'
require 'tmpdir'
require 'fileutils'
require 'json'
require 'jekyll-minifier'
require 'nokogiri'

require_relative '../_plugins/mathjax-prerender'

def assert(condition, message)
  raise message unless condition
end

FixtureSite = Struct.new(:source, :cache_dir, :dest, :config, :static_files) do
  def filter_cache
    @filter_cache ||= {}
  end
end
FixtureDocument = Struct.new(:output, :data, :relative_path)

class FixtureMathWorker
  attr_reader :calls
  attr_accessor :failure

  def initialize
    @calls = 0
  end

  def render(html, options)
    @calls += 1
    raise 'broken formula' if failure

    { 'html' => html.gsub('\\(x\\)', '<mjx-container jax="CHTML">x</mjx-container>'),
      'css' => "mjx-container {color:inherit} /* #{options.fetch('fontURL')} */",
      'fonts' => [] }
  end

  def close; end
end

class FixtureMathCompressor
  include Jekyll::Compressor

  def initialize(site)
    @site = site
  end
end

def with_math_fixture
  Dir.mktmpdir('mathjax-prerender-') do |root|
    FileUtils.mkdir_p(File.join(root, 'scripts'))
    FileUtils.mkdir_p(File.join(root, 'assets/js'))
    File.write(File.join(root, 'scripts/render-math.mjs'), 'renderer signature')
    File.write(File.join(root, 'assets/js/mathjax-setup.js'), 'math configuration')
    File.write(File.join(root, 'package-lock.json'), '{}')
    font_dir = File.join(root, 'node_modules/@mathjax/mathjax-newcm-font/chtml/woff2')
    FileUtils.mkdir_p(font_dir)
    File.binwrite(File.join(font_dir, 'mjx-ncm-n.woff2'), 'wOF2 fixture')
    site = FixtureSite.new(root, File.join(root, '.jekyll-cache'), File.join(root, '_site'),
                           { 'baseurl' => '/project', 'enable_math' => true }, [])
    yield site
  end
end

def math_document(source = '<html><head></head><body><p>Prose \\(x\\).</p></body></html>')
  FixtureDocument.new(source, { 'math' => true }, '/example.html')
end

with_math_fixture do |site|
  worker = FixtureMathWorker.new
  renderer = Jekyll::MathPrerender::Renderer.new(site, worker: worker)
  page = math_document
  renderer.render_document(page)
  assert(page.output.include?('<mjx-container'), 'Math must arrive as rendered HTML')
  assert(!page.output.include?('\\(x\\)'), 'Visible TeX source must be replaced')
  assert(page.output.include?('/project/assets/css/mathjax/'), 'Stylesheet must respect baseurl')
  assert(page.output.index('stylesheet') < page.output.index('</head>'), 'Math stylesheet must block the first paint')
  assert(site.static_files.any? { |asset| asset.relative_path.end_with?('.woff2') }, 'Fonts must participate in Jekyll output cleanup')
  assert(site.static_files.any? { |asset| asset.relative_path.end_with?('.css') }, 'Math CSS must participate in Jekyll output cleanup')
  site.static_files.each { |asset| asset.write(site.dest) }
  assert(Dir[File.join(site.dest, 'assets/css/mathjax/*.css')].size == 1, 'Generated CSS must be written')
  assert(File.binread(File.join(site.dest, 'assets/fonts/mathjax-newcm-4.1.3/mjx-ncm-n.woff2')) == 'wOF2 fixture', 'Local font bytes must be unchanged')
  puts 'PASS: initial math HTML, blocking CSS, base URLs, and exact local fonts'

  site.static_files.clear
  cached_worker = FixtureMathWorker.new
  cached = Jekyll::MathPrerender::Renderer.new(site, worker: cached_worker)
  cached_page = math_document
  cached.render_document(cached_page)
  assert(cached_worker.calls.zero? && cached_page.output == page.output, 'A fresh renderer must reuse exact cached output')
  FileUtils.rm_rf(site.dest)
  site.static_files.each { |asset| asset.write(site.dest) }
  assert(Dir[File.join(site.dest, 'assets/css/mathjax/*.css')].size == 1, 'A cached build must restore deleted CSS')
  assert(Dir[File.join(site.dest, 'assets/fonts/mathjax-newcm-4.1.3/*.woff2')].size == 1, 'A cached build must restore deleted fonts')
  puts 'PASS: fresh workers and deleted outputs restore from complete cached results'

  changed_page = math_document('<html><head></head><body>Changed \\(x\\)</body></html>')
  cached.render_document(changed_page)
  assert(cached_worker.calls == 1, 'Changed content must invalidate its page cache')
  entries = Dir[File.join(site.cache_dir, 'mathjax-prerender/*.json')]
  assert(entries.size == 1, 'Updating a page must replace its cache, not accumulate legacy outputs')
  File.write(entries.first, '{truncated')
  cached.render_document(math_document)
  assert(cached_worker.calls == 2, 'A corrupt cache must trigger fresh rendering')
  puts 'PASS: changed content and corrupt caches re-render without accumulating old pages'
end

with_math_fixture do |site|
  worker = FixtureMathWorker.new
  renderer = Jekyll::MathPrerender::Renderer.new(site, worker: worker)
  renderer.render_document(math_document)
  page = math_document
  page.data['math_scale'] = 1
  renderer.render_document(page)
  assert(worker.calls == 2, 'Changed math options must invalidate cache')
  File.write(File.join(site.source, 'assets/js/mathjax-setup.js'), 'changed configuration')
  Jekyll::MathPrerender::Renderer.new(site, worker: worker).render_document(math_document)
  assert(worker.calls == 3, 'Changed shared math configuration must invalidate cache')
  puts 'PASS: rendering options and shared configuration invalidate caches'
end

with_math_fixture do |site|
  worker = FixtureMathWorker.new
  worker.failure = true
  renderer = Jekyll::MathPrerender::Renderer.new(site, worker: worker)
  begin
    renderer.render_document(math_document)
    raise 'A failed render must stop the build'
  rescue Jekyll::Errors::FatalException => error
    assert(error.message.include?('/example.html') && error.message.include?('broken formula'), 'Build errors must identify the page and cause')
  end
  assert(Dir[File.join(site.cache_dir, 'mathjax-prerender/*.json')].empty?, 'Failed rendering must never be cached')
  puts 'PASS: render failures stop the build with page context and are never cached'
end

with_math_fixture do |site|
  worker = FixtureMathWorker.new
  renderer = Jekyll::MathPrerender::Renderer.new(site, worker: worker)
  plain = math_document
  plain.data['math'] = false
  renderer.render_document(plain)
  pseudo = math_document
  pseudo.data['pseudocode'] = true
  renderer.render_document(pseudo)
  assert(worker.calls.zero? && site.static_files.empty?, 'Plain pages and legacy pseudocode must retain their original routes')
  puts 'PASS: non-mathematical and pseudocode pages are unchanged'
end

scripts = File.read(File.expand_path('../_includes/scripts.liquid', __dir__))
def render_browser_math(scripts, prerender:, math: true, pseudocode: false)
  fixture_site = FixtureSite.new(File.expand_path('..', __dir__), nil, nil, { 'baseurl' => '' }, [])
  Liquid::Template.parse(scripts).render!(
    { 'site' => { 'enable_math' => true, 'math_prerender' => prerender },
      'page' => { 'math' => math, 'pseudocode' => pseudocode } },
    registers: { site: fixture_site }
  )
end
assert(!render_browser_math(scripts, prerender: true).include?('id="MathJax-script"'), 'Pre-rendered pages must not load the browser MathJax renderer')
assert(!render_browser_math(scripts, prerender: true).include?('/assets/js/mathjax-setup.js'), 'Pre-rendered pages must not load browser math setup')
assert(render_browser_math(scripts, prerender: false).include?('id="MathJax-script"'), 'The explicit legacy configuration must retain browser rendering')
assert(render_browser_math(scripts, prerender: true, pseudocode: true).include?('/assets/js/pseudocode-setup.js'), 'Pseudocode must retain its existing browser setup')
puts 'PASS: rendered pages omit browser MathJax, while explicit legacy and pseudocode routes remain available'

Dir.mktmpdir('mathjax-production-minification-') do |root|
  site = FixtureSite.new(File.expand_path('..', __dir__), File.join(root, 'cache'), File.join(root, 'output'),
                         { 'baseurl' => '', 'enable_math' => true,
                           'jekyll-minifier' => { 'compress_javascript' => false } }, [])
  renderer = Jekyll::MathPrerender::Renderer.new(site)
  page = math_document(<<~'HTML')
    <html><head></head><body><p>Ordinary    prose.</p>
    \[\begin{pmatrix}a & b \\ c & d \\ e & f \\ g & h \\ i & j\end{pmatrix}\]
    </body></html>
  HTML
  previous_environment = ENV['JEKYLL_ENV']
  begin
    renderer.render_document(page)
    spacer_text = ->(html) { Nokogiri::HTML5(html).css('mjx-stretchy-v mjx-spacer').map(&:text) }
    original_spacers = spacer_text.call(page.output)
    assert(original_spacers.size == 2 && original_spacers.all? { |text| text.include?("\n") },
           'Tall matrix parentheses must use newline-separated vertical extenders')
    ENV['JEKYLL_ENV'] = 'production'
    output = File.join(root, 'output/index.html')
    FixtureMathCompressor.new(site).output_html(output, page.output)
    minified = File.read(output)
    assert(spacer_text.call(minified) == original_spacers,
           'Production HTML minification must preserve the line breaks that join tall parentheses')
    assert(minified.include?('Ordinary prose.'), 'Ordinary prose must retain production whitespace minification')
    puts 'PASS: production minification preserves vertical delimiter extenders and still compresses prose'
  ensure
    ENV['JEKYLL_ENV'] = previous_environment
    renderer.close
  end
end

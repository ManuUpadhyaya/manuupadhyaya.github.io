require 'jekyll'
require 'tmpdir'
require 'fileutils'
require_relative '../_plugins/style-delivery'

def assert(condition, message)
  raise message unless condition
end

Dir.mktmpdir('style-delivery-jekyll-') do |source|
  FileUtils.mkdir_p(File.join(source, 'scripts'))
  FileUtils.mkdir_p(File.join(source, 'assets/css'))
  File.symlink(File.expand_path('../scripts/optimize-style-delivery.mjs', __dir__), File.join(source, 'scripts/optimize-style-delivery.mjs'))
  File.write(File.join(source, 'purgecss.config.js'), "module.exports = require(#{File.expand_path('../purgecss.config.js', __dir__).inspect});\n")
  css = File.join(source, 'assets/css/main.css')
  File.write(css, 'body { color: red; } .unused { display: none; }')
  link = '<link rel="stylesheet" href="/project/assets/css/main.css">'
  File.write(File.join(source, 'index.html'), "---\n---\n<html><head>#{link}</head><body>Preview</body></html>")
  config = Jekyll.configuration('source' => source, 'destination' => File.join(source, 'preview'),
                                'baseurl' => '/project', 'quiet' => true, 'plugins_dir' => [])
  site = Jekyll::Site.new(config)
  site.process
  output = File.join(site.dest, 'index.html')
  assert(File.read(output).include?('<style>body { color: red; }</style>'), 'Ordinary Jekyll builds must inline the same purged CSS')
  assert(File.read(File.join(site.dest, 'assets/css/main.css')).include?('.unused'), 'Original output CSS must survive for subsequent watch builds')
  File.write(css, 'body { color: blue; } .unused { display: none; }')
  # Jekyll tracks static assets at whole-second mtime precision.
  File.utime(Time.now + 2, Time.now + 2, css)
  site.process
  assert(File.read(output).include?('<style>body { color: blue; }</style>'), 'The same Jekyll instance must inline changed CSS during watch rebuilds')
  puts 'PASS: normal Jekyll post_write hook and changed-CSS watch rebuild'

  previous_node = ENV['NODE_BINARY']
  begin
    ENV['NODE_BINARY'] = File.join(source, 'missing-node')
    begin
      site.process
      raise 'A missing build dependency must fail the build'
    rescue Jekyll::Errors::FatalException => error
      assert(error.message.include?('Stylesheet delivery optimization failed'), 'Missing Node must explain the build failure')
    end
    site.config['inline_blocking_styles'] = false
    site.process
    assert(File.read(output).include?(link), 'The explicit opt-out must retain original stylesheet delivery')
  ensure
    ENV['NODE_BINARY'] = previous_node
  end
  puts 'PASS: missing dependency fails loudly; explicit opt-out bypasses optimization'
end

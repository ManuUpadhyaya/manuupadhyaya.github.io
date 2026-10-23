require 'jekyll'
require 'nokogiri'
require 'tmpdir'
require 'fileutils'
require 'digest/md5'
require_relative '../_plugins/cache-bust'

def assert(condition, message)
  raise message unless condition
end

FIGURE_TEMPLATE = File.expand_path('../_includes/figure.liquid', __dir__)
SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>'
RASTER = 'fixture raster bytes'

def render_figures(baseurl:, responsive:)
  Dir.mktmpdir('figure-cache-key-test-') do |fixture|
    source = File.join(fixture, 'source')
    destination = File.join(fixture, 'output')
    FileUtils.mkdir_p([File.join(source, '_includes'), File.join(source, 'assets/img')])
    FileUtils.cp(FIGURE_TEMPLATE, File.join(source, '_includes/figure.liquid'))
    File.write(File.join(source, 'assets/img/diagram.svg'), SVG)
    File.write(File.join(source, 'assets/img/pixel.png'), RASTER)
    File.write(File.join(source, 'index.html'), <<~LIQUID)
      ---
      ---
      <section id="cached">{% include figure.liquid path="assets/img/diagram.svg" cache_bust=true width="520" height="277" alt="Fixture diagram" caption="Fixture caption" %}</section>
      <section id="plain">{% include figure.liquid path="assets/img/diagram.svg" %}</section>
      <section id="external">{% include figure.liquid path="https://images.example.test/diagram.svg" %}</section>
      <section id="override">{% include figure.liquid path="assets/img/diagram.svg" url="https://images.example.test/override.svg" cache_bust=true %}</section>
      <section id="raster">{% include figure.liquid path="assets/img/pixel.png" cache_bust=true sizes="80vw" %}</section>
    LIQUID
    config = Jekyll.configuration(
      'source' => source,
      'destination' => destination,
      'url' => 'https://example.test',
      'baseurl' => baseurl,
      'plugins' => [],
      'imagemagick' => { 'enabled' => responsive, 'widths' => [256, 512] },
      'lazy_loading_images' => true,
      'quiet' => true
    )
    Dir.chdir(source) { Jekyll::Site.new(config).process }
    yield Nokogiri::HTML.fragment(File.read(File.join(destination, 'index.html')))
  end
end

def check_figures(baseurl:, responsive:)
  render_figures(baseurl: baseurl, responsive: responsive) do |html|
    local_svg = "#{baseurl}/assets/img/diagram.svg"
    cached_svg = "#{local_svg}?#{Digest::MD5.hexdigest(SVG)}"
    expected_images = {
      'cached' => cached_svg,
      'plain' => local_svg,
      'external' => 'https://images.example.test/diagram.svg',
      'override' => 'https://images.example.test/override.svg',
      'raster' => "#{baseurl}/assets/img/pixel.png?#{Digest::MD5.hexdigest(RASTER)}"
    }
    expected_images.each do |id, url|
      assert(html.at_css("##{id} img")['src'] == url, "#{id}: the image URL must retain its existing behavior")
    end
    cached = html.at_css('#cached img')
    assert(cached['width'] == '520' && cached['height'] == '277', 'Figure dimensions must remain unchanged')
    assert(cached['alt'] == 'Fixture diagram', 'Figure alternative text must remain unchanged')
    assert(cached['loading'] == 'lazy' && cached['decoding'] == 'async', 'Image loading and decoding behavior must remain unchanged')
    assert(html.at_css('#cached figcaption').text.strip == 'Fixture caption', 'Figure captions must remain unchanged')

    if responsive
      expected_sources = {
        'cached' => cached_svg,
        'plain' => local_svg,
        'external' => 'https://images.example.test/diagram.svg',
        'override' => local_svg,
        'raster' => "#{baseurl}/assets/img/pixel-256.webp 256w, #{baseurl}/assets/img/pixel-512.webp 512w"
      }
      expected_sources.each do |id, url|
        assert(html.at_css("##{id} source")['srcset'] == url, "#{id}: responsive source must select the correct image/cache key")
      end
      assert(html.at_css('#cached source')['srcset'] == cached['src'], 'SVG display and enhancement fetches must share one cache key')
      assert(html.at_css('#raster source')['type'] == 'image/webp', 'Raster source types must remain unchanged')
      assert(html.at_css('#raster source')['sizes'] == '80vw', 'Explicit raster sizes must remain unchanged')
    else
      assert(html.css('source').empty?, 'Disabling responsive images must still omit all source elements')
    end
    puts "PASS: figure URLs with baseurl=#{baseurl.inspect}, responsive=#{responsive}"
  end
end

check_figures(baseurl: '', responsive: true)
check_figures(baseurl: '/project', responsive: true)
check_figures(baseurl: '/project', responsive: false)

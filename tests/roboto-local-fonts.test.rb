require 'jekyll'
require 'nokogiri'
require 'tmpdir'
require 'fileutils'
require 'json'
require 'digest'
require 'open3'

def assert(condition, message)
  raise message unless condition
end

ROOT = File.expand_path('..', __dir__)
GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap'
PRELOAD_FILES = %w[
  KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBHMdazQ.woff2
].freeze

def render_font_fixture(baseurl:, local_roboto:, site_local_roboto: nil, page_data: {}, site_data: {}, include_scripts: false)
  Dir.mktmpdir('roboto-local-fonts-test-') do |fixture|
    source = File.join(fixture, 'source')
    destination = File.join(fixture, 'output')
    FileUtils.mkdir_p(File.join(source, '_includes'))
    %w[head.liquid metadata.liquid roboto-local-fonts.liquid scripts.liquid].each do |name|
      path = File.join(ROOT, '_includes', name)
      FileUtils.cp(path, File.join(source, '_includes', name)) if File.file?(path)
    end
    flag = local_roboto.nil? ? '' : "local_roboto: #{local_roboto}\n"
    extra_data = page_data.map { |key, value| "#{key}: #{value.to_json}\n" }.join
    content = "{% include head.liquid %}"
    content += "{% include scripts.liquid %}" if include_scripts
    File.write(File.join(source, 'index.html'), "---\n#{flag}#{extra_data}---\n#{content}")
    FileUtils.mkdir_p(File.join(source, '_data'))
    File.write(File.join(source, '_data/socials.json'), { 'scholar_userid' => 'scholar', 'leetcode_id' => 'leetcode' }.to_json)
    config = Jekyll.configuration(
      'source' => source,
      'destination' => destination,
      'url' => 'https://example.test',
      'baseurl' => baseurl,
      'local_roboto' => site_local_roboto,
      'third_party_libraries' => { 'google_fonts' => { 'url' => { 'fonts' => GOOGLE_FONTS_URL } } },
      'disable_disk_cache' => true,
      'quiet' => true,
      **site_data
    )
    site = Jekyll::Site.new(config)
    site.process
    Nokogiri::HTML(site.pages.find { |page| page.name == 'index.html' }.output)
  end
end

['', '/project'].product([[true, false], [nil, true]]).each do |baseurl, (page_flag, site_flag)|
  document = render_font_fixture(baseurl: baseurl, local_roboto: page_flag, site_local_roboto: site_flag)
  css = document.css('style').map(&:text).join
  assert(css.scan('@font-face').size == 36, 'Local Roboto must retain all 36 literal font-face declarations')
  assert(css.scan(/font-weight:\s*(\d+)/).flatten.tally == { '300' => 9, '400' => 9, '500' => 9, '700' => 9 }, 'Each existing Roboto weight must retain all nine subsets')
  assert(document.css('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]').empty?, 'A local-font page must not also request Google fonts')
  preloads = document.css('link[rel="preload"][as="font"]')
  expected_urls = PRELOAD_FILES.map { |file| "#{baseurl}/assets/fonts/roboto-v51/#{file}" }
  assert(preloads.map { |link| link['href'] } == expected_urls, 'Only the critical Latin font may be preloaded, with its baseurl preserved')
  assert(preloads.all? { |link| link['type'] == 'font/woff2' && link.key?('crossorigin') }, 'Font preloads must specify WOFF2 and crossorigin')
  font_urls = css.scan(/url\(["']?([^"')]+)["']?\)/).flatten
  assert(font_urls.size == 36 && font_urls.uniq.size == 9, 'The literal faces must reference the same nine local font files')
  assert(font_urls.all? { |url| url.start_with?("#{baseurl}/assets/fonts/roboto-v51/") }, 'Every font-face URL must respect baseurl')
  manifest = JSON.parse(File.read(File.join(ROOT, 'assets/fonts/roboto-v51/provenance.json')))
  normalized = css.gsub("#{baseurl}/assets/fonts/roboto-v51/", '/assets/fonts/roboto-v51/').gsub(%r{/\*.*?\*/}m, '').gsub(/[\s'"]/, '')
  assert(Digest::SHA256.hexdigest(normalized) == manifest.fetch('cssDeclarationIntegrity').fetch('sha256'), 'Local font declarations must preserve the exact prototype font metrics and Unicode mappings')
  puts "PASS: local Roboto declarations and font URLs with baseurl=#{baseurl.inspect}, page=#{page_flag.inspect}, site=#{site_flag.inspect}"
end

[[false, true], [false, false], [nil, false], [nil, nil]].each do |page_flag, site_flag|
  document = render_font_fixture(baseurl: '/project', local_roboto: page_flag, site_local_roboto: site_flag)
  assert(document.css('link[rel="stylesheet"]').any? { |link| link['href'] == GOOGLE_FONTS_URL }, 'An explicit page opt-out or disabled site default must retain the Google stylesheet')
  assert(document.css('style').none? { |style| style.text.include?('@font-face') }, 'The Google fallback must not also include local Roboto declarations')
  puts "PASS: Google font fallback with page=#{page_flag.inspect}, site=#{site_flag.inspect}"
end

site_default = Jekyll.configuration('source' => ROOT, 'quiet' => true)['local_roboto']
document = render_font_fixture(baseurl: '', local_roboto: nil, site_local_roboto: site_default)
assert(document.css('style').any? { |style| style.text.include?('@font-face') }, 'The repository default must serve unflagged pages with the bundled Roboto fonts')
puts 'PASS: the repository font default serves bundled Roboto'

[
  [{ 'social' => false, 'permalink' => '/blog/' }, false, false],
  [{ 'social' => true, 'permalink' => '/about/' }, false, true],
  [{ 'social' => false, 'permalink' => '/' }, true, true],
  [{ 'social' => false, 'permalink' => '/' }, false, false],
  [{ 'social' => false, 'permalink' => '/publications/' }, true, false]
].each do |page_data, navbar_social, expected|
  document = render_font_fixture(
    baseurl: '/project', local_roboto: true, page_data: page_data,
    site_data: { 'enable_navbar_social' => navbar_social }
  )
  %w[academicons.min.css scholar-icons.css].each do |filename|
    links = document.css('link').select { |link| link['href'] == "/project/assets/css/#{filename}" }
    assert(!links.empty? == expected, "#{filename} must load exactly when page or home navbar social icons render")
  end
end
puts 'PASS: social icon CSS follows page and home navbar social rendering'

def badge_requests(document, embeds)
  scripts = document.css('script').map { |script| { 'src' => script['src'], 'async' => script.key?('async'), 'code' => script.text } }
  runner = <<~JS
    const vm = require('node:vm');
    const { scripts, embeds } = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
    const requests = [];
    const context = {
      document: {
        querySelector(selector) { return embeds.includes(selector) ? {} : null; },
        querySelectorAll() { return []; },
        createElement() { return {}; },
        body: { appendChild(script) { requests.push({ src: script.src, async: script.async }); script.onload?.(); } },
      },
    };
    context.window = context;
    vm.createContext(context);
    for (const script of scripts) {
      if (script.src) requests.push({ src: script.src, async: script.async });
      else vm.runInContext(script.code, context);
    }
    console.log(JSON.stringify(requests.filter(({ src }) => /d1bxh8uas1mnw7\.cloudfront\.net|badge\.dimensions\.ai/.test(src))));
  JS
  output, error, status = Open3.capture3('node', '-e', runner, stdin_data: { scripts: scripts, embeds: embeds }.to_json)
  assert(status.success?, "Rendered optional scripts must execute: #{error}")
  JSON.parse(output)
end

document = render_font_fixture(
  baseurl: '', local_roboto: true, include_scripts: true, page_data: { 'permalink' => '/publications/' },
  site_data: { 'enable_publication_badges' => { 'altmetric' => true, 'dimensions' => true } }
)
[
  [[], []],
  [['.altmetric-embed'], ['https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js']],
  [['.__dimensions_badge_embed__'], ['https://badge.dimensions.ai/badge.js']],
  [['.altmetric-embed', '.__dimensions_badge_embed__'], ['https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js', 'https://badge.dimensions.ai/badge.js']]
].each do |embeds, expected|
  requests = badge_requests(document, embeds)
  assert(requests.map { |request| request['src'] } == expected, "Only rendered badges may request their library: expected #{expected.inspect}, got #{requests.inspect}")
  assert(requests.all? { |request| request['async'] }, 'Present badges must retain asynchronous script loading')
end
puts 'PASS: optional badge libraries load asynchronously only for rendered badge embeds'

font_dir = File.join(ROOT, 'assets/fonts/roboto-v51')
manifest = JSON.parse(File.read(File.join(font_dir, 'provenance.json')))
assert(Dir[File.join(font_dir, '*.woff2')].size == 9, 'The font bundle must contain exactly the nine prototype files')
manifest.fetch('fonts').each do |font|
  bytes = File.binread(File.join(font_dir, font.fetch('filename')))
  assert(bytes.start_with?('wOF2'), "Invalid WOFF2 signature: #{font.fetch('filename')}")
  assert(bytes.bytesize == font.fetch('bytes') && Digest::SHA256.hexdigest(bytes) == font.fetch('sha256'), "Bundled font differs from the verified source: #{font.fetch('filename')}")
end
license_bytes = File.binread(File.join(font_dir, 'OFL.txt'))
assert(Digest::SHA256.hexdigest(license_bytes) == manifest.fetch('license').fetch('sha256'), 'The official OFL text must remain unchanged')
puts 'PASS: all nine bundled WOFF2 files and official OFL match their recorded source hashes'

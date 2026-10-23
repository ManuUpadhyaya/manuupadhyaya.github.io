require 'jekyll'
require 'nokogiri'
require 'tmpdir'
require 'fileutils'
require 'json'
require 'digest'

def assert(condition, message)
  raise message unless condition
end

ROOT = File.expand_path('..', __dir__)
GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap'
PRELOAD_FILES = %w[
  KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBHMdazQ.woff2
  KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMawCUBHMdazTgWw.woff2
].freeze

def render_font_fixture(baseurl:, local_roboto:)
  Dir.mktmpdir('roboto-local-fonts-test-') do |fixture|
    source = File.join(fixture, 'source')
    destination = File.join(fixture, 'output')
    FileUtils.mkdir_p(File.join(source, '_includes'))
    %w[head.liquid metadata.liquid roboto-local-fonts.liquid].each do |name|
      path = File.join(ROOT, '_includes', name)
      FileUtils.cp(path, File.join(source, '_includes', name)) if File.file?(path)
    end
    flag = local_roboto.nil? ? '' : "local_roboto: #{local_roboto}\n"
    File.write(File.join(source, 'index.html'), "---\n#{flag}---\n{% include head.liquid %}")
    config = Jekyll.configuration(
      'source' => source,
      'destination' => destination,
      'url' => 'https://example.test',
      'baseurl' => baseurl,
      'third_party_libraries' => { 'google_fonts' => { 'url' => { 'fonts' => GOOGLE_FONTS_URL } } },
      'disable_disk_cache' => true,
      'quiet' => true
    )
    Jekyll::Site.new(config).process
    Nokogiri::HTML(File.read(File.join(destination, 'index.html')))
  end
end

['', '/project'].each do |baseurl|
  document = render_font_fixture(baseurl: baseurl, local_roboto: true)
  css = document.css('style').map(&:text).join
  assert(css.scan('@font-face').size == 36, 'Local Roboto must retain all 36 literal font-face declarations')
  assert(css.scan(/font-weight:\s*(\d+)/).flatten.tally == { '300' => 9, '400' => 9, '500' => 9, '700' => 9 }, 'Each existing Roboto weight must retain all nine subsets')
  assert(document.css('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]').empty?, 'A local-font page must not also request Google fonts')
  preloads = document.css('link[rel="preload"][as="font"]')
  expected_urls = PRELOAD_FILES.map { |file| "#{baseurl}/assets/fonts/roboto-v51/#{file}" }
  assert(preloads.map { |link| link['href'] } == expected_urls, 'Local font preloads must preserve the prototype Latin/math order and respect baseurl')
  assert(preloads.all? { |link| link['type'] == 'font/woff2' && link.key?('crossorigin') }, 'Font preloads must specify WOFF2 and crossorigin')
  font_urls = css.scan(/url\(["']?([^"')]+)["']?\)/).flatten
  assert(font_urls.size == 36 && font_urls.uniq.size == 9, 'The literal faces must reference the same nine local font files')
  assert(font_urls.all? { |url| url.start_with?("#{baseurl}/assets/fonts/roboto-v51/") }, 'Every font-face URL must respect baseurl')
  manifest = JSON.parse(File.read(File.join(ROOT, 'assets/fonts/roboto-v51/provenance.json')))
  normalized = css.gsub("#{baseurl}/assets/fonts/roboto-v51/", '/assets/fonts/roboto-v51/').gsub(%r{/\*.*?\*/}m, '').gsub(/[\s'"]/, '')
  assert(Digest::SHA256.hexdigest(normalized) == manifest.fetch('cssDeclarationIntegrity').fetch('sha256'), 'Local font declarations must preserve the exact prototype font metrics and Unicode mappings')
  puts "PASS: local Roboto declarations, preloads, and font URLs with baseurl=#{baseurl.inspect}"
end

[false, nil].each do |flag|
  document = render_font_fixture(baseurl: '/project', local_roboto: flag)
  assert(document.css('link[rel="stylesheet"]').any? { |link| link['href'] == GOOGLE_FONTS_URL }, 'Unflagged pages must retain their existing Google stylesheet')
  assert(document.css('style').none? { |style| style.text.include?('@font-face') }, 'Unflagged pages must not receive local Roboto declarations')
  puts "PASS: existing Google font behavior with local_roboto=#{flag.inspect}"
end

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

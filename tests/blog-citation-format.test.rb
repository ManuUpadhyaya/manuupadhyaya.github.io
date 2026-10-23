require 'jekyll'
require 'jekyll-minifier'
require 'nokogiri'
require 'tmpdir'
require 'fileutils'

def assert(condition, message)
  raise message unless condition
end

# Exercise the production minifier: CSS white-space alone cannot protect the
# citation's newlines and indentation when the generated HTML is compressed.
ENV['JEKYLL_ENV'] = 'production'
Dir.mktmpdir('blog-citation-format-test-') do |fixture|
  source = File.join(fixture, 'source')
  destination = File.join(fixture, 'output')
  FileUtils.mkdir_p(File.join(source, '_includes'))
  FileUtils.cp(File.expand_path('../_includes/blog-citation.liquid', __dir__), File.join(source, '_includes/blog-citation.liquid'))
  File.write(File.join(source, 'index.md'), <<~LIQUID)
    ---
    title: 'A "quoted" & <example> Lyapunov post'
    date: 2026-10-12
    citation_doi: 10.5281/zenodo.23521024
    citation_url: https://example.test/blog/published-post/
    ---
    {% include blog-citation.liquid %}
  LIQUID
  config = Jekyll.configuration(
    'source' => source, 'destination' => destination, 'quiet' => true,
    'first_name' => 'Manu', 'last_name' => 'Upadhyaya', 'url' => 'http://127.0.0.1:8080',
    'jekyll-minifier' => { 'compress_javascript' => false }
  )
  Jekyll::Site.new(config).process
  document = Nokogiri::HTML(File.read(File.join(destination, 'index.html')))
  code = document.at_css('#cite-this-post code')
  lines = code.text.lines.map(&:chomp)
  assert(lines.length == 9, 'Production citation must keep the opening, seven fields and closing brace on separate lines')
  assert(lines.first == '@misc{upadhyaya2026lyapunov,' && lines.last == '}', 'BibTeX opening and closing must stay unindented')
  assert(lines[1...-1].all? { |line| line.match?(/\A  \w+ = \{.+\},\z/) }, 'Each field must retain two-space indentation and single spaces around =, as in AutoLyap')
  assert(code.text.include?('title = {A "quoted" & <example> {Lyapunov} post}'), 'HTML escaping must preserve the title in the displayed and copied citation')
  assert(code.text.include?('doi = {10.5281/zenodo.23521024}'), 'Formatting must preserve the DOI')
  assert(code.text.include?('url = {https://example.test/blog/published-post/}'), 'Citations must use the eventual public URL even when the preview overrides site.url')
  assert(document.at_css('.blog-citation-copy')['aria-label'] == 'Copy BibTeX', 'The citation must retain its accessible copy control')
  puts 'PASS: citation line breaks, indentation and content survive production HTML minification'
end

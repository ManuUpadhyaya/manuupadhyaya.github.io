require 'jekyll'
require 'nokogiri'
require 'tmpdir'
require 'fileutils'
require 'yaml'
require 'open3'

plugin = File.expand_path('../_plugins/typography-hints.rb', __dir__)
require plugin

SOFT_HYPHEN = "\u00AD"
RULES = {
  'words' => %w[
    sub-optimal sub-optimality semi-definite semi-definiteness
    non-negative non-negativity non-positive non-convex non-smooth non-expansive
  ]
}.freeze


def assert(condition, message)
  raise message unless condition
end


def render_hints(html, rules: RULES)
  site = Jekyll::Site.new(Jekyll.configuration('source' => Dir.tmpdir, 'quiet' => true))
  site.data['hyphenation'] = rules
  Liquid::Template.parse('{{ content | typography_hints }}').render!(
    { 'content' => html }, registers: { site: site }
  )
end


def fragment(html)
  Nokogiri::HTML5.fragment(html)
end

# Catch a missing filter, a wrong discretionary split, or a changed letter.
input = '<p>Suboptimal suboptimality semidefinite semidefiniteness nonnegative nonnegativity nonpositive nonconvex nonsmooth nonexpansive.</p>'
expected = "Sub\u00ADoptimal sub\u00ADoptimality semi\u00ADdefinite semi\u00ADdefiniteness non\u00ADnegative non\u00ADnegativity non\u00ADpositive non\u00ADconvex non\u00ADsmooth non\u00ADexpansive."
output = render_hints(input)
assert(fragment(output).text == expected, 'Curated words must receive only the approved invisible semantic breaks')
assert(fragment(output).text.delete(SOFT_HYPHEN) == fragment(input).text, 'Removing hints must recover the original wording and spelling exactly')
puts 'PASS: explicit compound breaks preserve every prose character'

# Catch accidental guessing, partial matches, ASCII-only boundaries, or case rewriting.
input = '<p>suboptimally presuboptimal suboptimality2 suboptimal_name ésuboptimal suboptimalé suboptimaĺ SUBOPTIMAL sUboptimal suboptimal, (Suboptimality) nonconvex.</p>'
expected = "suboptimally presuboptimal suboptimality2 suboptimal_name ésuboptimal suboptimalé suboptimaĺ SUBOPTIMAL sUboptimal sub\u00ADoptimal, (Sub\u00ADoptimality) non\u00ADconvex."
assert(fragment(render_hints(input)).text == expected, 'Only complete lowercase or initial-capital words in the curated list may change')
puts 'PASS: Unicode word boundaries, original case, and unlisted words remain safe'

# Catch expansion beyond prose or changes to destinations, attributes, and navigation.
input = <<~HTML
  <h1>suboptimal</h1><nav><p>suboptimal</p><ul><li>nonconvex</li></ul></nav>
  <div id="toc"><p>suboptimal</p><li>nonconvex</li></div>
  <div class="toc"><p>suboptimal</p></div><div role="navigation"><li>nonconvex</li></div>
  <div id="plain-container">suboptimal</div><p title="suboptimal"><a href="/suboptimal?q=nonconvex" data-label="suboptimal">suboptimal</a> <em>nonconvex</em></p>
  <ul><li>nonnegative</li></ul><figure><figcaption>semidefinite</figcaption></figure>
HTML
output = fragment(render_hints(input))
%w[h1 nav #toc .toc [role=navigation]].each do |selector|
  assert(output.css(selector).none? { |node| node.text.include?(SOFT_HYPHEN) }, "#{selector} must not receive prose hints")
end
assert(output.at_css('#plain-container').text == 'suboptimal', 'Bare container text must not receive hints')
link = output.at_css('a')
assert(link.text == "sub\u00ADoptimal" && output.at_css('em').text == "non\u00ADconvex", 'Inline prose elements must inherit paragraph eligibility')
assert(link['href'] == '/suboptimal?q=nonconvex' && link['data-label'] == 'suboptimal', 'Link destinations and data attributes must remain untouched')
assert(output.at_css('p[title]')['title'] == 'suboptimal', 'Title attributes must remain untouched')
assert(output.css('ul > li').last.text == "non\u00ADnegative" && output.at_css('figcaption').text == "semi\u00ADdefinite", 'List prose and figure captions must receive hints')
puts 'PASS: hints apply only to eligible prose text nodes'

# Catch TeX corruption, code/metadata edits, and foreign-content case loss from HTML4 serialization.
input = <<~'HTML'
  <p>suboptimal <code>nonconvex</code><kbd>suboptimal</kbd><samp>suboptimal</samp>
  <span class="math">\(\text{suboptimal} < nonconvex\)</span>
  <span class="MathJax_Preview">suboptimal</span><mjx-container><p>suboptimal</p></mjx-container>
  <span class="citation">suboptimal</span><span class="jekyll-scholar">suboptimal</span>
  <button>suboptimal</button><label>suboptimal</label><textarea>suboptimal</textarea><input value="suboptimal">
  <svg viewBox="0 0 120 80"><foreignObject><p>suboptimal</p></foreignObject><text>nonconvex</text></svg></p>
  <pre><p>suboptimal</p></pre><script type="math/tex">\text{suboptimal} < nonconvex</script>
  <script type="application/ld+json">{"name":"suboptimal"}</script><style>/* suboptimal */</style>
  <p>\(\text{suboptimal}\) nonconvex</p><p>$suboptimal$ nonconvex</p><p>\[suboptimal\] nonconvex</p>
HTML
output = render_hints(input)
before = fragment(input)
after = fragment(output)
assert(after.at_css('p').children.first.text.include?("sub\u00ADoptimal"), 'Safe prose beside protected inline content must still receive hints')
%w[code kbd samp .math .MathJax_Preview mjx-container .citation .jekyll-scholar button label textarea input svg pre script style].each do |selector|
  assert(after.css(selector).map(&:to_html) == before.css(selector).map(&:to_html), "#{selector} must remain intact when surrounding prose changes")
end
assert(output.include?('viewBox="0 0 120 80"') && output.include?('<foreignObject>'), 'SVG attribute and element casing must survive HTML5 parsing')
assert(after.css('p').to_a.last(3).map(&:text) == before.css('p').to_a.last(3).map(&:text), 'Raw TeX delimiter-containing text nodes must be conservatively skipped')
assert(after.text.delete(SOFT_HYPHEN) == before.text, 'Protected and ordinary text together must retain all original characters')
puts 'PASS: math, code, citations, forms, metadata, and SVG are protected'

# Catch reserialization with no work, repeated insertion, or changed pre-existing hints.
input = "<p class='unchanged'>sub\u00ADoptimal &amp; already-written.</p>"
assert(render_hints(input) == input, 'Input without a new hint must be returned byte-for-byte')
input = "<p>sub\u00ADoptimal nonnegative &amp; nonnegative.</p>"
once = render_hints(input)
assert(render_hints(once) == once, 'Repeated rendering must be idempotent')
assert(fragment(once).text.count(SOFT_HYPHEN) == 3, 'Existing discretionary breaks must not be duplicated')
assert(render_hints('<p>suboptimal</p>', rules: nil) == '<p>suboptimal</p>', 'Sites without a word list must keep their original output')
puts 'PASS: unchanged input and existing hints stay stable across renders'

# Catch a missing layout branch, bypassed site data, or damage to Jekyll relative URLs.
Dir.mktmpdir('typography-hints-test-') do |fixture|
  source = File.join(fixture, 'source')
  destination = File.join(fixture, 'output')
  %w[_includes _layouts _data _plugins].each { |dir| FileUtils.mkdir_p(File.join(source, dir)) }
  %w[head header footer scripts].each { |name| File.write(File.join(source, '_includes', "#{name}.liquid"), '') }
  FileUtils.cp(File.expand_path('../_layouts/default.liquid', __dir__), File.join(source, '_layouts/default.liquid'))
  FileUtils.cp(plugin, File.join(source, '_plugins/typography-hints.rb'))
  FileUtils.cp(File.expand_path('../_data/hyphenation.yml', __dir__), File.join(source, '_data/hyphenation.yml'))
  pages = { 'plain' => nil, 'toc-left' => 'left', 'toc-right' => 'right' }
  originals = {}
  pages.each do |name, sidebar|
    metadata = { 'layout' => 'default' }
    metadata['toc'] = { 'sidebar' => sidebar } if sidebar
    path = File.join(source, "#{name}.md")
    originals[path] = metadata.to_yaml + "---\n# Suboptimal heading\n\nSuboptimal [nonconvex]({{ '/suboptimal/' | relative_url }}).\n"
    File.write(path, originals[path])
  end
  build = <<~'RUBY'
    require 'jekyll'
    Jekyll::Site.new(Jekyll.configuration(
      'source' => ARGV[0], 'destination' => ARGV[1], 'quiet' => true,
      'baseurl' => '/research', 'lang' => 'en'
    )).process
  RUBY
  build_output, build_status = Open3.capture2e(RbConfig.ruby, '-e', build, source, destination)
  assert(build_status.success?, "The real Jekyll fixture build must pass: #{build_output}")
  pages.each_key do |name|
    page = Nokogiri::HTML5(File.read(File.join(destination, "#{name}.html")))
    assert(page.at_css('[role="main"] p').text == "Sub\u00ADoptimal non\u00ADconvex.", "#{name}: real layout output must receive site-configured hints")
    assert(page.at_css('h1').text == 'Suboptimal heading', "#{name}: heading text must stay unchanged")
    assert(page.at_css('[role="main"] a')['href'] == '/research/suboptimal/', "#{name}: Jekyll baseurl-aware links must survive")
  end
  originals.each { |path, original| assert(File.read(path) == original, 'Jekyll rendering must never edit prose source') }
end
puts 'PASS: real Jekyll data, all default layout branches, baseurl, and unchanged prose sources'

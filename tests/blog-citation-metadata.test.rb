require 'jekyll'
require 'nokogiri'
require 'json'
require 'tmpdir'
require 'fileutils'
require 'yaml'

def assert(condition, message)
  raise message unless condition
end

def check_citation_metadata(published:, preview:, site_url: 'https://example.test')
  Dir.mktmpdir('blog-citation-metadata-test-') do |fixture|
    source = File.join(fixture, 'source')
    destination = File.join(fixture, 'output')
    %w[_includes _layouts _posts _news].each { |dir| FileUtils.mkdir_p(File.join(source, dir)) }
    %w[metadata.liquid head.liquid].each do |name|
      FileUtils.cp(File.expand_path("../_includes/#{name}", __dir__), File.join(source, '_includes', name))
    end
    File.write(File.join(source, '_layouts/default.html'), '<html><head>{% include head.liquid %}</head><body>{{ content }}</body></html>')

    title = 'Lyapunov "proofs" & <bounds>'
    metadata = {
      'layout' => 'default',
      'title' => title,
      'published' => published,
      'citation_doi' => '10.5281/zenodo.23521024',
      'citation_url' => 'https://example.test/blog/citation-entry/',
      'citation_author_orcid' => 'https://orcid.org/0000-0002-8235-0789',
      'license' => 'https://creativecommons.org/licenses/by/4.0/'
    }
    File.write(File.join(source, '_posts/2020-01-02-citation-entry.md'), metadata.to_yaml + "---\nUnchanged post content.\n")
    File.write(File.join(source, '_posts/2020-01-01-other-entry.md'), "---\nlayout: default\ntitle: Other post\nog_image: https://example.test/article.png\n---\nOther content.\n")
    File.write(File.join(source, '_news/update.md'), "---\nlayout: default\ntitle: Research update\ndate: 2020-01-01\n---\nNews content.\n")
    File.write(File.join(source, 'index.html'), "---\nlayout: default\ntitle: Home\n---\nHome content.\n")

    config = Jekyll.configuration(
      'source' => source, 'destination' => destination, 'quiet' => true,
      'first_name' => 'Example', 'last_name' => 'Scholar', 'title' => 'blank',
      'description' => 'Fixture site.', 'lang' => 'en', 'url' => site_url,
      'og_image' => 'https://example.test/portrait.png',
      'collections' => { 'news' => { 'output' => true, 'permalink' => '/news/:title/' } },
      'permalink' => '/blog/:title/', 'unpublished' => preview,
      'serve_schema_org' => true, 'serve_og_meta' => true
    )
    Jekyll::Site.new(config).process
    path = File.join(destination, 'blog/citation-entry/index.html')
    assert(File.file?(path) == (published || preview), 'Private drafts must stay out of production builds')

    if File.file?(path)
      doc = Nokogiri::HTML(File.read(path))
      meta = ->(name) { doc.at_css("meta[name='#{name}']")&.[]('content') }
      assert(meta.call('citation_title') == title, 'Citation titles must round-trip quotes and HTML characters')
      assert(meta.call('citation_author') == 'Example Scholar', 'Citation metadata must identify the author')
      assert(meta.call('citation_author_orcid') == metadata['citation_author_orcid'], 'Citation metadata must identify the author ORCID')
      assert(meta.call('citation_publication_date') == '2020/01/02', 'Citation dates must follow the post date')
      assert(meta.call('citation_doi') == '10.5281/zenodo.23521024', 'Citation metadata must expose the reserved DOI')
      assert(meta.call('citation_language') == 'en', 'Citation metadata must identify the language')
      assert(meta.call('DC.type') == 'blogPost', 'Reference managers must recognise a blog post rather than guess a journal article')
      assert(meta.call('DC.rights') == metadata['license'], 'Reference managers must retain the approved license')
      assert(doc.css('meta[name="citation_pdf_url"], meta[name="citation_journal_title"]').empty?, 'Do not invent a PDF or journal')
      assert(doc.at_css('link[rel="license"]')&.[]('href') == metadata['license'], 'The license link must use CC BY 4.0')
      graph = JSON.parse(doc.at_css('script[type="application/ld+json"]').text)['@graph']
      post = graph.find { |node| node['@type'] == 'BlogPosting' }
      person = graph.find { |node| node['@type'] == 'Person' }
      assert(person['sameAs'].include?(metadata['citation_author_orcid']), 'The post author must link to the verified ORCID profile')
      assert(post['identifier']['propertyID'] == 'DOI' && post['identifier']['value'] == metadata['citation_doi'], 'Structured data must identify the DOI')
      assert(post['license'] == metadata['license'], 'The blog post must carry its approved license')
      assert(post['copyrightHolder'] == { '@id' => "#{site_url}/#person" }, 'Licensing must preserve the author as copyright holder')
      assert(post['copyrightYear'] == 2020, 'Copyright year must follow the post year')
      assert(!post.key?('image'), 'Article schema must not describe the default author portrait as an article illustration')
      assert(!post.key?('primaryImageOfPage') && !post.key?('breadcrumb'), 'Article nodes must not carry WebPage-only properties')
      assert(person['image'] == 'https://example.test/portrait.png', 'The author must retain the site portrait')
      assert(doc.at_css('meta[property="og:image"]')['content'] == 'https://example.test/portrait.png', 'Social previews must retain the portrait fallback')
      assert(doc.at_css('link[rel="canonical"]')['href'] == metadata['citation_url'], 'The real head must use the public post URL even in a local preview')
      assert(doc.at_css('meta[property="og:url"]')['content'] == metadata['citation_url'], 'Social metadata must identify the same public post URL')
      assert(post['url'] == metadata['citation_url'] && post['@id'] == 'https://example.test/blog/citation-entry/#webpage', 'Structured article identity must use the public post URL')
      assert(person['@id'] == "#{site_url}/#person" && post['author']['@id'] == person['@id'], 'Preview author identity must stay consistent with the preview homepage')
      assert(doc.at_css('body').text.strip == 'Unchanged post content.', 'Citation and license metadata must not change visible content')
      assert(meta.call('robots') == 'noindex, follow', 'Draft previews must remain noindex') unless published
    end

    ['index.html', 'blog/other-entry/index.html'].each do |other|
      doc = Nokogiri::HTML(File.read(File.join(destination, other)))
      assert(doc.css('meta[name^="citation_"], meta[name="DC.type"], meta[name="DC.rights"], link[rel="license"]').empty?, 'Other pages must not inherit the post citation or license')
      graph = JSON.parse(doc.at_css('script[type="application/ld+json"]').text)['@graph']
      assert(graph.none? { |node| node.key?('license') || node.key?('copyrightHolder') || node.key?('identifier') }, 'The post license and DOI must not apply to the rest of the website')
      assert(graph.none? { |node| node.fetch('sameAs', []).include?(metadata['citation_author_orcid']) }, 'The post-only ORCID setting must not change other pages')
      if other == 'index.html'
        homepage = graph.find { |node| node['@type'] == 'ProfilePage' }
        assert(homepage['primaryImageOfPage']['url'] == 'https://example.test/portrait.png', 'WebPage subtypes must retain their page image')
      else
        post = graph.find { |node| node['@type'] == 'BlogPosting' }
        assert(post['image'] == 'https://example.test/article.png', 'Explicit article illustrations must remain in article schema')
        assert(!post.key?('primaryImageOfPage') && !post.key?('breadcrumb'), 'Explicit article images must not reintroduce WebPage-only properties')
      end
    end
    doc = Nokogiri::HTML(File.read(File.join(destination, 'news/update/index.html')))
    graph = JSON.parse(doc.at_css('script[type="application/ld+json"]').text)['@graph']
    news = graph.find { |node| node['@type'] == 'NewsArticle' }
    assert(!news.key?('image') && !news.key?('primaryImageOfPage') && !news.key?('breadcrumb'), 'News articles must also omit portrait fallback and WebPage-only properties')
    puts "PASS: citation and license metadata with published=#{published}, preview=#{preview}"
  end
end

check_citation_metadata(published: true, preview: false)
check_citation_metadata(published: false, preview: true)
check_citation_metadata(published: false, preview: false)
check_citation_metadata(published: false, preview: true, site_url: 'http://127.0.0.1:8080')

# Render the real publication JSON-LD section with the fields supplied by
# Jekyll Scholar, including semantic BibTeX types and the site's legacy theses.
Dir.mktmpdir('publication-schema-test-') do |fixture|
  site = Jekyll::Site.new(Jekyll.configuration(
    'source' => fixture, 'destination' => File.join(fixture, 'output'), 'quiet' => true,
    'url' => 'https://example.test', 'lang' => 'en'
  ))
  layout = File.read(File.expand_path('../_layouts/bib.liquid', __dir__))
  schema = layout[layout.index('{% assign publication_page_url')..]
  base = { 'key' => 'research', 'title' => 'A "quoted" research title', 'year' => '2020',
           'author_array' => [{ 'first' => 'Example', 'last' => 'Scholar' }] }
  cases = [
    ['doctoral BibTeX type', { 'type' => 'phdthesis', 'school' => 'Example University' }, 'Thesis', nil],
    ['masters BibTeX type', { 'type' => 'mastersthesis', 'school' => 'Example University' }, 'Thesis', nil],
    ['legacy doctoral journal label', { 'type' => 'article', 'journal' => 'PhD thesis' }, 'Thesis', nil],
    ['legacy masters journal label', { 'type' => 'article', 'journal' => 'Master’s thesis' }, 'Thesis', nil],
    ['real journal', { 'type' => 'article', 'journal' => 'Research Journal', 'abbr' => 'Thesis' }, 'ScholarlyArticle', 'Research Journal'],
    ['conference', { 'type' => 'inproceedings', 'booktitle' => 'Research Conference' }, 'ScholarlyArticle', 'Research Conference']
  ]
  cases.each do |label, fields, type, venue|
    html = Liquid::Template.parse(schema).render!(
      { 'site' => site.site_payload['site'], 'page' => { 'url' => '/publications/' }, 'entry' => base.merge(fields) },
      registers: { site: site }
    )
    node = JSON.parse(Nokogiri::HTML(html).at_css('script[type="application/ld+json"]').text)
    assert(node['@type'] == type, "#{label}: publication schema must describe the actual work type")
    assert(node['name'] == base['title'], "#{label}: titles must preserve quotes")
    if venue
      assert(node['isPartOf']['name'] == venue, "#{label}: real publication venues must remain intact")
    else
      assert(!node.key?('isPartOf'), "#{label}: a thesis is not a periodical or publication issue")
    end
    puts "PASS: publication schema for #{label}"
  end
end

require 'jekyll'
require 'jekyll-feed'
require 'jekyll-sitemap'
require 'jekyll-minifier'
require 'tmpdir'
require 'fileutils'
require 'uri'

def assert(condition, message)
  raise message unless condition
end

template = File.expand_path('../llms.txt', __dir__)
assert(File.file?(template), 'The site must provide an llms.txt template')
ENV['JEKYLL_ENV'] = 'production'
repo_config = Jekyll.configuration('source' => File.dirname(template), 'quiet' => true)
minifier_config = repo_config.fetch('jekyll-minifier')

def render_fixture(template, minifier_config, baseurl:, unpublished:, with_posts: true)
  Dir.mktmpdir('llms-txt-test-') do |fixture|
    source = File.join(fixture, 'source')
    destination = File.join(fixture, 'output')
    FileUtils.mkdir_p(File.join(source, '_posts'))
    FileUtils.cp(template, File.join(source, 'llms.txt'))
    FileUtils.cp(File.join(File.dirname(template), 'robots.txt'), File.join(source, 'robots.txt'))

    ['', 'publications', 'software', 'teaching', 'blog'].each_with_index do |path, index|
      permalink = path.empty? ? '/' : "/#{path}/"
      File.write(File.join(source, "page-#{index}.md"), "---\npermalink: #{permalink}\n---\nFixture page.\n")
    end

    if with_posts
      File.write(File.join(source, '_posts', '2020-01-03-public-entry.md'), "---\ntitle: Public fixture\npublished: true\nseo_description: <strong>Public</strong> summary.\n---\nPublic content.\n")
      File.write(File.join(source, '_posts', '2020-01-02-private-entry.md'), "---\ntitle: PRIVATE_DRAFT_TITLE\npublished: false\nseo_description: PRIVATE_DRAFT_SUMMARY\n---\nPrivate content.\n")
      File.write(File.join(source, '_posts', '2020-01-01-normal-entry.md'), "---\ntitle: Normal public fixture\ndescription: Fallback summary.\n---\nPublic content.\n")
      File.write(File.join(source, '_posts', '2020-01-04-noindex-entry.md'), "---\ntitle: NOINDEX_TITLE\nnoindex: true\n---\nUnlisted content.\n")
      File.write(File.join(source, '_posts', '2020-01-05-unsitemapped-entry.md'), "---\ntitle: UNSITEMAPPED_TITLE\nsitemap: false\n---\nUnlisted content.\n")
      File.write(File.join(source, '_posts', '2999-01-01-future-entry.md'), "---\ntitle: FUTURE_TITLE\n---\nFuture content.\n")
    end

    config = Jekyll.configuration(
      'source' => source,
      'destination' => destination,
      'title' => 'Fixture Researcher',
      'description' => 'A fixture research site.',
      'url' => 'https://example.test',
      'baseurl' => baseurl,
      'permalink' => '/blog/:title/',
      'unpublished' => unpublished,
      'plugins' => ['jekyll-feed', 'jekyll-sitemap', 'jekyll-minifier'],
      'jekyll-minifier' => minifier_config,
      'quiet' => true
    )
    site = Jekyll::Site.new(config)
    site.process
    output = File.read(File.join(destination, 'llms.txt'))
    robots = File.read(File.join(destination, 'robots.txt'))
    origin = "https://example.test#{baseurl}"

    collapsed_files = { 'llms.txt' => output, 'robots.txt' => robots }.reject { |_, content| content.include?("\n") }.keys
    assert(collapsed_files.empty?, "Production minification removed record/Markdown line breaks from #{collapsed_files.join(', ')}")
    assert(output.start_with?("# Fixture Researcher\n"), 'llms.txt must start with the site heading')
    assert(output.lines.any? { |line| line.chomp == '## Site' }, 'llms.txt must preserve a separate section heading')
    assert(output.lines.count { |line| line.start_with?('- [') } >= 6, 'llms.txt must preserve separate Markdown list entries')
    assert(output.include?('> A fixture research site.'), 'llms.txt must include the site summary')
    assert(!output.match?(/<(?:!doctype|html|head|body)\b/i), 'llms.txt must remain plain Markdown without an HTML layout')
    assert(!output.match?(/\{%|\{\{/), 'llms.txt must not contain unrendered Liquid')
    robots_lines = robots.lines.map(&:strip)
    assert(robots_lines.include?('User-agent: *'), 'robots.txt must preserve its crawler record')
    assert(robots_lines.include?('Disallow: /lighthouse_results/'), 'robots.txt must preserve its existing crawl rule')
    assert(robots_lines.include?("Sitemap: #{origin}/sitemap.xml"), 'robots.txt must preserve a separate canonical sitemap record')
    assert(!robots.match?(/\{%|\{\{/), 'robots.txt must not contain unrendered Liquid')

    expected_links = {
      'About' => '/',
      'Publications' => '/publications/',
      'Software' => '/software/',
      'Teaching' => '/teaching/',
      'Blog' => '/blog/',
      'Blog feed' => '/feed.xml'
    }
    expected_links.each do |label, path|
      assert(output.include?("[#{label}](#{origin}#{path})"), "Missing canonical #{label} link")
    end

    output.scan(/^- \[[^\n]+?\]\(([^\s)]+)\)/).flatten.each do |url|
      parsed = URI.parse(url)
      assert(parsed.scheme == 'https' && parsed.host == 'example.test', "Expected a canonical absolute URL, got #{url}")
      path = parsed.path.delete_prefix(baseurl).delete_prefix('/')
      path += 'index.html' if path.empty? || path.end_with?('/')
      assert(File.file?(File.join(destination, path)), "Linked resource does not exist: #{url}")
    end

    %w[PRIVATE_DRAFT_TITLE PRIVATE_DRAFT_SUMMARY /blog/private-entry/ NOINDEX_TITLE /blog/noindex-entry/ UNSITEMAPPED_TITLE /blog/unsitemapped-entry/ FUTURE_TITLE /blog/future-entry/].each do |private_value|
      assert(!output.include?(private_value), "Nonpublic content leaked into llms.txt: #{private_value}")
    end

    if with_posts
      assert(output.include?("[Public fixture](#{origin}/blog/public-entry/): Public summary."), 'Published posts need their title and SEO description')
      assert(output.include?("[Normal public fixture](#{origin}/blog/normal-entry/): Fallback summary."), 'Posts without an explicit published flag must remain discoverable')
      draft_exists = File.file?(File.join(destination, 'blog', 'private-entry', 'index.html'))
      assert(draft_exists == unpublished, 'Fixture must exercise a real unpublished preview build')
    else
      assert(!output.include?('## Blog posts'), 'An empty blog must not produce an empty posts section')
    end

    sitemap = File.read(File.join(destination, 'sitemap.xml'))
    assert(!sitemap.include?("#{origin}/llms.txt"), 'llms.txt must stay out of the sitemap')
    puts "PASS: llms.txt with baseurl=#{baseurl.inspect}, unpublished=#{unpublished}, posts=#{with_posts}"
  end
end

render_fixture(template, minifier_config, baseurl: '', unpublished: false)
render_fixture(template, minifier_config, baseurl: '', unpublished: true)
render_fixture(template, minifier_config, baseurl: '/project', unpublished: true)
render_fixture(template, minifier_config, baseurl: '', unpublished: false, with_posts: false)

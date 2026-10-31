# Add only explicitly curated discretionary breaks to rendered prose. The
# Markdown sources, spelling, link attributes, code, and mathematics stay intact.
require 'nokogiri'

module Jekyll
  module TypographyHints
    SOFT_HYPHEN = "\u00AD".freeze
    PROSE_TAGS = %w[p li figcaption].freeze
    PROTECTED_TAGS = %w[
      h1 h2 h3 h4 h5 h6 nav code pre kbd samp var script style math svg
      input button label textarea select option cite
    ].freeze
    PROTECTED_CLASSES = %w[
      math tex katex katex-display citation citations jekyll-scholar bibliography
      bibtex csl-entry csl-bib-body table-of-contents
    ].freeze
    WORD_CHARACTER = '[\p{L}\p{M}\p{N}_\u00AD]'.freeze
    RAW_TEX = /\$|\\[()\[\]]|\\[a-zA-Z]+\s*\{/.freeze

    def typography_hints(input)
      return input unless input.is_a?(String) && !input.empty?

      words = @context.registers[:site]&.data&.dig('hyphenation', 'words')
      return input unless words.is_a?(Array)

      replacements = {}
      words.each do |pattern|
        # Hyphens in this list are break positions, never literal additions.
        next unless pattern.is_a?(String) && pattern.match?(/\A[a-z]+(?:-[a-z]+)+\z/)

        plain = pattern.delete('-')
        hinted = pattern.tr('-', SOFT_HYPHEN)
        replacements[plain] = hinted
        replacements[plain.capitalize] = hinted.sub(/\A[a-z]/, &:upcase)
      end
      return input if replacements.empty?

      matcher = /(?<!#{WORD_CHARACTER})(?:#{Regexp.union(replacements.keys)})(?!#{WORD_CHARACTER})/
      return input unless input.match?(matcher)

      # HTML5 retains foreign-content casing (viewBox, foreignObject) and raw
      # MathJax script contents; an HTML4 round trip does not preserve both.
      document = Nokogiri::HTML5.fragment(input)
      changed = false
      document.xpath('.//text()').each do |node|
        next if node.content.match?(RAW_TEX)

        ancestors = node.ancestors.select(&:element?)
        next unless ancestors.any? { |ancestor| PROSE_TAGS.include?(ancestor.name) }
        next if ancestors.any? { |ancestor| typography_protected?(ancestor) }

        hinted = node.content.gsub(matcher) { |word| replacements.fetch(word) }
        next if hinted == node.content

        node.content = hinted
        changed = true
      end
      changed ? document.to_html : input
    end

    private

    def typography_protected?(node)
      return true if PROTECTED_TAGS.include?(node.name) || node.name.start_with?('mjx-')
      return true if node['role'] == 'navigation'

      tokens = [node['id'], *node['class'].to_s.split].compact
      tokens.any? do |token|
        PROTECTED_CLASSES.include?(token.downcase) ||
          token.match?(/mathjax|\Amjx-|(?:\A|[-_])toc(?:\z|[-_])/i)
      end
    end
  end
end

Liquid::Template.register_filter(Jekyll::TypographyHints)

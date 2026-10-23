# Allow LaTeX citation commands in posts that opt in, using Jekyll Scholar.
require 'kramdown'
require 'kramdown-parser-gfm'

module Jekyll
  module LatexCitations
    COMMANDS = %r{
      <!--.*?-->
      | \{%\s*raw\s*%\}.*?\{%\s*endraw\s*%\}
      | <(?<code_tag>pre|code|script|style)\b[^>]*>.*?(?:</\k<code_tag>\s*>|\z)
      | ^[ \t]*(?<fence>`{3,}|~{3,})[^\n]*\n.*?(?:^[ \t]*\k<fence>[`~]*[ \t]*(?:\n|\z)|\z)
      | (?<ticks>`+).*?\k<ticks>(?!`)
      | \\\[.*?\\\]
      | \\\(.*?\\\)
      | \$\$.*?\$\$
      | (?<!\\)\$(?!\$).*?(?<!\\)\$
      | (?<!\\)\\(?<command>cite|nocite)\{(?<keys>[^{}]+)\}
    }mix.freeze

    def self.convert(content)
      code_lines = {}
      tree = Kramdown::Document.new(content, input: 'GFM').root
      collect_code_lines(tree, code_lines)

      content.gsub(COMMANDS) do |match|
        citation = Regexp.last_match
        next match unless citation[:command]
        line = content[0...citation.begin(0)].count("\n") + 1
        next match if code_lines[line]

        keys = citation[:keys].split(',').map(&:strip)
        unless keys.all? { |key| key.match?(/\A[\w:.+\/-]+\z/) }
          raise Jekyll::Errors::FatalException, "Invalid citation keys: #{citation[:keys]}"
        end

        command = citation[:command].downcase
        tag = "{% #{command} #{keys.join(' ')} %}"
        command == 'nocite' ? "{% capture _latex_nocite %}#{tag}{% endcapture %}" : tag
      end
    end

    def self.collect_code_lines(node, lines)
      if node.type == :codeblock
        start = node.options[:location]
        count = node.value.lines.size + (node.options[:fenced] ? 2 : 0)
        count.times { |offset| lines[start + offset] = true }
      end
      node.children.each { |child| collect_code_lines(child, lines) }
    end
  end
end

Jekyll::Hooks.register :posts, :pre_render do |post|
  next unless post.data['latex_citations']

  post.data['cited'] = []
  post.content = Jekyll::LatexCitations.convert(post.content)
end

require 'digest'
require 'fileutils'
require 'json'
require 'open3'
require 'tempfile'
require 'timeout'

module Jekyll
  module MathPrerender
    FONT_DIRECTORY = 'assets/fonts/mathjax-newcm-4.1.3'.freeze
    SPACER_PATTERN = /<mjx-spacer\b[^>]*>.*?<\/mjx-spacer>/m.freeze

    def self.enabled?(site, document)
      site.config['enable_math'] && site.config.fetch('math_prerender', true) &&
        document.data['math'] && !document.data['pseudocode']
    end

    # Generated files participate in normal Jekyll cleanup and writing, including
    # watch rebuilds and cache hits after deleting the output directory.
    class Asset < Jekyll::StaticFile
      def initialize(site, relative_path, source: nil, content: nil)
        @asset_path = relative_path.sub(%r{\A/+}, '')
        @source_path = source
        @content = content
        super(site, site.source, File.dirname(@asset_path), File.basename(@asset_path))
      end

      def write(destination)
        target = File.join(destination, @asset_path)
        bytes = @content || File.binread(@source_path)
        return false if File.file?(target) && File.binread(target) == bytes.b

        FileUtils.mkdir_p(File.dirname(target))
        File.binwrite(target, bytes)
        true
      end
    end

    class Worker
      def initialize(site)
        @site = site
      end

      def render(html, options)
        start unless @input
        @input.puts(JSON.generate('html' => html, 'options' => options))
        line = Timeout.timeout(120) { @output.gets }
        raise "MathJax worker stopped: #{@diagnostics}" unless line

        result = JSON.parse(line)
        raise result.fetch('error').fetch('message') if result['error']
        raise 'MathJax worker returned incomplete output' unless result['html'].is_a?(String) && result['css'].is_a?(String)

        result
      end

      def close
        @input&.close unless @input&.closed?
        if @process && !@process.join(2)
          Process.kill('TERM', @process.pid)
          @process.join
        end
        @output&.close unless @output&.closed?
        @error_reader&.join(1)
        @error&.close unless @error&.closed?
      rescue Errno::ESRCH, IOError
        nil
      end

      private

      def start
        script = File.join(@site.source, 'scripts/render-math.mjs')
        @input, @output, @error, @process = Open3.popen3(ENV.fetch('NODE_BINARY', 'node'), script, chdir: @site.source)
        @input.sync = true
        @diagnostics = ''
        @error_reader = Thread.new do
          @error.each_line { |line| @diagnostics = (@diagnostics + line)[-8000, 8000] || (@diagnostics + line) }
        rescue IOError
          nil
        end
      end
    end

    class Renderer
      def initialize(site, worker: nil)
        @site = site
        @worker = worker || Worker.new(site)
        @cache_directory = File.join(site.cache_dir, 'mathjax-prerender')
        @signature = signature
        @registered_assets = {}
      end

      def render_document(document)
        return unless MathPrerender.enabled?(@site, document)

        # MathJax stacks vertical delimiter pieces using literal newlines in
        # white-space: pre spacers. jekyll-minifier runs later, during write;
        # preserve only these nodes so its whitespace collapse cannot erase them.
        minifier = @site.config['jekyll-minifier'] ||= {}
        minifier[:preserve_patterns] = Array(minifier[:preserve_patterns]) | [SPACER_PATTERN]

        baseurl = @site.config['baseurl'].to_s.sub(%r{/\z}, '')
        options = { 'fontURL' => "#{baseurl}/#{FONT_DIRECTORY}" }
        { 'math_font' => 'font', 'math_scale' => 'scale', 'math_match_font_height' => 'matchFontHeight' }.each do |key, name|
          options[name] = document.data[key] unless document.data[key].nil?
        end
        request_key = Digest::SHA256.hexdigest(JSON.generate([@signature, options, document.output]))
        page_key = Digest::SHA256.hexdigest(document.relative_path.to_s)
        cache_path = File.join(@cache_directory, "#{page_key}.json")
        result = @site.config['disable_disk_cache'] ? nil : read_cache(cache_path, request_key)
        unless result
          result = @worker.render(document.output, options)
          validate_result(result)
          persist(cache_path, request_key, result)
        end

        css_path = "assets/css/mathjax/#{Digest::SHA256.hexdigest(result.fetch('css'))[0, 20]}.css"
        register(css_path, content: result.fetch('css'))
        register_fonts
        links = %(<link rel="stylesheet" href="#{baseurl}/#{css_path}" data-mathjax-prerender>)
        Array(result['fonts']).select { |url| url.end_with?('/mjx-ncm-zero.woff2', '/mjx-ncm-n.woff2', '/mjx-ncm-i.woff2') }.each do |url|
          links += %(<link rel="preload" as="font" type="font/woff2" href="#{url}" crossorigin>)
        end
        document.output = result.fetch('html').sub(%r{</head>}i) { "#{links}</head>" }
      rescue StandardError => error
        raise Jekyll::Errors::FatalException, "MathJax pre-render failed for #{document.relative_path}: #{error.message}. Check the mathematics and run npm ci if build dependencies are missing."
      end

      def close
        @worker.close
      end

      private

      def signature
        paths = %w[package-lock.json assets/js/mathjax-setup.js _includes/roboto-local-fonts.liquid _sass/_base.scss _sass/_layout.scss]
        paths += Dir.glob(File.join(@site.source, 'scripts/{render-math,math-*}.mjs')).map { |path| path.delete_prefix(@site.source + '/') }
        paths += Dir.glob(File.join(@site.source, 'assets/fonts/roboto-v51/*.woff2')).map { |path| path.delete_prefix(@site.source + '/') }
        [1, *paths.sort.map { |path| File.file?(File.join(@site.source, path)) ? Digest::SHA256.file(File.join(@site.source, path)).hexdigest : nil }]
      end

      def validate_result(result)
        raise 'Incomplete rendered page or stylesheet' unless result['html'].is_a?(String) && result['html'].match?(%r{</head>}i) && result['css'].is_a?(String)
        raise 'Rendered math contains an error' if result['html'].match?(/<mjx-merror\b|data-mjx-error=/)
      end

      def read_cache(path, key)
        entry = JSON.parse(File.read(path))
        result = entry.fetch('result')
        return unless entry['key'] == key && entry['checksum'] == Digest::SHA256.hexdigest(JSON.generate(result))

        validate_result(result)
        result
      rescue StandardError
        nil
      end

      def persist(path, key, result)
        return if @site.config['disable_disk_cache']

        FileUtils.mkdir_p(@cache_directory)
        entry = { 'key' => key, 'result' => result, 'checksum' => Digest::SHA256.hexdigest(JSON.generate(result)) }
        Tempfile.create(['.mathjax-', '.tmp'], @cache_directory) do |file|
          file.write(JSON.generate(entry))
          file.close
          File.rename(file.path, path)
        end
      rescue SystemCallError, IOError
        # Re-rendering remains correct if optional cache storage is unavailable.
        nil
      end

      def register(path, source: nil, content: nil)
        return if @registered_assets[path]

        @registered_assets[path] = true
        @site.static_files << Asset.new(@site, path, source: source, content: content)
      end

      def register_fonts
        package = File.join(@site.source, 'node_modules/@mathjax/mathjax-newcm-font')
        fonts = Dir.glob(File.join(package, 'chtml/woff2/*.woff2'))
        raise 'MathJax New Computer Modern font package is missing' if fonts.empty?

        fonts.each { |path| register("#{FONT_DIRECTORY}/#{File.basename(path)}", source: path) }
        license = File.join(package, 'LICENSE')
        register("#{FONT_DIRECTORY}/LICENSE", source: license) if File.file?(license)
      end
    end
  end
end

Jekyll::Hooks.register :site, :post_render do |site|
  renderer = Jekyll::MathPrerender::Renderer.new(site)
  begin
    documents = site.pages + site.collections.values.flat_map(&:docs)
    documents.each { |document| renderer.render_document(document) }
  ensure
    renderer.close
  end
end

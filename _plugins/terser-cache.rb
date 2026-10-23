require 'jekyll-terser'
require 'digest'
require 'fileutils'
require 'tempfile'

module Jekyll
  module Terser
    # Reuse the compiler's exact output across development preview restarts.
    class CachedCompiler
      CACHE_VERSION = 1

      def initialize(compiler, site)
        @compiler = compiler
        @directory = File.join(site.cache_dir, 'terser')
        lockfile = File.join(site.source, 'Gemfile.lock')
        lock_digest = Digest::SHA256.file(lockfile).hexdigest if File.file?(lockfile)
        @signature = [CACHE_VERSION, site.config['terser'], ::Terser::VERSION,
                      Jekyll::Terser::VERSION, lock_digest]
      rescue SystemCallError, IOError
        @directory = nil
      end

      def compile(source)
        return @compiler.compile(source) unless @directory

        key = Digest::SHA256.hexdigest(Marshal.dump([@signature, source.b, source.encoding.name]))
        path = File.join(@directory, key)
        cached = read(path)
        return cached unless cached.nil?

        compiled = @compiler.compile(source)
        persist(path, compiled)
        compiled
      end

      private

      def read(path)
        checksum, encoding, output = File.binread(path).split("\n", 3)
        return unless output && checksum == Digest::SHA256.hexdigest("#{encoding}\n".b + output)

        output.force_encoding(Encoding.find(encoding))
      rescue SystemCallError, IOError, ArgumentError
        nil
      end

      def persist(path, compiled)
        FileUtils.mkdir_p(@directory)
        payload = "#{compiled.encoding.name}\n".b + compiled.b
        Tempfile.create(['.terser-', '.tmp'], @directory) do |file|
          file.binmode
          file.write(Digest::SHA256.hexdigest(payload) + "\n" + payload)
          file.close
          File.rename(file.path, path)
        end
      rescue SystemCallError, IOError
        # Caching is optional; a storage failure must not interrupt the preview.
        nil
      end
    end

    module CacheCompilerOutput
      def initialize(site, *args)
        super
        return unless ENV['JEKYLL_ENV'] == 'development'
        return if site.config['disable_disk_cache'] || !Jekyll::Cache.disk_cache_enabled

        @terser = CachedCompiler.new(@terser, site)
      end
    end

    JSFile.prepend(CacheCompilerOutput) unless JSFile.ancestors.include?(CacheCompilerOutput)
  end
end

require 'open3'

Jekyll::Hooks.register :site, :post_write do |site|
  next unless site.config.fetch('inline_blocking_styles', true)

  script = File.join(site.source, 'scripts/optimize-style-delivery.mjs')
  output, error, status = Open3.capture3(
    ENV.fetch('NODE_BINARY', 'node'), script,
    '--source', site.source, '--dest', site.dest, '--baseurl', site.config['baseurl'].to_s,
    chdir: site.source
  )
  unless status.success?
    raise Jekyll::Errors::FatalException, "Stylesheet delivery optimization failed: #{error}. Run npm ci to install the pinned build dependencies."
  end

  Jekyll.logger.info 'Style delivery:', output.strip
rescue SystemCallError => error
  raise Jekyll::Errors::FatalException, "Stylesheet delivery optimization failed: #{error.message}. Install Node.js and run npm ci."
end

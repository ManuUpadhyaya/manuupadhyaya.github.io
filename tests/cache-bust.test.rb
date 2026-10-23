require 'liquid'
require 'tmpdir'
require 'fileutils'
require_relative '../_plugins/cache-bust'

def assert(condition, message)
  raise message unless condition
end

def with_css_fixture(purge_config: true)
  Dir.mktmpdir('cache-bust-test-') do |fixture|
    Dir.chdir(fixture) do
      FileUtils.mkdir_p(['_sass/nested', 'assets/css'])
      File.write('_sass/_base.scss', "$color: red;\n")
      File.write('_sass/nested/_layout.scss', "body { color: $color; }\n")
      File.write('assets/css/main.scss', "@import 'base';\n")
      File.write('purgecss.config.js', "module.exports = { safelist: [] };\n") if purge_config
      yield
    end
  end
end

def css_url
  Liquid::Template.parse('{{ "/assets/css/main.css" | bust_css_cache }}').render!({}, strict_filters: true)
end

with_css_fixture do
  original = css_url
  assert(original.match?(%r{\A/assets/css/main\.css\?[0-9a-f]{32}\z}), 'CSS URL must retain its path and cache fingerprint')
  assert(css_url == original, 'Unchanged CSS inputs must produce a stable cache fingerprint')

  File.write('purgecss.config.js', "module.exports = { safelist: { greedy: [/^mjx-mtext$/] } };\n")
  assert(css_url != original, 'A PurgeCSS config-only change must invalidate the CSS cache fingerprint')
  puts 'PASS: PurgeCSS config-only changes invalidate stable CSS fingerprints'
end

with_css_fixture do
  original = css_url
  File.write('_sass/nested/_layout.scss', "body { color: blue; }\n")
  assert(css_url != original, 'Changes to nested Sass partials must still invalidate the CSS cache fingerprint')
  puts 'PASS: nested Sass changes invalidate the CSS fingerprint'
end

with_css_fixture do
  original = css_url
  File.write('assets/css/main.scss', "@import 'base';\nbody { margin: 0; }\n")
  assert(css_url != original, 'Changes to main.scss must still invalidate the CSS cache fingerprint')
  puts 'PASS: main.scss changes invalidate the CSS fingerprint'
end

with_css_fixture(purge_config: false) do
  original = css_url
  assert(original.match?(%r{\A/assets/css/main\.css\?[0-9a-f]{32}\z}), 'Sites without a PurgeCSS config must still produce a CSS fingerprint')
  assert(css_url == original, 'CSS fingerprints must remain stable when the optional PurgeCSS config is absent')
  File.write('_sass/_base.scss', "$color: blue;\n")
  assert(css_url != original, 'Sites without a PurgeCSS config must still invalidate CSS fingerprints on Sass changes')
  puts 'PASS: missing PurgeCSS config remains compatible with stable, invalidatable CSS fingerprints'
end

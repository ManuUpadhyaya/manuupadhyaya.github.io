#!/bin/bash
set -euo pipefail

echo "Entry point script running"

CONFIG_FILE=_config.yml

# Function to manage Gemfile.lock
manage_gemfile_lock() {
    git config --global --add safe.directory '*'
    if command -v git &> /dev/null && [ -f Gemfile.lock ]; then
        if git ls-files --error-unmatch Gemfile.lock &> /dev/null; then
            echo "Gemfile.lock is tracked by git, keeping it intact"
            # Keep intentional local dependency edits when the preview restarts.
        else
            echo "Gemfile.lock is not tracked by git, removing it"
            rm Gemfile.lock
        fi
    fi
}

install_node_dependencies() {
    [[ -f package-lock.json ]] || return 0
    local lock_digest
    lock_digest=$(node -p "require('crypto').createHash('sha256').update(require('fs').readFileSync('package-lock.json')).digest('hex')")
    if [[ -f node_modules/.math-build-lock ]] && [[ "$(cat node_modules/.math-build-lock)" == "$lock_digest" ]]; then
        return 0
    fi

    echo "Installing JavaScript dependencies for current package-lock.json"
    npm ci --ignore-scripts --prefer-offline --no-audit --no-fund
    printf '%s\n' "$lock_digest" > node_modules/.math-build-lock
}

start_jekyll() {
    manage_gemfile_lock
    install_node_dependencies
    if ! bundle check >/dev/null 2>&1; then
        echo "Installing missing gems for current Gemfile.lock"
        bundle install
    fi
    local serve_args=(--watch --port=8080 --host=0.0.0.0 --livereload --verbose --trace --force_polling)
    if [[ "${JEKYLL_ENV:-}" == "development" ]]; then
        serve_args+=(--unpublished)
    fi
    bundle exec jekyll serve "${serve_args[@]}" &
}

start_jekyll

while true; do
    inotifywait -q -e modify,move,create,delete $CONFIG_FILE
    if [ $? -eq 0 ]; then
        echo "Change detected to $CONFIG_FILE, restarting Jekyll"
        jekyll_pid=$(pgrep -f jekyll)
        kill -KILL $jekyll_pid
        start_jekyll
    fi
done

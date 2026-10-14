#!/bin/sh
# Xcode Cloud kjører dette rett etter at koden er hentet: installerer Node, pakkene og kopierer app-skallet inn i iOS-prosjektet.
set -e
export HOMEBREW_NO_AUTO_UPDATE=1 HOMEBREW_NO_INSTALL_CLEANUP=1
brew install node@22 >/dev/null
export PATH="$(brew --prefix node@22)/bin:$PATH"
cd "$CI_PRIMARY_REPOSITORY_PATH"
node -v
npm ci --no-audit --no-fund
npx cap sync ios

# foundry changelog
0.14.0 - Moved to external `bower` and `component` release plugins

0.13.0 - Moved to external `git` release plugin

0.12.0 - Introduced `glob` discovered modules

0.11.0 - Relocated `message` generation from `git` plugin to `release` command itself

0.10.0 - Moved from `version` to `params` for all release steps

0.9.0 - Broke up setVersion, register, and publish into release specific libraries

0.8.1 - Corrected lint errors

0.8.0 - Moved from minified `exec` calls to update version to `fs` read/write

0.7.0 - Rearranged steps into setVersion, register, and publish

0.6.0 - Relocated foundry library from `bin` to `lib`

0.5.0 - Upgraded completion library to `commander-completion`

0.4.1 - Removed extra space from auto-complete output

0.4.0 - Added rudimentary bash/zsh completion via opt-in `npm run link-bash-completion`

0.3.0 - Completed tests for `release-bower`, `release-component`, and `release-pypi`

0.2.0 - Refactored Factory to extend from Commander and started `release-npm` test

0.1.2 - Fixed git test in Travis CI

0.1.1 - Updated test to run against `git` and in enclosed environments only

0.1.0 - Initial port of `git-release` hooks from `twolfson/dotfiles`

# foundry [![Build status](https://travis-ci.org/twolfson/foundry.png?branch=master)](https://travis-ci.org/twolfson/foundry)

Release manager for [npm][], [bower][], [component][], [PyPI][], [git tags][], and any plugin you can write.

[npm]: http://npmjs.org/
[bower]: http://bower.io/
[component]: http://component.io/
[PyPI]: http://pypi.python.org/
[git tags]: http://git-scm.com/

This was created out of frustration; there was no generic *sharable* release manager. Previously, I was using [git-extra's git-release][] command with [dotfiles git hooks][].

[git-extra's git-release]: https://github.com/visionmedia/git-extras/blob/1.9.0/Readme.md#git-release
[dotfiles git hooks]: https://github.com/twolfson/dotfiles/tree/0.39.1/git-template-dir/hooks

![Example foundry-release](docs/foundry-release.png)

## Getting Started
Install the module via: `npm install foundry`

By default, `foundry` is not configured with any release libraries. Install a release library via `npm`:

```bash
npm install foundry-release-bower  # bower
npm install foundry-release-component  # component.io
npm install foundry-release-git  # git
npm install foundry-release-npm  # npm
npm install foundry-release-pypi  # PyPI
```

Details about existing plugins and their documentation can be found under the [Plugins](#plugins) heading.

For example purposes, we will create/release on a local-only `git` repository.

```bash
# Install a `git` foundry-release plugin
npm install foundry-release-git

# Create git repo
mkdir foundry-example
cd foundry-example
git init
echo "Hello World" > README.md
git add README.md
git commit -m "Added documentation"

# Run our release
./node_modules/.bin/foundry release
# [master c6ce921] Release 0.1.0

# See the release commit and tag
git log --decorate --oneline
# c6ce921 (HEAD, tag: 0.1.0, master) Release 0.1.0
# f0c25b3 Added documentation
```

### Global installation
`foundry` supports global installation as it loads plugins from its peer node modules. This previous example can be done globally via

```bash
npm install -g foundry
npm install
# ...
foundry release
```

## Documentation
`foundry` provides a command line interface for releasing.

```bash
$ foundry --help

  Usage: foundry [options] [command]

  Commands:

    release <version>      Set version for package metadata and publish to registries
    plugins                List installed `foundry` plugins
    completion             Get potential completions for a command. Looks for `COMP_CWORD`, `COMP_LINE`, `COMP_POINT`.

  Options:

    -h, --help     output usage information
    --plugin-dir <directory>  Directory to load plugins from. Should have same structure as `node_modules`
    -V, --version  output the version number

```

Example releases are:

```bash
foundry release 0.1.0
foundry release 0.3.0
foundry release 1.0.0
```

> Commands that automatically increment semver are planned (e.g. `foundry release major`, `foundry release minor`). See https://github.com/twolfson/foundry/issues/16 for more information.

### Release process

When a release occurs, the following steps are processed:

1. Update files, update package files with the new version and changes (e.g. update `package.json`, add to `CHANGELOG.md`)
2. Commit, persist any changes to a version control system (e.g. `git commit && git tag`)
3. Register, if the package is new (semver === `0.1.0`), then register it to its repository (e.g. `python setup.py register`)
4. Publish, release changes to package's repostiroy manager (e.g. `npm publish`)

### Plugins
`foundry` plugins contain the `foundry-plugin` keyword and adhered to the `foundry` release plugin specification:

https://github.com/twolfson/foundry-release-spec

Existing plugins are:

- [foundry-release-bower][], manages `version` in `bower.json`
- [foundry-release-component][], manages `version` in `component.json`
- [foundry-release-git][], runs `git tag` and `git commit` upon release
- [foundry-release-npm][], manages `version` in `package.json` and runs `npm publish` upon release
- [foundry-release-pypi][], manages `version` in `setup.py` and registers/zips/gzips package upon release
- More plugins can be found at https://www.npmjs.org/browse/keyword/foundry-release

[foundry-release-bower]: https://github.com/twolfson/foundry-release-bower
[foundry-release-component]: https://github.com/twolfson/foundry-release-component
[foundry-release-git]: https://github.com/twolfson/foundry-release-git
[foundry-release-npm]: https://github.com/twolfson/foundry-release-npm
[foundry-release-pypi]: https://github.com/twolfson/foundry-release-pypi

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint via [grunt](https://github.com/gruntjs/grunt) and test via `npm test`.

## Donating
Support this project and [others by twolfson][gittip] via [gittip][].

[![Support via Gittip][gittip-badge]][gittip]

[gittip-badge]: https://rawgithub.com/twolfson/gittip-badge/master/dist/gittip.png
[gittip]: https://www.gittip.com/twolfson/

## Unlicense
As of Dec 07 2013, Todd Wolfson has released this repository and its contents to the public domain.

It has been released under the [UNLICENSE][].

[UNLICENSE]: UNLICENSE

# foundry [![Build status](https://travis-ci.org/twolfson/foundry.png?branch=master)](https://travis-ci.org/twolfson/foundry)

Release manager for npm, bower, component, PyPI, and any plugin you can write

Grand vision:

- foundry - Sugar command that wraps subcommands (also node modules with `bin` scripts for individual invocation)
- foundry-config - Manage config for foundry `~/.foundry/config.json`
- // TODO: Consider how we can read from global npm install. Probably better to have our own in case we need to override things
- // TODO: Maybe we can put these together into `foundry-manager`? (e.g. what about upgrades)
- foundry-install - Installs
- foundry-uninstall - Installs
    - Alias as `unlink`
- foundry-release - Discovers installed release scripts, determines flavors that match, compares and upgrades semvers.
    - If there are semvers that don't line up, it will prompt for action (maybe another library itself)
    - If semvers cannot be increased (e.g. a flavor doesn't support `release`)
        - // TODO: Is this a likely case? Does PyPI deal with this? Is this YAGNI for our MVP?
- foundry-release-npm - Release script for npm. Looks for package.json, bumps semver, saves, publishes to npm.
- foundry-release-git - Find the oldest git tag (defaults to 0.1.0 -- config override), bumps semver, git tag, git push --tags
- foundry-release-changelog-md - This will not be part of the initial release. Or maybe it will be. This will insert a new line to a markdown template of the following format (maybe using reverse templating)
- foundry-release-changelog-md -

```markdown
# foundry changelog
0.1.0 - Implemented release library
```

Templater will see:

```
# {{name}} changelog
{{version}} - {{message}}
```

`release` command will need to accept `major`, `minor`, `patch`, `release <name>`, `<semver>` (e.g. `0.1.0`).

// TODO: $EDITOR opening should be another node module
Optionally, a message can be provided via `-m, --message`. If not provided, a prompt will open in $EDITOR (config can override this).

Each release script must have the following export functions

// TODO: We are worrying about other formats beyond semver but we don't know what they look like. It is silly to try to future proof for something we cannot predit. Consider it YAGNI.

```js
exports.getVersion = function (options, cb) {
  // Working directory will be process.cwd();
  // options.cwd = process.cwd();
};
exports.setVersion = function (version, options, cb) {
  // semver = 0.1.0+release
  // TODO: Thoughts on semver.major, semver.minor, semver.patch as properties?
};
// Optional function to register if the package is brand new
exports.register = function (options, cb) {
  // Register to PyPI
  // Maybe bower too?
};
exports.publish = function (options, cb) {
  // Publish to npm, git tag, zip + tarball to PyPI
};
// Optional setting for semver types
exports.accepts = {
  semver: {
    major: true,
    minor: true,
    patch: true,
    release: false
  }
};
```

config will accept a mustache template for formatting

```js
{
  // versionFormat: 'v{{major}}.{{minor}}.{{patch}}{{#release}}{{.}}{{/release}}'
  versionFormat: '{{major}}.{{minor}}.{{patch}}{{#release}}{{.}}{{/release}}',
  defaults: {
    message: 'Release {{version}}',
    version: '0.1.0'
  }
}
```

## Getting Started
Install the module with: `npm install foundry`

```javascript
var foundry = require('foundry');
foundry.awesome(); // "awesome"
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

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

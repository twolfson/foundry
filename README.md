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

        ```markdown
        # foundry changelog
        0.1.0 - Implemented release library
        ```

        Templater will see:

        ```markdown
        # {{name}} changelog
        {{version}} - {{message}}
        ```

    - foundry-release-bower - Look at the bower.json (don't fallback to component.json due to potential conflicts). Get the latest semver. If this is the first release, register with the register. git tag the version.
        - // TODO: How will this play with `git-tag`?
        - // TODO: Should git-tag play dead on bower.json files? Probably not in case they don't use release-bower.
        - // TODO: Both bower and git-tag should be tolerant if the current version already has the proper tag.
    - foundry-release-component - Same as bower except with different register mechanism. Initial versions will not automatically register into the wiki page.
    - foundry-release-pypi - Register setup.py to PyPI, publish with zip + tarball (allow for customization via config, under some namespace)
- foundry-link - Links the current folder into the list of registered releasers

// TODO: Initial release could forego increasing of versions and go with a set-only approach.

// TODO: Consider safeguards (e.g. don't release unless on `master`, probably inside of hooks)

`release` command will need to accept `major`, `minor`, `patch`, `pre-release <name>`, `<semver>` (e.g. `0.1.0`).

There will be the option to add `metadata` via `--metadata <metadata>`.

The commands above were provided by http://semver.org/

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
  // semver = 0.1.0-pre-release+metadata
  // TODO: Thoughts on semver.major, semver.minor, semver.patch as properties?
};
// Optional function to register if the package is brand new
// TODO: This should be a prompt (e.g. "This looks like an initial release. Should we register to the appropriate registries? [Y/n]
exports.register = function (options, cb) {
  // Register to PyPI
  // Maybe bower too?
};
exports.publish = function (options, cb) {
  // Publish to npm, git tag, zip + tarball to PyPI
};

// Optional setting for semver types
exports.accepts = {
  major: true,
  minor: true,
  patch: true,
  'pre-release': false,
  metadata: false
};
```

config will accept a mustache template for formatting

```js
{
  // versionFormat: 'v{{major}}.{{minor}}.{{patch}}{{#pre-release}}-{{.}}{{/pre-release}}{{#metadata}}+{{.}}{{/metadata}}',
  versionFormat: '{{major}}.{{minor}}.{{patch}}{{#pre-release}}-{{.}}{{/pre-release}}{{#metadata}}+{{.}}{{/metadata}}',
  defaults: {
    // TODO: Users will prob want a hook for injecting metadata, figure that out.
    // TODO: Maybe `~/.foundry/hooks/metadata.js`?
    message: 'Release {{version}}',
    version: '0.1.0'
  }
}
```

We might want standalone functions for register and publish

```bash
foundry register
foundry publish
```

Maybe even register/publish with callouts to specific releasers

```bash
foundry register git-tag
foundry publish git-tag
```

This leads to the question of `get-version` and such as well

```bash
foundry get-version # 1.33.7
foundry set-version 42.0.0

foundry get-version bower # 1270.0.1
foundry set-version npm 192168.1.1
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

#!/usr/bin/env bash
# Exit on our first error
set -e

# Install a `git` foundry-release command
npm install foundry-release-git

# Copy over symlink to our foundry instance
ln -s ../../bin/foundry ./node_modules/.bin/

# Create git repo
mkdir foundry-example
cd foundry-example
git init
echo "Hello World" > README.md
git add README.md
git commit -m "Added documentation"

# Generate `package.json` with `foundry` config
cat > package.json <<EOF
{
  "foundry": {
    "releaseCommands": [
      "foundry-release-git"
    ]
  }
}
EOF

# Run our release
#   Prepending `./node_modules/.bin/` to `PATH` can be avoided by using `foundry-cli`
#   https://github.com/twolfson/foundry-cli
#   or by using `npm-run-script`
#   https://www.npmjs.org/doc/misc/npm-scripts.html#environment
PATH="$PATH:./node_modules/.bin/foundry"
foundry release 1.0.0
# [master c6ce921] Release 1.0.0

# See the release commit and tag
git log --decorate --oneline
# c6ce921 (HEAD, tag: 1.0.0, master) Release 1.0.0
# f0c25b3 Added documentation

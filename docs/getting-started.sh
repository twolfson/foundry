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
foundry release
# [master c6ce921] Release 0.1.0

# See the release commit and tag
git log --decorate --oneline
# c6ce921 (HEAD, tag: 0.1.0, master) Release 0.1.0
# f0c25b3 Added documentation

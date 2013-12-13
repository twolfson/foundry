# Points of reference
# https://github.com/git/git/blob/v1.8.5/contrib/completion/git-completion.bash
# https://github.com/isaacs/npm/blob/v1.3.17/lib/utils/completion.sh

_foundry_completion () {
  echo 'hai'
  COMPREPLY=('release')
}

complete -F _foundry_completion foundry
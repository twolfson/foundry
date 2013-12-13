# Points of reference
# https://github.com/git/git/blob/v1.8.5/contrib/completion/git-completion.bash
# https://github.com/isaacs/npm/blob/v1.3.17/lib/utils/completion.sh

_foundry_completion () {
  # COMP_WORDBREAKS=${COMP_WORDBREAKS/=/}
  # COMP_WORDBREAKS=${COMP_WORDBREAKS/@/}
  #   IFS=$'\n' COMPREPLY=($(COMP_CWORD="$COMP_CWORD" \
  #                          COMP_LINE="$COMP_LINE" \
  #                          COMP_POINT="$COMP_POINT" \
  echo "$COMP_CWORD"
  echo "$COMP_LINE"
  echo "$COMP_POINT"
  COMPREPLY=('release\n')
}

complete -F _foundry_completion foundry
# Points of reference
# https://github.com/git/git/blob/v1.8.5/contrib/completion/git-completion.bash
# https://github.com/isaacs/npm/blob/v1.3.17/lib/utils/completion.sh

_foundry_completion () {
  # COMP_WORDBREAKS=${COMP_WORDBREAKS/=/}
  # COMP_WORDBREAKS=${COMP_WORDBREAKS/@/}
  #   IFS=$'\n' COMPREPLY=($(COMP_CWORD="$COMP_CWORD" \
  #                          COMP_LINE="$COMP_LINE" \
  #                          COMP_POINT="$COMP_POINT" \
  # echo -n "$COMP_CWORD"
  # echo -n "$COMP_LINE"
  # echo -n "$COMP_POINT"
  echo -n 'A'
  echo -n "${COMP_WORDS[@]}"
  echo -n 'B'
  local si="$IFS"
  # IFS=$'\n' COMPREPLY=('release')
  IFS="$si"
}

complete -F _foundry_completion foundry
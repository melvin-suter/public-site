---
title: Bash Arguments
---

```bash
VAR1="a"
VAR2="b"
VAR3="c"
ARGS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -1|--var1) # --var1 value
      VAR1="$2"
      shift ; shift
      ;;
    -2|--var2) # --var2 value
      SEARCHPATH="$2"
      shift ; shift
      ;;
    -l|--lib) # switch used as --var3
      VAR3=1
      shift
      ;;
    *) # get all other stuff
      ARGS="$*"
      shift
      ;;
  esac
done
```
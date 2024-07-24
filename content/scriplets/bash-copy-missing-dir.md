---
title: Bash copy only missing directories
---

```bash
# Make sure you either use a tailing / on both or none of the following variables!!!
SOURCE_DIR="/path/to/source"
DEST_DIR="/path/to/dest"

find $SOURCE_DIR -maxdepth 1 -type d | sed -E "s;^$SOURCE_DIR;;" | while read dir ; do
  test -d $DEST_DIR$dir || /bin/cp -Rf $SOURCE_DIR$dir $DEST_DIR$dir
done
```

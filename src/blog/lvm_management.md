---
title: LVM Management
tags: 
- tech
- kb
- linux
---

## Reload Disk Info

```bash
echo 1 > /sys/block/sdX/device/rescan
```

## Resize Disk

Use parted to resize partiion if needed

```bash
# for example /dev/sda3
$ parted /dev/sdXX
(parted) print free
(...)

Number  Start   End     Size    File system  Name                  Flags
        17.4kB  1049kB  1031kB  Free Space
 1      1049kB  630MB   629MB   fat32        EFI System Partition  boot, esp
 2      630MB   1704MB  1074MB  xfs
 3      1704MB  64.4GB  62.7GB                                     lvm
        64.4GB  164.4GB 100GB   Free Space
        
(parted) resizepart 3
End?  [64.4GB]? 164.4GB
(parted) quit
```

Resize pv

```bash
# for example /dev/sda3
pvresize /dev/sdXX
```

Resize lv

```bash
# Specific size
lvresize --size 1.34t /dev/mapper/cl-root

# Full
lvresize -l+100%FREE /dev/mapper/cl-root
```

Resize fs

```bash
# for ext3
resize2fs /dev/mapper/cl-root
# for xfs
xfs_growfs /dev/mapper/cl-root
```


## Check on State/Progress

```bash
# Show Filesystem
df -h

# Show Disks
lsblk

# Show LVM Infos
pvs
vgs
lvs
```

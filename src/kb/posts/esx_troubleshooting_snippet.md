---
title: ESXi Troubleshooting Snippets
date: 2023-07-17
tags: 
- kb
- vmware
---


VM Processes

```bash
# List all VMs
esxcli vm process list	

# Filter by name
esxcli vm process list	| grep -A3 -i VMNAMEHERE

# Kill soft
esxcli vm process kill -t soft -w XXXXX

# Kill hard
esxcli vm process kill -t hard -w XXXXX
```

Task Management

```bash
# List all tasks
vim-cmd vimsvc/task_list

# Get task Info (taskid liek haTask--vim.....)
 vim-cmd vimsvc/task_info TASKIDHERE

# Cancle task (taskid liek haTask--vim.....)
vim-cmd vimsvc/task_cancel TASKIDHERE
```

Check ESXI locks

```bash
lsof | grep -i 'FILENAMEHERE'
```
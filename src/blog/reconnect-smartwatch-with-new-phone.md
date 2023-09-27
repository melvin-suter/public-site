---
title: Reconnect Smartwatch with new Phone
date: 2022-12-21
tags: 
- blog
- tech
---

You got a new phone? Greate for you. But now your smartwatch won't connect to it. There is a simple fix for that.

**Prerequisites:**

- Developer Mode activated on smartwatch
- Allow ADB over WiFi
- Downloaded ADB
- PC and Smartwatch connected on same wifi (for example your phone hotspot)
- Run the following adb commands to "reset" your smartwatch's bluetooth to connect to new phone:

```
adb connect SMARTWATCH-IP-HERE
adb shell "pm clear com.google.android.gms && reboot"
adb disconnect
adb connect SMARTWATCH-IP-HERE
adb shell " am start -a android.bluetooth.adapter.action.REQUEST_DISCOVERABLE"
```

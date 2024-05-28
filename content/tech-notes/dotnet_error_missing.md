---
title: The application 'add' does not exist.
tags: 
- linux
- dotnet
---

You're trying to run `dotnet add package <PACKAGE>` on a RHEL based system and get this error:

```bash
he command could not be loaded, possibly because:
  * You intended to execute a .NET application:
      The application 'add' does not exist.
  * You intended to execute a .NET SDK command:
      No .NET SDKs were found.

Download a .NET SDK:
https://aka.ms/dotnet-download

Learn about SDK resolution:
https://aka.ms/dotnet/sdk-not-found
```

## Issue

The problem is, the .rpm inside the microsoft repo has dependencies on packages like `dotnet-hostfxr-6.0.x86_64`, which are also present in the default AppStream repo.
So it gets the packages from the wrong repository.

## Solution

You're in luck. There is a simple fix:
```bash
dnf remove dotnet-*
dnf install --repo=packages-microsoft-com-prod dotnet-sdk-6.0
```

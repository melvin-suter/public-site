---
title: YubiKey Setup SSH
date: 2022-01-01
tags: 
- kb
- linux
---

This guide will help you setup yubikey as an optional authentification method for ssh. (on CentOS)

# Install packages 

on Server

```bash
yum install -y epel-release
yum install -y pam_yubico
```

on Client:

```bash
yum install -y yubico-piv-tool
```

# Setup Key

```bash
yubico-piv-tool -s 9a -a generate -o public.pem
yubico-piv-tool -a verify-pin -a selfsign-certificate -s 9a -S "/CN=SSH key/" -i public.pem -o cert.pem
yubico-piv-tool -a import-certificate -s 9a -i cert.pem
```

# Setup PKCS11

On client:

```bash
# Check if file is really there
ll /usr/lib64/pkcs11/opensc-pkcs11.so 
# Create enviroment variable
echo "export OPENSC_LIBS=/usr/lib64/pkcs11" > /etc/profile.d/opensclibs.sh
```

# Setup SSH Key

On Client:

```bash
ssh-keygen -D $OPENSC_LIBS/opensc-pkcs11.so -e
# Add one of the keys to the remote machine
ssh -I $OPENSC_LIBS/opensc-pkcs11.so user@remote.example.com
```

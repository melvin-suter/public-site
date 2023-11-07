---
title: SSH for Windows
tags: 
- blog
- windows
---

A lot of people might be aware, that windows supports the openssh client natively now. Just had over to powershell and enter `ssh server.example.org` and you can start a ssh connection.

**But...**

How many knew that you can setup openssh server too?

Let's give it a try:

```powershell
# Install Feature
Get-WindowsCapability -Online | ? {$_.Name -like 'OpenSSH.Server*' } |Select -first 1  |Add-WindowsCapability -Online

# Start the sshd service
Start-Service sshd

# OPTIONAL but recommended:
Set-Service -Name sshd -StartupType 'Automatic'

# Confirm the Firewall rule is configured. It should be created automatically by setup. Run the following to verify
if (!(Get-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -ErrorAction SilentlyContinue | Select-Object Name, Enabled)) {
    Write-Output "Firewall Rule 'OpenSSH-Server-In-TCP' does not exist, creating it..."
    New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
} else {
    Write-Output "Firewall rule 'OpenSSH-Server-In-TCP' has been created and exists."
}
```
---
title: Setup Raspberry Pi Sensor for Zabbix
date: 2023-07-17
tags: 
- kb
- linux
---

## Image Prep

```
# Prep
dnf install -y qemu-img
modprobe nbd max_part=8
qemu-nbd --connect=/dev/nbd0 raspios.img

# Mount Partition
fdisk /dev/nbd0 -l
mkdir /mnt/d1
mkdir /mnt/d2
mount /dev/nbd0p1 /mnt/d1
mount /dev/nbd0p2 /mnt/d2

# Inject Script
git clone  https://github.com/melvin-suter/raspberry_pi_sensor.git /mnt/d2/opt/raspberry_pi_sensor
cp /mnt/opt/raspberry_pi_sensor/env-mon.service /mnt/d2/etc/systemd/system/env-mon.service
cp /mnt/opt/raspberry_pi_sensor/custom_startup.service /mnt/d2/etc/systemd/system/custom_startup.service
ln -s /mnt/d2/etc/systemd/system/env-mon.service /mnt/d2/etc/systemd/system/multi-user.target.wants/env-mon.service
ln -s /mnt/d2/etc/systemd/system/custom_startup.service /mnt/d2/etc/systemd/system/multi-user.target.wants/custom_startup.service

# Inject boot
cp /mnt/d2/opt/raspberry_pi_sensor/boot/* /mnt/d1/
while read -r line; do
grep -qxF $line /mnt/d1/config.txt || echo $line >> /mnt/d1/config.txt
done < /mnt/d2/opt/raspberry_pi_sensor/boot/custom_config.txt

# Unmount
umount /mnt/d1
umount /mnt/d2
qemu-nbd --disconnect /dev/nbd0
rmmod nbd
```


------------------------------------

## OLD STUFF

## Setup Wifi

`nano /etc/wpa_supplicant/wpa_supplicant.conf`
```
country=CH
update_config=1
ctrl_interface=/var/run/wpa_supplicant

network={
    scan_ssid=1
    ssid="SSID"
    psk="PASSWORD"
}
```


## Setup Sensor

`nano /boot/config.txt`
Add:
```
dtoverlay=w1-gpio
```

Activate Modules
```
modprobe w1-gpio
modprobe w1-therm
ls /sys/bus/w1/devices
#Will show something like 28-XXXX
cat /sys/bus/w1/devices/28-XXXXX/w1_slave
```

## Zabbix

Setup Agent
```bash
wget https://repo.zabbix.com/zabbix/5.2/raspbian/pool/main/z/zabbix/zabbix-sender_5.2.3-1%2Bdebian10_armhf.deb
dpkg -i zabbix-sender_5.2.3-1+debian10_armhf.deb
mkdir /etc/zabbix

echo "# Server
Server=zabbixserver.domain.local
ServerActive=zabbixserver.domain.local

# Encryption
TLSConnect=psk
TLSPSKFile=/etc/zabbix/zabbix_agentd.psk
TLSPSKIdentity=ID-HERE

" > /etc/zabbix/zabbix_sender.conf
echo "YOURKEYHERE" > /etc/zabbix/zabbix_agentd.psk
```

Setup Script
```bash
mkdir /opt/temp_sender
git clone https://github.com/melvin-suter/raspberry_pi_sensor.git /opt/temp_sender
```

<a href="/assets/raspberrypi_sensor_template.yaml">Download Template</a>
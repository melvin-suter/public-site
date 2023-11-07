---
title: Kubernetes Setup - Rancher
date: 2023-10-05
# permalink: false
tags: 
- linux
- kubernetes
---

## Rancher Setup

> Allthough I'll be showing stable here, I used alpha as the current stable version is not compatible with kubernetes 1.27

Lets begin installing rancher on our k3s00 cluster:

```bash
# Add Repository
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable

# Create Namespace
kubectl create namespace cattle-system
```yubikey-setup-ssh.md (liquid)
[1] [11ty] Writing ../dist/blog/index.html from ./blog/index.md (liquid)

For rancher we need cert-manager, but I wan't to use let's encrypt for almost everything. So we definitely need cert-manager:

```bash
# If you have installed the CRDs manually instead of with the `--set installCRDs=true` option added to your Helm install command, you should upgrade your CRD resources before upgrading the Helm chart:
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.crds.yaml

# Add the Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io

# Update your local Helm chart repository cache
helm repo update

# Install the cert-manager Helm chart
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.0
```

And we can see the cert-manager working:

```bash
[root@k3s00-01 ~]# kubectl get pods --namespace cert-manager
NAME                                       READY   STATUS    RESTARTS   AGE
cert-manager-59b7f65948-mxt69              1/1     Running   0          39s
cert-manager-cainjector-7fd8f6bbbf-vmt4b   1/1     Running   0          39s
cert-manager-webhook-787cd749dc-msscl      1/1     Running   0          39s
```

> We are going to take a little shortcut here.
> Usually I would let let's encrypt sign the ingress certs. But because ranger will only be available from controlled jump-hosts, where I can easily add certs, we will use self-signed certificates. This has the advantage of beeing a lot simpler to setup, than Let's Encrypt DNS based issuers.

Let's install ranger:

```bash
# All Kubernetes apps will be available with the tld apps.suter.dev, except for some public facing stuff
helm install rancher rancher-stable/rancher \
  --namespace cattle-system \
  --set hostname=rancher.apps.suter.dev \
  --set bootstrapPassword=SuperAdmin1234
```

After the next chapter we can access it with the browser and change the admin password.

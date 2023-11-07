---
title: WIP Kubernetes Setup
date: 2023-10-05
# permalink: false
tags: 
- blog
- linux
- kubernetes
---

# THIS IS STILL WIP #

I've been on the journy of kubernetes for a while now. I tried K3S single- & multi-node, RKE2, vCenter provisioned, bare-metal.
Now I want to get it right. So I'll start from scratch.

What I want to achiev:
- "Single" Click setup of a new cluster (automatically applaying all needed manifests for storage, argo, etc.)
- K3S single & multi node
- Centralized Rancher & ArgoCD for all Clusters
- vCenter Provisioned
- No external services needed (except DNS and such)

How I'm gonna do it:
- Synology NAS
  - This whill be the NFS Datastore for all clusters
  - NFS Provisioner will be used
- Cluster k3s00
  - This is the kubernetes management cluster
  - 3-Node K3S
  - Rancher, ArgoCD, Rundeck, Gitlab (everything needed to manage kubernetes)
  - Will be manually setup, because of the hen-egg problem
  - embedded HA etcd database, so no external database is needed
- Cluster k3sXX
  - "App" Clusters
  - Can be Single or Multi Node
  - Auto Setup through k3s00
  - embedded HA etcd database, so no external database is needed
- Networking
  - DHCP with static kubevip, so no load-balancer is needed
  - DHCP reservations where needed (for firwalling)
  - Currently all kubernetes clusters will be in their own zone

So let's get to it.

# k3s00 - Management Cluster Setup

The first thing we need is some linux vms. This is easy, as I've already got a rockylinux template.
So let's spin up 3 VMs and get started on setting up k3s.

## k3s setup

On k3s00-01:

```bash
hostnamectl set-hostname k3s00-01.suter.dev

date | sha1sum # generate the k3s secret and copy to SECRET below
curl -sfL https://get.k3s.io | K3S_TOKEN=SECRET sh -s - server --cluster-init

# Install helm
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | sh -s - 

# Copy Config to be usable for helm too
cp /etc/rancher/k3s/k3s.yaml $HOME/.kube/config
```

On k3s00-02 & 03:

```bash
hostnamectl set-hostname k3s00-03.suter.dev
curl -sfL https://get.k3s.io | K3S_TOKEN=SECRET sh -s - server --server https://k3s00-01.suter.dev:6443
```

Let's check the nodes and pods:

```bash
[root@k3s00-03 ~]# kubectl get nodes
NAME                 STATUS   ROLES                       AGE     VERSION
k3s00-01.suter.dev   Ready    control-plane,etcd,master   173m    v1.27.6+k3s1
k3s00-02.suter.dev   Ready    control-plane,etcd,master   5m10s   v1.27.6+k3s1
k3s00-03.suter.dev   Ready    control-plane,etcd,master   53s     v1.27.6+k3s1
[root@k3s00-03 ~]# kubectl get pods -A
NAMESPACE     NAME                                     READY   STATUS      RESTARTS   AGE
kube-system   coredns-77ccd57875-p6tvc                 1/1     Running     0          172m
kube-system   helm-install-traefik-4kt8z               0/1     Completed   1          172m
kube-system   helm-install-traefik-crd-d5nz9           0/1     Completed   0          172m
kube-system   local-path-provisioner-957fdf8bc-cbspp   1/1     Running     0          172m
kube-system   metrics-server-648b5df564-sbsnr          1/1     Running     0          172m
kube-system   svclb-traefik-33e9b2f1-4g2zn             2/2     Running     0          172m
kube-system   svclb-traefik-33e9b2f1-6slkn             2/2     Running     0          5m11s
kube-system   svclb-traefik-33e9b2f1-7wvrk             2/2     Running     0          54s
kube-system   traefik-64f55bb67d-mlqp4                 1/1     Running     0          172m
```

Looks good.

## Rancher Setup

We are going to install rancher now, you can have a look here: <a href="/blog/posts/kubernetes_setup_rancher">Kubernetes Setup - Rancher</a>

## KubeVIP

Before we can go any further, we need a VIP for our cluster. Have a look here: <a href="/blog/posts/kubernetes_setup_kubevip">Kubernetes Setup - KubeVIP</a>

## NFS Storage Provider

For storage setup, have a look here: <a href="/blog/posts/kubernetes_setup_storage">Kubernetes Setup - Storage</a>

## Harbor

We need a centralized image repository for our own images.
So we're going to setup a harbor: <a href="/blog/posts/kubernetes_setup_harbor">Kubernetes Setup - Harbor</a>


## Rundeck

We now need an automation platform. So let's get a rundeck up.
Have a look here how to do it: <a href="/blog/posts/kubernetes_setup_rundeck">Kubernetes Setup - Rundeck</a>

## Cert-Manager

Let's setup Let's Encrypt. I'm using digital ocean as a DNS provider.

```yaml
apiVersion: v1
data:
  access-token: >-
    SOMETOKENGOESHERE
kind: Secret
metadata:
  name: digitalocean-dns
  namespace: cert-manager
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: SOMEEMAILGOESHERE
    preferredChain: ''
    privateKeySecretRef:
      name: letsencrypt
    server: https://acme-v02.api.letsencrypt.org/directory
    solvers:
      - dns01:
          digitalocean:
            tokenSecretRef:
              key: access-token
              name: digitalocean-dns
```
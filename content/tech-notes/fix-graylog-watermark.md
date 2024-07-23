---
title: Fix Graylog Watermark
date: 2024-07-23
tags: 
- linux
---

If you monitor your graylog server already and use a single node instance, there is no real need for a watermark on your open/elasticsearch server.
Here you go:

```bash
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "transient": {

    "cluster.routing.allocation.disk.watermark.low": "50g",
    "cluster.routing.allocation.disk.watermark.high": "1g",
    "cluster.routing.allocation.disk.watermark.flood_stage": "512m",
    "cluster.info.update.interval": "15m"
  }
}'
```

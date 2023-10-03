---
title: Graylog Migration
date: 2023-07-17
tags: 
- kb
- linux
---


## How

The easiest way to migrate a graylog instance, is to build a new one and migrate elasticsearch data by combining the two elasticsearch nodes to a cluster and replicating all data.

### Which issues will I have?
Hopefully none :D
But realistically, you will have to reinstall content-packs or at least clone & delete all streams. They seem to be failing during the import.

## Procedure

>> Stop graylog-server before you start with anything!


### Setup Elasticsearch Cluster

Open port 9200 & 9300 (for NFT it is: `nft add rule default INPUT tcp dport 9200 accept ; nft add rule default INPUT tcp dport 9300 accept`

Prepares node by editing conf file `vim /etc/elasticsearch/elasticsearch.yml` and change:

**New One**
```yaml
node.name: uniqlog-02
cluster.name: graylog
network.host: 10.10.2.38
http.port: 9200
discovery.seed_hosts: ["10.10.2.37", "10.10.2.38"]
cluster.initial_master_nodes: ["10.10.2.37", "10.10.2.38"]
node.master: true
```

**Old One**
```yaml
node.name: uniqlog-01
cluster.name: graylog
network.host: 10.10.2.37
http.port: 9200
discovery.seed_hosts: ["10.10.2.37", "10.10.2.38"]
cluster.initial_master_nodes: ["10.10.2.37", "10.10.2.38"]
node.master: true
```

Restart elasticsearch on both nodes `systemctl restart elasticearch` & check if the cluster has 2 nodes:
`curl -XGET http://10.10.2.37:9200/_cluster/health?pretty`

> If they don't want tu cluster, try renaming `/var/lib/elasticsearch/nodes/0/_state` on the new server, while having elasticsearch stopped.
{.is-info}

Check on state 
```bash
while true ; do echo "$(date +%T) $(curl -s -XGET http://10.6.248.20:9200/_cat/indices?v | awk '{print $3}' | tail -n +2 | xargs -I{} curl -s -XGET http://10.6.248.20:9200/_cat/shards/{}/ | grep "UNASSIGNED" | wc -l)" ; sleep 1; done
```


### Migrate Data

If you check the indexes you will see, that they aren't replicated yet:
```
curl -s -XGET http://10.10.2.37:9200/_cat/indices?v
curl -s -XGET http://10.10.2.38:9200/_cat/indices?v
``` 

Increase replicas for all indexes:
```bash
curl -s -XGET http://10.10.2.37:9200/_cat/indices?v | awk '{print $3}' | tail -n +2 | xargs -I{} curl -XPUT 10.10.2.37:9200/{}/_settings -H 'Content-Type: application/json' -d '{
  "index" : {
    "number_of_replicas" : 1,
    "auto_expand_replicas": false
  }
}'
```

Restart elasticsearch again if necessary + wait and watch (all shards need to be allocated + indixes on green):
```bash
watch "curl -s -XGET http://10.10.2.37:9200/_cat/indices?v ; echo ==========================; curl -s -XGET http://10.10.2.38:9200/_cat/shards?v"

# OR

watch echo "$(curl -s -XGET http://10.129.205.31:9200/_cat/shards?v | grep "205.30" | wc -l) / $(curl -s -XGET http://10.129.205.31:9200/_cat/shards?v | grep "  p  " | wc -l)"

```

Evacuate NOde (if needed):
```bash
curl -XPUT 10.10.2.37:9200/_cluster/settings -d '{
  "transient" : {
  	"cluster.routing.allocation.exclude._ip" : "10.10.2.37"
  }
}'
```

### Breakup Cluster

Remove Voting rights for old node:
```bash
curl -X POST "10.10.2.38:9200/_cluster/voting_config_exclusions?node_names=uniqlog-02"
```


Reset replica count:
```bash
curl -s -XGET http://10.10.2.38:9200/_cat/indices?v | awk '{print $3}' | tail -n +2 | xargs -I{} curl -XPUT 10.10.2.38:9200/{}/_settings -H 'Content-Type: application/json' -d '{
  "index" : {
    "number_of_replicas" : 0
  }
}'
```

Stop elasticsearch on the old server

Edit the elasticsearch config on the new server & restart:
```
node.name: uniqlog-02
cluster.name: graylog
network.host: localhost
http.port: 9200
discovery.seed_hosts: ["localhost"]
cluster.initial_master_nodes: ["localhost"]
node.master: true
```

Remove voting exlusion:
```bash
curl -X DELETE "localhost:9200/_cluster/voting_config_exclusions"
```


### Dump & Restore MongoDB

On the old server, dump mongodb with `mongodump` & copy the whole `dump` folder to the new server. Import it with ` mongorestore dump`

### Finished
start graylog



## Reindex if it doesnt work

```bash
newIP=10.10.2.38

# Update template shards (just ignore the fact, that elasticsearch can't handle basic shit like update..... it creates a duplicate.....)
curl -s -XPOST http://$newIP:9200/_index_template/shrttrm_-template -H 'Content-Type: application/json' -d '{
  "index_patterns" : ["shrttrm__*"],
  "template": {
    "settings": {
      "number_of_shards": 1
    }
  }
}'

curl -s -XGET http://$newIP:9200/_cat/indices?v | grep -i yellow | awk '{print $3}' | while read line ; do
	curl -s -XPUT "$newIP:9200/${line}_reindex" -d "{
    $(curl -s -XGET "$newIP:9200/${line}/_mapping" | tail -n +3 | head -n -2 )
  }"

	echo "$line -> ${line}_reindex"
  curl -s -XPOST http://$newIP:9200/_reindex -H 'Content-Type: application/json' -d "{
    \"source\": {
    	\"index\": \"${line}\"
    },
    \"dest\": {
    	\"index\": \"${line}_reindex\",
			\"version_type\": \"external\"
    }
  }"
done



POST _reindex
{
  "source": {
    "index": "my-index-000001"
  },
  "dest": {
    "index": "my-new-index-000001"
  }
}
```
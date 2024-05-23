---
title: Elasticsearch 2 Opensearch
date: 2023-10-03
tags: 
- linux
---

You might want to move from elasticsearch to opensearch due to the changes of graylog 5.<br>I was at the same position. We currently deploy mostly single-node standalone environments. This procedure is suited for those environments.

# 1. Step - Update Mongodb

We are upgrading from 4.2 to 6.0. This can only be done with steps between like `4.2 -> 4.4 -> 5.0 -> 6.0`.

Use these commands to upgrade:

```bash
#####################
# Upgrade 4.2 to 4.4
#####################

fromRepo=4.2
toRepo=4.4
toVersion=-4.4.25-1.el8

sed -i "s;$fromRepo;$toRepo;" /etc/yum.repos.d/mongodb-org.repo

dnf install -y mongodb-org$toVersion \
  mongodb-org-database$toVersion \
  mongodb-org-database-tools-extra$toVersion \
  mongodb-org-mongos$toVersion \
  mongodb-org-server$toVersion \
  mongodb-org-shell$toVersion \
  mongodb-org-tools$toVersion

systemctl restart mongod

mongo --eval "db.adminCommand( { setFeatureCompatibilityVersion: \"$toRepo\" } )"


#####################
# Upgrade 4.4 to 5.0
#####################

fromRepo=4.4
toRepo=5.0
toVersion=-5.0.21-1.el8

# Run same script


#####################
# Upgrade 5.0 to 6.0
#####################

fromRepo=5.0
toRepo=6.0
toVersion=

# Run same script
```

# Step 2 - Install Opensearch

You can do this manually or with a script/ansible role.
Make sure during configuration to use a different port.

I like to start graylog up quickly after the installation to let it connect to opensearch and set stuff up already.

If graylog acts up because of a missmatch with elastic/opensearch versions, you can force it into a specific version with this setting:

```ini
elasticsearch_version = 7
```

See <a href="https://github.com/Graylog2/graylog2-server/issues/12897">https://github.com/Graylog2/graylog2-server/issues/12897</a>

You have to edit 2 settings manually:

```yml
# Let Opensearch run on a different port while migrating
http.port: 9211

# Allow reindexing from elasticsearch
reindex.remote.allowlist: ["localhost:9200"]
```

# Step 3 - Prepare Bash

Use these variables:

```bash
elasticServer=localhost:9200
opensearchServer=localhost:9211
```

# Step 3 - Prepare Template

I had some issues with tempaltes not working correctely, that's why I use this template to "fix" it:

```bash
curl -XPUT $opensearchServer/_template/graylog-field-fix  -H 'Content-Type: application/json' -d '
{
  "order" : 1,
  "index_patterns" : [
    "*_*"
  ],
  "mappings" : {
    "dynamic_templates" : [
      {
        "internal_fields" : {
          "mapping" : {
            "type" : "keyword"
          },
          "match_mapping_type" : "string",
          "match" : "gl2_*"
        }
      },
      {
        "store_generic" : {
          "mapping" : {
            "type" : "keyword"
          },
          "match_mapping_type" : "string"
        }
      }
    ],
    "properties": {
      "gl2_processing_timestamp" : {
        "format" : "uuuu-MM-dd HH:mm:ss.SSS",
        "type" : "date"
      },
      "gl2_accounted_message_size" : {
        "type" : "long"
      },
      "gl2_receive_timestamp" : {
        "format" : "uuuu-MM-dd HH:mm:ss.SSS",
        "type" : "date"
      },
      "full_message" : {
        "fielddata" : false,
        "analyzer" : "standard",
        "type" : "text"
      },
      "streams" : {
        "type" : "keyword"
      },
      "message" : {
        "fielddata" : false,
        "analyzer" : "standard",
        "type" : "text"
      },
      "timestamp" : {
        "format" : "uuuu-MM-dd HH:mm:ss.SSS",
        "type" : "date"
      }

    }
  },
  "settings" : {
    "index" : {
      "mapping.total_fields.limit" : "10000"
    }
  }
}'
```


# Step 4 - Data Migration

You can now start a reindex script to migrate data like this:

```bash
curl -XGET $elasticServer/_cat/indices?v 2>/dev/null | cat | awk '{print $3}' |tail -n+2 | while read indexName ; do

  echo "################################################"
  echo "$(date) - $indexName - create"
  curl -XPUT $opensearchServer/$indexName  -H 'Content-Type: application/json'  -d '{
    "settings": {
      "index": {
        "blocks" : {
          "write" : "false",
          "metadata" : "false",
          "read" : "false"
        },
      "number_of_shards": "1",
      "number_of_replicas": "0"
      }
    }
  }'



  echo "################################################"
  echo "$(date) - $indexName - start reindex"

  curl http://$opensearchServer/_reindex?pretty -XPOST -H 'Content-Type: application/json' -d "{
      \"source\": {
        \"remote\": {
          \"host\": \"http://$elasticServer\"
        },
        \"index\": \"$indexName\"
      },
      \"dest\": {
        \"index\": \"$indexName\"
      }
    }"



  echo "################################################"
  echo "$(date) - $indexName - delete"
  curl -XDELETE $elasticServer/$indexName

  echo "################################################"
  echo "$(date) - $indexName - done"
  echo "################################################"
  echo "################################################"

done
```

# Step 5 - Uninstall Elasticsearch

Now uninstall elasticsearch, change the opensearch port to the original and make sure it is enabled.
If you used the `elasticsearch_version` fix, remove it.

# Step 6 - Optional: Fix Reindex

If something with the template didn't work out, you can reindex everything like this:

```bash

curl -XGET localhost:9200/_cat/indices?v 2>/dev/null |cat | awk '{print $3}' |tail -n+2 | grep -v ".open" | while read line ; do
  
  echo "$(date) - $line - start"
  curl -XPUT localhost:9200/$line/_settings  -H 'Content-Type: application/json'  -d '{
    "settings": {
      "index.blocks.write": "true"
    }
  }' 
  echo "$(date) - $line - clone"
  curl -XPOST localhost:9200/$line/_clone/old_$line 
  echo "$(date) - $line - delete"
  curl -XDELETE localhost:9200/$line 
  echo "$(date) - $line - reindex"
  curl http://localhost:9200/_reindex?pretty -XPOST -H 'Content-Type: application/json' -d "{
    \"source\": {
      \"index\": \"old_$line\"
    },
    \"dest\": {
      \"index\": \"$line\"
    }
  }" 
  echo "$(date) - $line - delete"
  curl -XDELETE localhost:9200/old_$line 
  echo "$(date) - $line - done"
  
  
done
```


# Step 7 - Optional: Fix Settings

You can now fix index settings like this:
```bash
# Block writes on everything and set replica count to 0
curl -XGET http://localhost:9200/_cat/indices?v | awk '{print $3}' | xargs -I{} curl -XPUT localhost:9200/{}/_settings  -H 'Content-Type: application/json'  -d '{
    "settings": {
      "index": {
        "blocks" : {
          "write" : "true",
          "metadata" : "false",
          "read" : "false"
        },
        "number_of_replicas": "0"
      }
    }
  }'

# Unblock writes on active indexes
curl -XGET http://localhost:9200/_cat/aliases 2>/dev/null | awk '{print $2}' | xargs -I{} curl -XPUT localhost:9200/{}/_settings  -H 'Content-Type: application/json'  -d '{
    "settings": {
      "index": {
        "blocks" : {
          "write" : "false",
          "metadata" : "false",
          "read" : "false"
        }
      }
    }
  }'
```

If the deflector breaks fix like this:

```bash
curl -X POST "localhost:9200/_aliases?pretty" -H 'Content-Type: application/json' -d'                                                                
{
  "actions" : [
    { "add" : { "index" : "graylog_X", "alias" : "graylog_deflector" } }
  ]
}'
```
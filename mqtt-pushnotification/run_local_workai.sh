#!/bin/sh
DEBUG_MESSAGE=0 ALLOW_GROUP_NOTIFICATION=1 \
REDIS_PASSWORD='87302aKecatcp' REDIS_HOST='rds.tiegushi.com' \
SERVER_URL='http://workaihost.tiegushi.com' \
MQTT_URL='ws://mq.tiegushi.com:80' \
MONGO_URL=mongodb://workAIAdmin:weo23biHUI@aidb.tiegushi.com:27017/workai?replicaSet=workaioplog\&readPreference=primaryPreferred\&connectTimeoutMS=30000\&socketTimeoutMS=30000\&poolSize=20 \
node main.js

#!/bin/sh

PRODUCTPREFIX=hotshare

./build_bundle.sh

# change the version number
VER=`grep version_of_build ./lib/6_version.js | cut -d"'" -f 2`
docker build -t lambdazhang/raidcdn:$PRODUCTPREFIX-$VER .
docker save -o $PRODUCTPREFIX-$VER.tar lambdazhang/raidcdn:$PRODUCTPREFIX-$VER
gzip $PRODUCTPREFIX-$VER.tar
mv $PRODUCTPREFIX-$VER.tar.gz ~


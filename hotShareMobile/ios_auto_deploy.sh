#!/bin/sh

cd ~/build-hot-share/ios/project

cp -R ~/workspace/hotShare/hotshare-buildfiles/ios/* ./

VER=`grep version_of_build ~/workspace/hotShare/hotShareMobile/lib/6_version.js | cut -d"'" -f 2`

sed -i.bak "s/2.2.35/$VER/g" shareEx/Info.plist

fastlane gym --export_method ad-hoc
DESTFILE="$HOME/hotShare-$VER.ipa"
cp ./hotShare.ipa $DESTFILE

fastlane beta

cd -

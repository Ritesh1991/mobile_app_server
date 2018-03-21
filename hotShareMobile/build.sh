#!/bin/bash
rm -rf ~/build-hot-share
rm -rf .meteor/local
#正式版本
meteor build ~/build-hot-share --server=https://hostgst.tiegushi.com/
#测试版本
#meteor build ~/build-hot-share --server=https://tsdfg.tiegushi.com/

rm -rf ~/build-hot-share/ios/project/hotShare/Images.xcassets/*
cp -rf ../ShareExtension/Images.xcassets/* ~/build-hot-share/ios/project/hotShare/Images.xcassets/

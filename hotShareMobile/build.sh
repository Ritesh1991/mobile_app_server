#!/bin/bash
rm -rf ~/build-workai
rm -rf .meteor/local/cordova-build
rm -rf .meteor/local/build
rm -rf .meteor/local/bundler-cache
rm -rf .meteor/local/plugin-cache
meteor build ~/build-workai --server=http://workaihost.tiegushi.com
# meteor build ~/build-hot-share --server=http://storeboard.tiegushi.com

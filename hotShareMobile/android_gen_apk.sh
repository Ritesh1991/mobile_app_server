#!/bin/sh

cd ~/build-hot-share/android/project

cp ~/workspace/hotShare/ShareExtension/Android/MainActivity.java ./src/org/hotshare/everywhere/
cp ~/workspace/hotShare/hotshare-buildfiles/AndroidManifest.xml ./
# change the version number
VER=`grep version_of_build ~/workspace/hotShare/hotShareMobile/lib/6_version.js | cut -d"'" -f 2`
VERCODE='100'`echo $VER | cut -d'.' -f 3`
sed -i.bak "s/android:versionName=\"2.2.31\"/android:versionName=\"$VER\"/g" AndroidManifest.xml
sed -i.bak "s/android:versionCode=\"20231\"/android:versionCode=\"$VERCODE\"/g" AndroidManifest.xml

cp ~/workspace/hotShare/hotshare-buildfiles/gradle.properties ./gradle.properties
cp ~/workspace/hotShare/hotshare-buildfiles/strings.xml ./res/values/strings.xml
#cp ~/workspace/hotShare/hotShareMobile/android.build.gradle ./build.gradle

ANDROID_HOME=~/Library/Android/sdk gradle wrapper
ANDROID_HOME=~/Library/Android/sdk/ ./gradlew assembleRelease -Pandroid.injected.signing.store.file=/Users/actiontec/workspace/hotShare/hotShareMobile/keystore -Pandroid.injected.signing.store.password=actiontec -Pandroid.injected.signing.key.alias="wifi whiteboard" -Pandroid.injected.signing.key.password=actiontec

DESTFILE="$HOME/hotshare-$VER.apk"
cp ./build/outputs/apk/project-release.apk $DESTFILE

cd -

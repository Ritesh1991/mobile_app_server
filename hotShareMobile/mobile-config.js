App.info({
  id: 'org.hotshare.everywhere',
  version: '1.5.35',
  name: 'hotShare',
  description: 'Share everything with everyone',
  author: 'hotShare Design Team',
  email: '',
  website: ''
});

App.setPreference('SplashMaintainAspectRatio', true);
App.setPreference('KeyboardDisplayRequiresUserAction', false);
App.setPreference('StatusBarOverlaysWebView', false);
App.setPreference('orientation', 'portrait');
// App.setPreference('StatusBarBackgroundColor', '#000000');
App.setPreference('StatusBarBackgroundColor','#37a7fe');
// App.setPreference('StatusBarStyle','blacktranslucent');
App.setPreference('StatusBarStyle','lightcontent');
App.setPreference('AutoHideSplashScreen', false);
App.setPreference('AndroidPersistentFileLocation','Internal');
App.setPreference('iosPersistentFileLocation','Library');
App.accessRule('*');
App.accessRule('http://*');
App.accessRule('https://*');
App.accessRule('*', { type: 'navigation' } );

App.icons({
  //'iphone': 'resource/icon_57.png',
  'iphone_2x': 'resource/icon_120.png',
  'iphone_3x': 'resource/icon_180.png',
  'ipad': 'resource/icon_76.png',
  'ipad_2x': 'resource/icon_152.png',
  'ios_settings': 'resource/icon_29.png',
  'ios_settings_2x': 'resource/icon_58.png',
  'ios_settings_3x': 'resource/icon_87.png',
  //'android_ldpi': 'resource/icon_36.png',
  'android_mdpi': 'resource/icon_48.png',
  'android_hdpi': 'resource/icon_72.png',
  'android_xhdpi': 'resource/icon_96.png',
  'android_xxhdpi': 'resource/icon.png',
  'android_xxxhdpi': 'resource/icon_192.png'
});

App.launchScreens({
  //'iphone': 'resource/splash_768_1024.png',
  'iphone_2x': 'resource/splash_640_960.png',
  'iphone5': 'resource/splash_640_1136.png',
  'iphone6': 'resource/splash_750_1334.png',
  'iphone6p_portrait': 'resource/splash_1242_2208.png',
  'ipad_portrait': 'resource/splash_768_1024.png',
  'ipad_portrait_2x': 'resource/splash_1536_2048.png',
  //'android_ldpi_portrait': 'resource/splash.png',
  'android_mdpi_portrait': 'resource/splash_320_470.png',
  'android_hdpi_portrait': 'resource/splash_480_640.png',
  'android_xhdpi_portrait': 'resource/splash_720_960.png',
  'android_xxhdpi_portrait': 'resource/splash_1080_1440.png'
});

App.configurePlugin('cordova-plugin-x-socialsharing', {
    APP_ID: 'wxcfcf19c225a36351'
});

App.configurePlugin('com.leon.cordova.wechat', {
    APP_ID: 'wxcfcf19c225a36351',
    QQ_APP_ID: '1104127289'
});
App.configurePlugin('com.share.wechatShare', {
    APP_ID: 'wxcfcf19c225a36351',
});

App.configurePlugin('org.zy.yuancheng.qq', {
    QQ_APP_ID: '1104127289'
});

App.configurePlugin('org.hotshare.baidutts', {
  API_KEY: 'iepMQqCsCil8uvGT2fPIP8lGMQDObIVi',
  API_SECRET: 'BlTv4N92QQb9F28vGXLkODdc3sOsXoUl',
  APP_ID: '6092105'
});

App.configurePlugin('jpush-phonegap-plugin', {
  API_KEY: '50e8f00890be941f05784e6f',
  CHANNEL: 'developer-default'
});
App.configurePlugin('phonegap-plugin-push', {
  SENDER_ID: 'NOTUSEDFORNOW'
});



/* *********storeboard app config********** */
/*
App.info({
  id: 'org.hotshare.storeboard',
  version: '0.0.3',
  name: 'Storeboard',
  description: 'Share everything with everyone',
  author: 'hotShare Design Team',
  email: '',
  website: ''
});

App.setPreference('KeyboardDisplayRequiresUserAction', false);
App.setPreference('StatusBarOverlaysWebView', false);
App.setPreference('orientation', 'portrait');
App.setPreference('StatusBarBackgroundColor', '#000000');
App.setPreference('StatusBarStyle','blacktranslucent');
App.setPreference('AutoHideSplashScreen', false);
App.setPreference('AndroidPersistentFileLocation','Internal');
App.setPreference('iosPersistentFileLocation','Library');
App.accessRule('*');
App.accessRule('http://*');
App.accessRule('https://*');

App.icons({
  'iphone': 'resource/icon_57.png',
  'iphone_2x': 'resource/icon_120.png',
  'iphone_3x': 'resource/icon_180.png',
  'ipad': 'resource/icon_76.png',
  'ipad_2x': 'resource/icon_152.png',
  'android_ldpi': 'resource/icon_36.png',
  'android_mdpi': 'resource/icon_48.png',
  'android_hdpi': 'resource/icon_96.png',
  'android_xhdpi': 'resource/icon.png'
});

 App.launchScreens({
   'iphone': 'resource/splashEN_768_1024.png',
   'iphone_2x': 'resource/splashEN_640_960.png',
   'iphone5': 'resource/splashEN_640_1136.png',
   'iphone6': 'resource/splashEN_750_1334.png',
   'iphone6p_portrait': 'resource/splashEN_1242_2208.png',
   'ipad_portrait': 'resource/splashEN_768_1024.png',
   'ipad_portrait_2x': 'resource/splashEN_1536_2048.png',
   'android_ldpi_portrait': 'resource/splashEN.png',
   'android_mdpi_portrait': 'resource/splashEN.png',
   'android_hdpi_portrait': 'resource/splashEN.png',
   'android_xhdpi_portrait': 'resource/splashEN.png'
 });

App.configurePlugin('nl.x-services.plugins.socialsharing', {
    APP_ID: 'wxcfcf19c225a36351'
});

App.configurePlugin('com.leon.cordova.wechat', {
    APP_ID: 'wxcfcf19c225a36351',
    QQ_APP_ID: '1104127289'
});
App.configurePlugin('com.share.wechatShare', {
    APP_ID: 'wxcfcf19c225a36351',
});

App.configurePlugin('org.zy.yuancheng.qq', {
    QQ_APP_ID: '1104127289'
});

App.configurePlugin('org.hotshare.baidutts', {
  API_KEY: 'iepMQqCsCil8uvGT2fPIP8lGMQDObIVi',
  API_SECRET: 'BlTv4N92QQb9F28vGXLkODdc3sOsXoUl',
  APP_ID: '6092105'
});
*/

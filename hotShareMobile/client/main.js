Template.registerHelper('isIOS',function(){
  return ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );
});

Template.registerHelper('isAndroid',function(){
  return navigator.userAgent.toLowerCase().indexOf("android") > -1;
});

// ---
// generated by coffee-script 1.9.2

if (Meteor.isCordova) {
    getHotPostsData = function() {
      Meteor.call('getHottestPosts',function(err, res){
        if (!err) {
          console.log('-------------------getHottestPosts')
          console.log(res)
          return Session.set('hottestPosts', res)
        }
      });
    }
    Deps.autorun(function(){
      if( Session.get('persistentLoginStatus') && !Meteor.userId() && !Meteor.loggingIn()){
        Session.setPersistent('persistentLoginStatus',false);
        window.plugins.toast.showLongCenter("登录超时，需要重新登录~");

        var pages = ['/user', '/bell', '/search'];
        if(pages.indexOf(location.pathname) != -1)
          PUB.page('/');
      }
    });

    window.updatePushNotificationToken = function(type,token){
        Deps.autorun(function(){
            if(Meteor.user()){
                if(token != Session.get("token"))
                {
                    console.log("type:"+type+";token:"+token);
                    Meteor.users.update({_id: Meteor.user()._id}, {$set: {type: type, token: token}});
                    Meteor.call('updatePushToken' ,{type: type, token: token,userId:Meteor.user()._id});
                    // Meteor.call('refreshAssociatedUserToken' ,{type: type, token: token});
                    Session.set("token", token);
                }
            } else {
                Session.set("token", '');
            }
        });
    };
    window.checkNotificationServicesEnabled = function(){
      var callbackHandle = function(data){
        console.log('data.isEnabled:'+data.isEnabled);
        var status = data.isEnabled ? 'on' :'off';
        Meteor.call('update_WorkAI_PushNotifacaton_Status',Meteor.userId(),status);
        var hasShow = Session.get('notificationConfim');

        if (!data.isEnabled && !hasShow) {
          navigator.notification.confirm('能及时收到考勤提醒',function(index){
              Session.set('notificationConfim','showed');
              if (index == 2) {
                if (device.platform === 'iOS') {
                  window.plugins.appsetup.openSettings();
                }
                else{
                  window.plugins.jPushPlugin.goToSet();
                }
              }
          },'开启推送',['以后再说','马上开启']);
        }
        else if (data.isEnabled){
          Session.set('notificationConfim',null);
        }
      };
      if (device.platform === 'iOS') {
        PushNotification.hasPermission(callbackHandle);
      }
      else{
        window.plugins.jPushPlugin.getUserNotificationSettings(function(result) {
          var data = {};
          if(result == 0) {
            // 系统设置中已关闭应用推送。
            data.isEnabled = false;
          } else if(result > 0) {
            // 系统设置中打开了应用推送。
            data.isEnabled = true;
          }
          callbackHandle(data);
        });
      }
    };
  Meteor.startup(function(){
    Session.setDefault('hottestPosts', [])
    getUserLanguage = function() {
      var lang;
      lang = void 0;
      if (navigator && navigator.userAgent && (lang = navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
        lang = lang[1];
      }
      if (!lang && navigator) {
        if (navigator.language) {
          lang = navigator.language;
        } else if (navigator.browserLanguage) {
          lang = navigator.browserLanguage;
        } else if (navigator.systemLanguage) {
          lang = navigator.systemLanguage;
        } else {
          if (navigator.userLanguage) {
            lang = navigator.userLanguage;
          }
        }
        lang = lang.substr(0, 2);
      }
      return lang;
    };
    document.addEventListener("deviceready", onDeviceReady, false);
    // PhoneGap加载完毕
    function onDeviceReady() {
        // 按钮事件
        // console.log('<------- onDeviceReady ----->');
        checkShareExtension();
        // getHotPostsData();
        navigator.splashscreen.hide();
        document.addEventListener("backbutton", eventBackButton, false); // 返回键
        document.addEventListener("pause", eventPause, false);//挂起
        document.addEventListener("resume", eventResume, false);

        checkNewVersion2();

        TAPi18n.precacheBundle = true;
        // if(isUSVersion){
        //   Session.set("display_lang",'en');
        //   Cookies.set("display-lang","en",360);
        //   AppRate.preferences.useLanguage = 'en';
        // }
        if(Cookies.check("display-lang")){
          var displayLang = Cookies.get("display-lang");
          Session.set("display_lang",displayLang)
          // if(displayLang === 'en'){
          //     AppRate.preferences.useLanguage = 'en';
          // }
          // else if(displayLang ==='zh')
          // {
              AppRate.preferences.useLanguage = 'zh-Hans';
          // }
          TAPi18n.setLanguage("zh")
          .done(function () {
             console.log("zh");
          })
          .fail(function (error_message) {
            // Handle the situation
            console.log(error_message);
          });
        } else {
          Session.set("display_lang","zh")
          AppRate.preferences.useLanguage = 'zh-Hans';
          TAPi18n.setLanguage("zh")
          .done(function () {
            console.log("en");
          })
          .fail(function (error_message) {
            // Handle the situation
            console.log(error_message);
          });
        }
        TAPi18n.setLanguage("zh")
         //当用户第八次使用该软件时提示评价app
        AppRate.preferences.usesUntilPrompt = 7;
        AppRate.preferences.storeAppURL.ios = '957024953';
        AppRate.preferences.storeAppURL.android = 'http://a.app.qq.com/o/simple.jsp?pkgname=org.hotshare.everywhere';
        AppRate.promptForRating(false);
        universalLinks.subscribe('openSimpleChatGroup',onSimpleChatPageRequested);
        zeroconfWatch();
        window.checkNotificationServicesEnabled();
    }

    // openNewsDetailedPage Event Handler
    function onSimpleChatPageRequested(eventData) {
      console.log('Showing to user details page for some news');
      // do some work to show detailed page
    }

    function checkShareExtension(){
      if(device.platform === 'iOS') {
        window.plugins.shareExtension.getShareData(function(data) {
            if(data){
               CustomDialog.show(data);
            }
        }, function() {Session.set('wait_import_count',false);});
      }
    }
    var lastPauseDate = null;
    function restartApplication() {
      var initialHref = window.location.href;
      // Show splash screen (useful if your app takes time to load)
      navigator.splashscreen.show();
      // Reload original app url (ie your index.html file)
      window.location = initialHref;
    }
    function zeroconfWatch(){
      var zeroconf = cordova.plugins.zeroconf;
      zeroconf.watch('_DeepEye._tcp', 'local.', function(result) {
          var action = result.action;
          var service = result.service;
          /* service : {
              'domain' : 'local.',
              'type' : '_zhifa._tcp.',
              'name': 'cloudrouter',
              'port' : 4000,
              'hostname' : 'Android.local.',
              'ipv4Addresses' : [ '192.168.31.103' ],
              'ipv6Addresses' : [ '2001:0:5ef5:79fb:10cb:1dbf:3f57:feb0' ],
              'txtRecord' : {
                  'foo' : 'bar'
              }
          } */
          if (action == 'added') {
              console.log('service added', service);
              Deps.autorun(function(){
                if(Meteor.userId()){
                  PUB.Toptip('<i class="fa fa-wifi fa-fw"></i> 发现一台新设备',{autohide:false, timeout:10000, service: service},function(event, options){
                    console.log(event);
                    console.log(JSON.stringify(options));
                    PUB.page('/deepVideoAnalysis');
                  });
                }
              });
          } else {
              console.log('service removed', service);
          }
      });
    }

    function eventResume(){
        if ($('body').text().length === 0 || $('body').text().indexOf("Oops, looks like there's no route on the client or the server for url:") > -1 ) {
          location.reload();
        }
        if (Meteor.status().connected !== true)
          Meteor.reconnect();
        checkNewVersion2();
        if (Meteor.user()) {
            console.log('Refresh Main Data Source when resume');
            if (Meteor.isCordova) {
                window.refreshMainDataSource();
                checkShareUrl();
                checkShareExtension();
                window.checkNotificationServicesEnabled();
                if(Meteor.user().profile.waitReadCount > 0){
                  Meteor.users.update({_id: Meteor.user()._id}, {$set: {'profile.waitReadCount': 0}});
                }

                if(device.platform === 'Android'){
                  window.plugins.shareExtension.getShareData(function(data) {
                    console.log("##RDBG getShareData: " + JSON.stringify(data));
                      if(data){
                         editFromShare(data);
                      }
                  }, function() {});
                  window.plugins.shareExtension.emptyData(function(result) {}, function(err) {});
                }
            }
        }
        //mqttEventResume();
        if (lastPauseDate != null) {
          var now = new Date();
          if (now.getTime() - lastPauseDate.getTime() > 5*60*1000) {
            restartApplication();
          }
        }
        try{
          if(mqtt_connection){
            console.log('try reconnect mqtt')
            // mqtt_connection._reconnect();
            mqttEventResume();
          }
        } catch (error) {
          console.log('mqtt reconnect Error=',error);
        }
    }
    function eventPause(){
      if(withAutoSavedOnPaused) {
          if (location.pathname === '/add') {
              Template.addPost.__helpers.get('saveDraft')()
          }
      }
      //mqttEventPause();
      lastPauseDate = new Date();
    }

    function eventBackButton(){
      // 显示tips时
      if(Tips.isShow())
        return Tips.close();

      // if on add hyperlink page, just disappear that page
      if ($('#show_hyperlink').css('display') == 'block') {
        console.log('##RDBG hide add hyperlink page');
        $('#add_posts_content').show();
        $('#show_hyperlink').hide();
        return;
      }

      // 编辑post时回退
        if(withAutoSavedOnPaused) {
            if (location.pathname === '/add') {
                Template.addPost.__helpers.get('saveDraft')()
            }
        }

        if ($('#swipebox-overlay').length > 0) {
            $.swipebox.close();
            return;
        }

      // 阅读私信时返回
      if(Session.equals('inPersonalLetterView',true)) {
        Session.set('inPersonalLetterView',false);
        $('body').css('overflow-y','auto');
        $('.personalLetterContent,.bellAlertBackground').fadeOut(300);
        return;
      }
      var currentRoute = Router.current().route.getName();
      if (currentRoute == 'myPosts'){
        if (isHotPostsChanged()) {
          PUB.confirm("您改变了热门帖子, 要保存吗?", function(){
            console.log('##RDBG confirm callback');
            saveHotPosts()
          });
        }
        PUB.back();
      }
      else if (currentRoute == 'deal_page'){
        if (Session.get("dealBack") == "register"){
          Router.go('/signupForm');
        } else if (Session.get("dealBack") == "anonymous"){
          Router.go('/authOverlay');
          Meteor.setTimeout(function(){
            $('.agreeDeal').css('display',"block")
          },10);
        }
      }  else if (currentRoute == "checkInOutMsgList"){
        var msgSession = SimpleChat.MsgSession.findOne({userId: Meteor.userId(),toUserId:sysMsgToUserId});
        if (msgSession)
          SimpleChat.MsgSession.update({_id:msgSession._id},{$set:{count:0}});
        PUB.back();
      }
      else if (currentRoute == "recoveryForm"){
        Router.go('/loginForm');
      } else if (currentRoute == undefined || currentRoute =="search" || currentRoute =="add" || currentRoute =="bell" || currentRoute =="user" || currentRoute == "authOverlay") {
        window.plugins.toast.showShortBottom('再点击一次退出!');
        document.removeEventListener("backbutton", eventBackButton, false); // 注销返回键
        document.addEventListener("backbutton", exitApp, false);// 绑定退出事件
        // 3秒后重新注册
        var intervalID = window.setInterval(function() {
            window.clearInterval(intervalID);
            document.removeEventListener("backbutton", exitApp, false); // 注销返回键
            document.addEventListener("backbutton", eventBackButton, false); // 返回键
        }, 3000);
      }else{
        //history.back();
        if($('.customerService,.customerServiceBackground').is(":visible")){
          $('.customerService,.customerServiceBackground').fadeOut(300);
        } else {
          var v = SimpleChat.simple_chat_page_stack.pop();
          if (v) {
            return Blaze.remove(v);
          }
          PUB.back();
        }
      }
    }

    function exitApp() {
        navigator.app.exitApp();
    }
  });
}

if (Meteor.isClient) {
  Session.set("DocumentTitle",'故事贴');
  Deps.autorun(function(){
    if(Meteor.userId()){
      Meteor.subscribe("topics");
      //Meteor.subscribe("topicposts");
      Meteor.subscribe('get-workai-user-relation',Meteor.userId());
      // getHotPostsData();
    }
    document.title = Session.get("DocumentTitle");
  });
}

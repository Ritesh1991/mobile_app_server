

// ---
// generated by coffee-script 1.9.2
getShareData = function(userId,url,title,imagePath) {
    console.log("shareExtension : " + url);
    if (url && url !== '') {
        //editFromShare(success);
        console.log("getUserInfo : " + userId);
        if (userId && userId !== '') {
            ShareURLs.insert({ userId: userId, url: url,title:title ,imagePath:imagePath},function callback(error){ 
                console.log("error : " + error);
                var error_message = '';
                if(error)
                {
                    error_message = '未知错误';
                }        
                window.plugins.shareExtension.closeView(error_message);
            });           
        }
    }
}

if (Meteor.isCordova) {
    window.updatePushNotificationToken = function(type,token){
        Deps.autorun(function(){
            if(Meteor.user()){
                if(token != Session.get("token"))
                {
                    console.log("type:"+type+";token:"+token);
                    Meteor.users.update({_id: Meteor.user()._id}, {$set: {type: type, token: token}});
                    Meteor.call('refreshAssociatedUserToken' ,{type: type, token: token});
                    Session.set("token", token);
                }
            } else {
                Session.set("token", '');
            }
        });
    }
  Meteor.startup(function(){
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
        // added for message from rocket chat iframe
        window.addEventListener('message', function(e) {
          if(e.data === 'closekeyboard') {
            cordova.plugins.Keyboard.close();
          }
          else if(e.data === 'closechatpage') {
            cordova.plugins.Keyboard.close();
            $("#rocketChat").fadeOut(400);
            $(".showBgColor").fadeIn(400);
            $("#chatSwitch").show()
          }
        }, false);

        // 按钮事件
        checkShareExtension();
        navigator.splashscreen.hide();
        document.addEventListener("backbutton", eventBackButton, false); // 返回键
        document.addEventListener("pause", eventPause, false);//挂起
        document.addEventListener("resume", eventResume, false);
        TAPi18n.precacheBundle = true;
        if(Cookies.check("display-lang")){
          var displayLang = Cookies.get("display-lang");
          Session.set("display_lang",displayLang)
          if(displayLang === 'en'){
              AppRate.preferences.useLanguage = 'en';
          }
          else if(displayLang ==='zh')
          {
              AppRate.preferences.useLanguage = 'zh-Hans';
          }
          TAPi18n.setLanguage(displayLang)
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
        //TAPi18n.setLanguage("zh")
         //当用户第八次使用该软件时提示评价app
        AppRate.preferences.usesUntilPrompt = 7;
        AppRate.preferences.storeAppURL.ios = '957024953';
        AppRate.preferences.storeAppURL.android = 'http://a.app.qq.com/o/simple.jsp?pkgname=org.hotshare.everywhere';
        AppRate.promptForRating(false);
        
    }
    
    function checkShareExtension(){
        
        window.plugins.shareExtension.getShareData(function(data) {
            if(data && data !==""){  
                Session.set("isShareExtension", true);
                window.plugins.shareExtension.emptyData();
            }
            else{
                Session.set("isShareExtension", false);
            }
        }, function() {});
    }
    function eventResume(){
        if (Meteor.user()) {
            console.log('Refresh Main Data Source when resume');
            if (Meteor.isCordova) {
                window.refreshMainDataSource();
                checkShareUrl();
            }
        }
    }
    function eventPause(){
      if(withAutoSavedOnPaused) {
          if (location.pathname === '/add') {
              Template.addPost.__helpers.get('saveDraft')()
          }
      }
    }

    function eventBackButton(){
      // 编辑post时回退
        if(withAutoSavedOnPaused) {
            if (location.pathname === '/add') {
                Template.addPost.__helpers.get('saveDraft')()
            }
        }
      
      var currentRoute = Router.current().route.getName();
      if (currentRoute == undefined || currentRoute =="search" || currentRoute =="add" || currentRoute =="bell" || currentRoute =="user" || currentRoute == "authOverlay") {
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
        PUB.back();
      }
    }

    function exitApp() {
        navigator.app.exitApp();
    }
  });
}

if (Meteor.isClient) {
  Session.set("DocumentTitle",'故事贴');
  Meteor.subscribe("topics")
  Meteor.subscribe("topicposts")
  Deps.autorun(function(){
    document.title = Session.get("DocumentTitle");
  });
}

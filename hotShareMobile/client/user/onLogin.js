if (Meteor.isClient) {
  Meteor.startup(function() {
    return Accounts.onLogin(function() {
      if (Meteor.user().profile["new"] === true) {
        Session.setPersistent('persistentLoginStatus', false);
      } else {
        Session.setPersistent('persistentLoginStatus', true);
      }
      if(FollowPosts.find({followby:Meteor.userId()}).count()<4){
        toLoadFollowPost()
      } else {
        toLoadLatestFollowPost()
      }
      Meteor.setTimeout(function() {
        try{
          if(isUSVersion){
            Meteor.call('updateUserLanguage', Meteor.userId(), 'en');
          } else {
            Meteor.call('updateUserLanguage', Meteor.userId(), 'zh');
          }
          console.log("Accounts.onLogin");
          Session.set("token", '');
          Meteor.subscribe("pcomments");
          checkShareUrl();
          if(device.platform === 'Android'){
            window.plugins.shareExtension.getShareData(function(data) {
              console.log("##RDBG getShareData: " + JSON.stringify(data));
              if(data){
                editFromShare(data);
              }
            }, function() {});
            window.plugins.shareExtension.emptyData(function(result) {}, function(err) {});
          }
          window.updateMyOwnLocationAddress();
          if (device.platform === 'iOS' && localStorage.getItem('registrationID') == null ) {
            var registerInterval1 = window.setInterval( function(){
              console.log('on push notification init');
              try{
                var push = PushNotification.init({
                  ios: {
                    alert: "true",
                    badge: "true",
                    sound: "true",
                    clearBadge: "true"
                  }
                });
              } catch(e){
                console.log('Exception in PushNotification.init')
                clearInterval(registerInterval1);
                registerInterval1 = null;
              }

              push.on('registration', function (data) {
                // data.registrationId
                result = data.registrationId;
                console.log('Got registrationID ' + result);
                Session.set('registrationID', result);
                Session.set('registrationType', 'iOS');
                localStorage.setItem('registrationID', result);
                window.clearInterval(registerInterval1);
                return window.updatePushNotificationToken('iOS', result);
              });

              push.on('notification', function (data) {
                console.log('Got message');
                if (data.count) {
                  Session.set('waitReadCount', data.count);
                }
                if (data.additionalData.foreground === false) {
                  console.log('Push notification when background');
                  window.refreshMainDataSource();
                  return;
                }
                if (data.message) {
                  PUB.toast(data.message);
                  return window.refreshMainDataSource();
                }
              });

              push.on('error', function (e) {
                console.log('No Push Notification support in this build error = ' + e.message);
                clearInterval(registerInterval1);
                registerInterval1 = null;
              });
            },20000 );
          }
          if (Session.get('registrationID') && localStorage.getItem('registrationID') && device.platform === 'iOS') {
            console.log(localStorage.getItem('registrationID'));
            return window.updatePushNotificationToken('iOS', localStorage.getItem('registrationID'));
          }
        } catch(e){
          console.log(e)
          console.log('exception on login')
        }
      }, 3000);
    });
  });
}

/* global window */
//import { Template } from 'meteor/templating';
//import { Blaze } from 'meteor/blaze';
//import { Spacebars } from 'meteor/spacebars';
//import { HTML } from 'meteor/htmljs';
//import { $ } from 'meteor/jquery';

const viewMap = window.viewMap = {}; // eslint-disable-line
var HTML = Package.htmljs.HTML

Template.cacher = new Template('Template.cacher', function() {
  const wrapperView = this;
  const templateName = Spacebars.call(wrapperView.lookup('template'));
  const id = Spacebars.call(wrapperView.lookup('id'));
  const data = Spacebars.call(wrapperView.lookup('data')) || {};

  if (!templateName) {
    throw new Error('Template name is required');
  }

  const baseView = Blaze._TemplateWith({}, function() {
    return HTML.Raw('<div></div>'); // eslint-disable-line
  });

  var view = viewMap[id];
  if (!view) {
    view = Blaze._TemplateWith(data, function() {
      return Spacebars.include(Template[templateName]);
    });
    viewMap[id] = view;
    view.dom = $('<div></div>');
    Blaze.render(view, view.dom.get(0));
    view._superView = true;
    view._domrange._superRange = true;
  }

  baseView.onViewReady(function() {
    // here's we mark this node to destroy innter elements
    // we need to override Blaze._destroyNode to overcome this
    this.firstNode()._ignoreElements = true;

    // now we need to append our original node here
    $(this.firstNode()).append(view.dom);
  });

  return baseView;
});

const originalDestroyNode = Blaze._destroyNode;
Blaze._destroyNode = function(elem) {
  // We don't need to if the element marked with ignoreElements
  if (elem._ignoreElements) {
    return;
  }

  originalDestroyNode(elem);
};

Template.selectFrame.helpers({
  active: function() {
    return Session.get('board');
  }
});


var checkAssociated = function(query) {
  var user = Meteor.user();
  var alreadyAssociated = false;
  var associatedUser = null;
  if (query['userId'] && user && user.profile && user.profile.associated) {
    var associated = user.profile.associated;
    for (var i = 0; i < associated.length; i++) {
      if (associated[i].id === query['userId']) {
        alreadyAssociated = true;
        associatedUser = associated[i];
        break;
      }
    }
  }
  var group_msg_page = null;
  var name = null;
  if (query['p'] === 'group_msg' && query['postOwerId']) {
    name = query['postOwerName'] ? query['postOwerName'] + ' 的故事群' : '故事群'
    var icon = 'http://oss.tiegushi.com/groupMessages.png';
    group_msg_page = '/simple-chat/to/group?id=' + query['postOwerId'] + '_group&name=' + encodeURIComponent(name) + '&icon=' + encodeURIComponent(icon);
    Session.set('msgToUserName', name);
    Session.set('msgFormUser', associatedUser);
  }
  if (alreadyAssociated) {
    var page = group_msg_page ? group_msg_page : '/simple-chat/user-list/' + Meteor.userId();
    Meteor.call('create-group-2', query['postOwerId'] + '_group', name, [query['postOwerId'], query['userId'], Meteor.userId()], function(err, res) {
      if (err) {
        PUB.toast('暂时无法打开群聊！');
        return;
      }
      console.log('create/update 故事群:', res, name);
      Router.go(page);
    });
    return;
  }
  navigator.notification.confirm('检测到可以绑定您在浏览器上的用户帐号，绑定之后可以方便的查看此帐号的消息及与其他人进行互动。', function(index) {
    if (index === 2)
      bindWebUserFun(query['userId'], query['touserId'], query['p'], query['postId'], group_msg_page);
  }, '提示', ['取消', '绑定']);
}

var checkoutQRCode = function() {
  console.log('clipboard check...');
  withQRTips && Meteor.isCordova && cordova.plugins.clipboard.paste(function(text) {
    console.log('clipboard text:', text);
    try {
      if (!(text.startsWith('http://') || text.startsWith('https://')))
        return;

      var uri = new URL(text);
      if (uri.pathname.toLowerCase() != '/restapi/webuser-qrcode')
        return;

      var queryStr = (uri.search && uri.search.length > 0 ? uri.search.substr(1) : '').split('&');
      var query = [];
      for (var i = 0; i < queryStr.length; i++)
        query[queryStr[i].split('=')[0]] = decodeURIComponent(queryStr[i].split('=')[1]);
      if (!query['userId'] || !query['p'])
        return;

      // 替换剪贴板内容
      cordova.plugins.clipboard.copy('');

      if (Session.get('fromUniversalLink') === true) {
        return;
      }

      checkAssociated(query);

    } catch (e) {
      console.log('cordova.plugins.clipboard.paste err:', e)
    }
  });
};

Template.registerHelper('isIOS', function() {
  return (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
});

Template.registerHelper('isAndroid', function() {
  return navigator.userAgent.toLowerCase().indexOf("android") > -1;
});

Deps.autorun(function() {
  if (Meteor.user() && Session.get('universalLinkData')) {
    var query = Session.get('universalLinkData');
    Session.set('universalLinkData', null);
    if (!query['userId'] || !query['p']) {
      return;
    }
    Session.set('fromUniversalLink', true);
    checkAssociated(query);
  }
});
// ---
// generated by coffee-script 1.9.2

Deps.autorun(function() {
  if (Meteor.userId()) {
    Meteor.subscribe('themes');
    if (withFromExample) {
      Meteor.subscribe('post-example');
    }
  }
});

if (Meteor.isCordova) {
  getHotPostsData = function() {
    Meteor.call('getHottestPosts', function(err, res) {
      if (!err) {
        console.log('-------------------getHottestPosts')
        console.log(res)
        return Session.set('hottestPosts', res)
      }
    });
  }
  Deps.autorun(function() {
    if (Session.get('persistentLoginStatus') && !Meteor.userId() && !Meteor.loggingIn()) {
      Session.setPersistent('persistentLoginStatus', false);
      window.plugins.toast.showLongCenter("登录超时，需要重新登录~");

      var pages = ['/user', '/bell', '/search'];
      if (pages.indexOf(location.pathname) != -1)
        PUB.page('/');
    }
  });

  window.updatePushNotificationToken = function(type, token) {
    Deps.autorun(function() {
      if (Meteor.user()) {
        if (token != Session.get("token")) {
          console.log("type:" + type + ";token:" + token);
          Meteor.users.update({
            _id: Meteor.user()._id
          }, {
            $set: {
              type: type,
              token: token
            }
          });
          Meteor.call('updatePushToken', {
            type: type,
            token: token,
            userId: Meteor.user()._id
          });
          // Meteor.call('refreshAssociatedUserToken' ,{type: type, token: token});
          Session.set("token", token);
        }
      } else {
        Session.set("token", '');
      }
    });
  }
  Meteor.startup(function() {
    Session.setDefault('hottestPosts', []);
    if (!window.cordova) {
      try {
        window.cordova = require('cordova');
      } catch (e) {
        console.log('cordova error : ' + e);
      }
    }
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
      Deps.autorun(function() {
        if (Meteor.userId())
          checkoutQRCode();
      });

      // 按钮事件
      // console.log('<------- onDeviceReady ----->');
      checkShareExtension();
      // getHotPostsData();
      navigator.splashscreen.hide();
      document.addEventListener("backbutton", eventBackButton, false); // 返回键
      document.addEventListener("pause", eventPause, false); //挂起
      document.addEventListener("resume", eventResume, false);
      checkNewVersion2();
      TAPi18n.precacheBundle = true;
      // if(isUSVersion){
      //   Session.set("display_lang",'en');
      //   Cookies.set("display-lang","en",360);
      //   AppRate.preferences.useLanguage = 'en';
      // }
      if (Cookies.check("display-lang")) {
        var displayLang = Cookies.get("display-lang");
        Session.set("display_lang", displayLang)
        // if(displayLang === 'en'){
        //     AppRate.preferences.useLanguage = 'en';
        // }
        // else if(displayLang ==='zh')
        // {
        AppRate.preferences.useLanguage = 'zh-Hans';
        // }
        TAPi18n.setLanguage("zh")
          .done(function() {
            console.log("zh");
          })
          .fail(function(error_message) {
            // Handle the situation
            console.log(error_message);
          });
      } else {
        Session.set("display_lang", "zh")
        AppRate.preferences.useLanguage = 'zh-Hans';
        TAPi18n.setLanguage("zh")
          .done(function() {
            console.log("en");
          })
          .fail(function(error_message) {
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
      universalLinks.subscribe('onWebReadOrWriteMessage', onWebReadOrWriteMessageEventHandler);

    }
    // onWebReadOrWriteMessageEventHandler Event Handler
    function onWebReadOrWriteMessageEventHandler(eventData) {
      console.log('Showing to user details page for some news');
      // do some work to show detailed page
      // {
      //   "url": "http://myhost.com/news/ul-plugin-released.html?foo=bar#cordova-news",
      //   "scheme": "http",
      //   "host": "myhost.com",
      //   "path": "/news/ul-plugin-released.html",
      //   "params": {
      //     "foo": "bar"
      //   },
      //   "hash": "cordova-news"
      // }
      if (eventData.path) {
        console.log('universalLink path: ' + eventData.path);
        if (eventData.path == '/web-rw-message') {
          //bindWebUser(eventData.params);
          Session.set('universalLinkData', eventData.params);
        }

      }
    }

    function checkShareExtension() {
      if (device.platform === 'iOS') {
        window.plugins.shareExtension.getShareData(function(data) {
          if (data) {
            CustomDialog.show(data);
          }
        }, function() {
          Session.set('wait_import_count', false);
        });
      }
    }

    function eventResume() {
      if ($('body').text().length === 0 || $('body').text().indexOf("Oops, looks like there's no route on the client or the server for url:") > -1) {
        location.reload();
      }
      if (Meteor.status().connected !== true)
        Meteor.reconnect();

      // checkNewVersion2();
      if (Meteor.user()) {
        console.log('Refresh Main Data Source when resume');
        if (Meteor.isCordova) {
          window.refreshMainDataSource();
          checkShareUrl();
          checkShareExtension();
          if (Meteor.user().profile.waitReadCount > 0) {
            Meteor.users.update({
              _id: Meteor.user()._id
            }, {
              $set: {
                'profile.waitReadCount': 0
              }
            });
          }

          if (device.platform === 'Android') {
            window.plugins.shareExtension.getShareData(function(data) {
              console.log("##RDBG getShareData: " + JSON.stringify(data));
              if (data) {
                editFromShare(data);
              }
            }, function() {});
            window.plugins.shareExtension.emptyData(function(result) {}, function(err) {});
          }

          checkoutQRCode();
        }
      }

      try {
        //if(mqtt_connection){
        console.log('try reconnect mqtt')
        mqttEventResume();
        // mqtt_connection._reconnect();
        //}
      } catch (error) {
        console.log('mqtt reconnect Error=', error);
      }
    }

    function eventPause() {
      if (withAutoSavedOnPaused) {
        if (location.pathname === '/add') {
          Template.addPost.__helpers.get('saveDraft')()
        }
      }
    }

    function eventBackButton() {
      // 显示tips时
      if (Tips.isShow())
        return Tips.close();

      // if on add hyperlink page, just disappear that page
      if ($('#show_hyperlink').css('display') == 'block') {
        console.log('##RDBG hide add hyperlink page');
        $('#add_posts_content').show();
        $('#show_hyperlink').hide();
        return;
      }

      // 编辑post时回退
      if (withAutoSavedOnPaused) {
        if (location.pathname === '/add') {
          Template.addPost.__helpers.get('saveDraft')()
        }
        if (location.pathname === '/newEditor') {
          Template.newEditor.__helpers.get('handleSaveDraft')()
        }
      }

      if ($('#swipebox-overlay').length > 0) {
        $.swipebox.close();
        return;
      }

      // 阅读私信时返回
      if (Session.equals('inPersonalLetterView', true)) {
        Session.set('inPersonalLetterView', false);
        $('body').css('overflow-y', 'auto');
        $('.personalLetterContent,.bellAlertBackground').fadeOut(300);
        return;
      }
      var currentRoute = Router.current().route.getName();
      console.log(currentRoute);
      if (currentRoute == 'myPosts') {
        if (isHotPostsChanged()) {
          PUB.confirm("您改变了热门帖子, 要保存吗?", function() {
            console.log('##RDBG confirm callback');
            saveHotPosts()
          });
        }
        PUB.back();
      } else if (currentRoute == 'deal_page') {
        if (Session.get("dealBack") == "register") {
          Router.go('/signupForm');
        } else if (Session.get("dealBack") == "anonymous") {
          Router.go('/authOverlay');
          Meteor.setTimeout(function() {
            $('.agreeDeal').css('display', "block")
          }, 10);
        }
      } else if (currentRoute == "recoveryForm") {
        Router.go('/loginForm');
      } else if (currentRoute == "series" || currentRoute == "series.:_id") {
        if (!Session.get('seriesIsSaved') && Session.get('isSeriesEdit')) {
          if (Session.get('seriesId') && Session.get('seriesId') !== '') {
            navigator.notification.confirm('这个操作无法撤销', function(r) {
              if (r !== 1) {
                updateOrInsertSeries(false, true);
              } else {
                PUB.back();
              }
            }, '您确定要放弃未保存的修改吗？', ['放弃修改', '保存修改']);
          } else {
            navigator.notification.confirm('这个操作无法撤销', function(r) {
              if (r == 1) {
                Session.set('seriesContent', '');
                PUB.back();
              }
            }, '您确定要放弃未保存的修改吗？', ['放弃修改', '继续编辑']);
          }
        } else {
          PUB.back();
        }
      } else if (currentRoute == undefined || currentRoute == "newEditor" || currentRoute == "search" || currentRoute == "add" || currentRoute == "registerFollow" || currentRoute == "registerTopic" || currentRoute == "bell" || currentRoute == "user" || currentRoute == "authOverlay") {
        window.plugins.toast.showShortBottom('再点击一次退出!');
        document.removeEventListener("backbutton", eventBackButton, false); // 注销返回键
        document.addEventListener("backbutton", exitApp, false); // 绑定退出事件
        // 3秒后重新注册
        var intervalID = window.setInterval(function() {
          window.clearInterval(intervalID);
          document.removeEventListener("backbutton", exitApp, false); // 注销返回键
          document.addEventListener("backbutton", eventBackButton, false); // 返回键
        }, 3000);
      } else {
        //history.back();
        if ($('.customerService,.customerServiceBackground').is(":visible")) {
          $('.customerService,.customerServiceBackground').fadeOut(300);
        } else {
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
  Session.set("DocumentTitle", '故事贴');

  Deps.autorun(function() {
    if (Meteor.userId()) {
      Meteor.subscribe("topics");
      //Meteor.subscribe("topicposts");
      // getHotPostsData();
    }
    document.title = Session.get("DocumentTitle");
  });
}


//detect blocked codes. 

(function(undefined) {

  // setImmediate
  (function(global, undefined) {
    "use strict";

    if (global.setImmediate) {
      return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var setImmediate;

    function addFromSetImmediateArguments(args) {
      tasksByHandle[nextHandle] = partiallyApplied.apply(undefined, args);
      return nextHandle++;
    }

    // This function accepts the same arguments as setImmediate, but
    // returns a function that requires no arguments.
    function partiallyApplied(handler) {
      var args = [].slice.call(arguments, 1);
      return function() {
        if (typeof handler === "function") {
          handler.apply(undefined, args);
        } else {
          (new Function("" + handler))();
        }
      };
    }

    function runIfPresent(handle) {
      // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
      // So if we're currently running a task, we'll need to delay this invocation.
      if (currentlyRunningATask) {
        // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
        // "too much recursion" error.
        setTimeout(partiallyApplied(runIfPresent, handle), 0);
      } else {
        var task = tasksByHandle[handle];
        if (task) {
          currentlyRunningATask = true;
          try {
            task();
          } finally {
            clearImmediate(handle);
            currentlyRunningATask = false;
          }
        }
      }
    }

    function clearImmediate(handle) {
      delete tasksByHandle[handle];
    }

    function installNextTickImplementation() {
      setImmediate = function() {
        var handle = addFromSetImmediateArguments(arguments);
        process.nextTick(partiallyApplied(runIfPresent, handle));
        return handle;
      };
    }

    function canUsePostMessage() {
      // The test against `importScripts` prevents this implementation from being installed inside a web worker,
      // where `global.postMessage` means something completely different and can't be used for this purpose.
      if (global.postMessage && !global.importScripts) {
        var postMessageIsAsynchronous = true;
        var oldOnMessage = global.onmessage;
        global.onmessage = function() {
          postMessageIsAsynchronous = false;
        };
        global.postMessage("", "*");
        global.onmessage = oldOnMessage;
        return postMessageIsAsynchronous;
      }
    }

    function installPostMessageImplementation() {
      // Installs an event handler on `global` for the `message` event: see
      // * https://developer.mozilla.org/en/DOM/window.postMessage
      // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

      var messagePrefix = "setImmediate$" + Math.random() + "$";
      var onGlobalMessage = function(event) {
        if (event.source === global &&
          typeof event.data === "string" &&
          event.data.indexOf(messagePrefix) === 0) {
          runIfPresent(+event.data.slice(messagePrefix.length));
        }
      };

      if (global.addEventListener) {
        global.addEventListener("message", onGlobalMessage, false);
      } else {
        global.attachEvent("onmessage", onGlobalMessage);
      }

      setImmediate = function() {
        var handle = addFromSetImmediateArguments(arguments);
        global.postMessage(messagePrefix + handle, "*");
        return handle;
      };
    }

    function installMessageChannelImplementation() {
      var channel = new MessageChannel();
      channel.port1.onmessage = function(event) {
        var handle = event.data;
        runIfPresent(handle);
      };

      setImmediate = function() {
        var handle = addFromSetImmediateArguments(arguments);
        channel.port2.postMessage(handle);
        return handle;
      };
    }

    function installReadyStateChangeImplementation() {
      var html = doc.documentElement;
      setImmediate = function() {
        var handle = addFromSetImmediateArguments(arguments);
        // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
        // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
        var script = doc.createElement("script");
        script.onreadystatechange = function() {
          runIfPresent(handle);
          script.onreadystatechange = null;
          html.removeChild(script);
          script = null;
        };
        html.appendChild(script);
        return handle;
      };
    }

    function installSetTimeoutImplementation() {
      setImmediate = function() {
        var handle = addFromSetImmediateArguments(arguments);
        setTimeout(partiallyApplied(runIfPresent, handle), 0);
        return handle;
      };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
      // For Node.js before 0.9
      installNextTickImplementation();

    } else if (canUsePostMessage()) {
      // For non-IE10 modern browsers
      installPostMessageImplementation();

    } else if (global.MessageChannel) {
      // For web workers, where supported
      installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
      // For IE 6–8
      installReadyStateChangeImplementation();

    } else {
      // For older browsers
      installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
  }(this)); // eslint-disable-line no-undef
})
.call('object' === typeof window && window || 'object' === typeof self && self || 'object' === typeof global && global || {});


Deps.autorun(function() {
  var interval = 500;
  var blockDelta = 1000 * 15;
  var interval = setInterval(function() {
    var last = Date.now();
    setImmediate(function() {
      var delta = Date.now() - last;
      if (delta > blockDelta) {
        console.log("node.eventloop_blocked", delta);
        trackEvent("system", "blocked")
      }
    });
  }, interval);

});


Deps.autorun(function() {
  if (Meteor.userId()) {
    Meteor.setTimeout(function() {
      SyncMsgSessionFromServer(Meteor.userId());
      // Meteor.subscribe('get-msg-session');
    }, 1000 * 2);
  }
});
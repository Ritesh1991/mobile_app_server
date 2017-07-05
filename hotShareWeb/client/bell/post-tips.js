var renderPage = function(){
  // Meteor.setTimeout(function(){
  //   var $box = $('.show-post-new-message');
  //   var $wrapper = $('#wrapper');
  //   var $gridster = $('.gridster');
  //   var $span = $('.bell-post-tips-span');
  //   var $test = $('.gridster #test');
  //   var $post_abstract = $('.post_abstract');

  //   console.log('render post-tips:', $box.length > 0 ? 'show' : 'hide');
  //   if($box.length > 0){
  //     $box.css('top', (($post_abstract.length > 0 ? $post_abstract.height() + $wrapper.height() : $wrapper.height()) + 50) + 'px');
  //     $span.css('height', '70px');
  //     $test.css({
  //       'position': 'position',
  //       'top': '70px'
  //     });
  //   }else{
  //     $span.css('height', '0px');
  //     $test.css({
  //       'position': 'position',
  //       'top': '0px'
  //     });
  //   }
  // }, 300);
};

Session.setDefault("TEST_AAA", true);
Session.setDefault('showBellPostTips',true);
Template.bellPostTips.helpers({
  hasNew: function(){
    var feedsCount = Template.bellPostTips.__helpers.get('feedsCount')();
    var showBellPostTips = Session.get('showBellPostTips');
    // var imageMarginPixel=5;
    // var $test = $('.gridster #test');
    // var test = $('.gridster #test')[0];
    // if (test == undefined || test == null)
    //   return false;
    // var firstChild = $('.gridster #test .element').first()[0];
    // console.log("feedsCount = "+feedsCount);
    // if (firstChild && firstChild.style && test.style) {
    //     if (feedsCount > 0) {
    //         if ($test && (parseInt(firstChild.style.top) <= test.offsetTop+imageMarginPixel)) {
    //             $test.children('.element').each(function () {
    //                 if (this.style && this.style.top) {
    //                     if (this.style.top.indexOf('px') >= 0) {
    //                         this.style.top = (parseInt(this.style.top)+65).toString() + 'px';
    //                     }
    //                 }
    //             });
    //             test.style.height = (parseInt(test.style.height)+65).toString() + 'px';
    //         }
    //     } else {
    //         if ($test && (parseInt(firstChild.style.top) > test.offsetTop+imageMarginPixel)) {
    //             $test.children('.element').each(function () {
    //                 if (this.style && this.style.top) {
    //                     if (this.style.top.indexOf('px') >= 0) {
    //                         this.style.top = (parseInt(this.style.top)-65).toString() + 'px';
    //                     }
    //                 }
    //             });
    //             test.style.height = (parseInt(test.style.height)-65).toString() + 'px';
    //         }
    //     }
    // }
    // return feedsCount > 0 && showBellPostTips;
    return feedsCount > 0
  },
  feedsCount: function(){

    // return Feeds.find({followby: Meteor.userId(), isRead:{$ne: true}, checked:{$ne: true}}).count();
    // return SimpleChat.Messages.find({'to.id':Meteor.userId(),is_read:false}).count();
    return Meteor.user().profile && Meteor.user().profile.waitReadMsgCount ? Meteor.user().profile.waitReadMsgCount : 0;
  },
  lsatFeed: function(){
    return Feeds.findOne({followby: Meteor.userId(), isRead:{$ne: true}, checked:{$ne: true}}, {sort: {createdAt: -1}});
  },
  lastIcon: function(){
    var lastMsg = SimpleChat.Messages.findOne({'to.id':Meteor.userId(),is_read:false},{sort:{create_time:-1}});
    if(lastMsg && lastMsg.form && lastMsg.form.icon){
      return lastMsg.form.icon
    } else {
      return '/userPicture.png'
    }
  },
  onLoadData: function(){
    renderPage();
  },
  associatedUserName: function(){
    var user = Meteor.user();
    if(user && user.profile && user.profile.associated && user.profile.associated[0] && user.profile.associated[0].name){
      return user.profile.associated[0].name;
    }
    return '';
  },
  msgBoxClipboard: function(){
    return 'http://'+server_domain_name+'/restapi/webuser-qrcode?userId='+Meteor.userId()+'&touserId=&p=post&postId='+Session.get('postContent')._id;
  }
});

Template.bellPostTips.onRendered(function(){
  var clipboard = new Clipboard('.msg-box');
  var onMsgBoxClient = function(){
    trackEvent("blkMsgBox", "clickBlkMsgBox");
    Session.set('showBellPostTips',false);
    Meteor.call('updataFeedsWithMe', Meteor.userId());
    var user = Meteor.user();
    if(withQRTips){
      if(user && user.profile && user.profile.associated && user.profile.associated.length > 0){
        Session.set('qrtype', '消息');
        return $('#bellPostDialog').fadeIn();
      }
      return showQrTips('','post',Session.get('postContent')._id);
    }else{
      Router.go('/bell');
    }
  };

  clipboard.on('success', function(e) {
    console.log('Action:', e.action);
    console.log('Text:', e.text);
    console.log('Trigger:', e.trigger);
    e.clearSelection();

    if (withQRTips){
      // TODO: 处理 copy 成功的流程
      onMsgBoxClient();
    }
  });

  clipboard.on('error', function(e) {
    console.log('Action:', e.action);
    console.log('Trigger:', e.trigger);
    onMsgBoxClient();
  });
});

Template.bellPostTips.events({
  // 'click .msg-box': function(){
  //   trackEvent("blkMsgBox", "clickBlkMsgBox");
  //   Session.set('showBellPostTips',false);
  //   Meteor.call('updataFeedsWithMe', Meteor.userId());
  //   var user = Meteor.user();
  //   if(withQRTips){
  //     if(user && user.profile && user.profile.associated && user.profile.associated.length > 0){
  //       Session.set('qrtype', '消息');
  //       return $('#bellPostDialog').fadeIn();
  //     }
  //     return showQrTips('','post',Session.get('postContent')._id);
  //   }else{
  //     Router.go('/bell');
  //   }
  // },
  'click #closeBellPostDialog': function(){
    // 移除未读消息
    SimpleChat.Messages.remove({is_read:false,'to.id': Meteor.userId()},function(err,num){
      if(err){
        console.log(err)
      }
    });
    $('#bellPostDialog').fadeOut();
  }
});

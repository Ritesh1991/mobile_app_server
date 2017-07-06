
Template.downLoadTipPage.events({
  'click .preStep':function(){
    trackEvent('ReOpenQrcodeTip','from downLoadTipPage');
    var data = Session.get('QrTipData');
    if (data) {
      Router.go('/qrcodeTipPage');
    }
  },
  'click .nextStep':function(){
    trackEvent('InstalledApp','from downLoadTipPage');
    Router.go('/appBindWebTipPage');
  },
  'click #qrDownloadAPP':function(){
    if(isIOS){
      trackEvent('Download','from Post Tail, IOS')
    }else if(isAndroidFunc()){
      trackEvent('Download','from Post Tail, Android')
    }else {
      trackEvent('Download','from Post Tail, Outside Wechat')
    }
    return window.open('http://a.app.qq.com/o/simple.jsp?pkgname=org.hotshare.everywhere', '_system');
    // Meteor.setTimeout(function(){
    //   console.log('need To Down Load');
    //   window.open('http://a.app.qq.com/o/simple.jsp?pkgname=org.hotshare.everywhere', '_system');
    // },2500);
    // Router.go('/appBindWebTipPage');
  }
});

Template.downLoadTipPage1.events({
  'click .close':function(){
    var post = Session.get('postContent');
    if (post && post._id) {
       return Router.go('/posts/'+post._id);
    }
    var quary = location.search.split("&");
    var postId = null;
    for (var i = 0; i < quary.length; i++) {
      if (quary[i].indexOf('postId') >= 0) {
        postId = quary[i].replace('postId=', '');
        break;
      }
    }
    if (postId) {
      Router.go('/posts/'+postId);
    }
  },
  'click #qrDownloadAPP':function(){
    if(isIOS){
      trackEvent('Download','from Post Tail, IOS')
    }else if(isAndroidFunc()){
      trackEvent('Download','from Post Tail, Android')
    }else {
      trackEvent('Download','from Post Tail, Outside Wechat')
    }
    return window.open('http://a.app.qq.com/o/simple.jsp?pkgname=org.hotshare.everywhere', '_system');
  }
});
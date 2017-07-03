
Template.appBindWebTipPage.events({
  'click .preStep':function(){
    trackEvent('BindUserFail','bind user had fail');
    Router.go('/joinWechatGroup');
  },
  'click .nextStep':function(){
  	trackEvent('BindUserSuccess','bind user had successful');
    var data = Session.get('QrTipData');
    if (data) {
      Router.go('/posts/'+data.postId);
    }
  }
});
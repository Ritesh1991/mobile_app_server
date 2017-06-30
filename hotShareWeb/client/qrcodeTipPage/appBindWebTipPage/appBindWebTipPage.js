
Template.appBindWebTipPage.events({
  'click .preStep':function(){
    // Router.go('/downLoadTipPage');
    
  },
  'click .nextStep':function(){
    var data = Session.get('QrTipData');
    if (data) {
      Router.go('/posts/'+data.postId);
    }
  }
});
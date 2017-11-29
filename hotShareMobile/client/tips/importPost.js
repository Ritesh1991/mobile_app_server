var swiper = new Swipe(['_tips_importPost_one', '_tips_importPost_two', '_tips_importPost_three']);
var handler = null;

Template._tips_importPost.helpers({
  swiper: function(){
    return swiper;
  }
});

Template._tips_importPost.onRendered(function(){
  swiper.setInitialPage('_tips_importPost_one');
  if(handler){
    handler.stop()
    handler = null;
  }
  Tracker.autorun(function(obj){
    handler = obj;
    if(swiper.pageIs('_tips_importPost_one')){
      swiper.leftRight(null, '_tips_importPost_two');
    }else if(swiper.pageIs('_tips_importPost_two')){
      swiper.leftRight('_tips_importPost_one', '_tips_importPost_three');
    }else if(swiper.pageIs('_tips_importPost_three')){
      swiper.leftRight('_tips_importPost_two', null);
    }
  });
});

Template._tips_importPost.events({
  "click ._tips_importPost_three": function(e, t) {
    Tips.close();
  }
});
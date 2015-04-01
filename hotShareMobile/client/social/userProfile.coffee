Template.userProfile.rendered=->
  $('.userProfile').css('min-height',$(window).height()-90)
  $('.viewPostImages ul li').css('height',$(window).width()*0.168)
Template.userProfile.helpers
  profile:->
    Meteor.users.findOne {_id: Session.get("ProfileUserId")}
  isFollowed:()->
    fcount = Follower.find({"followerId":Session.get("ProfileUserId")}).count()
    if fcount > 0
      true
    else
      false
  viewItems:()->
      value = 0
      count = Viewers.find({userId:Session.get("ProfileUserId")}).count()
      if count >=2
        value = 1
      else
        value = count-1
      for i in [0..value]
        vDoc = Viewers.find({userId:Session.get("ProfileUserId")},{sort: {createdAt: -1}}).fetch()[i]
        Meteor.subscribe("publicPosts",vDoc.postId)
        Posts.find({_id:vDoc.postId}).fetch()[0]
Template.userProfile.events
  'click #sendChatMessage': ()->
    Meteor.subscribe("userinfo",Session.get("ProfileUserId"));
    Session.set("Social.LevelOne.Menu", 'messageDialog')
  'click .postImages ul li':(e)->
    postId = e.currentTarget.id
    $(window).scrollTop(0)
    Router.go '/posts/'+postId

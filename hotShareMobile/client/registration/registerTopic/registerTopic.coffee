#用户 space2
Template.topic_title.helpers
  topics: ->
    Topics.find({"isFollowTopic":true},{sort: {index: 1}})
Template.topic_title_list.helpers
  isFollowed:(follow)->
    tcount = Follower.find({"userId":Meteor.userId(),"followerId":follow.userId}).count()
    if tcount > 0
      true
    else
      false
Template.registerTopic.onCreated ()->
  Meteor.subscribe("registerTopic")
  Meteor.subscribe("follower")
Template.registerTopic.helpers
  followCount: ->
    Follower.find({"userId":Meteor.userId()}).count()
  NeedMoreCount: ->
    4 - Follower.find({"userId":Meteor.userId()}).count()
  larger:(a,b)->
    if a > b
      true
    else
      false
Template.registerTopic.events
  'click #continue':->
    if Meteor.user().profile.new isnt undefined and Meteor.user().profile.new is true
      Meteor.users.update({_id: Meteor.userId()}, {$set: {"profile.new": false}})
      Session.setPersistent('persistentLoginStatus',true)
    #toLoadFollowPost();
    Router.go('/')
  'click .layer':(e)->
    fcount = Follower.find({"userId":Meteor.userId(),"followerId":@userId}).count()
    if fcount > 0
      followerId = Follower.findOne({
                     userId: Meteor.userId()
                     followerId: @userId
                 })._id
      removeFollower(followerId)
    else
      #匿名用户刚注册，系统就已经分配随机全名
      if Meteor.user().profile and Meteor.user().profile.fullname
        username = Meteor.user().profile.fullname
      else
        username = Meteor.user().username
      addFollower {
        userId: Meteor.userId()
        #用户更新fullname后，这里存放fullname
        userName: username
        #刚注册，用户还没有设置头像和个性签名
        #注册时，头像用默认头像，desc用''
        userIcon: Meteor.user().profile.icon
        userDesc: Meteor.user().profile.desc
        followerId: @userId
        #这里存放fullname
        followerName: @fullname
        followerIcon: @icon
        followerDesc: @desc
        createAt: new Date()
      }

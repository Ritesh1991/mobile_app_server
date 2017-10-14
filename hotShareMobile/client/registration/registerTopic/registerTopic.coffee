#用户 space2
Template.topic_title.helpers
  topics: ->
    Topics.find({"isFollowTopic":true},{sort: {index: 1}})
Template.topic_title_list.helpers
  isFollowed:(follow)->
    console.log 'isFollowed ========='
    console.log follow
    tcount = Topics.find({'type':'follow',"userId":Meteor.userId(),"followId":follow._id}).count()
    if tcount > 0
      true
    else
      false
Template.registerTopic.onCreated ()->
  Meteor.subscribe("registerTopic")
  Meteor.subscribe("followTopicUser")
Template.registerTopic.helpers
  followCount: ->
    Topics.find({'type':'follow',"userId":Meteor.userId()}).count()
  NeedMoreCount: ->
    4 - Topics.find({'type':'follow',"userId":Meteor.userId()}).count()
  larger:(a,b)->
    if a > b
      true
    else
      false
Template.registerTopic.events
  'click .continue':->
    if Meteor.user().profile.new isnt undefined and Meteor.user().profile.new is true
      Meteor.users.update({_id: Meteor.userId()}, {$set: {"profile.new": false}})
      Session.setPersistent('persistentLoginStatus',true)
    Router.go('/')
  'click .layer':(e)->
    fcount = Topics.find({'type':'follow',"userId":Meteor.userId(),"followId":@_id}).count()
    if fcount > 0
      followId = Topics.findOne({
                      'type':'follow',
                      'userId': Meteor.userId(),
                      'followId': @_id
                    })._id
      Meteor.call('removeTopicFollow', followId)
    else
      jsondata = {
        'type':'follow',
        'userId': Meteor.userId(),
        'text':@text,
        'followId': @_id
      }
      Meteor.call('updateTopicFollow', jsondata)

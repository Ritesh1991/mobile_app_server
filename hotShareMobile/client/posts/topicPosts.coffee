if Meteor.isClient
  Template.topicPosts.onCreated ()->
    Meteor.subscribe("topics")
    Session.set("topicPostLimit", 20)
    Session.set('topicPostsCollection','loading')
    Meteor.subscribe 'topicposts', Session.get('topicId'), 20, onReady: ->
      if Session.get("topicPostLimit") >= TopicPosts.find({topicId:Session.get('topicId')}).count()
        console.log 'topicPostsCollection loaded'
        Meteor.setTimeout (->
          Session.set 'topicPostsCollection', 'loaded'
        ), 500
    
  Template.topicPosts.rendered=->
    $('.content').css 'min-height',$(window).height()
    $(window).scroll (event)->
        tHeight = $('.home').height()
        nHeight = $(window).scrollTop() + $(window).height() + 300
        if nHeight > tHeight
          Session.set('topicPostsCollection','loading')
        target = $("#topicPostShowMoreResults");
        TOPIC_POSTS_ITEMS_INCREMENT = 20;

        if (!target.length)
            return;
        threshold = $(window).scrollTop() + $(window).height() - target.height()

        if target.offset().top < threshold
          if (!target.data("visible"))
              Session.set("topicPostLimit",
                          Session.get("topicPostLimit") + TOPIC_POSTS_ITEMS_INCREMENT)
              Meteor.subscribe 'topicposts', Session.get('topicId'), Session.get("topicPostLimit"), onReady: ->
                if Session.get("topicPostLimit") >= TopicPosts.find({topicId:Session.get('topicId')}).count()
                  console.log 'topicPostsCollection loaded'
                  Meteor.setTimeout (->
                    Session.set 'topicPostsCollection', 'loaded'
                    return
                  ), 500
                return
        else
          if (target.data("visible"))
              target.data("visible", false);
  Template.topicPosts.helpers
    TopicTitle:()->
      Session.get('topicTitle')
    getBrowseCount:(browse)->
      if (browse)
        browse
      else
        0
    Posts:()->
      TopicPosts.find({topicId:Session.get('topicId')}, {sort: {createdAt: -1}})
    moreResults:->
      if Session.equals('topicPostsCollection','loaded')
          false
      else
          true
  Template.topicPosts.events
    'click .back':(event)->
      $('.home').addClass('animated ' + animateOutUpperEffect);
      Meteor.setTimeout ()->
        PUB.back()
      ,animatePageTrasitionTimeout
    'click .mainImage': (event)->
      Session.set("postPageScrollTop", 0)
      if isIOS
        if (event.clientY + $('#footer').height()) >=  $(window).height()
          console.log 'should be triggered in scrolling'
          return false
      postId = this.postId
      $('.home').addClass('animated ' + animateOutUpperEffect)
      Session.set('channel','topicPosts')
      backview = Session.get("history_view") || []
      backview.push {
          view: Router.current().url.substr(1)
          scrollTop: $(window).scrollTop()
      }
      Session.set "history_view", backview
      Meteor.setTimeout ()->
        PUB.page '/posts/'+postId
      ,animatePageTrasitionTimeout
      Session.set 'FollowPostsId',this._id
      return
    'click .footer .icon': (e)->
      prepareToEditorMode()
      backview = Session.get("history_view") || []
      backview.push {
          view: Router.current().url.substr(1)
          scrollTop: $(window).scrollTop()
      }
      Session.set "history_view", backview
      Router.go '/userProfilePageOnly/' + this.owner
    'click .footer .name': (e)->
      console.log 'i clicked a name'
      backview = Session.get("history_view") || []
      backview.push {
          view: Router.current().url.substr(1)
          scrollTop: $(window).scrollTop()
      }
      Session.set "history_view", backview
      Router.go '/userProfilePageOnly/' + this.owner

  Template.topicFollowPosts.onCreated ()->
    Meteor.subscribe("topics")
    Session.set("topicPostLimit", 20)
    Session.set('topicPostsCollection','loading')
    Meteor.subscribe 'topicposts', Session.get('followTopicNow'), 20, onReady: ->
      if Session.get("topicPostLimit") >= TopicPosts.find({topicId:Session.get('followTopicNow')}).count()
        console.log 'topicPostsCollection loaded'
        Meteor.setTimeout (->
          Session.set 'topicPostsCollection', 'loaded'
        ), 500
    
  Template.topicFollowPosts.rendered=->
    $('.content').css 'min-height',$(window).height()
    $(window).scroll (event)->
        tHeight = $('.home').height()
        nHeight = $(window).scrollTop() + $(window).height() + 300
        if nHeight > tHeight
          Session.set('topicPostsCollection','loading')
        target = $("#topicPostShowMoreResults");
        TOPIC_POSTS_ITEMS_INCREMENT = 20;

        if (!target.length)
            return;
        threshold = $(window).scrollTop() + $(window).height() - target.height()

        if target.offset().top < threshold
          if (!target.data("visible"))
              Session.set("topicPostLimit",
                          Session.get("topicPostLimit") + TOPIC_POSTS_ITEMS_INCREMENT)
              Meteor.subscribe 'topicposts', Session.get('followTopicNow'), Session.get("topicPostLimit"), onReady: ->
                if Session.get("topicPostLimit") >= TopicPosts.find({topicId:Session.get('followTopicNow')}).count()
                  console.log 'topicPostsCollection loaded'
                  Meteor.setTimeout (->
                    Session.set 'topicPostsCollection', 'loaded'
                    return
                  ), 500
                return
        else
          if (target.data("visible"))
              target.data("visible", false);
  Template.topicFollowPosts.helpers
    TopicTitle:()->
      Session.get('topicTitle')
    getBrowseCount:(browse)->
      if (browse)
        browse
      else
        0
    Posts:()->
      TopicPosts.find({topicId:Session.get('followTopicNow')}, {sort: {createdAt: -1}})
    moreResults:->
      if Session.equals('topicPostsCollection','loaded')
          false
      else
          true
  Template.topicFollowPosts.events
    'click .back':(event)->
      $('.home').addClass('animated ' + animateOutUpperEffect);
      Meteor.setTimeout ()->
        PUB.back()
      ,animatePageTrasitionTimeout
    'click .mainImage': (event)->
      Session.set("postPageScrollTop", 0)
      if isIOS
        if (event.clientY + $('#footer').height()) >=  $(window).height()
          console.log 'should be triggered in scrolling'
          return false
      postId = this.postId
      $('.home').addClass('animated ' + animateOutUpperEffect);
      Meteor.setTimeout ()->
        PUB.page '/posts/'+postId
      ,animatePageTrasitionTimeout
      Session.set 'followTopicNow',this._id
      return
    'click .footer .icon': (e)->
      backview = Session.get("history_view") || []
      backview.push {
          view: Router.current().url.substr(1)
          scrollTop: $(window).scrollTop()
      }
      Session.set "history_view", backview
      Router.go '/userProfilePageOnly/' + this.owner
    'click .footer .name': (e)->
      backview = Session.get("history_view") || []
      backview.push {
          view: Router.current().url.substr(1)
          scrollTop: $(window).scrollTop()
      }
      Session.set "history_view", backview
      Router.go '/userProfilePageOnly/' + this.owner

  getFollowerArr = ()->
    userId = Meteor.userId()
    followerData = Follower.find().fetch()
    followpostData = FollowPosts.find({followby:Meteor.userId()}).fetch()
    notShowArrId = []
    notShowArrId.push(userId)
    for item in followerData
      if item.userId is userId
        notShowArrId.push(item.followerId)
    for postData in followpostData
      if notShowArrId.indexOf(postData.owner) is -1
        notShowArrId.push(postData.owner)
    console.log notShowArrId
    Session.set 'notShowPostUserIdArr', notShowArrId
  Template.topicPostsAll.onCreated ()->
    Session.set("newpostsLimit", 10)
    Session.set('newpostsCollection','loading')
    Meteor.subscribe 'newposts', 10, onReady: ->
      if Session.get("newpostsLimit") >= Posts.find({}).count()
        console.log 'newpostsCollection loaded'
        Meteor.setTimeout (->
          Session.set 'newpostsCollection', 'loaded'
        ), 500
    
  Template.topicPostsAll.rendered=->
    $('.content').css 'min-height',$(window).height()
    $(window).scroll (event)->
        tHeight = $('.home').height()
        nHeight = $(window).scrollTop() + $(window).height() + 320
        if nHeight > tHeight
          Session.set('newpostsCollection','loading')
        target = $("#topicPostShowMoreResults");
        TOPIC_POSTS_ITEMS_INCREMENT = 10;

        if (!target.length)
            return;
        threshold = $(window).scrollTop() + $(window).height() - target.height()

        if target.offset().top < threshold
          if (!target.data("visible"))
              Session.set("newpostsLimit",
                          Posts.find({}).count() + TOPIC_POSTS_ITEMS_INCREMENT)
              Meteor.subscribe 'newposts', Session.get('newpostsLimit'), onReady: ->
                notShowArrId = Session.get('notShowPostUserIdArr')
                #getFollowerArr()
                if Session.get("newpostsLimit") >= Posts.find({'owner':{$nin:notShowArrId}}).count()
                  console.log 'newpostsCollection loaded'
                  Meteor.setTimeout (->
                    Session.set 'newpostsCollection', 'loaded'
                    return
                  ), 500
                return
        else
          if (target.data("visible"))
              target.data("visible", false);
  Template.topicPostsAll.helpers
    getBrowseCount:(browse)->
      if (browse)
        browse
      else
        0
    hideFollowerPosts:(owner)->
      followerIdArr = Session.get('notShowPostUserIdArr')
      if followerIdArr.indexOf(owner) isnt -1
        return false
      else
        return true
    fromSearchPage:()->
      if Session.get('isFromSearchPage') is false
        return false
      else
        return true
    newPosts:()->
      #getFollowerArr()
      #notShowArrId = Session.get('notShowPostUserIdArr')
      return Posts.find({'isReview':true,'publish':true}, {sort: {createdAt: -1}})
    moreResults:->
      if Session.equals('newpostsCollection','loaded')
          false
      else
          true
  Template.topicPostsAll.events
    'click .top-home-btn': (event)->
      Router.go '/'
    'click .top-series-btn': (event)->
      Router.go '/seriesList'
    'click .back':(event)->
      $('.home').addClass('animated ' + animateOutUpperEffect);
      Meteor.setTimeout ()->
        PUB.back()
      ,animatePageTrasitionTimeout
    'click .mainImage': (event)->
      Session.set("postPageScrollTop", 0)
      if isIOS
        if (event.clientY + $('#footer').height()) >=  $(window).height()
          console.log 'should be triggered in scrolling'
          return false
      postId = this._id
      $('.home').addClass('animated ' + animateOutUpperEffect)
      Session.set('channel','topicPostsAll')
      backview = Session.get("history_view") || []
      backview.push {
          view: Router.current().url.substr(1)
          scrollTop: $(window).scrollTop()
      }
      Session.set "history_view", backview
      Meteor.setTimeout ()->
        PUB.page '/posts/'+postId
      ,animatePageTrasitionTimeout
      # Session.set 'FollowPostsId',this._id
      return
    'click .footer .icon': (e)->
      backview = Session.get("history_view") || []
      backview.push {
          view: Router.current().url.substr(1)
          scrollTop: $(window).scrollTop()
      }
      Session.set "history_view", backview
      Router.go '/userProfilePageOnly/' + this.owner
    'click .footer .name': (e)->
      backview = Session.get("history_view") || []
      backview.push {
          view: Router.current().url.substr(1)
          scrollTop: $(window).scrollTop()
      }
      Session.set "history_view", backview
      Router.go '/userProfilePageOnly/' + this.owner

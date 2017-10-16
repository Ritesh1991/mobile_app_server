@onUserProfile = ->
  @PopUpBox = $('.popUpBox').bPopup
    positionStyle: 'fixed'
    position: [0, 0]
    console.log "in user profile page"
    Session.set('displayUserProfileBox',true)
    #onClose: ->
    #  Session.set('displayUserProfileBox',false)
    #onOpen: ->
    #  Session.set('displayUserProfileBox',true)
    
if Meteor.isClient
  xpull = null
  loadMoreHandler = null
  Template.listPosts.onDestroyed ()->
    if xpull
      xpull.destroy()
      xpull = null
    if loadMoreHandler
      loadMoreHandler.loadMore = null
      loadMoreHandler.lock()
      loadMoreHandler.detachScrollListener()

      loadMoreHandler.container.removeEventListener('touchstart', loadMoreHandler.touchStart)
      loadMoreHandler.container.removeEventListener('touchmove', loadMoreHandler.touchMove)
      loadMoreHandler.container.removeEventListener('touchend', loadMoreHandler.touchEnd)
      loadMoreHandler = null
  Template.listPosts.onCreated ()->
    if withFollowTopic
      Meteor.subscribe("topics")
      Session.set("topicPostLimit", 20)
      Session.set('topicPostsCollection','loading')
      if Session.get 'followTopicNow' and Session.get 'followTopicNow' isnt 'my-follow'
        Meteor.subscribe 'topicposts', Session.get('followTopicNow'), 20, onReady: ->
          if Session.get("topicPostLimit") >= TopicPosts.find({topicId:Session.get('followTopicNow')}).count()
            console.log 'topicPostsCollection loaded'
            Meteor.setTimeout (->
              Session.set 'topicPostsCollection', 'loaded'
            ), 500
  Template.listPosts.rendered=->
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
    if !$('.home #wrapper #list-post').data("plugin_xpull")
      $('.home #wrapper #list-post').xpull(
        {
          onPullStart: ()->
            console.log('xpull start')
            Session.set('followPostsCollection','loaded')
          callback: ()->
            console.log('pull to refresh follow posts')
            toLoadLatestFollowPost()
        }
      )
      xpull = $('.home #wrapper #list-post').data("plugin_xpull")
    else
      $('.home #wrapper #list-post').data("plugin_xpull").init()
    Deps.autorun (h)->
      if Meteor.userId() and FollowPosts.find({followby:Meteor.userId()}).count()>3
        h.stop()
        loadMoreHandler = initLoadMoreForListPosts()
    #    $('.mainImage').css('height',$(window).height()*0.55)
    ###
    $(window).scroll (event)->
        target = $("#showMoreResults");
        if (!target.length)
            return;
        threshold = $(window).scrollTop() + $(window).height() - target.height();

        if target.offset().top < threshold
            if (!target.data("visible"))
                console.log("target became visible (inside viewable area)");
                target.data("visible", true);
                toLoadFollowPost();
        else
            if (target.data("visible"))
                console.log("target became invisible (below viewable arae)");
                target.data("visible", false);
    ###
  Template.listPosts.helpers
    getBrowseCount:(browse)->
      if (browse)
        browse
      else
        0
    myPosts:()->
      if withFollowTopic
        getTopicFollowId()
        if Session.get 'followTopicNow' is 'my-follow'
          return FollowPosts.find({followby:Meteor.userId(),publish:{"$ne":false}}, {sort: {createdAt: -1},limit:Session.get("followpostsitemsLimit")})
        else
          # return topic follow posts.
          return TopicPosts.find({topicId:Session.get('followTopicNow')}, {sort: {createdAt: -1}})
      else
        FollowPosts.find({followby:Meteor.userId(),publish:{"$ne":false}}, {sort: {createdAt: -1},limit:Session.get("followpostsitemsLimit")})
    # isfollowerpost:(postId)->
    #   if FollowPosts.find({postId:postId}).count() > 1 and postId isnt null
    #     followPostsId = FollowPosts.findOne({postId: postId})._id
    #     FollowPosts.remove({_id:followPostsId})
    #     myFollowedPosts = FollowPosts.find({followby:Meteor.userId(),publish:{"$ne":false}}, {sort: {createdAt: -1}})
    #     #Session.setPersistent('persistentMyFollowedPosts',myFollowedPosts.fetch())
    #     return true
    #   else
    #     return true
    moreTopicResults:->
      if Session.equals('topicPostsCollection','loaded')
          false
      else
          true
    moreResults:->
      false
      #!(FollowPosts.find().count() < Session.get("followpostsitemsLimit"))
    loading:->
      Session.equals('followPostsCollection','loading')
    loadError:->
      Session.equals('followPostsCollection','error')
  Template.listPosts.events
    'click .mainImage': (event)->
      Session.set("postPageScrollTop", 0)
      if isIOS
        if (event.clientY + $('.home #footer').height()) >=  $(window).height()
          console.log 'should be triggered in scrolling'
          return false
      $('.home').addClass('animated ' + animateOutLowerEffect);
      postId = this.postId
      prepareToEditorMode()
      setTimeout ()->
        PUB.page '/posts/'+postId
      ,animatePageTrasitionTimeout
      # console.log this.postId
      Session.set 'FollowPostsId',this._id
      # console.log this._id
    'click .footer .icon': (e)->
      # console.log 'i clicked a icon'
      # console.log "owner is: " + this.owner
      prepareToEditorMode()
      Session.set("ProfileUserId1", this.owner)
      Session.set("currentPageIndex",-1)
      Meteor.subscribe("usersById", this.owner)
      Meteor.subscribe("recentPostsViewByUser", this.owner)
      Session.set('pageToProfile','/')
      Session.set('pageScrollTop',$(window).scrollTop())
      onUserProfile()
    'click .footer .name': (e)->
      # console.log 'i clicked a name'
      prepareToEditorMode()
      Session.set("ProfileUserId1", this.owner)
      Session.set("currentPageIndex",-1)
      Meteor.subscribe("usersById", this.owner)
      Meteor.subscribe("recentPostsViewByUser", this.owner)
      Session.set('pageToProfile','/')
      Session.set('pageScrollTop',$(window).scrollTop())
      onUserProfile()

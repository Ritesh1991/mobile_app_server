  Template.showUserProfile.rendered=->
    $('.userProfile').css('min-height', $(window).height() - 40)
    $('.viewPostImages ul li').css('height',$(window).width()*0.168)
    $('.page').addClass('scrollable')
    if PostFriends.find({ta: Session.get("userProfileId")}).count() is 0
      Meteor.subscribe "postOwnerInfo",Session.get("userProfileId")
  Template.showUserProfile.helpers
    isFollowedTheAuthor: ()->
      Follower.find({followerId: Session.get("userProfileId"), userId: Meteor.userId()}).count()>0
    isMale:(sex)->
      sex is 'male'
    isFemale:(sex)->
      sex is 'female'
    isMyself:()->
      Session.get("userProfileId") is Meteor.userId()
    AddFriend:->
      Meteor.subscribe("friendFeeds", Session.get("userProfileId"),Meteor.userId())
      addstr = '添加'
      if Cookies.check("display-lang")
        if Cookies.get("display-lang") is 'en'
          addstr = 'Add'
        else
          addstr = '添加'
      else
        addstr = '添加'
      if Feeds.find({requesteeId:Session.get("userProfileId"),requesterId:Meteor.userId()}).count()>0
        addstr = '已发送邀请'
        if Cookies.check("display-lang")
          if Cookies.get("display-lang") is 'en'
            addstr = 'Invitation has been sent'
          else
            addstr = '已发送邀请'
        else
          addstr = '已发送邀请'
      addstr
    profile:->
      if Session.get("userProfileId") is Meteor.userId()
        Meteor.user()
      else
        if PostFriends.findOne {ta: Session.get("userProfileId")}
          PostFriends.findOne {ta: Session.get("userProfileId")}
        else
          Meteor.users.findOne {_id: Session.get("userProfileId")}
    location:->
      getLocation(Session.get("userProfileId"))
    isFollowed:()->
      fcount = Follower.find({"followerId":Session.get("userProfileId")}).count()
      if fcount > 0
        true
      else
        false
    viewLists:()->
      ViewLists.find({userId:Session.get("userProfileId")},{sort: {createdAt: -1}, limit:3})
    favouriteList: ()->
      Meteor.subscribe("userfavouriteposts", Session.get("userProfileId"), 3)
      postIds = []
      FavouritePosts.find({userId: Session.get("userProfileId")}).forEach((item) ->
          if !~postIds.indexOf(item.postId)
            postIds.push(item.postId)
      )
      Posts.find({_id: {$in: postIds}})
    compareViewsCount:(value)->
      if (ViewLists.find({userId:Session.get("userProfileId")}, {sort: {createdAt: -1}, limit:3}).count() > value)
        true
      else
        false
    isSuggested:()->
      Meteor.subscribe("userFeeds", Session.get("userProfileId"),Session.get("postContent")._id)
      if Feeds.find({followby: Session.get("userProfileId"),postId: Session.get("postContent")._id,recommanderId:Meteor.userId()}).count()>0
        true
      else
        false
  Template.showUserProfile.events
    'click .chatToUser':(e)->
      ta = Session.get("userProfileId")
      $(window).children().off()
      $(window).unbind('scroll')
      $('.showUserProfile').fadeOut()
      $('.showBgColor').fadeIn()
      if $(e.currentTarget).attr('userprofile') and $(e.currentTarget).attr('userprofile') isnt ''
        userName = $(e.currentTarget).attr('userprofile')
      else if $(e.currentTarget).attr('username') and $(e.currentTarget).attr('username') isnt ''
        userName = $(e.currentTarget).attr('username')
      else
        userName = ''
      Session.set('msgToUserName', userName)
      Meteor.setTimeout ()->
        Session.set("Social.LevelOne.Menu",'contactsList')
        # Router.go('/simple-chat/to/user?id='+ta)
        writeLetterTo(ta)
      ,300
    'click #followAuthor': (e)->
      if Meteor.user().profile.fullname
        username = Meteor.user().profile.fullname
      else
        username = Meteor.user().username
      profile = Template.userProfilePage1.__helpers.get('profile')()
      followerName = ''
      if profile and profile.profile and profile.profile.fullname
        followerName = profile.profile.fullname
      else if profile
        followerName = profile.username
      insertObj = {
        userId: Meteor.userId()
        #这里存放fullname
        userName: username
        userIcon: Meteor.user().profile.icon
        userDesc: Meteor.user().profile.desc
        followerId: Session.get("userProfileId")
        #这里存放fullname
        followerName: followerName
        followerIcon: profile.profile.icon
        followerDesc: profile.profile.desc
        createAt: new Date()
      }
      addFollower(insertObj)
    'click #unFollowAuthor': (e)->
      followId = Follower.findOne({followerId: Session.get("userProfileId"), userId: Meteor.userId()})._id
      removeFollower(followId)
    'click .userProfile .back':()->
      if window.userProfileTrackerHandler
        window.userProfileTrackerHandler.stop()
        window.userProfileTrackerHandler = null
      Session.set("Social.LevelOne.Menu",'contactsList')
      $('.showUserProfile').fadeOut()
      $('.showBgColor').fadeIn()
      if Session.get('pageToProfile')
        Meteor.setTimeout ()->
          Router.go Session.get('pageToProfile')
          Session.set('pageToProfile',null)
          scrollTop = Session.get('pageScrollTop')
          if scrollTop and scrollTop isnt 0
            document.body.scrollTop = Session.get('pageScrollTop')
            Session.set('pageScrollTop',0)
          if Session.get('fromContactsList') is true
            Session.set('fromContactsList',false)
            Session.set("SocialOnButton",'contactsList')
            $('.div_contactsList').css('display',"block")
            $('.div_discover').css('display',"none")
            $('.div_me').css('display',"none")
        ,300
    'click .postImages ul li':(e)->
      postId = e.currentTarget.id
      $(window).children().off()
      $(window).unbind('scroll')
      $('.showUserProfile').fadeOut()
      $('.showBgColor').fadeIn()
      Meteor.setTimeout ()->
        Session.set("Social.LevelOne.Menu",'contactsList')
        Session.set('fromUserProfile',true)
        Router.go '/posts/'+postId
        document.body.scrollTop = 0
      ,300
    'click #addToContactList': ()->
      addToContactList("userProfileId")

  Template.MyfavoritePosts.rendered=->
    $(window).scroll (event)->
      if Session.get("Social.LevelOne.Menu") is 'contactsList'
        MOMENTS_ITEMS_INCREMENT = 10;
        if window.innerHeight
          winHeight = window.innerHeight
        else
          winHeight = $(window).height() # iphone fix
        closeToBottom = ($(window).scrollTop() + winHeight > $(document).height() - 100);
        if (closeToBottom and hasMoreResult1())
          if window.favouritepostsCollection1_getmore is 'done' and (window.newLayoutImageInDownloading < 5)
            console.log('Triggered data source refresh');
            window.favouritepostsCollection1_getmore = 'inprogress'
            Session.set("favouritepostsLimit1",Session.get("favouritepostsLimit1") + MOMENTS_ITEMS_INCREMENT);
  Template.MyfavoritePosts.helpers
    isLoading:()->
      (Session.equals('newLayoutImageDownloading',true) or
        !Session.equals('favouritepostsCollection1_getmore','done')) and
        Session.equals("SocialOnButton",'contactsList')
    onPostId:()->
      if Session.get("postContent")
        return Session.get("postContent")._id
      else
        return null
    favoritePosts1:()->
      postIds = []
      FavouritePosts.find({userId: Session.get("userProfileId")}).forEach((item) ->
        if !~postIds.indexOf(item.postId)
          postIds.push(item.postId)
      )
      posts = Posts.find({_id: {$in: postIds}}).fetch()
      posts.sort((p1, p2)->
        return -(FavouritePosts.findOne({postId: p1._id, userId: Session.get("userProfileId")}).createdAt - FavouritePosts.findOne({postId: p2._id, userId: Session.get("userProfileId")}).createdAt)
      )
      posts         
    suggestPosts:()->
      SuggestPosts.find({},{sort: {createdAt: -1},limit:10})
    loading:()->
      Session.equals('momentsCollection','loading')
    loadError:()->
      Session.equals('momentsCollection','error')
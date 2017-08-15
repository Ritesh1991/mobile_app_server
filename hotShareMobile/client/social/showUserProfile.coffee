  Template.showUserProfile.rendered=->
    $('.userProfile').css('min-height', $(window).height() - 40)
    $('.viewPostImages ul li').css('height',$(window).width()*0.168)
    $('.page').addClass('scrollable')
    if PostFriends.find({ta: Session.get("ProfileUserId1")}).count() is 0
      Meteor.subscribe "postOwnerInfo",Session.get("ProfileUserId1")
  Template.showUserProfile.helpers
    isFollowedTheAuthor: ()->
      Follower.find({followerId: Session.get("ProfileUserId1"), userId: Meteor.userId()}).count()>0
    showPostSuggestionToUser: ()->
      withPostSuggestionToUser
    isMale:(sex)->
      sex is 'male'
    isFemale:(sex)->
      sex is 'female'
    isMyself:()->
      Session.get("ProfileUserId1") is Meteor.userId()
    AddFriend:->
      Meteor.subscribe("friendFeeds", Session.get("ProfileUserId1"),Meteor.userId())
      addstr = '添加'
      if Cookies.check("display-lang")
        if Cookies.get("display-lang") is 'en'
          addstr = 'Add'
        else
          addstr = '添加'
      else
        addstr = '添加'
      if Feeds.find({requesteeId:Session.get("ProfileUserId1"),requesterId:Meteor.userId()}).count()>0
        addstr = '已发送邀请'
        if Cookies.check("display-lang")
          if Cookies.get("display-lang") is 'en'
            addstr = 'Invitation has been sent'
          else
            addstr = '已发送邀请'
        else
          addstr = '已发送邀请'
      addstr
    withChat:->
      withChat
    profile:->
      if Session.get("ProfileUserId1") is Meteor.userId()
        Meteor.user()
      else
        if PostFriends.findOne {ta: Session.get("ProfileUserId1")}
          PostFriends.findOne {ta: Session.get("ProfileUserId1")}
        else
          Meteor.users.findOne {_id: Session.get("ProfileUserId1")}
    location:->
      getLocation(Session.get("ProfileUserId1"))
    isFollowed:()->
      fcount = Follower.find({"followerId":Session.get("ProfileUserId1")}).count()
      if fcount > 0
        true
      else
        false
    viewLists:()->
      ViewLists.find({userId:Session.get("ProfileUserId1")},{sort: {createdAt: -1}, limit:3})
    favouriteList: ()->
      Meteor.subscribe("userfavouriteposts", Session.get("ProfileUserId1"), 3)
      postIds = []
      FavouritePosts.find({userId: Session.get("ProfileUserId1")}).forEach((item) ->
          if !~postIds.indexOf(item.postId)
            postIds.push(item.postId)
      )
      Posts.find({_id: {$in: postIds}})
    compareViewsCount:(value)->
      if (ViewLists.find({userId:Session.get("ProfileUserId1")}, {sort: {createdAt: -1}, limit:3}).count() > value)
        true
      else
        false
    isSuggested:()->
      Meteor.subscribe("userFeeds", Session.get("ProfileUserId1"),Session.get("postContent")._id)
      if Feeds.find({followby: Session.get("ProfileUserId1"),postId: Session.get("postContent")._id,recommanderId:Meteor.userId()}).count()>0
        true
      else
        false
  Template.showUserProfile.events
    'click .chatToUser':(e)->
      ta = Session.get("ProfileUserId1")
      $(window).children().off()
      $(window).unbind('scroll')
      if PopUpBox
        PopUpBox.close()
        $('.popUpBox, .b-modal').remove()
      $('.showUserProfile').fadeOut()
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
        followerId: Session.get("ProfileUserId1")
        #这里存放fullname
        followerName: followerName
        followerIcon: profile.profile.icon
        followerDesc: profile.profile.desc
        createAt: new Date()
      }
      addFollower(insertObj)
    'click #unFollowAuthor': (e)->
      followId = Follower.findOne({followerId: Session.get("ProfileUserId1"), userId: Meteor.userId()})._id
      removeFollower(followId)
    'click .userProfile .back':()->
      if window.userProfileTrackerHandler
        window.userProfileTrackerHandler.stop()
        window.userProfileTrackerHandler = null
      Session.set("Social.LevelOne.Menu",'contactsList')
      if PopUpBox
        PopUpBox.close()
        $('.popUpBox, .b-modal').hide()
      $('.showUserProfile').fadeOut()
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
      if PopUpBox
        PopUpBox.close()
        $('.popUpBox, .b-modal').hide()
      $('.showUserProfile').fadeOut()
      Meteor.setTimeout ()->
        Session.set("Social.LevelOne.Menu",'contactsList')
        Session.set('fromUserProfile',true)
        Router.go '/posts/'+postId
        document.body.scrollTop = 0
      ,300
    'click #addToContactList': ()->
      addToContactList("ProfileUserId1")
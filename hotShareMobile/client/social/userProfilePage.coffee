if Meteor.isClient
  updateMeetsCount = (userId)->
    meetInfo = PostFriends.findOne({me:Meteor.userId(),ta:userId})
    if(meetInfo)
      meetCount=meetInfo.count
      clientMeetCount = ClientPostFriends.find({_id: meetInfo._id}).count()
      console.log('clientMeetCount=='+JSON.stringify(meetInfo)+',count=='+clientMeetCount)
      if(meetCount and meetCount is 1 and clientMeetCount is 0)
        ClientPostFriends.insert(meetInfo)
  getLocationThirdParty = (ip, userId)->
    $.getJSON "http://ip2l.tiegushi.com/ip/" + ip, (json , textStatus, jqXHR )->
      if (textStatus is 'success') and json
        address = ''
        if json.location and json.location isnt ''
          address += json.location
        if address isnt ''
          Session.set('userLocation_'+userId,address)
          console.log 'Set user location to ' + address
        else
          Session.set('userLocation_'+userId,'未知')
  getLocation = (userId)->
    user = Meteor.users.findOne({'_id':userId})
    if user and user.profile
      if user.profile.location and user.profile.location isnt ''
        return user.profile.location
    userInfo = PostFriends.findOne({ta:userId})
    console.log('Get location for user '+ userId + JSON.stringify(userInfo))
    if userInfo and userInfo.profile
      if userInfo.profile.location and userInfo.profile.location isnt ''
        return userInfo.profile.location
      else if userInfo.profile.lastLogonIP and userInfo.profile.lastLogonIP isnt ''
        unless Session.get('userLocation_'+userId)
          console.log 'Get Address from ' + userInfo.profile.lastLogonIP
          Session.set('userLocation_'+userId,'加载中...')
          url = "http://restapi.amap.com/v3/ip?output=json&key=b5204bfc0ffbe36db8f0c9254ef65e25&ip="+userInfo.profile.lastLogonIP
          $.getJSON url, (json, textStatus, jqxhr)->
            console.log 'status is ' + textStatus
            address = ''
            if textStatus is 'success'
              console.log 'Remote IP Info is ' + JSON.stringify(json)
              if (not $.isArray(json.province)) and json.province and json.province isnt ''
                address += '中国,' + json.province
              if (not $.isArray(json.city)) and json.city and json.city isnt '' and json.city isnt json.province
                address += ',' + json.city
              console.log 'Address is ' + address
              if address isnt ''
                Session.set('userLocation_'+userId,address)
              else
                getLocationThirdParty(userInfo.profile.lastLogonIP, userId)
            else
              getLocationThirdParty(userInfo.profile.lastLogonIP, userId)
      else
        Session.set('userLocation_'+userId,'未知')
      return Session.get('userLocation_'+userId)
  addToContactList = (userId)->
    username = Meteor.user().username
    if Meteor.user().profile.fullname
      username = Meteor.user().profile.fullname
    UserProfile = PostFriends.findOne({ta:Session.get(userId)})
    requestee = UserProfile.displayName
    UserProfile._id = UserProfile.ta
    if Follower.findOne({"userId":UserProfile._id,"followerId":Meteor.userId()})
      insertObj = {
        userId: Meteor.userId()
        userName: username
        userIcon: Meteor.user().profile.icon
        userDesc: ''
        followerId: UserProfile._id
        followerName: requestee
        followerIcon: UserProfile.profile.icon
        followerDesc: ''
        createAt: new Date()
      }
      addFollower(insertObj)
      return
    if Feeds.findOne({"requesteeId":Meteor.userId(),"requesterId":UserProfile._id})
      addFollower {
        userId: Meteor.userId()
        userName: username
        userIcon: Meteor.user().profile.icon
        userDesc: ''
        followerId: UserProfile._id
        followerName: requestee
        followerIcon: UserProfile.profile.icon
        followerDesc: ''
        createAt: new Date()
      }
      addFollower {
        userId: UserProfile._id
        userName: requestee
        userIcon: UserProfile.profile.icon
        userDesc: ''
        followerId: Meteor.userId()
        followerName: username
        followerIcon: Meteor.user().profile.icon
        followerDesc: ''
        createAt: new Date()
      }
      return
    Feeds.insert {
      eventType:'sendrequest'
      createdAt:new Date()
      followby:Meteor.userId()
      requestee:requestee
      requesteeIcon:UserProfile.profile.icon
      requesteeId:UserProfile._id
      requester:username
      requesterIcon:Meteor.user().profile.icon
      requesterId:Meteor.userId()
    }
    Feeds.insert {
      eventType:'getrequest'
      createdAt:new Date()
      followby:UserProfile._id
      requestee:requestee
      requesteeIcon:UserProfile.profile.icon
      requesteeId:UserProfile._id
      requester:username
      requesterIcon:Meteor.user().profile.icon
      requesterId:Meteor.userId()
    }
  Template.userProfilePageOnly.onRendered ->
    # starting page
    Session.set("postPageScrollTop", 0)
    console.log 'Showing userProfile'
    Session.set('favoritePostsOnlyLimit', 10)
    if window.userProfileTrackerHandler
      window.userProfileTrackerHandler.stop()
      window.userProfileTrackerHandler = null

  Template.userProfilePageOnly.rendered=->
    $('.userProfile').css('min-height', $(window).height() - 40)
    $('.viewPostImages ul li').css('height',$(window).width()*0.168)
    $('.page').addClass('scrollable')
    if PostFriends.find({ta: Session.get("profilePageUser")}).count() is 0
      Meteor.subscribe "postOwnerInfo",Session.get("profilePageUser")
  Template.userProfilePageOnly.helpers
    isFollowedTheAuthor: ()->
      Follower.find({followerId: Session.get("profilePageUser"), userId: Meteor.userId()}).count()>0
    showPostSuggestionToUser: ()->
      withPostSuggestionToUser
    isMale:(sex)->
      sex is 'male'
    isFemale:(sex)->
      sex is 'female'
    isMyself:()->
      Session.get("profilePageUser") is Meteor.userId()
    AddFriend:->
      Meteor.subscribe("friendFeeds", Session.get("profilePageUser"),Meteor.userId())
      addstr = '添加'
      if Cookies.check("display-lang")
        if Cookies.get("display-lang") is 'en'
          addstr = 'Add'
        else
          addstr = '添加'
      else
        addstr = '添加'
      if Feeds.find({requesteeId:Session.get("profilePageUser"),requesterId:Meteor.userId()}).count()>0
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
      if Session.get("profilePageUser") is Meteor.userId()
        Meteor.user()
      else
        if PostFriends.findOne {ta: Session.get("profilePageUser")}
          PostFriends.findOne {ta: Session.get("profilePageUser")}
        else
          Meteor.users.findOne {_id: Session.get("profilePageUser")}
    location:->
      getLocation(Session.get("profilePageUser"))
    isFollowed:()->
      fcount = Follower.find({"followerId":Session.get("profilePageUser")}).count()
      if fcount > 0
        true
      else
        false
    viewLists:()->
      ViewLists.find({userId:Session.get("profilePageUser")},{sort: {createdAt: -1}, limit:3})
    favouriteList: ()->
      postIds = []
      FavouritePosts.find({userId: Session.get("profilePageUser")}).forEach((item) ->
          if !~postIds.indexOf(item.postId)
            postIds.push(item.postId)
      )
      Posts.find({_id: {$in: postIds}})
    compareViewsCount:(value)->
      if (ViewLists.find({userId:Session.get("profilePageUser")}, {sort: {createdAt: -1}, limit:3}).count() > value)
        true
      else
        false
    hasFavoritePosts:()->
      if FavouritePosts.find({userId: Session.get("profilePageUser")}).count() > 0
        return true
      else
        return false
  Template.userProfilePageOnly.events
    'click .userProfileTop .icon':(e)->
      iconUrl = $(e.currentTarget).attr('src')
      Session.set('thisIconUrl',iconUrl)
      $('#showUserIconBigPic').show()
    'click .chatToUser':(e)->
      ta = Session.get("profilePageUser")
      $(window).children().off()
      $(window).unbind('scroll')
      if Session.get("profilePageUser")
        history = Session.get("history_view") || []
        history.push {
            view: 'userProfilePageOnly/'+Session.get("profilePageUser")
            scrollTop: document.body.scrollTop
        }
        Session.set "history_view", history
      if $(e.currentTarget).attr('userprofile') and $(e.currentTarget).attr('userprofile') isnt ''
        userName = $(e.currentTarget).attr('userprofile')
      else if $(e.currentTarget).attr('username') and $(e.currentTarget).attr('username') isnt ''
        userName = $(e.currentTarget).attr('username')
      else
        userName = ''
      Session.set('msgToUserName', userName)
      Meteor.setTimeout ()->
        Session.set("Social.LevelOne.Menu",'contactsList')
        writeLetterTo(ta)
      ,300
    'click #followAuthor': (e)->
      if Meteor.user().profile.fullname
        username = Meteor.user().profile.fullname
      else
        username = Meteor.user().username
      profile = Template.userProfilePageOnly.__helpers.get('profile')()
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
        followerId: Session.get("profilePageUser")
        #这里存放fullname
        followerName: followerName
        followerIcon: profile.profile.icon
        followerDesc: profile.profile.desc
        createAt: new Date()
      }
      addFollower(insertObj)
    'click #unFollowAuthor': (e)->
      followId = Follower.findOne({followerId: Session.get("profilePageUser"), userId: Meteor.userId()})._id
      removeFollower(followId)
    'click #userProfileBack':()->
      if window.userProfileTrackerHandler
        window.userProfileTrackerHandler.stop()
        window.userProfileTrackerHandler = null
      PUB.back()
    'click .postImages ul li':(e)->
      postId = e.currentTarget.id
      $(window).children().off()
      $(window).unbind('scroll')
      history = Session.get("history_view") || []
      history.push {
          view: Router.current().url.substr(1)
          scrollTop: document.body.scrollTop
      }
      Session.set "history_view", history
      Meteor.setTimeout ()->
        Router.go '/posts/'+postId
        document.body.scrollTop = 0
      ,300
    'click #addToContactList': ()->
      addToContactList("profilePageUser")

  Template.favoritePostsOnly.rendered=->
    $(window).scroll (event)->
      FAVOURITE_ONLY_POSTS_INCREMENT = 10;
      console.log("moments window scroll event: "+event);
      if window.innerHeight
        winHeight = window.innerHeight
      else
        winHeight = $(window).height() # iphone fix
      closeToBottom = ($(window).scrollTop() + winHeight > $(document).height() - 100);
      #console.log('Close to bottom: '+closeToBottom)
      if (closeToBottom and hasMoreResult1())
        #if window.momentsCollection_getmore is 'done' and (window.newLayoutImageInDownloading < 5)
        if window.favouritepostsCollection1_getmore is 'done' and (window.newLayoutImageInDownloading < 5)
          console.log('Triggered data source refresh');
          window.favouritepostsCollection1_getmore = 'inprogress'
          Session.set("favoritePostsOnlyLimit",Session.get("favoritePostsOnlyLimit") + FAVOURITE_ONLY_POSTS_INCREMENT);
  Template.favoritePostsOnly.helpers
    isLoading:()->
      (Session.equals('newLayoutImageDownloading',true) or
        #!Session.equals('momentsCollection_getmore','done')) and
        !Session.equals('favouritepostsCollection1_getmore','done')) and
        Session.equals("SocialOnButton",'contactsList')
    onPostId:()->
      if Session.get("postContent")
        return Session.get("postContent")._id
      else
        return null
    favoritePostsOnly:()->
      postIds = []
      FavouritePosts.find({userId: Session.get("profilePageUser")}).forEach((item) ->
        if !~postIds.indexOf(item.postId)
          postIds.push(item.postId)
      )
      console.log(postIds)
      #Posts.find({_id: {$in: postIds}})
      posts = Posts.find({_id: {$in: postIds}}).fetch()
      posts.sort((p1, p2)->
        return -(FavouritePosts.findOne({postId: p1._id, userId: Session.get("profilePageUser")}).createdAt - FavouritePosts.findOne({postId: p2._id, userId: Session.get("profilePageUser")}).createdAt)
      )
      posts
    suggestPosts:()->
      SuggestPosts.find({},{sort: {createdAt: -1},limit:10})
    loading:()->
      Session.equals('momentsCollection','loading')
    loadError:()->
      Session.equals('momentsCollection','error')

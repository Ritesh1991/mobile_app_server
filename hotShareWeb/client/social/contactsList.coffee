if Meteor.isClient
  Meteor.startup ()->
    Session.setDefault 'newfriends_data',[]
  onUserProfile = ->
    #Meteor.subscribe("userfavouriteposts", Session.get("ProfileUserId"), 10)
    @PopUpBox = $('.popUpBox').bPopup
      positionStyle: 'fixed'
      position: [0, 0]
      onClose: ->
        Session.set('displayUserProfileBox',false)
      onOpen: ->
        Session.set('displayUserProfileBox',true)
  Template.contactsList.helpers
    follower:()->
      Follower.find({"userId":Meteor.userId()},{sort: {createdAt: -1}})
    isViewer:()->
      Meteor.subscribe("userViewers", Session.get("postContent")._id,this.followerId)
      if Viewers.find({postId:Session.get("postContent")._id, "userId":this.followerId}).count()>0
        true
      else
        false
  Template.contactsList.events
    "click #addNewFriends":()->
      Session.set("Social.LevelOne.Menu",'addNewFriends')
    "click .oldFriends":(e)->
      userProfileList = Follower.find({"userId":Meteor.userId()},{sort: {createdAt: -1}}).fetch()
      Session.set("userProfileList", userProfileList)
      Session.set("userProfileType", "oldfriends");
      Session.set("currentPageIndex", 1);
      for i in [0..userProfileList.length-1]
        if userProfileList[i].followerId is this.followerId
          Session.set("currentProfileIndex", i)
      prevProfileIndex = Session.get("currentProfileIndex")-1
      nextProfileIndex = Session.get("currentProfileIndex")+1
      if prevProfileIndex < 0
         prevProfileIndex = userProfileList.length-1
      if nextProfileIndex > userProfileList.length-1
         nextProfileIndex = 0
      Session.set("ProfileUserId", this.followerId)
      Session.set("ProfileUserId1", this.followerId)
      Session.set("ProfileUserId3", userProfileList[prevProfileIndex].followerId)
      Session.set("ProfileUserId2", userProfileList[nextProfileIndex].followerId)
      #click on current friends list
      onUserProfile()
      #PUB.page('userProfilePage1')
    'click .messageGroup': ()->
      Session.set("Social.LevelOne.Menu", 'messageGroup')
  Template.addNewFriends.onRendered ()->
    $(window).scroll (event)->
      if Session.get("Social.LevelOne.Menu") is 'contactsList'
        console.log "postfriends window scroll event: "+event
        target = $("#showMorePostFriendsResults");
        POSTFRIENDS_ITEMS_INCREMENT = 10;
        console.log "target.length: " + target.length
        if $('#newFriendRedSpotReal').is(":hidden") and parseInt($('#newFriendRedSpotReal').html()) > 0
          $('#newFriendRedSpotReal').show()
          $('#newFriendRedSpot').hide()
        if (!target.length)
          return;
        threshold = $(window).scrollTop() + $(window).height() - target.height();
        console.log "threshold: " + threshold
        console.log "target.top: " + target.offset().top
        if target.offset().top < threshold
          if (!target.data("visible"))
            target.data("visible", true);
            Session.set("postfriendsitemsLimit",Session.get("postfriendsitemsLimit")+POSTFRIENDS_ITEMS_INCREMENT)
        else
          if (target.data("visible"))
            target.data("visible", false);
  Template.addNewFriends.helpers
    hasFriendMeet:()->
    meeter:()->
      PostFriends.find({meetOnPostId:Session.get("postContent")._id,ta:{$ne:null}},{sort:{createdAt:-1}})
    isMyself:()->
      this.ta is Meteor.userId()
    isSelf:(follow)->
      if follow.userId is Meteor.userId()
        true
      else
        false
    isFollowed:()->
      fcount = Follower.find({"followerId":this.ta}).count()
      if fcount > 0
        true
      else
        false
    isViewer:()->
      vcount = Viewers.find({postId:Session.get("postContent")._id, userId:this.ta}).count()
      if vcount > 0
        true
      else
        false
    showRedSpot:()->
      if this.count>1 or ClientPostFriends.findOne({_id:this._id})
        false
      else
        true
    moreResults:()->
      return false
      # !(PostFriends.find({meetOnPostId:Session.get("postContent")._id}).count()+1 < Session.get("postfriendsitemsLimit"))
    loading:()->
      Session.equals('postfriendsCollection','loading')
    loadError:()->
      Session.equals('postfriendsCollection','error')
  Template.addNewFriends.events
    "click .touserdetail":(e)->
      currentId =  e.currentTarget.id
      if $('#' + currentId + ' .red_spot').length > 0
        $('#' + currentId + ' .red_spot').remove()
        totalCount = parseInt($('#newFriendRedSpotReal').html()) - 1
        if totalCount > 0
          $('#newFriendRedSpot').html(totalCount.toString())
          $('#newFriendRedSpot').show()
          $('#newFriendRedSpotReal').hide()
        else
          $('#newFriendRedSpot').hide()
          $('#newFriendRedSpotReal').hide()
      clientMeetCount = ClientPostFriends.find({_id: this._id}).count()
      if (this.count is 1 and clientMeetCount is 0)
        ClientPostFriends.insert(this)
        # Meets.update({_id: this._id}, {$set: {count: 2}})
      userProfileList = PostFriends.find({meetOnPostId:Session.get("postContent")._id,ta:{$ne:null}},{sort:{createdAt:-1}}).fetch()
      Session.set("userProfileList", userProfileList)
      Session.set("userProfileType", "newfriends")
      Session.set("currentPageIndex", 1)
      for i in [0..userProfileList.length-1]
        if userProfileList[i].ta is this.ta
          Session.set("currentProfileIndex", i)
      prevProfileIndex = Session.get("currentProfileIndex")-1
      nextProfileIndex = Session.get("currentProfileIndex")+1
      if prevProfileIndex < 0
         prevProfileIndex = userProfileList.length-1
      if nextProfileIndex > userProfileList.length-1
         nextProfileIndex = 0
      Session.set("ProfileUserId", this.ta)
      Session.set("ProfileUserId1", this.ta)
      Session.set("ProfileUserId3", userProfileList[prevProfileIndex].ta)
      Session.set("ProfileUserId2", userProfileList[nextProfileIndex].ta)
      #click on suggest friends list
      onUserProfile()
      #PUB.page('userProfilePage1')
    "click #addNewFriends":()->
      Session.set("Social.LevelOne.Menu",'addNewFriends')
    'click .delFollow':(e)->
      FollowerId = Follower.findOne({
                     userId: Meteor.userId()
                     followerId: this.userId
                 })._id
      Follower.remove(FollowerId)
    'click .addFollow':(e)->
      if Meteor.user().profile.fullname
         username = Meteor.user().profile.fullname
      else
         username = Meteor.user().username
      Follower.insert {
        userId: Meteor.userId()
        #这里存放fullname
        userName: username
        userIcon: Meteor.user().profile.icon
        userDesc: Meteor.user().profile.desc
        followerId: this.userId
        #这里存放fullname
        followerName: this.username
        followerIcon: this.userIcon
        createAt: new Date()
      }
      type = 'follow'
      to = {
        id: this.userId,
        name: this.username,
        icon: this.userIcon
      }
      sendMqttMessageToFollower(type, to, '刚刚关注了你')
    'click .meet_letter_btn':(e)->
      console.log(this);
      ta = e.currentTarget.id
      user = Meteor.user()
      if withQRTips
        Template._sendMsg.open({
          id: this.ta,
          name: this.displayName,
          icon: this.profile.icon
        })
        # if user and user.profile and user.profile.associated and user.profile.associated.length > 0
        #   $('#bellPostDialog').fadeIn();
        # Session.set('qrtype', '联系人');
        # showQrTips('','post',Session.get('postContent')._id)

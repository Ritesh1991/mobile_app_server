if Meteor.isClient
  Session.setDefault("Social.LevelOne.Menu",'discover')
  Session.setDefault("SocialOnButton",'postBtn')
  Template.socialContent.events
    'click .postBtn':->
      #PUB.postPageBack()
      trackEvent("socialBar","Post")
      Session.set("SocialOnButton",'postBtn')
      Session.set("Social.LevelOne.Menu",'discover')
      if $('.contactsList .head').is(':visible')
        $('.contactsList .head').fadeOut 300
      document.body.scrollTop = 0
    'click .chatBtn': (e, t)->
      e.stopPropagation()
      $(".chatBtn .red_spot").hide().html(0)
      trackEvent("socialBar","GroupChat")
      url = 'http://'+chat_server_url+'/channel/'+ Session.get('postContent')._id+'/userid/'+Meteor.userId();
      #window.location.href = url
      ref = cordova.ThemeableBrowser.open(url,'_blank',{
          closeButton: {
            image: 'ic_action_previous_item.png',
            imagePressed: 'ic_action_previous_item.png',
            align: 'left',
            event: 'closePressed'
          },
          statusbar: {
            color: '#000000'
          },
          toolbar: {
            height: 40,
            color: '#F0F0F0'
          }
        })
      ref.addEventListener('closePressed', (event) ->
        ref.close()
      )
      ref.addEventListener('toPost', (event) ->
        ref.close()
        console.log("postId:"+event.postId)
        Meteor.setTimeout ()->
          Router.go '/posts/'+event.postId
        ,300
      )
      #Session.set("Social.LevelOne.Menu",'chatContent')
      #Session.set("SocialOnButton",'chatContent')
      #t.chatroom.show()
    'click .contactsBtn':->
      trackEvent("socialBar","Newfrineds")
      Session.set("Social.LevelOne.Menu",'contactsList')
      Session.set("SocialOnButton",'contactsList')
      $('.div_contactsList').css('display',"block")
      $('.div_discover').css('display',"none")
      $('.div_me').css('display',"none")
      document.body.scrollTop = $(".showPostsBox").height()
    'click .discoverBtn':->
      trackEvent("socialBar","Discover")
      Session.set("SocialOnButton",'discover')
      Session.set('momentsitemsLimit', 10);
      Session.set("Social.LevelOne.Menu",'discover')
      $('.div_contactsList').css('display',"none")
      $('.div_discover').css('display',"block")
      $('.div_me').css('display',"none")
      document.body.scrollTop = $(".showPostsBox").height()
    'click .meBtn':->
      trackEvent("socialBar","Me")
      Session.set("SocialOnButton",'me')
      Session.set("Social.LevelOne.Menu",'me')
      #Session.set('favouritepostsLimit', 0);
      $('.div_contactsList').css('display',"none")
      $('.div_discover').css('display',"none")
      $('.div_me').css('display',"block")
      document.body.scrollTop = $(".showPostsBox").height()
      triggerScroll=()->
        $(window).trigger('scroll')
      setTimeout(triggerScroll, 500)
  Template.socialContent.rendered=->
    $('.chatBoxContent').css('min-height',$(window).height()-90)

    #url = 'http://'+chat_server_url+'/channel/'+ Session.get('postContent')._id+'/userid/'+Meteor.userId();
    #this.chatroom = window.open(url,'_blank', 'location=no,hidden=yes')

  Template.socialContent.helpers
    newcount:()->
      PostFriends.find({meetOnPostId:Session.get("postContent")._id,count:1,ta:{$ne:null}},{sort: {createdAt: -1}}).count()
    feedscount:()->
      Feeds.find({followby:Meteor.userId(),checked:false}).count()
    haveFeeds:->
      if Feeds.find({followby:Meteor.userId(),checked:false}).count()>0
        true
      else
        false
    haveNewFriends: ->
      if PostFriends.find({meetOnPostId:Session.get("postContent")._id,count:1,ta:{$ne:null}},{sort:{createdAt:-1}}).count()>0
        true
      else
        false
    whichOne : ->
      Session.get('Social.LevelOne.Menu')
    isFocus : (view) ->
      #if Session.equals("Social.LevelOne.Menu",view)
      if Session.equals("SocialOnButton",view)
        "focusColor"
      else
        ""
    isWaitRead: ()->
      MsgSession.find({userId: Meteor.userId(), waitRead: {$gt: 0}}).count() > 0
    dynamicMe: ()->
      if Session.equals("SocialOnButton",'me')
        return 'me'
      else
        return 'emptyMe'

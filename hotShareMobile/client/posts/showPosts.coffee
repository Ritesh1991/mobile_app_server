if Meteor.isClient
  updatePinImages = (post,images)->
    if post.pinImages
      # todo
      console.log('update pin images')
      pinImages = post.pinImages
    else
      # todo
      console.log('insert pin images')
      pinImages = {
        images:[],
        likeUserId:{},
        dislikeUserId:{},
        likeSum:0,
        dislikeSum:0
      }
    pinImages.images = images
    Posts.update {_id: post._id}, {$set:{pinImages: pinImages}}, (err, num)->
      if err or num <= 0
        return console.log('insert pin images error:',err)
      console.log('pin images insert ')
  uploadPinImagesToAliyun = (images,progress,originImages,index,cb)->
    uploadToAliyun_new(originImages[index-1].filename, originImages[index-1].URI,(status, data)->
      if status is 'error'
        cb('uploadFailed',null)
      if status is 'done'
        images.push({
          isImage: true,
          imgUrl: data
        })
        cb(null,data)
      if status is 'uploading'
        progress += (data.loaded * index)/ (data.total * originImages.length) 
        $('.pinImageProgressTip').text('正在上传 '+parseInt(progress*10)+'%')
        $('.pinProgress').css('width',parseInt(progress*10)+'%')
    )
  uploadPinImages = (post,originImages, isTry)->
    images = []
    progress = 0
    $('.pinProgress').css('width','0%')
    $('.pinImageProgressTip').text('正在上传')
    $('.pinImageProgress').fadeIn()
    async.series({
      one: (cb)->
        uploadPinImagesToAliyun(images,progress,originImages,1,cb)
      two: (cb)->
        if originImages[1]
          uploadPinImagesToAliyun(images,progress,originImages,2,cb)
        else
          cb(null,null)
      three: (cb)->
        if originImages[2]
          uploadPinImagesToAliyun(images,progress,originImages,3,cb)
        else
          cb(null,null)
    },(err, results)->
      console.log('uploading pinImage ==\n',JSON.stringify(results))
      console.log('images==\n',JSON.stringify(images))
      if err
        console.log('upPinImages ERR='+err)
        $('.pinImageProgress').fadeOut(500)
        if isTry
          return PUB.toast('图片上传失败！请检查网络或稍后再试~')
        return navigator.notification.confirm('上传图片失败，是否需要重新上传？',(button)->
          if button is 1
            uploadPinImages(post, originImages, true)
        ,'图片上传失败','重新上传,取消')
      else
        $('.pinProgress').css('width','100%')
        $('.pinImageProgressTip').text('上传成功')
        Meteor.setTimeout(()->
          $('.pinImageProgress').fadeOut(500)
          updatePinImages(post,images)
        ,100)
    )
  @isIOS = if navigator.userAgent.match(/(iPad|iPhone|iPod)/g) then true else false
  @isWeiXinFunc = ()->
    ua = window.navigator.userAgent.toLowerCase()
    M = ua.match(/MicroMessenger/i)
    if M and M[0] is 'micromessenger'
      true
    else
      false
  @isAndroidFunc = ()->
    userAgent = navigator.userAgent.toLowerCase()
    return (userAgent.indexOf('android') > -1) or (userAgent.indexOf('linux') > -1)
  compareSwipeImgNew = (obj1,obj2)->
    val1 = obj1.y
    val2 = obj2.y
    if val1 < val2
      return -1
    else if val1 > val2
      return 1
    else
      val3 = obj1.x
      val4 = obj2.x
      if val3 < val4
        return -1
      else if val3 > val4
        return 1
      else
        return 0
  window.getDocHeight = ->
    D = document
    Math.max(
      Math.max(D.body.scrollHeight, D.documentElement.scrollHeight)
      Math.max(D.body.offsetHeight, D.documentElement.offsetHeight)
      Math.max(D.body.clientHeight, D.documentElement.clientHeight)
    )
  subscribeCommentAndViewers = ()->
    if Session.get("postContent")
      setTimeout ()->
        Meteor.subscribe "comment",Session.get("postContent")._id
        #Meteor.subscribe "viewers",Session.get("postContent")._id
      ,500
  onUserProfile = ->
    @PopUpBox = $('.popUpBox').bPopup
      positionStyle: 'fixed'
      position: [0, 0]
      onClose: ->
        Session.set('displayUserProfileBox',false)
      onOpen: ->
        Session.set('displayUserProfileBox',true)
  @toNextPost = ->
    id = $('.newLayout_element').attr('id')
    console.log( 'ID' + id);
    toGo = '/posts/' + id
    Meteor.defer ()->
      BaiduTTS.speak({
          text: '正在为您准备下一篇文章',
          rate: 1.5
        }
      ,()->
        Deps.autorun (handler)->
          if Session.equals('channel','posts/' + id)
            handler.stop()
            $('.tts-stoper').show()
            BaiduTTS.speak({
                text: Session.get('postContent').title,
                rate: 1.5
              }
            ,()->
              startPostTTS(0)
            ,(error)->
              startPostTTS(0)
            )
      ,(reason)->
        Deps.autorun (handler)->
          if Session.equals('channel','posts/' + id)
            handler.stop()
            $('.tts-stoper').show()
            startPostTTS(0)
      )
    Router.go(toGo)
  @remoteEventHandler = (e)->
    console.log('Event from remote event is '+e)
    if e is 'nextTrack'
      toNextPost()
  keyboardShowHandler = (e) ->
    console.log 'Keyboard height is: ' + e.keyboardHeight
    lastKeyboardHeight = Session.get('keyboardHeight')
    Session.set 'keyboardHeight', e.keyboardHeight
    if device.platform is 'Android' and Session.get("pcommetsClicked") is true
      scrollTop = $(window).scrollTop()+e.keyboardHeight
      $(window).scrollTop(scrollTop)
      return
    if lastKeyboardHeight is undefined
        return
    # if Math.abs(e.keyboardHeight - lastKeyboardHeight) < 5
    #     returns
    unless Session.get("pcommetsClicked") is true
        return
    offset = e.keyboardHeight - lastKeyboardHeight
    console.log 'Keyboard offset is: ' + offset
    if offset <= 5
        return
    scrollTop = $(window).scrollTop()+offset
    Session.set('backgroundTop', 0-scrollTop);
    console.log 'scrollTop is: ' + scrollTop
    $(window).scrollTop(scrollTop)

  window.addEventListener 'native.keyboardshow', keyboardShowHandler

  hookRemoteEvent = ()->
    if Meteor.isCorodva and device.platform is 'iOS'
      remoteControls.receiveRemoteEvent = remoteEventHandler
  showSocialBar = ()->
    displaySocialBar = $(".socialContent #socialContentDivider").isAboveViewPortBottom();
    if displaySocialBar
      unless $('.contactsList .head').is(':visible')
        $('.contactsList .head').fadeIn 300
      unless $('.userProfile .head').is(':visible')
        $('.userProfile .head').fadeIn 300
    unless $('.socialContent .chatFooter').is(':visible')
      $('.socialContent .chatFooter').fadeIn 300
  hideSocialBar = ()->
    if $('.contactsList .head').is(':visible')
      $('.contactsList .head').fadeOut 300
    if $('.socialContent .chatFooter').is(':visible')
      $('.socialContent .chatFooter').fadeOut 300
  scrollEventCallback = ()->
#Sets the current scroll position
    st = $(window).scrollTop()
    if st <= 40
      showSocialBar()
      unless $('.showPosts .head').is(':visible')
        $('.showPosts .head').fadeIn 300
      window.lastScroll = st
      return

    if window.lastScroll - st > 5
      $('.showPosts .head').fadeIn 300
      showSocialBar()
    if window.lastScroll - st < -5
      $('.showPosts .head').fadeOut 300
      displaySocialBar = $(".socialContent #socialContentDivider").isAboveViewPortBottom();
      if displaySocialBar
        Session.set("showSuggestPosts",true)
        showSocialBar()
      else
        hideSocialBar()
    if(st + $(window).height()) is window.getDocHeight()
      showSocialBar()
      window.lastScroll = st
      return
    # Changed is too small
    if Math.abs(window.lastScroll - st) < 5
      return
    #Determines up-or-down scrolling
    displaySocialBar = $(".socialContent #socialContentDivider").isAboveViewPortBottom();
    if displaySocialBar
#showSocialBar()
      if $(".div_discover").css("display") is "block"
        Session.set("SocialOnButton",'discover')
      if $(".div_contactsList").css("display") is "block"
        Session.set("SocialOnButton",'contactsList')
      if $(".div_me").css("display") is "block"
        Session.set("SocialOnButton",'me')
    else
      if $('.contactsList .head').is(':visible')
        $('.contactsList .head').fadeOut 300
      Session.set("SocialOnButton",'postBtn')
    #Updates scroll position
    window.lastScroll = st

  Tracker.autorun ()->
    if Session.get("needBindScroll") is true
      Session.set("needBindScroll", false)
      setTimeout ()->
        Session.set('displayDiscoverContent',true)
        if withSocialBar
          $(window).scroll(scrollEventCallback)
      ,1000
  Tracker.autorun ()->
    if Session.get("needReviewPostStyle") is true
      Session.set("needReviewPostStyle",false)
      console.log  'open a New Post!'
      setTimeout ()->
        $('.showPosts').removeClass('animated ' + animateOutUpperEffect)
        document.body.scrollTop = 0;
        Session.set("SocialOnButton",'postBtn');
        $('.showPosts .head').fadeIn(300);
      ,1000
  Tracker.autorun ()->
    if Meteor.userId()
      if Session.get("postContent")
        setTimeout ()->
          $('.showPosts').removeClass('animated ' + animateOutUpperEffect)
        ,1000
  Tracker.autorun ()->
    if Session.get("needToast") is true
      Session.set("needToast",false)
      setTimeout ()->
        scrolltop = 0
        $('.showPosts').get(0).style.overflow = ''
        $('.showPosts').get(0).style.maxHeight = ''
        $('.showPosts').get(0).style.position = ''
        $('.readmore').remove()
        if $('.dCurrent').length
          scrolltop=$('.dCurrent').offset().top
          Session.set("postPageScrollTop", scrolltop)
          document.body.scrollTop = Session.get("postPageScrollTop")
        if Session.get("isPcommetReply") is true
         return
        userName=Session.get("pcommentsName")
        toastr.info(userName+"点评过的段落已为您用蓝色标注！")
      ,1000
  # Session.setDefault('hottestPosts', [])
  Template.showPosts.created=->
    layoutHelperInit()
    Session.set("content_loadedCount", 0)
    # getHotPostsData()
  getAuthorReadPopularPosts = ()->
    owner = Session.get('postContent').owner
    _id = Session.get('postContent')._id
    if owner and _id
      userInfo = Meteor.users.findOne({_id: owner})
      myHotPosts = null
      if userInfo
        myHotPosts = userInfo.myHotPosts
      if (myHotPosts && myHotPosts.length >= 3)
        Session.set("authorHotPosts", myHotPosts)
        return
      else
        Meteor.subscribe "authorReadPopularPosts",owner,_id,3,()->
          mostReadPosts = Posts.find({owner: owner, publish: {$ne: false}},{sort: {browse: -1},limit: 3}).fetch()
          if (myHotPosts == undefined || myHotPosts == null)
            myHotPosts = []
          if (mostReadPosts == undefined || mostReadPosts == null)
            mostReadPosts = []
          size = myHotPosts.length
          idx = 0
          while (size < 3 && idx < mostReadPosts.length)
            inHotPosts = false
            for itemPost in myHotPosts
              itemId = itemPost.postId or itemPost._id
              if itemId and itemId is mostReadPosts[idx]._id
                inHotPosts = true
            unless inHotPosts
              myHotPosts.push(mostReadPosts[idx])
            idx++
            size = myHotPosts.length
          Session.set("authorHotPosts", myHotPosts)

  Template.showPosts.onRendered ->
    getAuthorReadPopularPosts()
    if Session.get('formSimpleChatPage') is 'user'
      $('.showPostsBox,.showPostsLine,.superChatIntroduce').show()
      Session.set("Social.LevelOne.Menu",'contactsList')
      Session.set("SocialOnButton",'contactsList')
      $('.div_contactsList').css('display',"block")
      $('.div_discover').css('display',"none")
      $('.div_me').css('display',"none")
      document.body.scrollTop = $(".showPostsBox").height()
      Session.set('formSimpleChatPage',false)
  Template.showPosts.onDestroyed ->
    # if window._music
    #   document.getElementById('audio_' + window._music_id).pause()
    #   if window._media
    #     window._media.stop()
    #   window._music = null
    #   window._music_id = null
    #   window._media = null

    document.body.scrollTop = 0
    Session.set("postPageScrollTop", 0)
    Session.set("showSuggestPosts",false)
    $('.tool-container').remove()
    if $('.tts-stoper').is(':visible')
      $('.tts-stoper').hide()
      window.currentTTS.stop()

  Template.SubscribeAuthor.onRendered ->
    Meteor.subscribe 'follower'
  Template.SubscribeAuthor.helpers
    hasType: (val)->
      return Session.equals('subscribeAutorPageType', val)
    oldMail: ->
      postId = Session.get("postContent")._id
      post = Posts.findOne()
      followMailAddr = Meteor.user().profile.followMailAddr
      follower = Follower.findOne({userId: Meteor.userId(), followerId: post.owner})
      userEmail = if follower then follower.userEmail else ''
      if userEmail
        return userEmail
      else if followMailAddr
        return followMailAddr
      else
        return ''
  Template.SubscribeAuthor.events
    'click .subscribeAutorPage_okBtn':(e,t)->
      owner = Meteor.users.findOne({_id: Session.get('postContent').owner})
      ownerName = if owner.profile.fullname then owner.profile.fullname else owner.username
      addFollower {
        userId: Meteor.userId()
        userName: Meteor.user().profile.fullname || Meteor.user().username
        userIcon: Meteor.user().profile.icon || '/userPicture.png'
        userDesc: Meteor.user().profile.desc

        followerId: owner._id
        followerName: ownerName
        followerIcon: owner.profile.icon || '/userPicture.png'
        followerDesc: owner.profile.desc

        createAt: new Date()
      }
      $('.subscribeAutorPage').hide()
      PUB.toast('关注成功~')
    'click .subscribeAutorPage_cannelBtn, click .subscribeAutorPage_bg':->
      $('.subscribeAutorPage').hide()

  Template.showPosts.onRendered ->
    postId = this.data._id
    ownerId = this.data.ownerId
    # showFollowTips = ()->
    #   owner = Meteor.users.findOne({_id: ownerId})

    #   if !owner
    #     return
    #   # is 0
    #   if !(Counts.has('post_viewer_count_'+Meteor.userId()+'_'+postId))
    #     return
    #   console.log('viewer_counts = '+Counts.get('post_viewer_count_'+Meteor.userId()+'_'+postId))
    #   # off
    #   if !(owner.profile.followTips isnt false)
    #     return
    #   # slef
    #   if Meteor.userId() is owner._id
    #     return
    #   # follower
    #   if Follower.find({userId: Meteor.userId(), followerId: owner._id}).count() > 0
    #     return
    #   # < 3
    #   if Counts.get('post_viewer_count_'+Meteor.userId()+'_'+postId) < 3
    #     return
    #   if Counts.get('post_viewer_count_'+Meteor.userId()+'_'+postId) >= 3
    #     $('.subscribeAutorPage').show()
    # showFollowTips()

    # getHotPostsData()
    #if !amplify.store('chatNotify')
    #  amplify.store('chatNotify',1)
    #if amplify.store('chatNotify') < 6
    #  amplify.store('chatNotify',amplify.store('chatNotify')+1)
    #  $(".chatBtn .red_spot").show().html(1)
    ###
    mqtt_connection=mqtt.connect('ws://rpcserver.raidcdn.com:80')
    mqtt_connection.on('connect',()->
      console.log('Connected to server')
      mqtt_connection.subscribe(Session.get('postContent')._id)
      #mqtt_connection.publish(Session.get('postContent')._id, 'Hello u'+Session.get('postContent')._id)
    )
    mqtt_connection.on 'message',(topic, message)->
      mqtt_msg = JSON.parse(message.toString())
      console.log(message.toString())
      if mqtt_msg.type and mqtt_msg.type is 'newmessage'
        $('.socialContent .chatFooter').fadeIn 300
        #$(".chatBtn").addClass('twinking')
        #$(".chatBtn i").removeClass('fa-comment-o').addClass('fa-commenting-o')
        mqtt_msg_num = $.trim($(".chatBtn .red_spot").html())
        mqtt_msg_num = if mqtt_msg_num is '' then 0 else parseInt(mqtt_msg_num)
        mqtt_msg_num += 1
        mqtt_msg_num = if mqtt_msg_num > 99 then '99+' else mqtt_msg_num
        $(".chatBtn .red_spot").show().html(mqtt_msg_num)

      #if mqtt_msg.type and mqtt_msg.type is 'newmember'
      $(".chatBtn .chat-icon-img").addClass('twinkling')
      setTimeout(() ->
        $(".chatBtn .chat-icon-img").removeClass('twinkling')
      , 10000);
    ###
    #Calc Wechat token after post rendered. not on mobile
    #calcPostSignature(window.location.href.split('#')[0]);
    if Session.get("postPageScrollTop") isnt undefined and Session.get("postPageScrollTop") isnt 0
      setTimeout ()->
          document.body.scrollTop = Session.get("postPageScrollTop")
        , 280
  Template.showPosts.onRendered ->
    # getHotPostsData()
    $('.popUpBox, .b-modal').hide()
    Session.set 'showDraft', false
    Session.setDefault "displayPostContent",true
    Session.setDefault "toasted",false
    Session.set('postfriendsitemsLimit', 10)
    Session.set("showSuggestPosts",false)
    $('.mainImage').css('height',$(window).height()*0.55)
    postContent = Session.get("postContent")
    title=postContent.title.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '')
    if postContent.publish is false
      Router.go('/unpublish')
    if postContent.addontitle
      title=title+":"+postContent.addontitle
    trackPage('http://cdn.tiegushi.com/posts/'+postContent._id,title)
    subscribeCommentAndViewers()
    browseTimes = 0
    Session.set("Social.LevelOne.Menu",'discover')
    Session.set("SocialOnButton",'postBtn')
    Meteor.subscribe("follower")
    Meteor.subscribe("allBlackList")
    if not Meteor.isCordova
      favicon = document.createElement('link');
      favicon.id = 'icon';
      favicon.rel = 'icon';
      favicon.href = postContent.mainImage;
      document.head.appendChild(favicon);
    Deps.autorun (h)->
      if Meteor.userId() and Meteor.userId() isnt ''
        h.stop()
        Meteor.call 'readPostReport',postContent._id,Meteor.userId(), null, (err, res)->
          if !err and res is true
            console.log 'readPostReport:', res
            if Template.showPosts.__helpers.get('isMynewpost')() is true
              return
            newpostsdata = Session.get 'newpostsdata'
            if newpostsdata and postContent._id is newpostsdata._id
              return
            #文章作者被加入黑名单时不提示关注作者
            if BlackList.find({blackBy: Meteor.userId(), blacker:{$in: [postContent._id]}}).count() > 0
              return
            $('.subscribeAutorPage').show()
#    $('.textDiv1Link').linkify();
    setTimeout ()->
      $("a[target='_blank']").click((e)->
        e.preventDefault();
        if Meteor.isCordova
          #and $(this).attr('class').indexOf('_post_item_a') is -1
          Session.set("isReviewMode","undefined")
          prepareToEditorMode()
          #PUB.page '/add'
          Session.set("ishyperlink",true)
          handleAddedLink($(e.currentTarget).attr('href'))
        else
          cordova.InAppBrowser.open($(e.currentTarget).attr('href'), '_system')
          # window.open($(e.currentTarget).attr('href'), '_system')#, 'hidden=no,toolbarposition=top')
          return false
      )
    , 450

    $('.showBgColor').css('min-height',$(window).height())
    window.lastScroll = 0;
    Session.set("needBindScroll", false)
    if withSocialBar
      $(window).scroll(scrollEventCallback)
    if Session.get('changeUserNameBck') is true
      trackEvent("socialBar","Me")
      Session.set("SocialOnButton",'me')
      Session.set("Social.LevelOne.Menu",'me')
      $('.div_contactsList').css('display',"none")
      $('.div_discover').css('display',"none")
      $('.div_me').css('display',"block")
      Session.set('changeUserNameBck', false)
      setTimeout ()->
          document.body.scrollTop = Session.get("changeNameBckScroll")
        , 450


    setTimeout ()->
      $showPosts = $('.showPosts')
      $test = $('.showPosts').find('.content .gridster #test')

      if $test and $test.height() > 1000 and $('.dCurrent').length is 0
        $('.showPosts').get(0).style.overflow = 'hidden'
        $('.showPosts').get(0).style.maxHeight = '1500px'
        $('.showPosts').get(0).style.position = 'relative'
        $showPosts.after('<div class="readmore"><div class="readMoreContent"><i class="fa fa-chevron-down"></i>' + (TAPi18n.__('readMore')) + '</div></div>')
    , 600

  Template.showPosts.helpers
    showPostGroupChatIntro:->
      return !localStorage.getItem('postGroupChatIntro')
    showSaveTipHintTemplate:->
      return !localStorage.getItem('savetipFlag')
    showBindTips:->
      Session.equals('showBindTips',true);
    has_share_follower: ->
      return if Meteor.user().profile and Meteor.user().profile.web_follower_count then Meteor.user().profile.web_follower_count > 0 else false
    msgs_count: ->
      if Posts.findOne({_id: Session.get('postContent')._id}).owner isnt Meteor.userId()
        return 0

      result  = 0
      pub = Posts.findOne({_id: Session.get('postContent')._id}).pub
      console.log 'pub:', pub
      _.map pub, (item)->
        if item.pcomments and item.pcomments.length > 0
          _.map item.pcomments, (pcom)->
            if pcom.read isnt true and pcom.createdAt >= new Date('2016-09-12 00:00:00') and pcom.userId != Meteor.userId()
              result += 1
        if item.links and item.links.length > 0
          _.map item.links, (link)->
            if link.enable is true and link.read is false and link.userId != Meteor.userId()
              result += 1

      console.log 'msgs:', result
      return result
    has_msgs: (val)->
      return val > 0
    withSectionMenu: withSectionMenu
    withSectionShare: withSectionShare
    withPostTTS: withPostTTS
    showImporting: ()->
      this.import_status is 'importing' and this.ownerId is Meteor.userId()
    clickedCommentOverlayThumbsUp:()->
      i = Session.get('focusedIndex')
      userId = Meteor.userId()
      post = Session.get("postContent").pub
      if post[i] isnt undefined and post[i].dislikeUserId isnt undefined and post[i].likeUserId[userId] is true
        return true
      else
        return false
    isMynewpost:()->
      postId = Session.get("postContent")._id
      mynewpostId = Session.get("mynewpostId")
      if postId is mynewpostId
        # Session.set("mynewpostId","")
        return true
      else
        return false
    isInSeries:()->
      latestSeries = Session.get("postContent").latestSeries
      if latestSeries
        return true
      return false
    postSeriesId:()->
      latestSeries = Session.get("postContent").latestSeries
      latestSeries.seriesId
    postSeriesTitle:()->
      latestSeries = Session.get("postContent").latestSeries
      latestSeries.seriesTitle
    postSeriesImage:()->
      post = Session.get("postContent")
      latestSeries = post.latestSeries
      if latestSeries.seriesImage
        return latestSeries.seriesImage
      else 
        return post.mainImage
    authorReadPopularPosts: ()->
      myHotPosts = Session.get("authorHotPosts")
      return myHotPosts
    clickedCommentOverlayThumbsDown:()->
      i = Session.get('focusedIndex')
      userId = Meteor.userId()
      post = Session.get("postContent").pub
      if post[i] isnt undefined and post[i].dislikeUserId isnt undefined and post[i].dislikeUserId[userId] is true
        return true
      else
        return false
    displayPostContent:()->
      Session.get('displayPostContent')
    getMainImageHeight:()->
      $(window).height()*0.55
    getAbstractSentence:->
      if Session.get('focusedIndex') isnt undefined
        if Session.get('postContent').pub[Session.get('focusedIndex')].html
          Session.get('postContent').pub[Session.get('focusedIndex')].html
        else
          Session.get('postContent').pub[Session.get('focusedIndex')].text
      else
        null
    getAbstractSentenceIndex:->
      pub = Session.get('postContent').pub
      index = Session.get('focusedIndex')
      count = 0
      for i in [0..index]
        if pub[i].type is 'text'
          count++
      count
    getPostContent:(obj)->
      self = obj
      self.pub = self.pub || []
      _.map self.pub, (doc, index, cursor)->
        _.extend(doc, {index: index})
    getPub:->
      self = this
      contentList = Template.showPosts.__helpers.get('getPostContent')(self)
      loadedCount = if Session.get("content_loadedCount") then Session.get("content_loadedCount") else 0
      #console.log("loadedCount="+loadedCount+", "+contentList.length)
      newLoadedCount = contentList.length
      if (loadedCount < contentList.length)
        if loadedCount+10 < contentList.length
          newLoadedCount = loadedCount+10
        else
          newLoadedCount = contentList.length
        if Session.get("content_loadedCount") isnt newLoadedCount
          setTimeout(()->
              Session.set("content_loadedCount", newLoadedCount)
            , 0)
      contentList.slice(0, newLoadedCount)
    getPub2:->
      self = this
      self.pub = self.pub || []
      _.map self.pub, (doc, index, cursor)->
        _.extend(doc, {index: index})
    displayCommentInputBox:()->
      Session.get('displayCommentInputBox')
    inWeiXin: ()->
      isWeiXinFunc()
    withAfterPostIntroduce: ()->
      withAfterPostIntroduce
    withSocialBar: ()->
      withSocialBar
    isCordova:()->
      Meteor.isCordova
    refcomment:->
      RC = Session.get 'RC'
      #console.log "RC: " + RC
      RefC = Session.get("refComment")
      if RefC
        return RefC[RC].text
    time_diff_str: (created)->
      GetTime0(new Date() - new Date(created))
    time_diff: (created)->
      GetTime0(new Date() - created)
    isMyPost:->
      if Meteor.user()
        if Posts.find({_id:this._id}).count() > 0
          post = Posts.find({_id:this._id}).fetch()[0]
          if post.owner is Meteor.userId()
            return true
      return false
    shareToStoryGroup:->
      if withShareStoryGroup?
        true
      else
        false
    isMobile:->
      Meteor.isCordova
    haveUrl:->
      if Session.get("postContent").fromUrl is undefined  or Session.get("postContent").fromUrl is ''
        false
      else
        true
    get_share_class: (val1, val2)->
      return if val1 is true and val2 is true then 'two' else ''
  isASCII = (str)->
    /^[\x00-\x7F]*$/.test(str)
  countASCII = (string)->
    count = 0;
    for i in [0..(string.length-1)]
      if (isASCII(string.charAt(i)))
        count+=1
    return count

  startPostTTS = (fromIndex)->
    pub = Session.get("postContent").pub
    toRead = []
    for i in [fromIndex..(pub.length-1)]
      if pub[i].type is 'text' and pub[i].text and pub[i].text isnt ''
        if pub[i].text.length > 999
          strArray =  pub[i].text.match(/.{1,999}/g);
          for subStr in strArray
            toRead.push(subStr)
        else
          toRead.push(pub[i].text)
    if toRead.length > 0
      totalExaminated = 0
      totalAscii = 0
      for text in toRead
        totalExaminated += text.length
        totalAscii += countASCII(text)
        if totalExaminated > 200
          break
      if totalAscii > (totalExaminated * 0.8)
        window.currentTTS = TTS
      else
        window.currentTTS = BaiduTTS
        toRead.push('故事贴，"'+ Session.get('postContent').title + '"，全文朗读结束，感谢您的使用。')
      $('.tts-stoper').show()
      if Meteor.isCordova and device.platform is 'iOS'
        if window.remoteControls.updateMetas
          post = Session.get('postContent')
          params = [post.ownerName, post.title, '故事贴', post.mainImage,0,0];
          window.remoteControls.updateMetas( (success)->
            console.log(success)
            hookRemoteEvent()
          , (fail)->
            console.log(fail)
            hookRemoteEvent()
          , params);
      async.mapLimit(toRead,1,(item,callback)->
        console.log('TTS: ' + item)
        window.currentTTS.speak({
            text: item,
            rate: 1.5
          }
        ,()->
          if $('.tts-stoper').is(':visible')
            callback(null,'succ')
          else
            callback(new Error('Stopped'),'err')
        ,(reason)->
          callback(new Error(reason),'err')
        )
      ,(err,result)->
        console.log('Err ' + err + ' Result ' + result);
        $('.tts-stoper').hide()
        unless err
          toNextPost()
      );
    else
      window.plugins.toast.showShortCenter("并未选中可读的段落");
  sectionToolbarClickHandler = (self,event,node)->
    console.log('Index ' + self.index + ' Action ' + $(node).attr('action') )
    action = $(node).attr('action')
    if action is 'section-forward'
      options = {
        'androidTheme': window.plugins.actionsheet.ANDROID_THEMES.THEME_HOLO_LIGHT, # default is THEME_TRADITIONAL
        'title': '分享',
        'buttonLabels': ['分享给微信好友', '分享到微信朋友圈','分享到QQ','分享到QQ空间','分享到更多应用'],
        'androidEnableCancelButton' : true, #default false
        'winphoneEnableCancelButton' : true, #default false
        'addCancelButtonWithLabel': '取消',
        #'position': [20, 40] # for iPad pass in the [x, y] position of the popover
      }
      window.plugins.actionsheet.show(options, (buttonIndex)->
        switch buttonIndex
          when 1 then shareTo('WXSession',Blaze.getData($('.showPosts')[0]),self.index)
          when 2 then shareTo('WXTimeLine',Blaze.getData($('.showPosts')[0]),self.index)
          when 3 then shareTo('QQShare',Blaze.getData($('.showPosts')[0]),self.index)
          when 4 then shareTo('QQZoneShare',Blaze.getData($('.showPosts')[0]),self.index)
          when 5 then shareTo('System',Blaze.getData($('.showPosts')[0]),self.index)
      );
    else if action is 'post-tts'
      startPostTTS(self.index)
  Template.showPosts.events
    'click .postSeries': (e,t)->
      seriesId = e.currentTarget.id
      Router.go '/series/' + seriesId
    'click .authorReadPopularPostItem': (e)->
      postId = e.currentTarget.id
      unless postId
        postId = this._id
      unless postId
        postId = this.postId
      currentPostId = Session.get('postContent')._id
      document.body.scrollTop = 0
      $('.showPosts .head').fadeIn(300)
      if postId is currentPostId
        Session.set("SocialOnButton",'postBtn')
      else
        Session.set 'readMomentsPost',true
        Router.go '/posts/' + postId
    'click #shareStoryBtn' :->
      Session.set('isRecommendStory',true)
      trackEvent("shareStoryBtn","MobileRecommendStory")
      history = Session.get("history_view") || []
      history.push {
          view: 'posts/'+Session.get('postContent')._id
          scrollTop: document.body.scrollTop
          parent: 'postItem'
      }
      Session.set "history_view", history
      PUB.page '/recommendStory'
    'click .readmore': (e, t)->
      # if e.target is e.currentTarget
      $showPosts = $('.showPosts')
      $('.showPosts').get(0).style.overflow = ''
      $('.showPosts').get(0).style.maxHeight = ''
      $('.showPosts').get(0).style.position = ''
      $('.readmore').remove()
    'click .abstract_thumbsUp': (e)->
      i = Session.get('focusedIndex')
      commentOverlayThumbsUpHandler(i)
    'click .abstract_thumbsDown': (e)->
      i = Session.get('focusedIndex')
      commentOverlayThumbsDownHandler(i)
    'click .abstract_commentGray': (e)->
      Session.set("pcommetsId","")
      backgroundTop = 0-$(window).scrollTop()
      Session.set('backgroundTop', backgroundTop);
      $('.pcommentInput,.alertBackground').fadeIn 300, ()->
        $('#pcommitReport').focus()
      $('#pcommitReport').focus()

      $('.showBgColor').css('min-width',$(window).width())
      Session.set "pcommentIndexNum", Session.get('focusedIndex')
    'click .tts-stoper' : ()->
      Meteor.defer ()->
        $('.tts-stoper').hide()
        window.currentTTS.stop()
    'click .postTextItem' :(e)->
      if withSectionMenu
        # console.log('clicked on textdiv ' + this._id)
        # $self = $('#'+this._id)
        $self = $(e.currentTarget)
        toolbar = $self.data('toolbarObj')
        unless toolbar
          self = this
          $self.toolbar
            content: '.section-toolbar'
            position: 'bottom'
            hideOnClick: true
          $self.on 'toolbarItemClick',(event,buttonClicked)->
            sectionToolbarClickHandler(self,event,buttonClicked)
          $self.data('toolbarObj').show()
    'click #ViewOnWeb' :->
      if Session.get("postContent").fromUrl
        if Meteor.isCordova
          Session.set("isReviewMode","undefined")
          prepareToEditorMode()
          Session.set("ishyperlink",true)
          #PUB.page '/add'
          handleAddedLink(Session.get("postContent").fromUrl)
        else
          window.location.href=Session.get("postContent").fromUrl
    'click .post-user':->
      Session.set("ProfileUserId1", this.owner)
      Session.set("currentPageIndex",-1)
      Meteor.subscribe("userinfo", this.owner)
      Meteor.subscribe("recentPostsViewByUser", this.owner)
      Session.set('pageToProfile','/posts/'+ Session.get('postContent')._id)
      Session.set('pageScrollTop',$(window).scrollTop())
      onUserProfile()
    "click .showPostsFollowMe span a":->
      if Meteor.isCordova
        cordova.plugins.clipboard.copy('故事贴')
        PUB.toast('请在微信中搜索关注公众号“故事贴”(已复制到粘贴板)')
        return
      if isIOS
        window.location.href="http://mp.weixin.qq.com/s?__biz=MzAwMjMwODA5Mw==&mid=209526606&idx=1&sn=e8053772c8123501d47da0d136481583#rd"
      if isAndroidFunc()
        window.location.href="weixin://profile/gh_5204adca97a2"
    "click .change":->
      RC = Session.get("RC")+1
      if RC>7
         RC=0
      Session.set("RC", RC)
    'click #finish':->
      if PopUpBox
        PopUpBox.close()
        # $('.popUpBox, .b-modal').hide()
      else
        $('.popUpBox').hide 0
    "click #submit":->
      $("#new-reply").submit()

      # here need to subscribe refcomments again, otherwise cannot get refcomments data
      Meteor.subscribe "refcomments", ()->
        setTimeout ()->
          refComment = RefComments.find()
          if refComment.count() > 0
            Session.set("refComment",refComment.fetch())
      if PopUpBox
        PopUpBox.close()
        # $('.popUpBox, .b-modal').hide()
      else
        $('.popUpBox').hide 0
    "submit .new-reply": (event)->
      # This function is called when the new task form is submitted
      content = event.target.comment.value
      console.log content
      if content is ""
        return false

      FollowPostsId = Session.get("FollowPostsId")
      postId = Session.get("postContent")._id
      if Meteor.user()
        if Meteor.user().profile.fullname
          username = Meteor.user().profile.fullname
        else
          username = Meteor.user().username
        userId = Meteor.user()._id
        userIcon = Meteor.user().profile.icon
      else
        username = '匿名'
        userId = 0
        userIcon = ''
      try
        Comment.insert {
          postId:postId
          content:content
          username:username
          userId:userId
          userIcon:userIcon
          createdAt: new Date()
        }
        FollowPosts.update {_id: FollowPostsId},{$inc: {comment: 1}}
      catch error
        console.log error
      event.target.comment.value = ""
      $("#comment").attr("placeholder", "说点什么")
      $("#comment").css('height', 'auto')
      $('.contactsList .head').fadeOut 300
      false
    'focus .commentArea':->
      console.log("#comment get focus");
      if Meteor.isCordova and isIOS
        cordova.plugins.Keyboard.disableScroll(true)
    'blur .commentArea':->
      console.log("#comment lost focus");
      if Meteor.isCordova and isIOS
        cordova.plugins.Keyboard.disableScroll(false)
    'click #showPostsBack' :->
      Session.set("pcommetsId","")
      Session.set("pcommentsName","")
      $(window).children().off()
      $(window).unbind('scroll')
      $('.showPosts').addClass('animated ' + animateOutUpperEffect)
      $('.showPostsFooter').addClass('animated ' + animateOutUpperEffect)
      setTimeout ()->
        #PUB.back()
        # if Session.get("backtoMyPosts") is true
        #   Session.set("backtoMyPosts",false)
        #   PUB.page('/myPosts')
        #else 
        if Session.get("backtopageuser") is true
          Session.set('backtopageuser', false)
          PUB.page('/user')
        else if Session.get("fromSeries") and Session.get("fromSeries").status is true
          seriesId = Session.get("fromSeries").id
          Session.set("fromSeries",'')
          Router.go '/series/' + seriesId
        else if Session.get("backtoalldrafts") is true
          Session.set("backtoalldrafts",false)
          PUB.page('/allDrafts')
        else if Session.get('fromUserProfile') is true and Session.get('pageToProfile')
          Session.set("fromUserProfile",false)
          onUserProfile()
        else
          PUB.postPageBack()
        if Session.get("Social.LevelOne.Menu") is 'userProfile'
          Session.set("Social.LevelOne.Menu",'contactsList')
          return
      ,animatePageTrasitionTimeout
    'click #edit': (event)->
      if this.import_status
        # unless this.import_status is 'imported' or this.import_status is 'done'
        if this.import_status is 'imported' or this.import_status is 'done'
          if enableSimpleEditor and Meteor.user().profile and Meteor.user().profile.defaultEditor isnt 'fullEditor'
            return Router.go('/newEditor?type=edit&id='+this._id)
        else
          return window.plugins.toast.showLongBottom('此故事的图片正在处理中，请稍后操作~')
        
      editorVersion = this.editorVersion || 'fullEditor'
      if (editorVersion is 'simpleEditor')
        return Router.go('/newEditor?type=edit&id='+this._id)

      #Clear draft first
      Drafts.remove({})
      #Prepare data from post
      fromUrl = ''
      if this.fromUrl and this.fromUrl isnt ''
        fromUrl = this.fromUrl
      draft0 = {_id:this._id, type:'image', isImage:true, url: fromUrl, owner: Meteor.userId(), imgUrl:this.mainImage, filename:this.mainImage.replace(/^.*[\\\/]/, ''), URI:"", data_row:0,style:this.mainImageStyle}
      Drafts.insert(draft0)
      pub = this.pub;
      if pub.length > 0
        ###
        Router.go('/add') will trigger addPost onRendered first, then defer function run.
        The Drafts.insert will trigger addPostItem OnRendered function run, then do the layout thing. The 2nd defer function
        will run after then. The final callback will be called after all item layout done, so closePreEditingPopup run.
        ###
        deferedProcessAddPostItemsWithEditingProcessBar(pub)
      Session.set 'isReviewMode','2'
      #Don't push showPost page into history. Because when save posted story, it will use Router.go to access published story directly. But in history, there is a duplicate record pointing to this published story.
      Router.go('/add')
    'click #unpublish': (event)->
      self = this
      # navigator.notification.confirm('取消发表的故事将会被转换为草稿。', (r)->
      #   if r isnt 2
      #     return
      #   #PUB.page('/user')
      fromUrl = ''
      if self.fromUrl and self.fromUrl isnt ''
        fromUrl = self.fromUrl
      draft0 = {_id:self._id, type:'image', isImage:true, url:fromUrl ,owner: Meteor.userId(), imgUrl:self.mainImage, filename:self.mainImage.replace(/^.*[\\\/]/, ''), URI:"", data_row:0}
      self.pub.splice(0, 0, draft0);
      if Posts.find({owner: Meteor.userId()}).count() is 1
        Session.setPersistent('persistentMyOwnPosts',null)
        Session.setPersistent('myPostsCount',0)
      postId = self._id
      userId = Meteor.userId()
      drafts = {
        _id:postId,
        pub:self.pub,
        title:self.title,
        fromUrl:fromUrl,
        addontitle:self.addontitle,
        mainImage: self.mainImage,
        mainText: self.mainText,
        owner:userId,
        createdAt: new Date(),
        editorVersion: self.editorVersion
      }
      Meteor.call 'unpublish',postId,userId,drafts, (err, res)->
        #Meteor.subscribe 'myCounter'
        myHotPosts = Meteor.user().myHotPosts || []
        if myHotPosts and myHotPosts.length > 0
          newArray = []
          for item in myHotPosts
            itemPostId = item.postId or item._id
            if itemPostId isnt postId
              newArray.push(item)
          myHotPosts = newArray
          Meteor.users.update { _id: Meteor.userId() }, $set: 'myHotPosts': myHotPosts
        FollowPosts.remove({_id:postId})
      Router.go('/user')
      return
      # , '取消发表故事', ['依然发表','存为草稿']);


    'click #report': (e)->
      # Router.go('reportPost')
      blackerId = Session.get("postContent").owner
      if BlackList.find({blackBy: Meteor.userId(), blacker:{$in: [blackerId]}}).count() > 0
        hasInBlackList = true
        menus = ['举报','从黑名单中移除']
      else
        menus = ['举报','拉黑']
      menuTitle = ''
      callback = (buttonIndex)->
        if buttonIndex is 1
          Router.go('reportPost')
        else if buttonIndex is 2
          if hasInBlackList
            removeFromeBlackList(blackerId)
          else
            addIntoBlackList(blackerId)
      PUB.actionSheet(menus, menuTitle, callback)
    'click .postImageItem, click .pinImage': (e)->
      swipedata = []
      swipedataSort = []
      i = 0
      selected = 0
      IMGS = $('.postImageItem')
      for image in IMGS
        x = parseInt($(image).css('left'))
        y = parseInt($(image).css('top'))
        href = $(image).children('img').attr('data-original')
        swipedataSort.push 
          x: x
          y: y
          href: href
      swipedataSort.sort(compareSwipeImgNew) #数组重排序
      # console.log swipedataSort
      for imageurl in swipedataSort
        if imageurl.href is this.imgUrl
          selected = i
        swipedata.push
          href: imageurl.href
        i++
      if swipedata.length > 0
        $.swipebox swipedata,{
          initialIndexOnArray: selected
          hideCloseButtonOnMobile : true
          loopAtEnd: false
        }
      else
        pub.toast('打开图片失败。')
  Template.postFooter.helpers
    refcomment:->
      RC = Session.get 'RC'
      RefC = Session.get("refComment")
      if RefC
        return RefC[RC].text
    heart:->
      Session.get("postContent").heart.length
    retweet:->
      Session.get("postContent").retweet.length
    comment:->
      Session.get("postContent").commentsCount
      #Comment.find({postId:Session.get("postContent")._id}).count()
    blueHeart:->
      heart = Session.get("postContent").heart
      if Meteor.user()
        if JSON.stringify(heart).indexOf(Meteor.userId()) is -1
          return false
        else
          return true
      else
        return amplify.store( Session.get("postContent")._id)
    blueRetweet:->
      retweet = Session.get("postContent").retweet
      if JSON.stringify(retweet).indexOf(Meteor.userId()) is -1
        return false
      else
        return true
  heartOnePost = ->
    Meteor.subscribe "refcomments", ()->
      setTimeout ()->
        refComment = RefComments.find()
        if refComment.count() > 0
          Session.set("refComment",refComment.fetch())
    if Meteor.user()
      postId = Session.get("postContent")._id
      FollowPostsId = Session.get("FollowPostsId")
      heart = Session.get("postContent").heart
      if JSON.stringify(heart).indexOf(Meteor.userId()) is -1
        heart.sort()
        heart.push {userId: Meteor.userId(),createdAt: new Date()}
        Posts.update {_id: postId},{$set: {heart: heart}}
        FollowPosts.update {_id: FollowPostsId},{$inc: {heart: 1}}
        return
    else
      postId = Session.get("postContent")._id
      heart = Session.get("postContent").heart
      heart.sort()
      heart.push {userId: 0,createdAt: new Date()}
      Posts.update {_id: postId},{$set: {heart: heart}}
      amplify.store(postId,true)
  onComment = ->
    window.PopUpBox = $('.popUpBox').bPopup
      positionStyle: 'absolute'
      position: [0, 0]
      onClose: ->
        Session.set('displayCommentInputBox',false)
      onOpen: ->
        Session.set('displayCommentInputBox',true)
        setTimeout ->
            $('.commentArea').focus()
          ,300
        console.log 'Modal opened'
        $('.popUpBox').css('height', $(document).height())
  onRefresh = ->
    RC = Session.get("RC")+1
    if RC>7
       RC=0
    Session.set("RC", RC)
  unless Meteor.isCordova
    if isIOS
      Template.postFooter.events
        'touchstart .refresh':onRefresh
        'touchstart .comment':onComment
        'touchstart .heart':heartOnePost
  Template.postFooter.events
    'click .refresh':onRefresh
    'click .comment':onComment
    'click .heart':heartOnePost
    'click .retweet':->
      if Meteor.user()
        postId = Session.get("postContent")._id
        FollowPostsId = Session.get("FollowPostsId")
        retweet = Session.get("postContent").retweet
        if JSON.stringify(retweet).indexOf(Meteor.userId()) is -1
          retweet.sort()
          retweet.push {userId: Meteor.userId(),createdAt: new Date()}
          Posts.update {_id: postId},{$set: {retweet: retweet}}
          FollowPosts.update {_id: FollowPostsId},{$inc: {retweet: 1}}
          return
    'click .blueHeart':->
      Meteor.subscribe "refcomments", ()->
          setTimeout ()->
            refComment = RefComments.find()
            if refComment.count() > 0
              Session.set("refComment",refComment.fetch())
      if Meteor.user()
        postId = Session.get("postContent")._id
        FollowPostsId = Session.get("FollowPostsId")
        heart = Session.get("postContent").heart
        if JSON.stringify(heart).indexOf(Meteor.userId()) isnt -1
          arr = []
          for item in heart
            if item.userId isnt Meteor.userId()
              arr.push {userId:item.userId,createdAt:item.createdAt}
          Posts.update {_id: postId},{$set: {heart: arr}}
          FollowPosts.update {_id: FollowPostsId},{$inc: {heart: -1}}
          return
    'click .blueRetweet':->
      if Meteor.user()
        postId = Session.get("postContent")._id
        FollowPostsId = Session.get("FollowPostsId")
        retweet = Session.get("postContent").retweet
        if JSON.stringify(retweet).indexOf(Meteor.userId()) isnt -1
          arr = []
          for item in retweet
            if item.userId isnt Meteor.userId()
              arr.push {userId:item.userId,createdAt:item.createdAt}
          Posts.update {_id: postId},{$set: {retweet: arr}}
          FollowPosts.update {_id: FollowPostsId},{$inc: {retweet: -1}}
          return
  Template.pCommentsList.helpers
      time_diff: (created)->
        GetTime0(new Date() - created)
      hasPcomments: ->
         i = Session.get "pcommentIndexNum"
         post = Session.get("postContent").pub
         if post and post[i] and post[i].pcomments isnt undefined
           return true
         else
           return false
      pcomments:->
         i = Session.get "pcommentIndexNum"
         post = Session.get("postContent").pub
         if post[i] isnt undefined
           return post[i].pcomments
         else
           return ''

  Template.pCommentsList.events
      'click .alertBackground':->
        $('.showBgColor').removeAttr('style')
        $(window).scrollTop(0-Session.get('backgroundTop'))
        $('.pcommentsList,.alertBackground').fadeOut 300
        Session.set('backgroundTop','')
      'click #pcommitReportBtn':(e, t)->
        i = Session.get "pcommentIndexNum"
        content = $('#pcommitReport').val()
        postId = Session.get("postContent")._id
        post = Session.get("postContent").pub

        if (favp = FavouritePosts.findOne({postId: postId, userId: Meteor.userId()}))
          FavouritePosts.update({_id: favp._id}, {$set: {updateAt: new Date()}})
        else
          FavouritePosts.insert({postId: postId, userId: Meteor.userId(), createdAt: new Date(), updateAt: new Date()})

#        if withSponserLinkAds
#          position = 1+(post.length/2)
#        if i > position then i -= 1 else i = i
        if content is ""
          $('.showBgColor').removeAttr('style')
          $('.showBgColor').css('min-width',$(window).width())
          $(window).scrollTop(0-Session.get('backgroundTop'))
          $('.pcommentsList,.alertBackground').fadeOut 300
          return false
        if Meteor.user()
          if Meteor.user().profile.fullname
            username = Meteor.user().profile.fullname
          else
            username = Meteor.user().username
          userId = Meteor.user()._id
          userIcon = Meteor.user().profile.icon
        else
          username = '匿名'
          userId = 0
          userIcon = ''
        if not post[i].pcomments or post[i].pcomments is undefined
          pcomments = []
          post[i].pcomments = pcomments
        pcommentJson = {
          content:content
          username:username
          userId:userId
          userIcon:userIcon
          createdAt: new Date()
        }
        post[i].pcomments.push(pcommentJson)
        updatePostsContentSession(post,"pcomments",i);
        Posts.update({_id: postId},{"$set":{"pub":post,"ptype":"pcomments","pindex":i}}, (error, result)->
          if error
            console.log(error.reason);
          else
            console.log("success");ownerId
        )
        $('#pcommitReport').val('')
        $("#pcommitReport").attr("placeholder", "评论")
        $('.showBgColor').removeAttr('style')
        $(window).scrollTop(0-Session.get('backgroundTop'))
        $('.pcommentsList,.alertBackground').fadeOut 300
        false


  Template.pcommentInput.helpers
      placeHolder:->
        placeHolderText = '评论'
        if Session.get("pcommetsReply")
           i = Session.get "pcommentIndexNum"
           post = Session.get("postContent").pub
           selectedIndex = Session.get("pcommentSelectedIndex")
           if post and post[i] and post[i].pcomments isnt undefined
              pcomments = post[i].pcomments
              if pcomments[selectedIndex] isnt undefined
                toUsername = pcomments[selectedIndex].username
                placeHolderText = '回复'+toUsername+':'
         return placeHolderText
      time_diff: (created)->
        GetTime0(new Date() - created)
      hasPcomments: ->
         i = Session.get "pcommentIndexNum"
         post = Session.get("postContent").pub
         if post and post[i] and post[i].pcomments isnt undefined
           return true
         else
           return false
      pcomments:->
         i = Session.get "pcommentIndexNum"
         post = Session.get("postContent").pub
         if post[i] isnt undefined
           return post[i].pcomments
         else
           return ''

  Template.pcommentInput.events
      'click .alertBackground':->
        $('.showBgColor').removeAttr('style')
        $('body').removeAttr('style')
        $(window).scrollTop(0-Session.get('backgroundTop'))
        $('.pcommentInput,.alertBackground').fadeOut 300
        $('.post-pcomment-current-pub-item').removeClass('post-pcomment-current-pub-item')
        Session.set('backgroundTop','')
      'click #pcommitReportBtn':(e, t)->
        i = Session.get "pcommentIndexNum"
        content = $('#pcommitReport').val()
        postId = Session.get("postContent")._id
        post = Session.get("postContent").pub
        ###
        mqtt_msg = {"type": "postcomment", "message": " 评论了此段 \"" + Session.get("postContent").pub[i].text.replace(/<(?:.|\n)*?>/gm, '') + '": ' + content, "postid": Session.get('postContent')._id}
        mqtt_msg.message = Meteor.user().profile.fullname + mqtt_msg.message
        mqtt_connection=mqtt.connect('ws://rpcserver.raidcdn.com:80')
        mqtt_connection.on('connect',()->
          console.log('Connected to server')
          #mqtt_connection.subscribe(Session.get('postContent')._id)
          mqtt_connection.publish('all', JSON.stringify(mqtt_msg))
        )
        ###

        if (favp = FavouritePosts.findOne({postId: postId, userId: Meteor.userId()}))
          FavouritePosts.update({_id: favp._id}, {$set: {updateAt: new Date()}})
        else
          FavouritePosts.insert({postId: postId, userId: Meteor.userId(), createdAt: new Date(), updateAt: new Date()})
#        if withSponserLinkAds
#          position = 1+(post.length/2)
#        if i > position then i -= 1 else i = i
        if content is ""
          $('body').removeAttr('style')
          $('.showBgColor').removeAttr('style')
          $(window).scrollTop(0-Session.get('backgroundTop'))
          $('.pcommentInput,.alertBackground').fadeOut 300
          return false
        if Meteor.user()
          if Meteor.user().profile.fullname
            username = Meteor.user().profile.fullname
          else
            username = Meteor.user().username
          userId = Meteor.user()._id
          userIcon = Meteor.user().profile.icon
        else
          username = '匿名'
          userId = 0
          userIcon = ''
        if not post[i].pcomments or post[i].pcomments is undefined
          pcomments = []
          post[i].pcomments = pcomments

        toUsername = ''
        toUserId = ''
        if Session.get("pcommetsReply")
            selectedIndex = Session.get("pcommentSelectedIndex")
            pcomments = post[i].pcomments
            toUsername = pcomments[selectedIndex].username
            toUserId = pcomments[selectedIndex].userId
        console.log 'toUserId>>>>>>>'+toUserId
        pcommentJson = {
          content:content
          toUsername:toUsername
          toUserId:toUserId
          username:username
          userId:userId
          userIcon:userIcon
          createdAt: new Date()
        }
        post[i].pcomments.push(pcommentJson)
        updatePostsContentSession(post,"pcomments",i);
        popUpObj = {}
        objHelp = 'pub.'+i+'.pcomments';
        popUpObj[objHelp] = pcommentJson;
        Posts.update({_id: postId},{
          $push: popUpObj
          $set:
            'ptype': 'pcomments'
            'pindex': i
        }, (error, result)->
          if error
            console.log(error.reason);
          else
            postItem = $('.post-pcomment-current-pub-item')
            offsetHeight = postItem.height() - parseInt(postItem.attr('data-height'))
            console.log(offsetHeight)
            testDivHeight = parseInt($('#test').css('height'))
            $('#test').css('height',testDivHeight + offsetHeight + 'px')
            # resize nex node top
            postItem.nextAll().each ()->
              try
                item = $(this)
                top = offsetHeight + item.position().top
                item.css('top', top + 'px')
              catch
            postItem.removeClass('post-pcomment-current-pub-item')

            console.log("success");
        )
        type = 'pcomments'
        postData = Session.get('postContent')
        pcommentContent = content
        to = {
          id: toUserId || postData.owner,
          name: toUsername || postData.ownerName,
          icon: postData.ownerIcon,
          pcommentContent: pcommentContent,
          pcommentIndexNum: Session.get("pcommentIndexNum"),
          pcomment: Session.get("postContent").pub[i].text.replace(/<(?:.|\n)*?>/gm, '')
        }
        if to.id isnt '' and to.id isnt Meteor.userId()
          sendMqttMessageToUser(type,to,postData)
        $('#pcommitReport').val("")
        $("#pcommitReport").attr("placeholder", "评论")
        #$('body').removeAttr('style')
        $('.showBgColor').removeAttr('style')
        $(window).scrollTop(0-Session.get('backgroundTop'))
        $('.pcommentInput,.alertBackground').fadeOut 300
        #refreshPostContent()
        false
  Template.pcommentInputPrompt.helpers
    isMyPcomment:->
      if Session.get('pcommentInputPromptPageUserId') is Meteor.userId()
        return true
      else
        return false

  Template.pcommentInputPrompt.events
    'click .deleteComment':(e,t)->
      postId = Session.get("postContent")._id
      post = Session.get("postContent").pub
      i = Session.get "pcommentIndexNum"
      pcomments = post[i].pcomments
      index = Session.get('pcommentSelectedIndex')
      pcomments.splice( index, 1 )
      updatePostsContentSession(post,"pcomments",i)
      Posts.update({_id: postId},{"$set":{"pub":post,"ptype":"pcomments","pindex":i}}, (error, result)->
          if error
            console.log(error.reason);
          else
            console.log("success");
            postItem = $('.post-pcomment-current-pub-item')
            console.log postItem
            offsetHeight = postItem.height() - parseInt(postItem.attr('data-height'))
            console.log offsetHeight
            testDivHeight = parseInt($('#test').css('height'))
            $('#test').css('height',testDivHeight + offsetHeight + 'px')
            # resize nex node top
            postItem.nextAll().each ->
              try
                item = $(this)
                top = offsetHeight + item.position().top
                item.css 'top', top + 'px'
              catch e
                console.log 'error:' + e
            postItem.removeClass 'post-pcomment-current-pub-item'
      )
      $('.pcommentInputPromptPage').hide()
    'click .bg, click .cancleBtn':->
      $('.pcommentInputPromptPage').hide()
    'click .reply':->
      $('.pcommentInputPromptPage').hide()
      Session.set("pcommetsReply",true)
      bgheight = $('.post-pcomment-current-pub-item').offset().top+parseInt($('.post-pcomment-current-pub-item').attr('data-height'))+50
      $('.showBgColor').attr('style','overflow:hidden;min-width:' + $(window).width() + 'px;' + 'height:' + bgheight + 'px;')
      Session.set("pcommetsId","")
      backgroundTop = 0-$(window).scrollTop()
      Session.set('backgroundTop', backgroundTop);
      $('.pcommentInput,.alertBackground').fadeIn 300, ()->
        $('#pcommitReport').focus()
      $('#pcommitReport').focus()
      

  Template.shareReaderClub.helpers
    # show_share_reader_club: ->
    #   hotPosts = _.filter Session.get('hottestPosts') || [], (value)->
    #     value.hasPush
    #   return (hotPosts.length > 0) and (Session.get('postContent').ownerId isnt Meteor.UserId()) or (hotPosts.length > 0) and (if Meteor.user().profile and Meteor.user().profile.web_follower_count then Meteor.user().profile.web_follower_count > 0 else false)
    has_share_hot_post: ->
      hotPosts = _.filter Session.get('hottestPosts') || [], (value)->
        true
        # !value.hasPush
      # console.log("-------------has_share_hot_post")
      # console.log(hotPosts)
      return hotPosts.length > 0
    has_share_follower: ->
      # if Session.get('postContent').owner isnt Meteor.userId()
      #   return false
      return if Meteor.user().profile and Meteor.user().profile.web_follower_count then Meteor.user().profile.web_follower_count > 0 else false
  Template.shareReaderClub.events
    'click .btnNo': (e, t)->
      $('.shareReaderClub,.shareReaderClubBackground').hide()
    'click .share-hot-post': (e, t)->
      $('.shareReaderClub,.shareReaderClubBackground').hide()
      Router.go('/hotPosts/' + Session.get('postContent')._id)
    'click .share-fllower': (e, t)->
      $('.shareReaderClub,.shareReaderClubBackground').hide()
      Meteor.call('sendEmailByWebFollower', Session.get('postContent')._id, 'share')
      navigator.notification.confirm('分享成功~', `function(){}`, '提示', ['知道了'])
  Template.recommendStory.onRendered ->
    $('body').css('overflow-y','hidden')
    Session.set('storyListsLimit',10)
    Session.set('storyListsLoaded',false)
    Session.set('storyListsType','publishedStories')
  Template.recommendStory.onDestroyed ->
    $('body').css('overflow-y','auto')
    Session.set('isRecommendStory',false)
  Template.recommendStory.helpers
    storyListsLoaded: ()->
      if Session.get('storyListsType') is 'publishedStories'
        return Session.get('storyListsLoaded') is true
      else
        return favouritepostsCollection_getmore is 'done'
    isStoryListsLoadedAll: ()->
      if Session.get('storyListsType') is 'publishedStories'
        return Session.get('storyListsCounts') < Session.get('storyListsLimit')
      else
        return FavouritePosts.find({userId: Meteor.userId()}).count() < Session.get("favouritepostsLimit")
    storyLists:()->
      if Session.get('storyListsType') is 'publishedStories'
        posts = Posts.find({owner: Meteor.userId()})
      else
        postIds = []
        FavouritePosts.find({userId: Meteor.userId()}).forEach((item) ->
          if !~postIds.indexOf(item.postId)
            postIds.push(item.postId)
        )
        posts = Posts.find({_id: {$in: postIds}})
      return posts
    getFirstParagraph:(pub)->
      text = ''
      if !pub
        return ''
      for i in [1..pub.length-1]
        if pub[i].type is 'text'
          if pub[i].isHyperlink
            text = pub[i].hyperlinkText
          else
            text = pub[i].text.replace(/<(?:.|\n)*?>/gm, '')
        if text? and text isnt ''
          break
      return text
  Template.recommendStory.events
    'click .leftButton':(e)->
      PUB.pagepop();
      return Router.go('/posts/'+Session.get('postContent')._id)
    'click #importBtn': (e)->
      originUrl = $('#importUrl').val()
      console.log('originUrl=='+originUrl)
      if originUrl is ''
        if Meteor.isCordova
          cordova.plugins.clipboard.paste (text)->
            if text and text isnt '' and text.indexOf('http') > -1
              originUrl = text
            else
              return PUB.toast('请输入或粘贴一个链接~')
        else
          return PUB.toast('请输入或粘贴一个链接~')
      # 判断url格式
      urlReg = new RegExp("(http[s]{0,1}|ftp)://[a-zA-Z0-9\\.\\-]+\\.([a-zA-Z]{2,4})(:\\d+)?(/[a-zA-Z0-9\\.\\-~!@#$%^&*+?:_/=<>]*)?", "gi")
      if !originUrl.match(urlReg)
        return PUB.toast('链接格式错误~')
      # 调用导入相关方法
      prepareToEditorMode()
      Session.set('recommendStoryShare', true)
      Session.set('recommendStoryShareFromId',Session.get('postContent')._id)
      PUB.pagepop();
      Router.go('/add')
      Meteor.setTimeout(()->
        Session.set 'isServerImport', true
        handleDirectLinkImport(originUrl)
      ,100)
    'click .storyLists li':(e)->
      console.log('target_postId=='+e.currentTarget.id)
      if Session.get('postContent')._id
        # 推荐到读友圈
        Meteor.call 'pushRecommendStoryToReaderGroups', Session.get('postContent')._id, e.currentTarget.id, (err)->
          if !err
            PUB.toast('推荐成功！')
          else
            console.log('pushRecommendStoryToReaderGroups:', err)
      PUB.pagepop();
      return Router.go('/posts/'+Session.get('postContent')._id)
    'click #loadMore': (e)->
      if Session.get('storyListsType') is 'publishedStories'
        limit = parseInt(Session.get('storyListsLimit'))
        limit += 10
        Session.set('storyListsLimit',limit)
      else
        favouritepostsLimit = Session.get('favouritepostsLimit')
        favouritepostsLimit += 10
        Session.set('favouritepostsLimit',favouritepostsLimit)
      Session.set('storyListsLoaded',false)
    'click .storySource .radio': (e)->
      Session.set('storyListsType',e.currentTarget.id)

    Tracker.autorun ()->
      if Session.get('addPostTheme')
        style = Session.get('addPostTheme')
        if !style or style is 'default'
          return $('head link#post-theme').remove()
        $theme = $('head link#post-theme')
        if ($theme.length > 0)
          return $theme.attr('href', theme_host_url + style)
        $('head').append('<link id="post-theme" rel="stylesheet" type="text/css" href="'+theme_host_url + style+'">')
        return
      if Session.get('postContent')
        style = Session.get('postContent').style
        if !style
          return $('head link#post-theme').remove()
        $theme = $('head link#post-theme')
        if ($theme.length > 0)
          return $theme.attr('href', theme_host_url + style)
        $('head').append('<link id="post-theme" rel="stylesheet" type="text/css" href="'+theme_host_url + style+'">')
    Template.showPosts.helpers
      withPinImage: ()->
        return withPinImage
      is_owner: ()->
        return Meteor.userId() is Session.get('postContent').owner
      themes: ()->
        return Themes.find({})
      theme_host: ()->
        return theme_host_url
      get_hover: (theme)->
        return theme.style is Session.get('postContent').style or (!Session.get('postContent').style and theme.default is true)
      themeLoadFaild: ()->
        return Themes.find({}).count() == 0
      themeLoaded:()->
        return Session.get('post_theme_loaded') != 'loading'
      hasPinImages:()->
        return Session.get('postContent') and Session.get('postContent').pinImages
      pinImages:->
        if Session.get('postContent') and Session.get('postContent').pinImages
          return Session.get('postContent').pinImages
      pinImageStyle:(images)->
        if images.length == 1
          return "width:100%;height: 200px;height: 30vh;"
        if images.length == 2
          return "width: 50%;height: 200px;height: 50vw;";
        return "";
      pinImglike:->
        if this.pinImages.likeSum is undefined
          0
        else
          this.pinImages.likeSum
      pinImgdislike:->
        if this.pinImages.dislikeSum is undefined
          0
        else
          this.pinImages.dislikeSum
      pinImgselfClickedUp:->
        userId = Meteor.userId()
        if this.pinImages.dislikeUserId isnt undefined and this.pinImages.likeUserId[userId] is true
          return true
        else
          return false
      pinImgselfClickedDown:->
        userId = Meteor.userId()
        if this.pinImages.dislikeUserId isnt undefined and this.pinImages.dislikeUserId[userId] is true
          return true
        else
          return false
      showPostPinImagesIntro:->
        owner = Session.get('postContent').owner
        if owner is Meteor.userId() and localStorage.getItem('pinImagesIntros') isnt 'true' and withPinImage
          return true
        return false
    Template.showPosts.events
      'click .post-theme-btn': ()->
        $('.post-theme-box').show()
        $('.post-theme-box-mask').show()
      'click .post-theme-box-mask': ()->
        $('.post-theme-box').hide()
        $('.post-theme-box-mask').hide()
      'click .post-theme-box li': ()->
        Posts.update {_id: Session.get('postContent')._id}, {$set: {style: this.style}}, (err, num)->
          if err or num <= 0
            return console.log('update post style error:', err)
          Session.set('postContent', Posts.findOne({_id: Session.get('postContent')._id}))
          console.log('update post style')
      'click .post-theme-box .btn-succ': ()->
        $('.post-theme-box').hide()
        $('.post-theme-box-mask').hide()
      'click .try-theme-again':(e)->
        Session.set('post_theme_loaded','loading');
        Meteor.subscribe('themes',()->
          Session.set('post_theme_loaded','loaded');
        )
      'click .post-pin-image': ()->
        console.log('try to select image')
        post = Session.get('postContent')
        if !post
          return console.log('get postContent failed!')
        # 图片上传
        originImages = []
        selectMediaFromAblum(3, (cancel, result,currentCount,totalCount)->
          if cancel
            return
          if result
            originImages.push({
              filename: result.filename,
              URI: result.URI,
              smallImage: result.smallImage
            })
            console.log('Local is:',JSON.stringify(originImages))
            if currentCount >= totalCount
              console.log('Local finished, start upload images')
              uploadPinImages(post, originImages)
        )
      'click .pinthumbsUp':(e)->
        post = Session.get("postContent")
        postId = post._id
        pinImages = post.pinImages
        userId = Meteor.userId()
        
        if pinImages.likeUserId[userId] and pinImages.likeUserId[userId] is true
          pinImages.likeUserId[userId] = false
          if pinImages.likeSum > 0
            pinImages.likeSum -= 1 
            e.target.className="fa fa-thumbs-o-up pinthumbsUp"
            e.target.style = ""
        else
          if pinImages.dislikeUserId[userId] and pinImages.dislikeUserId[userId] is true
            pinImages.dislikeUserId[userId] = false
            if pinImages.dislikeSum > 0
              pinImages.dislikeSum -= 1 
              $('.pinthumbsDown')[0].className = "fa fa-thumbs-o-down pinthumbsDown"
              $('.pinthumbsDown')[0].style = ""
          pinImages.likeUserId[userId] = true
          pinImages.likeSum += 1 
          e.target.className="fa fa-thumbs-up pinthumbsUp"
          e.target.style.color="rgb(243,11,68)"
          e.target.style.fontSize="larger"

          # 发送私信
          to = {
            id: post.owner,
            name: post.ownerName,
            icon: post.ownerIcon,
            pcomment: ''
          }
          sendMqttMessageToUser('thumbsUp',to,post)

        post.pinImages = pinImages
        Session.set('postContent',post)
        Meteor.defer ()->
          Posts.update({_id: postId},{$set:{"pinImages":pinImages,"ptype":"like"}}, (error, result)->
            if error
              console.log(error.reason);
            else
              console.log("success");
          )
          if (favp = FavouritePosts.findOne({postId: postId, userId: userId}))
            FavouritePosts.update({_id: favp._id}, {$set: {updateAt: new Date()}})
          else
            FavouritePosts.insert({postId: postId, userId: userId, createdAt: new Date(), updateAt: new Date()})   
      'click .pinthumbsDown':(e)->
        post = Session.get("postContent")
        postId = post._id
        pinImages = post.pinImages
        userId = Meteor.userId()

        if pinImages.dislikeUserId[userId] and pinImages.dislikeUserId[userId] is true
          pinImages.dislikeUserId[userId] = false
          if pinImages.dislikeSum > 0
            pinImages.dislikeSum -= 1 
            e.target.className="fa fa-thumbs-o-down pinthumbsDown"
            e.target.style = ""
        else
          if pinImages.likeUserId[userId] and pinImages.likeUserId[userId] is true
            pinImages.likeUserId[userId] = false
            if pinImages.likeSum > 0
              pinImages.likeSum -= 1 
              $('.pinthumbsUp')[0].className = "fa fa-thumbs-o-up pinthumbsUp"
              $('.pinthumbsUp')[0].style = ""
          pinImages.dislikeUserId[userId] = true
          pinImages.dislikeSum += 1 
          e.target.className="fa fa-thumbs-down pinthumbsDown"
          e.target.style.color="rgb(0,0,255)"

          # 发送私信
          to = {
            id: post.owner,
            name: post.ownerName,
            icon: post.ownerIcon,
            pcomment: ''
          }
          sendMqttMessageToUser('thumbsDown',to,post)

        post.pinImages = pinImages
        Session.set('postContent',post)
        Meteor.defer ()->
          Posts.update({_id: postId},{$set:{"pinImages":pinImages,"ptype":"dislike"}}, (error, result)->
            if error
              console.log(error.reason);
            else
              console.log("success");
          )
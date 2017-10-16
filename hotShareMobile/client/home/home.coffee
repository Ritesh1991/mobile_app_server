#space 2
if Meteor.isClient
  toNum = (a) ->
    if a is null or a is undefined or a is ''
      return
      
    c = a.split('.')
    num_place = [
      ''
      '0'
      '00'
      '000'
      '0000'
    ]
    r = num_place.reverse()
    i = 0
    while i < c.length
      len = c[i].length
      c[i] = r[len] + c[i]
      i++
    res = c.join('')
    res
  @checkNewVersion2 = ->
    if CHECK_UPDATE
      platform = if Blaze._globalHelpers.isIOS() then 'ios' else (if Blaze._globalHelpers.isAndroid() then 'android' else 'others')
      HTTP.get(version_host_url,(err,result)->
        if err
          console.log(err)
          return
        data = result.data
        console.log(data)
        currentVersion = version_of_build
        if platform is 'ios'
          stableVersion = data.stable_ios
          latestVersion = data.latest_ios
          stableRelease = data.stable_release_ios
          latestRelease = data.latest_release_ios
        if platform is 'android'
          stableVersion = data.stable_android
          latestVersion = data.latest_android
          stableRelease = data.stable_release_android
          latestRelease = data.latest_release_android
        window.localStorage.setItem('stableVersion',stableVersion)
        window.localStorage.setItem('latestVersion',latestVersion)
        if currentVersion < stableVersion
          # 强制升级
          window.updateAPPVersion(data.stable_title,stableRelease, data.stable_styles,false)
          # navigator.notification.alert('建议升级到' + stableVersion+'\n主要更新'+stableRelease,goToUpdate,'您使用的故事贴版本太旧啦！', '立即升级')
        else if currentVersion < latestVersion
          updateTipTimes = window.localStorage.getItem('stable_update_tip_times')
          # 推荐升级
          # navigator.notification.confirm('故事贴 V' + latestVersion+' 已经发布\n主要更新: \n'+latestRelease, (index)->
          #   if index is 1
          #     goToUpdate()
          # '有新版本', '立即升级,稍后再说')
          if !updateTipTimes
            window.localStorage.setItem('stable_update_tip_times',1)
          window.localStorage.setItem('stable_update_tip_times',Number(updateTipTimes)+1)
          if updateTipTimes and updateTipTimes%data.latest_times is 0
            window.updateAPPVersion(data.latest_title,latestRelease, data.latest_styles,true)
      )
    else
      return
  @checkNewVersion = ->
    platform = if Blaze._globalHelpers.isIOS() then 'ios' else (if Blaze._globalHelpers.isAndroid() then 'android' else 'others')
    # version = Versions.findOne({})
    if !window.localStorage.getItem("latestVersion")
      console.log 'no localStorage latestVersion.'
      window.localStorage.setItem("latestVersion", version_of_build)
    # if version and version[platform]
    #   latestVersion = version[platform]
    # else
    #   latestVersion = version_of_build
    latestVersion =  window.localStorage.getItem("latestVersion")
    _latestVersion = toNum(latestVersion) 
    _version_of_build = toNum(version_of_build)
    # _localLatestVersion = toNum(window.localStorage.getItem("latestVersion"))
    
    # if _latestVersion > _version_of_build and _latestVersion > _localLatestVersion
    if _latestVersion > _version_of_build
      # window.localStorage.setItem("latestVersion", latestVersion)
      console.log 'set latestVersionAlert true. '
      # Session.set('latestVersionAlert', true) # 使用新的升级提醒
    else
      Session.set('latestVersionAlert', false)

    if _latestVersion > _version_of_build
      console.log '有新版本：' + _latestVersion
      return true
    if _latestVersion <= _version_of_build
      console.log '当前版本已是最新版本！'
      return false
  @goToUpdate = ->
    if Blaze._globalHelpers.isIOS()
      cordova.InAppBrowser.open('https://itunes.apple.com/app/gu-shi-tie/id957024953', '_system')
    else
      cordova.InAppBrowser.open('http://a.app.qq.com/o/simple.jsp?pkgname=org.hotshare.everywhere', '_system')
  @getTopicFollowId = ->
    count = Follower.find({"userId":Meteor.userId()}).count()
    topicCount = Topics.find({'type':'follow',"userId":Meteor.userId()}).count()
    if count > 0 and !Session.get 'followTopicNow'
      Session.set 'followTopicNow', 'my-follow'
    if count is 0 and !Session.get 'followTopicNow'
      if topicCount > 0
        Session.set 'followTopicNow', Topics.findOne({'type':'follow',"userId":Meteor.userId()}).followId
      else
        Session.set 'followTopicNow', Topics.findOne({"isFollowTopic":true},{sort: {index: 1}})._id

  Template.home.onCreated ()->
    if withFollowTopic
      Meteor.subscribe("follows")
      Meteor.subscribe("follower")
      Meteor.subscribe("registerTopic")
      Meteor.subscribe("followTopicUser")
      getTopicFollowId()
    
  Template.home.helpers
    myfollow:()->
      count = Follower.find({"userId":Meteor.userId()}).count()
      if count > 0
        return true
      else
        return false
    topiclist:()->
      count = Topics.find({'type':'follow',"userId":Meteor.userId()}).count()
      if count > 0
        return Topics.find({'type':'follow',"userId":Meteor.userId()})
      else
        return Topics.find({"isFollowTopic":true},{sort: {index: 1}})
    withFollowTopic:()->
      return withFollowTopic
    wasLogon:()->
      Session.get('persistentLoginStatus')
    isCordova:()->
      Meteor.isCordova
    isFirstLog:()->
      Session.get('isFlag');
  Template.home.events
    'click .swiper-slide': (event)->
      followId = event.currentTarget.id
      Session.set 'followTopicNow' , followId
    'click .top-series-btn': (event)->
      Router.go '/seriesList'
    'click #follow': (event)->
      history = Session.get('history_view') || [];
      history.push {
        view: 'home',
        scrollTop: document.body.scrollTop
      }
      Session.set('history_view',history);
      Router.go '/searchFollow'
    'click .clickHelp':(event)->
      PUB.page '/help'
    'click .closebtn':()->
      $('.app-rate').fadeOut()
      promptForRatingWindowButtonClickHandler(2)
    'click .btn-rate1':()->
      $('.app-rate').fadeOut()
      promptForRatingWindowButtonClickHandler(3)
    'click .btn-rate2':()->
      $('.app-rate').fadeOut()
      promptForRatingWindowButtonClickHandler(3)
  Template.home.rendered=->
    flag = window.localStorage.getItem("firstLog") == 'first'
    Session.set('isFlag', !flag)
    if withFollowTopic
      mySwiper = new Swiper '.swiper-container', {
        freeMode: true,
        slidesPerView: 'auto',
        freeModeSticky: true
      }
    checkNewVersion()

Tracker.autorun((t)->
  if Session.get('latestVersionAlert')
    t.stop()
    setTimeout(()->
      # Dialogs.alert('我们已为您备好更有趣新版本，记得去更新哦~', null, '新版本提示', '好的')
      navigator.notification.confirm(
          '我们已为您备好更有趣新版本，记得去更新哦~'
          (index)->
            if index is 2
              goToUpdate()
          '新版本提示'
          ['下次更新', '马上更新']
        )
    , 1000)
);

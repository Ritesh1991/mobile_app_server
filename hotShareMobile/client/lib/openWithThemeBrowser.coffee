@openWithThemeBrowser = (link)->
  ref = cordova.ThemeableBrowser.open(link,'_blank',{
    closeButton: {
      image: 'back',
      imagePressed: 'close_pressed',
      align: 'left',
      event: 'closePressed'
    },
    title:{
      color: '000000',
      showPageTitle: true
    },
    backButtonCanClose: true,
    # menu: {
    #   image: 'share',
    #   imagePressed: 'share_pressed',
    #   align: 'right',
    #   cancel: '取消',
    #   items: [
    #     {
    #       event: 'shareWechatFriend',
    #       label: '微信好友',
    #       image:'share_weixin_friends'
    #     },
    #     {
    #       event: 'shareWechatFriendField',
    #       label: '微信朋友圈',
    #       image:'share_weixin_timeline'
    #     },
    #     {
    #       event: 'shareQQ',
    #       label: 'QQ好友',
    #       image:'share_qq_friends'
    #     },
    #     {
    #       event: 'shareQQZone',
    #       label: 'QQ空间',
    #       image:'share_qq_qzone'
    #     },
    #     {
    #       event: 'shareMore',
    #       label: '更多',
    #       image:'share_more'
    #     }
    #   ]
    # },
    statusbar: {
      color: '#000000'
    },
    toolbar: {
      height: 44,
      color: '#F0F0F0'
    }
  })
  ref.addEventListener('closePressed', (event) ->
    ref.close()
  )
  # ref.addEventListener('toPost', (event) ->
  #   ref.close()
  #   console.log("postId:"+event.postId)
  #   Meteor.setTimeout ()->
  #     Router.go '/posts/'+event.postId
  #   ,300
  # )
  # ref.addEventListener('shareWechatFriend', (event) ->
  #   console.log("shareWechatFriend Pressed!")
  #   window.plugins.toast.showShortCenter(TAPi18n.__("preparePicAndWait"));
  #   downloadFromBCS imgUrl, (result) ->
  #     if result
  #       shareToWechatSession title, '来自故事贴', result, shareUrl
  #     else
  #       PUB.toast TAPi18n.__('failToGetPicAndTryAgain')
  #     return  
  # )
  # ref.addEventListener('shareWechatFriendField', (event) ->
  #   console.log("shareWechatFriendField Pressed！")
  #   window.plugins.toast.showShortCenter(TAPi18n.__("preparePicAndWait"));
  #   downloadFromBCS imgUrl, (result) ->
  #     if result
  #       shareToWechatTimeLine title, '来自故事贴', result, shareUrl
  #     else
  #       PUB.toast TAPi18n.__('failToGetPicAndTryAgain')
  #     return 
  # )
  # ref.addEventListener('shareQQ', (event) ->
  #   console.log("shareQQ Pressed！")
  #   window.plugins.toast.showShortCenter(TAPi18n.__("preparePicAndWait"));
  #   shareToQQ(title, "来自故事贴",imgUrl,shareUrl);
  # )
  # ref.addEventListener('shareQQZone', (event) ->
  #   console.log("shareQQZone Pressed！")
  #   window.plugins.toast.showShortCenter(TAPi18n.__("preparePicAndWait"));
  #   shareToQQZone(title, "来自故事贴",imgUrl,shareUrl);
  # )
  # ref.addEventListener('shareMore', (event) ->
  #   console.log("shareMore Pressed！")
  #   window.plugins.toast.showShortCenter(TAPi18n.__("preparePicAndWait"));
  #   downloadFromBCS imgUrl, (result) ->
  #     if result
  #       shareToSystem title, '来自故事贴', result, shareUrl
  #     else
  #       PUB.toast TAPi18n.__('failToGetPicAndTryAgain')
  #     return 
  # )

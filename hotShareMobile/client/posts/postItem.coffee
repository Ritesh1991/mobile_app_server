
if Meteor.isClient
  @sendMqttMessageToFollower=(type, to, text)->
    username = Meteor.user().profile.fullname || Meteor.user().username
    if type is 'follow'
      to.isFollow = true
      text = '刚刚关注了你'
    msg = {
      _id: new Mongo.ObjectID()._str,
      form:{
        id: Meteor.userId(),
        name: username,
        icon: Meteor.user().profile.icon || '/userPicture.png'
      },
      to: to,
      to_type: 'user',
      type: 'text',
      text: text,
      create_time: new Date(Date.now() + MQTT_TIME_DIFF),
      is_read: false
    }
    SimpleChat.Messages.insert msg, ()->
      console.log 'Messages insert.'
      sendMqttUserMessage(msg.to.id, msg)
    checkMqttMsgSessionToUser(to,text)
  @checkMqttMsgSessionToUser=(to,text)->
    count = SimpleChat.MsgSession.find({'userId':to.id,'toUserId':Meteor.userId()}).count()
    if count is 0
      doc = {
        _id: new Mongo.ObjectID()._str,
        count:0,
        createAt: new Date(),
        lastText: text,
        sessionType: "user",
        toUserIcon: Meteor.user().profile.icon || '/userPicture.png',
        toUserId: Meteor.userId(),
        toUserName: Meteor.user().profile.fullname || Meteor.user().username,
        updateAt: new Date(),
        userIcon: to.icon,
        userId: to.id,
        userName: to.name
      }
      SimpleChat.MsgSession.insert doc
  
  @messageBasedOnPost = (type,desc,postData)->
      to = {
        id: postData.owner,
        name: postData.ownerName,
        icon: postData.ownerIcon,
        pcomment: desc
      }
      sendMqttMessageToUser(type,to,postData)
  @sendMqttMessageToUser=(type,to,postData)->
    if(Meteor.userId() && to && Meteor.userId() == to.id)
      return
    username = Meteor.user().profile.fullname || Meteor.user().username
    if type is 'thumbsUp'
      to.isThumbsUp = true
      text = '我赞了你的文章《' + postData.title + '》哦~'
    else if type is 'thumbsDown'
      to.isThumbsDown = true
      text = '我踩了你的文章《' + postData.title + '》哦~'
    else if type is 'pcomments'
      to.isPcomments = true
      text = '我评论了你的文章《' + postData.title + '》中的段落'
      if to.pcommentContent
        text = '“' + to.pcommentContent + '”' + '\n' + "---- " + '我评论了你的文章《' + postData.title + '》中的段落'
    else if type is 'timeline'
      to.isLinkText = true
      text = '文章不错,已转发到微信朋友圈 -- ' + postData.title
    else if type is 'chat'
      to.isLinkText = true
      text = '文章不错,已转发到微信群聊 -- ' + postData.title
    else if type is 'system'
      to.isLinkText = true
      text = '文章不错,已转发到手机应用 -- ' + postData.title
    to.isPostAbstract = true
    to.mainImage = postData.mainImage
    msg = {
        _id: new Mongo.ObjectID()._str,
        form:{
          id: Meteor.userId(),
          name: username,
          icon: Meteor.user().profile.icon || '/userPicture.png'
        },
        title: postData.title,
        addontitle: postData.addontitle,
        mainImage: postData.mainImage,
        postId: postData._id,
        to: to,
        to_type: 'user',
        type: 'text',
        text: text,
        create_time: new Date(Date.now() + MQTT_TIME_DIFF),
        is_read: false
      }
    console.log('msg data is ' + msg)
    SimpleChat.Messages.insert msg, ()->
      console.log 'Messages insert.'
      sendMqttUserMessage(msg.to.id, msg)
    checkMqttMsgSessionToUser(to,text)
  @getLocalImagePath=(path,uri,id)->
    if !path or !id
      return ''
    $selector = $(".image_"+id)
    #cover IOS cdvfile:// and android file:///
    if (path.indexOf('file://') > -1) and (window.wkwebview or withLocalBase64)
      if $selector and $selector.attr('data-original') and $selector.attr('data-original') isnt '' and $selector.attr('data-original').indexOf('data:') is 0
        return $selector.attr('data-original')
      fileExtension = uri.replace(/^.*\./, '')
      console.log('Path need to be replaced ' + path + ' this URI ' + uri + ' extension ' + fileExtension)
      `
          window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function() {
              window.resolveLocalFileSystemURL(uri, function (fileEntry) {
                  fileEntry.file(function (file) {
                      var reader = new FileReader();
                      reader.onloadend = function (event) {
                          var localURL = event.target._localURL;
                          //retCount++;
                          var smallImage = event.target.result;
                          console.log('got small image ');
                          $(".image_"+id).attr('data-original',smallImage);
                      };
                      reader.readAsDataURL(file);
                  }, function (e) {
                      console.log('fileEntry.file Error = ' + e);
                  });
              }, function (e) {
                  console.log('resolveLocalFileSystemURL Error = ' + e);
              });
          },function(){
              console.log('Request file system error');
          });
      `
      return ''
    path
  getBaseWidth=()->
    ($('.showPosts').width()-30)/6
  getBaseHeight=()->
    ($('.showPosts').width()-30)/6
  layoutHelper=[0,0,0,0,0,0]
  imageMarginPixel=5
  @layoutHelperInit = ()->
    #在gridster之前需调用此方法，否则div#test的height会继承上次的设置，并每次加倍
    layoutHelper=[0,0,0,0,0,0]
  getLayoutTop=(helper,col,sizeX)->
    max=0
    for i in [col..(col+sizeX-1)]
      max=Math.max(max,helper[(i-1)])
    max
  updateLayoutData=(helper,col,sizeX,bottom)->
    for i in [col..(col+sizeX-1)]
      helper[(i-1)]=bottom
  simpleEditorIOSstyle = ()->
    if $('.simpleEditorPost .textDiv1Link div') and $('.simpleEditorPost .textDiv1Link div').length > 0
      $('.simpleEditorPost .textDiv1Link').css('white-space','normal')
  @getPcommentPlaceHolder=()->
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
  @showPcommentInputTextarea=()->
    pcommentPlaceHolderText = getPcommentPlaceHolder()
    textField = document.createElement("textarea")
    textField.setAttribute("name","pcommentInput-form")
    textField.setAttribute("cols",30)
    textField.setAttribute("rows",10)
    textField.setAttribute("placeholder",pcommentPlaceHolderText)
    textField.setAttribute("autofocus",'autofocus')
    textField.setAttribute("id","pcommitReport")
    document.getElementById('pcommentInputPageBody').appendChild(textField)
    $('.pcommentInputPages').fadeIn 300, ()->
      $('#pcommitReport').focus()
  Template.postItem.onRendered ()->
    this.$('img.lazy').lazyload()
    element=this.find('.element')
    myData=this.data
    parentNode=element.parentNode
    simpleEditorIOSstyle()
    if myData.index is 0
      #Initial the layoutHelper
      updateLayoutData(layoutHelper,1,6,parentNode.offsetTop)
    element.style.top=getLayoutTop(layoutHelper,myData.data_col,myData.data_sizex)+imageMarginPixel+'px'
    if myData.data_col isnt 1
      element.style.left=(parentNode.offsetLeft+(myData.data_col-1)*getBaseWidth()+imageMarginPixel)+'px'
      element.style.width=(myData.data_sizex*getBaseWidth()-imageMarginPixel)+'px'
    else
      element.style.left=parentNode.offsetLeft+(myData.data_col-1)*getBaseWidth()+'px'
      element.style.width=myData.data_sizex*getBaseWidth()+'px'
    if myData.type is 'image'
      element.style.height=myData.data_sizey*getBaseHeight()-5+'px'
    else if myData.type is 'video'
      element.style.height=myData.data_sizey*getBaseHeight()+'px'
    elementBottom=element.offsetTop+element.offsetHeight
    updateLayoutData(layoutHelper,myData.data_col,myData.data_sizex,elementBottom)
    parentNode.style.height=getLayoutTop(layoutHelper,1,6)-parentNode.offsetTop+'px'
    this.$('.textDiv1Link').linkify();
    this.$('.textDiv1Link a').each ()->
      $(this).addClass('_post_item_a')
      $(this).attr('target', '_blank')
    element.style.visibility = '';
    $('#'+myData._id).attr('data-height': $('#'+myData._id).height())
    $('#'+myData._id).bind 'DOMNodeInserted', (e) ->
      console.log 'element now contains '
      postItem = $(this)
      offsetHeight = postItem.height() - parseInt(postItem.attr('data-height'))
      console.log offsetHeight
      if offsetHeight == 0
        return
      testDivHeight = parseInt($('#test').css('height'))
      $('#test').css 'height', testDivHeight + offsetHeight + 'px'
      postItem.attr 'data-height': postItem.height()
      postItem.nextAll().each ->
        try
          item = $(this)
          top = offsetHeight + item.position().top
          item.css('top', top + 'px')
        catch error
          console.log  error
  Template.postItem.events
    'click ._post_item_a': (e)->
      url = $(e.currentTarget).attr('href').replaceAll(/"/, "")
      if url.startsWith('http://') or url.startsWith('https://')
        handleAddedLink(url)
      else
        url = 'http://' + url
        handleAddedLink(url)
    'click .thumbsUp': (e)->
      i = this.index
      Session.set("pcommetsId","")
      thumbsUpHandler(e,this)
      type = 'thumbsUp'
      postData = Session.get('postContent')
      to = {
        id: postData.owner,
        name: postData.ownerName,
        icon: postData.ownerIcon,
        pcommentIndexNum: i,
        pcomment: postData.pub[i].text.replace(/<(?:.|\n)*?>/gm, '')
      }
      likeUserId = postData.pub[i].likeUserId
      userId = Meteor.userId()
      if to.id isnt Meteor.userId()
        unless likeUserId and likeUserId[userId]
          sendMqttMessageToUser(type,to,postData)
    'click .thumbsDown': (e)->
      i = this.index
      Session.set("pcommetsId","")
      thumbsDownHandler(e,this)
      type = 'thumbsDown'
      postData = Session.get('postContent')
      to = {
        id: postData.owner,
        name: postData.ownerName,
        icon: postData.ownerIcon,
        pcommentIndexNum: i,
        pcomment: Session.get("postContent").pub[i].text.replace(/<(?:.|\n)*?>/gm, '')
      }
      dislikeUserId = postData.pub[i].dislikeUserId
      userId = Meteor.userId()
      if to.id isnt Meteor.userId()
        unless dislikeUserId and dislikeUserId[userId]
          sendMqttMessageToUser(type,to,postData)
    'click .pcomments': (e)->
      Session.set("pcommetsClicked",true)
      Session.set("pcommetsReply",false)
      $(e.currentTarget).parent().parent().parent().addClass('post-pcomment-current-pub-item').attr('data-height': $(e.currentTarget).parent().parent().parent().height())
      bgheight = $('.post-pcomment-current-pub-item').offset().top+parseInt($('.post-pcomment-current-pub-item').attr('data-height'))+50
      Session.set("pcommetsId","")
      backgroundTop = 0-$(window).scrollTop()
      Session.set('backgroundTop', backgroundTop);
      Meteor.setTimeout ()->
          if Session.get('pcommentsValue') isnt ''
            $('#pcommitReport').val(Session.get('pcommentsValue'))
        ,100
      pcommentPlaceHolderText = getPcommentPlaceHolder()
      Session.set "pcommentIndexNum", this.index
      Session.set 'pcommentPlaceHolderText', pcommentPlaceHolderText
      showPcommentInputTextarea()
    'click .pcommentsold': (e)->
      Session.set("pcommetsClicked",true)
      Session.set("pcommetsReply",false)
      $(e.currentTarget).parent().parent().parent().addClass('post-pcomment-current-pub-item').attr('data-height': $(e.currentTarget).parent().parent().parent().height())
      bgheight = $('.post-pcomment-current-pub-item').offset().top+parseInt($('.post-pcomment-current-pub-item').attr('data-height'))+50
      $('.showBgColor').attr('style','overflow:hidden;min-width:' + $(window).width() + 'px;' + 'height:' + bgheight + 'px;')
      Session.set("pcommetsId","")
      backgroundTop = 0-$(window).scrollTop()
      Session.set('backgroundTop', backgroundTop);
      #$('body').attr('style','position:fixed;top:'+Session.get('backgroundTop')+'px;')
      $('.pcommentInput,.alertBackground').fadeIn 300, ()->
        $('#pcommitReport').focus()
      $('#pcommitReport').focus()
      # $('.showBgColor').css('min-width',$(window).width())
      Session.set "pcommentIndexNum", this.index
    'click .bubble':(e)->
      Session.set("pcommetsClicked",true)
      Session.set "pcommentIndexNum", $(e.currentTarget).parent().parent().parent().index(".element")
      pcommentSelectedIndex = $(e.currentTarget).parent().index()
      console.log 'pcommentSelectedIndex >>>'+pcommentSelectedIndex
      Session.set('pcommentSelectedIndex', pcommentSelectedIndex)
      $(e.currentTarget).parent().parent().parent().addClass('post-pcomment-current-pub-item').attr('data-height': $(e.currentTarget).parent().parent().parent().height())
      Session.set 'pcommentInputPromptPageUserId', this.userId
      #if this.userId is Meteor.userId()
      if this.userId is Meteor.userId() or Meteor.userId() is Session.get('postContent').owner
        $(e.currentTarget).addClass('delbubblestyle')
        $('.pcommentInputPromptPage').show()
        return
      Session.set("pcommetsReply",true)
      bgheight = $('.post-pcomment-current-pub-item').offset().top+parseInt($('.post-pcomment-current-pub-item').attr('data-height'))+50
      Session.set("pcommetsId","")
      backgroundTop = 0-$(window).scrollTop()
      Session.set('backgroundTop', backgroundTop);
      showPcommentInputTextarea()

    'click .play_area': (e)->
      if window._media
        window._media.stop()
      current_id = $(e.currentTarget).find('audio').attr('id')
      $content = $('.showPosts .content')
      $node = $content.find('.play_area')
      for item in $node
        #console.log item
        if item.classList.contains('music_playing')
          audio=item.lastElementChild
          unless audio.id is current_id
            item.classList.remove('music_playing')
            audio.pause()
      $node=$(e.currentTarget)
      $audio=$node.find('audio')
      if $node.hasClass('music_playing')
        $node.removeClass('music_playing')
        $audio.trigger('pause')
        if window._media and $audio.attr('id') is window._music_id
          document.getElementById('audio_' + window._music_id).pause()
      else
        $node.addClass('music_playing')
        $audio.trigger('play')
        if window._media and $audio.attr('id') is window._music_id
          document.getElementById('audio_' + window._music_id).play()

      $video = $node.find("video")
      if $video.get(0)
        $video.siblings('.video_thumb').fadeOut(100)
        if $video.get(0).paused
          $video.get(0).play()
        else
          $video.get(0).pause()
      return
    'pause audio':()->
      console.log('Audio Paused')
    'playing audio':()->
      console.log('Audio playing')
    'ended audio': (e)->
      console.log('Audio End')
      if $(e.currentTarget).parent().hasClass('music_playing')
        $(e.currentTarget).parent().removeClass('music_playing')
    'error audio': (e)->
      console.log('Audio Error')
      if $(e.currentTarget).parent().hasClass('music_playing')
        $(e.currentTarget).parent().removeClass('music_playing')
    'playing video':(e)->
      $node=$(e.currentTarget).parent()
      if $node
        $curVideo = $node.find("video")
        if $curVideo and $curVideo.get(0)
          $curVideo.siblings('.video_thumb').fadeOut(100)

  Template.postItem.helpers
    getImageItem:(mImg,imgurl)->
      if (mImg.indexOf('file://') >= 0)
        if Session.get(mImg) is undefined
          ProcessImage = (URI,smallImage)->
            if smallImage
              Session.set(mImg, smallImage)
            else
              Session.set(mImg, '/noimage.png')
          getBase64OfImage('','',mImg,ProcessImage)
        Session.get(mImg)
      else
        imgurl
    isLocalImgUrlType: (imgUrl)->
      if imgUrl and imgUrl.indexOf('file://') > -1
        return true
      else
        return false
    isDraft: ()->
      Session.get('showDraft')
    DraftImageItem: (path,uri,id)->
      getLocalImagePath(path,uri,id)
    isOverLapping: (id)->
      element = document.getElementById(id)
      if element is null
        return false
      rect1 = document.getElementById(id).getBoundingClientRect()
      rect2 = document.getElementById($("#"+id).nextAll('.element')[0].id).getBoundingClientRect()
      overlapping = !(rect1.right < rect2.left or rect1.left > rect2.right or rect1.bottom < rect2.top or rect1.top > rect2.bottom)
      console.log(rect1.height)
      if overlapping
        console.log('被挡住了')
      else
        console.log('没有被挡住')
      return overlapping
    addTopOffsetStyle: (id)->
      rect1 = document.getElementById(id).getBoundingClientRect()
      rect2 = document.getElementById($("#"+id).nextAll('.element')[0].id).getBoundingClientRect()
      offsetTopLen = Number(rect1.height - (rect2.top - rect1.top)) + 15
      console.log('顶部偏移量为: '+offsetTopLen)
      # 更新容器高度
      testHeight = Number($('#test').css('height').slice(0,-2))
      $('#test').css({height: testHeight+Number(offsetTopLen)+'px'})
      # 更新后面的元素的top
      domNeedUpdate = $('#'+id).nextAll()
      domNeedUpdate.each () ->
        top = $(this).css('top').slice(0,-2)
        $(this).css({top: Number(top)+Number(offsetTopLen)+'px'})
      return
    hasm3u8: (videoInfo)->
      unless videoInfo
        return false
      playUrl = videoInfo.playUrl
      if playUrl.length > 5 and playUrl.lastIndexOf('.m3u8') is playUrl.length-5
        return true
      return false
    hasVideoInfo: (videoInfo)->
      unless videoInfo
        return false

      playUrl = videoInfo.playUrl
      zhifa_serverURL = "http://data.tiegushi.com"

      # m3u8
      if playUrl.length > 5 and playUrl.lastIndexOf('.m3u8') is playUrl.length-5
        if $('head script[tag=mp4]').length > 0
          $('head script[tag=mp4]').remove()
          $('head link[tag=mp4]').remove()
        if $('head script[tag=m3u8]').length > 0
          return true

        $('head').append('<link tag="m3u8" href="http://data.tiegushi.com/video-js.min.css" rel="stylesheet">')
        $('head').append('<script tag="m3u8">token = "EioJxvLpZHJvcrYdJ"; trafficDisplay = true; </script>')
        $('head').append('<script tag="m3u8" src="http://data.tiegushi.com/bundle-hls.js"></script>')
      # other video
      else
        if $('head script[tag=m3u8]').length > 0
          $('head script[tag=m3u8]').remove()
          $('head link[tag=m3u8]').remove()
        if $('head script[tag=mp4]').length > 0
          return true
        $('head').append('<link tag="mp4" href="http://data.tiegushi.com/video-js.min.css" rel="stylesheet">')
        $('head').append('<script tag="mp4">token = "7gFCGdcqXw4mSc252"; trafficDisplay = false; </script>')
        $('head').append('<script tag="mp4" src="http://data.tiegushi.com/bundle-raidcdn-mini-2.21.4.js"></script>')
      return true
    myselfClickedUp:->
      userId = Meteor.userId()
      if this.dislikeUserId isnt undefined and this.likeUserId[userId] is true
        return true
      else
        return false
    myselfClickedDown:->
      userId = Meteor.userId()
      if this.dislikeUserId isnt undefined and this.dislikeUserId[userId] is true
        return true
      else
        return false
    calcStyle: ()->
      # For backforward compatible. Only older version set style directly
      if this.style and this.style isnt ''
        ''
      else
        calcTextItemStyle(this.layout)
    isTextLength:(text)->
      if Session.get("postContent").allowComment is false
        return false
      else 
        if(text.trim().length>20)
          return true
        else if  text.split(/\r\n|\r|\n/).length > 1
          return true
        else
          return false
    pcIndex:->
      pcindex = Session.get("pcurrentIndex")
      if this.index is pcindex
        'dCurrent'
      else
        ''
    plike:->
      if this.likeSum is undefined
        0
      else
        this.likeSum
    hasHyperlink: ->
      if this.hyperlink is undefined or this.hyperlink is ''
        return false
      else
        return true
    hasPcomments: ->
      if this.pcomments isnt undefined and this.pcomments.length > 0
        return true
      else
        return false
    pcomment:->
      return this.pcomments
      
    isPcommentReply:->
      if this.toUsername and this.toUsername isnt ''
        return true
      else
        return false
    pdislike:->
      if this.dislikeSum is undefined
        0
      else
        this.dislikeSum
    pcomments:->
      if this.pcomments is undefined
        0
      else
        this.pcomments.length
    getStyle:->
      self=this
      pclength=0
      if self.pcomments
        pclength=self.pcomments.length
      userId=Session.get("pcommetsId")
      scolor="#F30B44"
      if userId and userId isnt ""
        if self.likeUserId and self.likeUserId[userId] is true
          scolor="#304EF5"
        if scolor is "#F30B44" and self.dislikeUserId and self.dislikeUserId[userId] is true
          scolor="#304EF5"
        if scolor is "#F30B44" and pclength>0
          for icomment in self.pcomments
            if icomment["userId"] is userId
              scolor="#304EF5"
              break
      if scolor is "#304EF5"
        if Session.get("toasted") is false
          Session.set "toasted",true
          Session.set("needToast",true)
      dislikeSum = 0
      if self.dislikeSum
        dislikeSum=self.dislikeSum
      likeSum=0
      if self.likeSum
        likeSum=self.likeSum
      if dislikeSum + likeSum + pclength is 0
        self.style
      else
        if self.style is undefined or self.style.length is 0
          "color: "+scolor+";"
        else
          self.style.replace("grey",scolor).replace("rgb(128, 128, 128)",scolor).replace("rgb(0, 0, 0)",scolor).replace("#F30B44",scolor)

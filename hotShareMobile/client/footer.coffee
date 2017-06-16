#space 2
if Meteor.isClient

  # $('#level2-popup-menu').on('hide.bs.modal', function (e) {
  #     alert("hidden")
  # }).on('show.bs.modal', function (e) {
  #   alert("show");
  # });
  $('#level2-popup-menu').on('hide.bs.modal', (e) ->
    alert 'hidden'
    return
  ).on 'show.bs.modal', (e) ->
    alert 'show'
    return
  Template.footer.helpers
    display_select_import_way: ()->
      Session.equals 'display_select_import_way',true
    is_wait_read_count: (count)->
      count > 0
    limit_top_read_count: (count)->
      count >= 99
    wait_read_count:->
      me = Meteor.user()
      counts = 0
      if me
        # if Session.equals('updataFeedsWithMe',true)
        #   return 0
        # else
        # counts += Feeds.find({
        #   followby: Meteor.userId(),
        #   isRead:{$ne: true},
        #   checked:{$ne: true},
        #   eventType:{$ne:'share'},
        #   createdAt: {$gt: new Date((new Date()).getTime() - 7 * 24 * 3600 * 1000)}
        # },{
        #   limit: 99
        # }).count()
        lists = SimpleChat.MsgSession.find({userId: Meteor.userId(),sessionType:'user'}).fetch()
        getLetterCounts = (item)->
          counts += item.count
        getLetterCounts item for item in lists
          # waitReadCount = Session.get('waitReadCount')
        #if me.profile and me.profile.waitReadCount
          #waitReadCount = me.profile.waitReadCount
          # if waitReadCount is undefined or isNaN(waitReadCount)
          #   waitReadCount = 0
          # if Session.get('channel') is 'bell' and waitReadCount > 0
          #   waitReadCount = 0
          #   Session.set('waitReadCount',0)
          #   Meteor.users.update({_id: Meteor.user()._id}, {$set: {'profile.waitReadCount': 0}});
          # return waitReadCount
      return counts
    wait_import_count:->
       return Session.get('wait_import_count')

    focus_style:(channelName)->
      channel = Session.get "focusOn"
      if channel is channelName
        $('.foot-btn').removeClass('focus')
        return "focus"
      else
        return ""
    icon_size:(channelName)->
      channel = Session.get "focusOn"
      if channel is channelName
        return true
    withFromExample:()->
      return withFromExample
    display_footer:()->
      console.log "document_body_scrollTop=" + Session.get("document_body_scrollTop")
      setTimeout(
        ()->
            document.body.scrollTop = Session.get("document_body_scrollTop")
        0
      )
      Meteor.isCordova
    fade:->
      if isAndroidFunc()
         ''
      else
         'fade'
  @prepareToEditorMode = ()->
    TempDrafts.remove({})
    $('body').removeClass('modal-open')
    Session.set 'isReviewMode','0'
    Session.set('draftTitle', '');
    Session.set('draftAddontitle', '');
    Drafts.remove({})
    Session.set 'NewImgAdd','true'
  @checkShareUrl = () ->
    if Meteor.user()
        window.plugins.userinfo.setUserInfo Meteor.user()._id, (->
            console.log 'setUserInfo was success '
            return
        ), ->
            console.log 'setUserInfo was Error!'
            return
        setTimeout(()->
            waitImportCount = ShareURLs.find().count()
            console.log 'waitImportCount :' + waitImportCount
            if waitImportCount > 0
              data = ShareURLs.find().fetch()
              console.log 'CustomDialog show!'
              #CustomDialog.show data[0]
        ,100)

  @editFromShare = (data)->
    Meteor.defer ()->
      $('.modal-backdrop.in').remove()
    prepareToEditorMode()
    PUB.page '/add'
    console.log 'type is ' + data.type
    console.log  'content'+data.content[0]
    if data.type is 'url'
       setTimeout(()->
          handleDirectLinkImport(data.content[0],1)
       ,100)
       return
    if data.type is 'image'
       Meteor.defer ()->
          importImagesFromShareExtension(data.content, (cancel, result,currentCount,totalCount)->
            if cancel
              #$('#level2-popup-menu').modal('hide');
              PUB.back()
              return
            if result
              console.log 'Local is ' + result.smallImage
              Drafts.insert {type:'image', isImage:true, owner: Meteor.userId(), imgUrl:result.smallImage, filename:result.filename, URI:result.URI, layout:''}
              if currentCount >= totalCount
                setTimeout(()->
                  Template.addPost.__helpers.get('saveDraft')()
                ,100)
          )
    # setTimeout(()->
    #   handleDirectLinkImport(url)
    # ,100)
  Template.footer.events
    'click #home':(e)->
      Meteor.setTimeout ()->
        toLoadLatestFollowPost()
      ,100
      if (Session.get("myHotPostsChanged"))
        Session.set("myHotPostsChanged", false)
        navigator.notification.confirm(
          '您改变了热门帖子, 要保存吗?'
          (index)->
            if index is 2
              saveHotPosts()
            PUB.page('/')
          '提示'
          ['暂不','保存']
        )
        return
      PUB.page('/')
    'click #search':(e)->
      if (Session.get("myHotPostsChanged"))
        Session.set("myHotPostsChanged", false)
        navigator.notification.confirm(
          '您改变了热门帖子, 要保存吗?'
          (index)->
            if index is 2
              saveHotPosts()
            PUB.page('/search')
          '提示'
          ['暂不','保存']
        )
        return
      PUB.page('/search')
    'click #bell':(e)->
      Meteor.defer ()->
        me = Meteor.user()
        if me and me.profile and me.profile.waitReadCount
          if me.profile.waitReadCount > 0
            Meteor.users.update({_id: Meteor.user()._id}, {$set: {'profile.waitReadCount': 0}});
      if (Session.get("myHotPostsChanged"))
        Session.set("myHotPostsChanged", false)
        navigator.notification.confirm(
          '您改变了热门帖子, 要保存吗?'
          (index)->
            if index is 2
              saveHotPosts()
            PUB.page('/bell')
          '提示'
          ['暂不','保存']
        )
        return
      # PUB.page('/bell')
      PUB.page('/simple-chat/user-list/'+Meteor.userId())
    'click #user':(e)->
      $('.importProgressBar, .b-modal, .toEditingProgressBar').remove()
      if (Session.get("myHotPostsChanged"))
        Session.set("myHotPostsChanged", false)
        navigator.notification.confirm(
          '您改变了热门帖子, 要保存吗?'
          (index)->
            if index is 2
              saveHotPosts()
            PUB.page('/user')
          '提示'
          ['暂不','保存']
        )
        return
      PUB.page('/user')
    'click #add': (e)->
      if (Session.get("myHotPostsChanged"))
        Session.set("myHotPostsChanged", false)
        navigator.notification.confirm(
          '您改变了热门帖子, 要保存吗?'
          (index)->
            if index is 2
              saveHotPosts()
            $('.importProgressBar, .b-modal, .toEditingProgressBar').remove()
            Tips.show('_tips_addPost')
          '提示'
          ['暂不','保存']
        )
        return
      $('.importProgressBar, .b-modal, .toEditingProgressBar').remove()
      Tips.show('_tips_addPost')
      if Session.get('persistentLoginStatus') and !Meteor.userId() and !Meteor.loggingIn()
        window.plugins.toast.showLongCenter("登录超时，需要重新登录~");
        e.stopPropagation()
        PUB.page('/')
    'click #album-select':(e)->
      Meteor.defer ()->
        $('.modal-backdrop.in').remove()
      prepareToEditorMode()
      PUB.page '/add'
      Meteor.defer ()->
          selectMediaFromAblum(20, (cancel, result,currentCount,totalCount)->
            if cancel
              #$('#level2-popup-menu').modal('hide');
              PUB.back()
              return
            if result
              console.log 'Local is ' + result.smallImage
              Drafts.insert {type:'image', isImage:true, owner: Meteor.userId(), imgUrl:result.smallImage, filename:result.filename, URI:result.URI, layout:''}
              if currentCount >= totalCount
                Meteor.setTimeout(()->
                  Template.addPost.__helpers.get('saveDraft')()
                ,100)
          )
    'click #web-import':(e)->
      $('#level2-popup-menu').modal('hide')
      #if we choose to use server import
      if withServerImport is true
        Session.set('display_select_import_way',true)
      #if we disable server import and just want to use mobile side import
      else
        Session.set('display_select_import_way',false)
        Meteor.defer ()->
          $('.modal-backdrop.in').remove()
        prepareToEditorMode()
        PUB.page '/add'
        cordova.plugins.clipboard.paste (link)->
          regexToken = /\b(((http|https?)+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig
          matchArray = regexToken.exec( link )
          if matchArray isnt null
            importLink = matchArray[0]
            if matchArray[0].indexOf('http') is -1
              importLink = "http://"+matchArray[0]
            Meteor.setTimeout(()->
              handleDirectLinkImport(importLink,1)
            ,100)
          else
            handleAddedLink(null)
            window.plugins.toast.showLongCenter("粘贴板内容并非有效连接，请手动粘贴\n浏览器内容加载后，点击地址栏右侧\"导入\"按钮");
        ,()->
          handleAddedLink(null)
          window.plugins.toast.showLongCenter("无法获得粘贴板数据，请手动粘贴\n浏览器内容加载后，点击地址栏右侧\"导入\"按钮");
    'click #share-import':(e)->
        window.plugins.shareExtension.getShareData ((data) ->
            if data
                editFromShare(data)
                window.plugins.shareExtension.emptyData ((count)->
                   if count == 0
                      return Session.set('wait_import_count',false)
                   Session.set('wait_import_count',true)
                ),->
                   console.log 'deleteShareData was failed!'
          ), ->
            Session.set('wait_import_count',false)
            console.log 'getShareData was Error!'
    'click #photo-select':(e)->
      Meteor.defer ()->
        $('.modal-backdrop.in').remove()
      prepareToEditorMode()
      PUB.page '/add'
      Meteor.defer ()->
        if window.takePhoto
          window.takePhoto (result)->
            console.log 'result from camera is ' + JSON.stringify(result)
            if result
              Drafts.insert {type:'image', isImage:true, owner: Meteor.userId(), imgUrl:result.smallImage, filename:result.filename, URI:result.URI, layout:''}
              Meteor.setTimeout(()->
                Template.addPost.__helpers.get('saveDraft')()
              ,100)
            else
              PUB.back()
    'click #from-example': (e)->
      example = JSON.parse('{"_id":"zwmXLe5tuWDKCZQM8","pub":[{"_id":"EvGDbdmsv7wASfojn","type":"image","currentCount":1,"totalCount":1,"isImage":true,"owner":"zR2Y5Ar9k9LZQS9vS","imgUrl":"http://data.tiegushi.com/ocmainimages/mainimage10.jpg","filename":"zR2Y5Ar9k9LZQS9vS_1494485644336_cdv_photo_002.jpg","URI":"file:///var/mobile/Containers/Data/Application/532583D2-EAE5-4B78-ACBC-1D0BE4C28E9C/Library/files/drafts/cdv_photo_002.jpg","data_row":1,"data_col":1,"data_sizex":6,"data_sizey":6},{"_id":"2krwF2Gx94Pp53979","type":"text","isImage":false,"owner":"zR2Y5Ar9k9LZQS9vS","text":"点击选择，修改文本","style":"","data_row":7,"data_col":1,"data_sizex":6,"data_sizey":2},{"_id":"ZavyJ5rMQHs6ggh95","type":"image","currentCount":1,"totalCount":1,"isImage":true,"owner":"zR2Y5Ar9k9LZQS9vS","imgUrl":"http://data.tiegushi.com/ocmainimages/mainimage11.jpg","filename":"zR2Y5Ar9k9LZQS9vS_1494485704758_cdv_photo_003.jpg","URI":"file:///var/mobile/Containers/Data/Application/532583D2-EAE5-4B78-ACBC-1D0BE4C28E9C/Library/files/drafts/cdv_photo_003.jpg","data_row":9,"data_col":1,"data_sizex":6,"data_sizey":6},{"_id":"bq9jTr7Y8pXyLRTzz","type":"text","isImage":false,"owner":"zR2Y5Ar9k9LZQS9vS","text":"点击选择，修改文本","style":"","data_row":15,"data_col":1,"data_sizex":6,"data_sizey":2},{"_id":"LwjKtrYJREF4nudAw","type":"image","currentCount":1,"totalCount":1,"isImage":true,"owner":"zR2Y5Ar9k9LZQS9vS","imgUrl":"http://data.tiegushi.com/ocmainimages/mainimage9.jpg","filename":"zR2Y5Ar9k9LZQS9vS_1494485716781_cdv_photo_004.jpg","URI":"file:///var/mobile/Containers/Data/Application/532583D2-EAE5-4B78-ACBC-1D0BE4C28E9C/Library/files/drafts/cdv_photo_004.jpg","data_row":17,"data_col":1,"data_sizex":6,"data_sizey":6},{"_id":"JZxcgQaWki6NukaF3","type":"text","isImage":false,"owner":"zR2Y5Ar9k9LZQS9vS","text":"点击选择，修改文本","style":"","data_row":23,"data_col":1,"data_sizex":6,"data_sizey":2}],"title":"故事样例","browse":0,"heart":[],"retweet":[],"comment":[],"commentsCount":0,"addontitle":"","mainImage":"http://data.tiegushi.com/ocmainimages/mainimage1.jpg","publish":true,"owner":"zR2Y5Ar9k9LZQS9vS","ownerName":"故事贴","ownerIcon":"/userPicture.png","createdAt":"2017-05-12T22:39:11.119Z","isReview":true,"insertHook":true,"import_status":"done","fromUrl":"","style":""}')
      post = Posts.findOne({_id: 'zwmXLe5tuWDKCZQM8'}) || (if localStorage.getItem('post-example') then JSON.parse(localStorage.getItem('post-example')) else null)
      post = post || example

      Meteor.defer ()->
        localStorage.setItem('post-example', JSON.stringify(post))
        $('.modal-backdrop.in').remove()
      prepareToEditorMode()
      PUB.page '/add'
      Meteor.defer ()->  
        #Clear draft first
        Drafts.remove({})
        #Prepare data from post
        fromUrl = ''
        if post.fromUrl and post.fromUrl isnt ''
          fromUrl = post.fromUrl
        draft0 = {_id: new Mongo.ObjectID()._str, type:'image', isImage:true, url: fromUrl, owner: Meteor.userId(), imgUrl:post.mainImage, filename:post.mainImage.replace(/^.*[\\\/]/, ''), URI:"", data_row:0,style:post.mainImageStyle}
        Drafts.insert(draft0)
        pub = post.pub;
        if pub.length > 0
          `
          for(var i=0;i<pub.length;i++){
            pub[i]._id = new Mongo.ObjectID()._str;
            pub[i].owner = Meteor.userId();
          }
          `
            
          ###
          Router.go('/add') will trigger addPost onRendered first, then defer function run.
          The Drafts.insert will trigger addPostItem OnRendered function run, then do the layout thing. The 2nd defer function
          will run after then. The final callback will be called after all item layout done, so closePreEditingPopup run.
          ###
          deferedProcessAddPostItemsWithEditingProcessBar(pub)

  Template.selectImportWay.helpers
    hasAssocaitedUsers: ()->
      (AssociatedUsers.find({}).count() > 0) or (UserRelation.find({userId: Meteor.userId()}).count() > 0)
  serverImportClick = (e, t)->
    Session.set('post_improt_way',e.currentTarget.id)
    Session.set('display_select_import_way',undefined)
    Meteor.defer ()->
      $('.modal-backdrop.in').remove()
    prepareToEditorMode()
    PUB.page '/add'
    cordova.plugins.clipboard.paste (link)->
      regexToken = /\b(((http|https?)+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig
      matchArray = regexToken.exec( link )
      if matchArray isnt null
        importLink = matchArray[0]
        if matchArray[0].indexOf('http') is -1
          importLink = "http://"+matchArray[0]
        Meteor.setTimeout(()->
          if e.currentTarget.id is 'serverImport'
            Session.set 'isServerImport', true
            handleDirectLinkImport(importLink)
          else
            handleDirectLinkImport(importLink,1)
        ,100)
      else
        handleAddedLink(null)
        window.plugins.toast.showLongCenter("粘贴板内容并非有效连接，请手动粘贴\n浏览器内容加载后，点击地址栏右侧\"导入\"按钮");
    ,()->
      handleAddedLink(null)
      window.plugins.toast.showLongCenter("无法获得粘贴板数据，请手动粘贴\n浏览器内容加载后，点击地址栏右侧\"导入\"按钮");
  Template.selectImportWay.events
    'click #mask': ->
      Session.set('display_select_import_way',undefined)
    'click .importWayBtn':(e,t)->
      serverImportClick(e, t)
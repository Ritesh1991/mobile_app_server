if Meteor.isClient
  @cleanDraft = ()->
    Drafts.remove({})
    TempDrafts.remove({})
  updateTopicPost=(topicPostObj)->
    topicPostId = topicPostObj.postId
    userId = topicPostObj.owner
    commentData = Comment.find({postId:topicPostId,userId:userId}, {sort: {createdAt: 1}}).fetch()
    if commentData and commentData.length > 0
      comment = ''
      for index of commentData
        comment += commentData[index].content
      r=comment.replace /\#([^\#|.]+)\#/g,(word)->
        topic = word.replace '#', ''
        topic = topic.replace '#', ''
        #console.log word
        if topic.length > 0 && topic.charAt(0)!=' '
          haveSpace = topic.indexOf ' ', 0
          if haveSpace > 0
              topic = topic[...haveSpace]
          console.log topic
          Meteor.call('updateTopicPostsAfterComment', topicPostId, topic, topicPostObj)
  @_editDraft = editDraft = (savedDraftData)->
      editorVersion = savedDraftData.editorVersion || 'fullEditor'
      if (editorVersion is 'simpleEditor')
        return Router.go('/newEditor?type=draft&id='+savedDraftData._id)

      callback = ()->
        TempDrafts.insert {
          _id:savedDraftData._id,
          pub:savedDraftData.pub,
          title:savedDraftData.title,
          addontitle:savedDraftData.addontitle,
          fromUrl:savedDraftData.fromUrl,
          mainImage: savedDraftData.mainImage,
          mainText: savedDraftData.mainText,
          owner:savedDraftData.owner,
          createdAt: savedDraftData.createdAt
        }
        # draft0 = {_id:savedDraftData._id, type:'image', isImage:true, url: savedDraftData.fromUrl, owner: Meteor.userId(), imgUrl:savedDraftData.mainImage, filename:savedDraftData.mainImage.replace(/^.*[\\\/]/, ''), URI:"", data_row:0,style:savedDraftData.mainImageStyle}
        # Drafts.insert(draft0)
        pub = savedDraftData.pub
        if pub.length > 0
          ###
          Router.go('/add') will trigger addPost onRendered first, then defer function run.
          The Drafts.insert will trigger addPostItem OnRendered function run, then do the layout thing. The 2nd defer function
          will run after then. The final callback will be called after all item layout done, so closePreEditingPopup run.
          ###
          deferedProcessAddPostItemsWithEditingProcessBar(pub)
        Session.set('fromDraftPost',true)
        Session.set('isReviewMode','0')
        Session.set 'showDraft', false
        Router.go('/add')

      # 没有取到草稿数据
      if (!savedDraftData or !savedDraftData.pub or savedDraftData.pub.length <= 0)
        post = Session.get("postContent")
        id = if post then post._id else ''
        if (!id and location.pathname.startsWith('/draftposts/'))
          id = location.pathname.substr('/draftposts/'.length)
        if (!id)
          PUB.alert('没有找到草稿数据，请返回上一页在重试~')
        else
          Meteor.subscribe("savedDraftsWithID", id, {
            onReady: ()->
              savedDraftData = SavedDrafts.findOne({_id: id})
              if (!savedDraftData)
                return PUB.alert('没有找到草稿数据，请返回上一页在重试~')
              callback()
            onStop: ()->
              savedDraftData = SavedDrafts.findOne({_id: id})
              if (!savedDraftData)
                return PUB.alert('没有找到草稿数据，请返回上一页在重试~')
              callback()
          })
      else
        callback()

  Template.showDraftPosts.created=->
    layoutHelperInit()
    Session.set("content_loadedCount", 0)
  Template.showDraftPosts.onRendered ->
    console.log('open draft.')
    Session.set 'showDraft', true
    if Session.get('postContent') and Session.get('postContent')._id
      Meteor.subscribe("savedDraftsWithID",Session.get('postContent')._id)
      unless Posts.find({_id:Session.get('postContent')._id}).count() > 0
        Meteor.subscribe("ViewPostsList",Session.get('postContent')._id)
    Session.setDefault "displayPostContent",true
    $('.mainImage').css('height',$(window).height()*0.55)
    postContent = Session.get("postContent")
    title=postContent.title.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '')
    unless Template.showDraftPosts.__helpers.get('is_server_import')() is true
      if postContent.publish is false
        console.log('Goto unpublish page...')
        Router.go('/unpublish')
    if postContent.addontitle
      title=title+":"+postContent.addontitle
    setTimeout ()->
      $("a[target='_blank']").click((e)->
        e.preventDefault();
        if Meteor.isCordova
          Session.set("isReviewMode","undefined")
          prepareToEditorMode()
          #PUB.page '/add'
          Session.set("ishyperlink",true)
          handleAddedLink($(e.currentTarget).attr('href'))
        else
          window.open($(e.currentTarget).attr('href'), '_blank', 'hidden=no,toolbarposition=top')
      )
    , 450
    $('.showBgColor').css('min-height',$(window).height())
    setTimeout ()->
      $lastEle = $('.element').last()
      height = parseInt($lastEle.css('top')) + $lastEle.height()
      $('#test').height(height)
    ,200

  Template.showDraftPosts.helpers
    is_server_import: ()->
      console.log('showDraftPosts: location.search = '+location.search)
      return location.search is '?server_import=true'
    getmainImage:()->
      mImg = this.mainImage
      if (mImg.indexOf('file:///') >= 0)
        if Session.get(mImg) is undefined
          ProcessImage = (URI,smallImage)->
            if smallImage
              Session.set(mImg, smallImage)
            else
              Session.set(mImg, '/noimage.png')
          getBase64OfImage('','',mImg,ProcessImage)
        Session.get(mImg)
      else
        this.mainImage
    showImporting: ()->
      this.import_status is 'importing' and this.ownerId is Meteor.userId()
    isMobile:->
      Meteor.isCordova
    displayPostContent:()->
      Session.get('displayPostContent')
    getMainImageHeight:()->
      $(window).height()*0.55
    getPostContent:(obj)->
      self = obj
      self.pub = self.pub || []
      console.log('call getPostContent')
      _.map self.pub, (doc, index, cursor)->
        _.extend(doc, {index: index})
    getPub:->
      self = Session.get("postContent")
      contentList = Template.showDraftPosts.__helpers.get('getPostContent')(self)
      loadedCount = if Session.get("content_loadedCount") then Session.get("content_loadedCount") else 0
      # console.log("loadedCount="+loadedCount+", "+contentList.length)
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
      contentList.slice(1, newLoadedCount)
    getPub2:->
      self = Session.get("postContent")
      self.pub = self.pub || []
      _.map self.pub, (doc, index, cursor)->
        _.extend(doc, {index: index})
    isCordova:()->
      Meteor.isCordova
    haveUrl:->
      if Session.get("postContent").fromUrl is undefined  or Session.get("postContent").fromUrl is ''
        false
      else
        true
  isASCII = (str)->
    /^[\x00-\x7F]*$/.test(str)
  countASCII = (string)->
    count = 0;
    for i in [0..(string.length-1)]
      if (isASCII(string.charAt(i)))
        count+=1
    return count

  Template.showDraftPosts.events
    'click #publish, click #modalPublish': (e)->
      currentTargetId = e.currentTarget.id
      ispreviewed = currentTargetId is "publish" and Session.get(Session.get('postContent')._id) is true
      if currentTargetId is "publish" and Session.get(Session.get('postContent')._id) isnt true
        $('#chooseAssociatedUser').modal('show')
        return
      history = []
      history.push {
          view: 'user'
          scrollTop: document.body.scrollTop
      }
      Session.set "history_view", history
      cleanDraft()
      Session.set('fromDraftPost',false)
      Session.set("backtoalldrafts",false)
      Meteor.defer ()->
        $('.modal-backdrop.fade.in').remove()
      if Meteor.user() is null
        window.plugins.toast.showShortBottom('请登录后发表您的故事')
        Router.go('/user')
        false
      else
        if(!Meteor.status().connected and Meteor.status().status isnt 'connecting')
          Meteor.reconnect()
        title = Session.get('postContent').title
        if title is '' or title is '[空标题]'
          window.plugins.toast.showShortBottom('请为您的故事加个标题')
          return

        #get the images to be uploaded
        postDraftData = Session.get('postContent').pub
        draftToBeUploadedImageData = []
        savedDraftData = Session.get('postContent')

        postId = savedDraftData._id
        addontitle = savedDraftData.addontitle
        title = savedDraftData.title
        mainImageStyle = savedDraftData.mainImageStyle
        mainText = savedDraftData.mainText
        fromUrl = savedDraftData.fromUrl
        editorVersion = savedDraftData.editorVersion

        modalUserId = $('#chooseAssociatedUser .modal-body dt.active').attr('userId')
        ownerUser = null
        if ispreviewed
          modalUserId = Session.get('post-publish-user-id')
        if modalUserId is Meteor.userId() or !modalUserId
          ownerUser = Meteor.user()
        else
          if ispreviewed
            ownerUser = {
              _id: modalUserId
              username: Session.get('import-select-user-data').username
              profile: {
                icon: Session.get('import-select-user-data').userIcon
                fullname: Session.get('import-select-user-data').fullname
              }
            }
          else
            ownerUser = {
              _id: modalUserId
              username: $('#chooseAssociatedUser .modal-body dt.active').attr('userName')
              profile: {
                icon: $('#chooseAssociatedUser .modal-body dt.active').attr('userIcon')
                fullname: $('#chooseAssociatedUser .modal-body dt.active').attr('userName')
              }
            }
            
        Session.set 'post-publish-user-id', ownerUser._id
        Session.set Session.get('postContent')._id, false
        ownerName = if ownerUser.profile and ownerUser.profile.fullname then ownerUser.profile.fullname else ownerUser.username
        ownerIcon = if ownerUser.profile and ownerUser.profile.icon then ownerUser.profile.icon else '/userPicture.png'

        if postDraftData.length > 1
          for i in [0..(postDraftData.length-1)]
            Drafts.insert(postDraftData[i])
          # console.log('Drafts is ')
          # console.log(Drafts.find().fetch())
          draftImageData = Drafts.find({type:'image'}).fetch()
          draftMusicData = Drafts.find({type:'music'}).fetch()
          draftVideoData = Drafts.find({type:'video'}).fetch()

          # console.log 'draftData arr list '
          # console.log draftImageData
          # console.log draftVideoData
          # console.log draftMusicData
          for i in [0..(draftImageData.length-1)]
              if !draftImageData[i].imgUrl
                continue
              unless draftImageData[i].imgUrl.toLowerCase().indexOf("http://data.tiegushi.com/") isnt -1
                # console.log 'push image to be uploaded.'
                draftToBeUploadedImageData.push(draftImageData[i])
          for music in draftMusicData
            if music.musicInfo.playUrl.toLowerCase().indexOf("http://")>= 0 or music.musicInfo.playUrl.toLowerCase().indexOf("https://")>= 0
              draftToBeUploadedImageData.unshift({})
              continue
            draftToBeUploadedImageData.push(music)
          for video in draftVideoData
            if video.videoInfo.imageUrl.toLowerCase().indexOf("http://")>= 0 or video.videoInfo.imageUrl.toLowerCase().indexOf("https://")>= 0
              draftToBeUploadedImageData.unshift({})
              continue
            draftToBeUploadedImageData.push(video)
          #uploadFileWhenPublishInCordova(draftToBeUploadedImageData, postId)
          #Don't add addpost page into history
          Session.set('terminateUpload', false)
          # console.log "draftToBeUploadedImageData is "
          # console.log draftToBeUploadedImageData
        else
          draftToBeUploadedImageData = []
        if draftToBeUploadedImageData.length > 0
          multiThreadUploadFileWhenPublishInCordova(draftToBeUploadedImageData, null, (err, result)->
            # console.log 'result is  '
            # console.log result
            unless result
              window.plugins.toast.showShortBottom('上传失败，请稍后重试')
              return
            if result.length < 1
              window.plugins.toast.showShortBottom('上传失败，请稍后重试')
              return
            for item in result
              # console.log item
              if item.uploaded and item._id
                if item.type is 'image' and item.imgUrl
                  Drafts.update({_id: item._id}, {$set: {imgUrl:item.imgUrl}});
                else if item.type is 'music' and item.musicInfo and item.musicInfo.playUrl
                  Drafts.update({_id: item._id}, {$set: {"musicInfo.playUrl":item.musicInfo.playUrl}});
                else if item.type is 'video' and item.videoInfo and item.videoInfo.imageUrl
                  Drafts.update({_id: item._id}, {$set: {"videoInfo.imageUrl":item.videoInfo.imageUrl}});
            if err
              window.plugins.toast.showShortBottom('上传失败，请稍后重试')
              return
            # console.log 'get errrrrrrrror'
            draftData = Drafts.find().fetch()
            pub = []
            #Save gridster layout first. If publish failed, we can recover the drafts
            for i in [0..(draftData.length-1)]
              if i is 0
                mainImage = draftData[i].imgUrl
              else
                pub.push(draftData[i])
            # console.log 'pub  is '
            # console.log pub
            sortBy = (key, a, b, r) ->
              r = if r then 1 else -1
              return -1*r if a[key] and b[key] and a[key] > b[key]
              return +1*r if a[key] and b[key] and a[key] < b[key]
              return +1*r if a[key] is undefined and b[key]
              return -1*r if a[key] and b[key] is undefined
              return 0
            pub.sort((a, b)->
              sortBy('data_row', a, b)
            )
            
            # remove data_wait_init status
            new_pub = []
            if pub.length > 0
              for i in [0..pub.length-1]
                row = {}
                for key,value of pub[i]
                  if key isnt 'data_wait_init'
                    row[key] = pub[i][key]
                new_pub.push(row)
            pub = new_pub
            # console.log 'pub is  '
            # console.log pub
            browseTimes = 0

            if Posts.find({_id:postId}).count()>0
              # console.log 'goooooooooood!!'
              browseTimes = Posts.findOne({_id:postId}).browse 
              Posts.update(
                {
                  _id:postId
                },
                {
                  $set:{
                    pub:pub,
                    title:title,
                    heart:[],  #点赞
                    retweet:[],#转发
                    comment:[], #评论
                    addontitle:addontitle,
                    mainImage: mainImage,
                    mainImageStyle:mainImageStyle,
                    mainText: mainText,
                    fromUrl: fromUrl,
                    publish:true,
                    owner:ownerUser._id,
                    ownerName:ownerName,
                    ownerIcon:ownerIcon,
                    createdAt: new Date(),
                    editorVersion: editorVersion
                  }
                }
              )
              if Template.showDraftPosts.__helpers.get('is_server_import')() is true
                Posts.update(
                  {
                    _id:postId
                  },
                  {
                    isReview: true
                  }
                )
            else
              Posts.insert( {
                _id:postId,
                pub:pub,
                title:title,
                browse:0,
                heart:[],  #点赞
                retweet:[],#转发
                comment:[], #评论
                commentsCount:0,
                addontitle:addontitle,
                mainImage: mainImage,
                mainImageStyle:mainImageStyle,
                mainText: mainText,
                fromUrl: fromUrl,
                publish:true,
                owner:ownerUser._id,
                ownerName:ownerName,
                ownerIcon:ownerIcon,
                createdAt: new Date(),
                editorVersion: editorVersion
              })
            topicPostObj = {
              postId:postId,
              title:title,
              addontitle:addontitle,
              mainImage:mainImage,
              heart:0,
              retweet:0,
              comment:1,
              owner:ownerUser._id,
              ownerName:ownerName,
              ownerIcon:ownerIcon,
              createdAt: new Date()
            }
            updateTopicPost(topicPostObj)
            #Delete from SavedDrafts if it is a saved draft.
            if SavedDrafts.find().count() is 1
              Session.setPersistent('mySavedDraftsCount',0)
              Session.setPersistent('persistentMySavedDrafts',null)
            SavedDrafts.remove({_id:postId})
            #Delete the Drafts
            cleanDraft()
            newPostData = {
              _id:postId,
              pub:pub,
              title:title,
              browse:browseTimes+1,
              heart:[],  #点赞
              retweet:[],#转发
              comment:[], #评论
              addontitle:addontitle,
              mainImage: mainImage,
              mainImageStyle:mainImageStyle,
              mainText: mainText,
              fromUrl: fromUrl,
              publish:true,
              owner:ownerUser._id,
              ownerName:ownerName,
              ownerIcon:ownerIcon,
              isReview: true,
              createdAt: new Date(),
              editorVersion: editorVersion
            }
            Session.set('newpostsdata', newPostData)
            Router.go('/newposts/'+postId)

            removeImagesFromCache(draftImageData)
          )
        else
          # console.log 'update posts '
          pubtest = savedDraftData.pub
          pubtest.shift()
          pub = pubtest
          mainImage = savedDraftData.mainImage
          browseTimes = 0

          if Posts.find({_id:postId}).count()>0
            # console.log 'goooooooooood!!'
            browseTimes = Posts.findOne({_id:postId}).browse
            Posts.update(
              {
                _id:postId
              },
              {
                $set:{
                  pub:pub,
                  title:title,
                  heart:[],  #点赞
                  retweet:[],#转发
                  comment:[], #评论
                  addontitle:addontitle,
                  mainImage: mainImage,
                  mainImageStyle:mainImageStyle,
                  mainText: mainText,
                  fromUrl: fromUrl,
                  publish:true,
                  owner:ownerUser._id,
                  ownerName:ownerName,
                  ownerIcon:ownerIcon,
                  createdAt: new Date(),
                  editorVersion: editorVersion
                }
              }
            )
            if Template.showDraftPosts.__helpers.get('is_server_import')() is true
              Posts.update(
                {
                  _id:postId
                },
                {
                  isReview: true
                }
              )
          else
            Posts.insert( {
              _id:postId,
              pub:pub,
              title:title,
              browse:0,
              heart:[],  #点赞
              retweet:[],#转发
              comment:[], #评论
              commentsCount:0,
              addontitle:addontitle,
              mainImage: mainImage,
              mainImageStyle:mainImageStyle,
              mainText: mainText,
              fromUrl: fromUrl,
              publish:true,
              owner:ownerUser._id,
              ownerName:ownerName,
              ownerIcon:ownerIcon,
              createdAt: new Date(),
              editorVersion: editorVersion
            })
          topicPostObj = {
            postId:postId,
            title:title,
            addontitle:addontitle,
            mainImage:mainImage,
            heart:0,
            retweet:0,
            comment:1,
            owner:ownerUser._id,
            ownerName:ownerName,
            ownerIcon:ownerIcon,
            createdAt: new Date(),
            editorVersion: editorVersion
          }
          updateTopicPost(topicPostObj)
          #Delete from SavedDrafts if it is a saved draft.
          if SavedDrafts.find().count() is 1
            Session.setPersistent('mySavedDraftsCount',0)
            Session.setPersistent('persistentMySavedDrafts',null)
          SavedDrafts.remove({_id:postId})
          #Delete the Drafts
          cleanDraft()
          newPostData = {
              _id:postId,
              pub:pub,
              title:title,
              browse:browseTimes+1,
              heart:[],  #点赞
              retweet:[],#转发
              comment:[], #评论
              addontitle:addontitle,
              mainImage: mainImage,
              mainImageStyle:mainImageStyle,
              mainText: mainText,
              fromUrl: fromUrl,
              publish:true,
              owner:ownerUser._id,
              ownerName:ownerName,
              ownerIcon:ownerIcon,
              isReview: true,
              createdAt: new Date(),
              editorVersion: editorVersion
          }
          insertPostOnTheHomePage(postId,newPostData)
          Session.set('newpostsdata', newPostData)
          Router.go('/newposts/'+postId)
        Session.set 'showDraft', false
        return
    'click .voicePlay':(e)->
        $ele = $(e.currentTarget)
        if $ele.hasClass('voicePlaying')
          $ele.removeClass 'voicePlaying'
          console.log voiceMedia
        else
          voiceMedia = new Media($ele.attr('data'), ()->
            console.log 'playAudio():Audio Success'
            $ele.removeClass 'voicePlaying'
            return
          , (err) ->
            console.log 'playAudio():Audio Error: ' + err
            $ele.removeClass 'voicePlaying'
            return
          )
          voiceMedia.play()
          $ele.addClass 'voicePlaying'
        e.stopPropagation()
    'click .showDraftback' :->
      Session.set('fromDraftPost',false)
      Session.set 'showDraft', false
      Session.set Session.get('postContent')._id, false
      setTimeout ()->
        # if Session.get("backtoalldrafts") is true
        #   Session.set("backtoalldrafts",false)
        #   PUB.page('/allDrafts')
        # else if Session.get("backtopageuser") is true
        #   Session.set('backtopageuser', false)
        #   PUB.page('/user')
        # else
          PUB.postPageBack()
      ,animatePageTrasitionTimeout
    'click .postImageItem': (e,t)->
      swipedata = []
      selected = 0
      console.log "=============click on image index is: " + e.currentTarget.id

      # find imgs
      $('.postImageItem').each (index, item)->
        $img = $(this).find('img')
        if $img.attr('data-original')
          swipedata.push({id: $img.attr('id'), href: $img.attr('data-original')})
        else
          swipedata.push({id: $img.attr('id'), href: $img.attr('src')})

      # get selected
      if swipedata.length > 0
        for i in [0..swipedata.length-1]
          if swipedata[i].id is e.currentTarget.id + 'img'
            selected = i
            break
      console.log('length:', swipedata.length, 'selected:', selected);

      $.swipebox swipedata,{
        initialIndexOnArray: selected
        hideCloseButtonOnMobile : true
        loopAtEnd: false
      }
    'click #edit': (event)->
      thispost = Session.get('postContent')
      draftId = thispost._id
      Meteor.subscribe("savedDraftsWithID",draftId)
      if thispost.import_status
        if thispost.import_status is 'imported' or thispost.import_status is 'done'
          # if enableSimpleEditor and Meteor.user().profile and Meteor.user().profile.defaultEditor isnt 'fullEditor'
          #   return Router.go('/newEditor?type=edit&id='+thispost._id)
        else
          return window.plugins.toast.showLongBottom('此故事的图片正在处理中，请稍后操作~')
      Session.set Session.get('postContent')._id, false
      editorVersion = thispost.editorVersion || 'fullEditor'
      if (editorVersion is 'simpleEditor')
        return Router.go('/newEditor?type=draft&id='+thispost._id)
      cleanDraft()
      savedDraftData = SavedDrafts.findOne({_id:draftId})
      if savedDraftData
        editDraft(savedDraftData)
      else
        subLoad = (err)->
          if (err)
            console.log('savedDraftsWithIDCollection error:', err)
          else
            console.log('savedDraftsWithIDCollection loaded')
          savedDraftData = SavedDrafts.findOne({_id:draftId})
          if (!savedDraftData)
            savedDraftData = Session.get("postContent")
          editDraft(savedDraftData)
        Meteor.subscribe("savedDraftsWithID",draftId,{
            onReady:()->
              subLoad()
            onStop: (err)->
              subLoad(err)
          })
    'click #editFull': (event)->
      openEditPage = (savedDraftData)->
        savedDraftData.fromPostId = savedDraftData._id
        savedDraftData._id = new Mongo.ObjectID()._str
        savedDraftData.editorVersion = 'fullEditor'
        savedDraftData.title = '[经典模式]\r\n' + savedDraftData.title
        if (savedDraftData.pub.length > 0)
          index = _.pluck(savedDraftData.pub, 'type').indexOf('image')
          savedDraftData.pub[index]._id = savedDraftData._id
          # if (savedDraftData.pub[index].url is savedDraftData.mainImage)
          #   savedDraftData.pub[index]._id = savedDraftData.fromPostId
        else
          # TODO: 此贴子没有段落
          return PUB.alert('转换失败，请重试~')

        SavedDrafts.insert savedDraftData, (err)->
          if err
            return PUB.alert('转换失败，请重试~')
          console.log('转换经典模式成功：', savedDraftData._id)
          Session.set('postContent', savedDraftData)
          editDraft(savedDraftData)

      cleanDraft()
      draftId = Session.get("postContent")._id
      savedDraftData = SavedDrafts.findOne({_id:draftId})
      if savedDraftData
        openEditPage(savedDraftData)
      else
        subLoad = (err)->
          if (err)
            console.log('savedDraftsWithIDCollection error:', err)
          else
            console.log('savedDraftsWithIDCollection loaded')
          savedDraftData = SavedDrafts.findOne({_id:draftId})
          if (!savedDraftData)
            savedDraftData = Session.get("postContent")
          openEditPage(savedDraftData)
        Meteor.subscribe("savedDraftsWithID",draftId,{
            onReady:()->
              subLoad()
            onStop: (err)->
              subLoad(err)
          })
    'click #delete':(event)->
      navigator.notification.confirm('您是否要删除草稿？', (r)->
        if r isnt 2
          return
        Session.set('fromDraftPost',false)
        #Delete it from SavedDrafts
        # draftData = Drafts.find().fetch()
        #Clear Drafts
        cleanDraft()
        draftId = Session.get("postContent")._id
        if SavedDrafts.find().count() is 1
          Session.setPersistent('mySavedDraftsCount',0)
          Session.setPersistent('persistentMySavedDrafts',null)
        SavedDrafts.remove draftId
        Posts.remove draftId
        Session.set 'showDraft', false
        # draftImageData = Drafts.find({type:'image'}).fetch()
        # removeImagesFromCache(draftImageData)
        # Drafts.remove {owner: Meteor.userId()}
        # $('.addPost').addClass('animated ' + animateOutUpperEffect);
        setTimeout ()->
          if Session.get("backtoMyPosts") is true
            Session.set("backtoMyPosts",false)
            PUB.page('/myPosts')
          else if Session.get("backtopageuser") is true
            Session.set('backtopageuser', false)
            PUB.page('/user')
          else
            PUB.postPageBack()
        ,animatePageTrasitionTimeout
        return
      , '删除草稿', ['取消','确定']);

      return

  Template.showDraftPosts.helpers
    isSimpleEditorPost:->
      return Session.get('postContent').editorVersion and Session.get('postContent').editorVersion is 'simpleEditor'
    isToFullVer:->
      # 导致简单模式的草稿不会显示转换为经典模式
      # return Session.get('postContent').editorVersion is 'simpleEditor' and !Session.get('postContent').fromPostId and SavedDrafts.find({fromPostId: Session.get('postContent')._id}).count() <= 0
      return Session.get('postContent').editorVersion is 'simpleEditor' and !Session.get('postContent').fromPostId
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
  Template.showDraftPosts.events
    'click .post-theme-btn': ()->
      $('.post-theme-box').show()
      $('.post-theme-box-mask').show()
    'click .post-theme-box-mask': ()->
      $('.post-theme-box').hide()
      $('.post-theme-box-mask').hide()
    'click .post-theme-box li': ()->
      Session.set('addPostTheme', this.style)
      postThemeHepler(this.style)
    'click .post-theme-box .btn-succ': ()->
      $('.post-theme-box').hide()
      $('.post-theme-box-mask').hide()
    'click .try-theme-again':(e)->
      Session.set('post_theme_loaded','loading');
      Meteor.subscribe('themes',()->
        Session.set('post_theme_loaded','loaded');
      )

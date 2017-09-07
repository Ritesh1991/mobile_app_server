
if Meteor.isClient
  subs = new SubsManager({
    #maximum number of cache subscriptions
    cacheLimit: 999,
    # any subscription will be expire after 30 days, if it's not subscribed again
    expireIn: 60*24*30
  });
  countA = 0
  Session.setDefault("postPageScrollTop", 0)
  @refreshPostContent=()->
    layoutHelperInit()
    Session.set("displayPostContent",false)
    Meteor.setTimeout ()->
      Session.set("displayPostContent",true)
    ,300
  Router.route '/bell',()->
    this.render 'bell'
    Session.set 'channel','bell'
    return
  Router.route '/redirect/:_id',()->
    Session.set('nextPostID',this.params._id)
    this.render 'redirect'
    return
  Router.route '/import', ()->
    this.render 'importPost'
  Router.route '/series/:_id', {
      waitOn: ->
        [subs.subscribe("oneSeries", this.params._id)]
      action: ->
        series = Series.findOne({_id: this.params._id})
        Session.set('seriesContent',series)
        this.render 'series', {data: series}
      fastRender: true
    }
  Router.route '/posts/:_id', {
      waitOn: ->
          [subs.subscribe("publicPosts", this.params._id),
           subs.subscribe("postsAuthor",this.params._id),
           subs.subscribe "pcomments"]
      loadingTemplate: 'loadingPost'
      action: ->
        post = Posts.findOne({_id: this.params._id})
        # Server won't push data if post not review
        #if !post or (post.isReview is false and post.owner isnt Meteor.userId())
        #  return this.render 'postNotFound'
        unless post
          console.log "Cant find the request post"
          this.render 'postNotFound'
          return
        Session.set("refComment",[''])
        if post and Session.get('postContent') and post.owner isnt Meteor.userId() and post._id is Session.get('postContent')._id and String(post.createdAt) isnt String(Session.get('postContent').createdAt)
          refreshPostContent()
          toastr.info('作者修改了帖子内容.')
          Meteor.call('refreshPostCDN', Session.get('postContent')._id)
          Meteor.setTimeout ()->
            Session.set('postContent',post)
          ,300
        else
          if window.dbupdate
            if window.dbupdate == false
              Session.set('postContent',post)
          else
            Session.set('postContent',post)
            
        Session.set('focusedIndex',undefined)
        if post.addontitle and (post.addontitle isnt '')
          documentTitle = post.title + "：" + post.addontitle
        else
          documentTitle = post.title
        Session.set("DocumentTitle",documentTitle)
        favicon = document.createElement('link')
        favicon.id = 'icon'
        favicon.rel = 'icon'
        favicon.href = post.mainImage
        document.head.appendChild(favicon)

        unless Session.equals('channel','posts/'+this.params._id)
          refreshPostContent()
        this.render 'showPosts', {data: post}
        Session.set 'channel','posts/'+this.params._id

        # 刷新本地follpost
        try
          followPost = FollowPosts.findOne({postId: this.params._id})
          if (post and post.owner is Meteor.userId() and followPost and followPost.mainImage isnt post.mainImage)
            followPost.mainImage = post.mainImage
            FollowPosts._collection._docs.set(followPost._id, followPost)
            console.log('refresh follpost', this.params._id)
        catch
      fastRender: true
    }
  Router.route '/view_posts/:_id', {
      waitOn: ->
          [subs.subscribe("publicPosts", this.params._id),
           subs.subscribe("postsAuthor",this.params._id),
           subs.subscribe "pcomments"]
      loadingTemplate: 'loadingPost'
      action: ->
        post = Posts.findOne({_id: this.params._id})
        # if !post or (post.isReview is false and post.owner isnt Meteor.userId())
        #   return this.render 'postNotFound'
        unless post
          console.log "Cant find the request post"
          this.render 'postNotFound'
          return
        Session.set("refComment",[''])
        if post and Session.get('postContent') and post.owner isnt Meteor.userId() and post._id is Session.get('postContent')._id and String(post.createdAt) isnt String(Session.get('postContent').createdAt)
          refreshPostContent()
          toastr.info('作者修改了帖子内容.')
          Meteor.call('refreshPostCDN', Session.get('postContent')._id)
          Meteor.setTimeout ()->
            Session.set('postContent',post)
          ,300
        else
          Session.set('postContent',post)
        Session.set('focusedIndex',undefined)
        if post.addontitle and (post.addontitle isnt '')
          documentTitle = post.title + "：" + post.addontitle
        else
          documentTitle = post.title
        Session.set("DocumentTitle",documentTitle)
        favicon = document.createElement('link')
        favicon.id = 'icon'
        favicon.rel = 'icon'
        favicon.href = post.mainImage
        document.head.appendChild(favicon)

        unless Session.equals('channel','posts/'+this.params._id)
          refreshPostContent()
        this.render 'showPosts', {data: post}
        Session.set 'channel','posts/'+this.params._id
      fastRender: true
    }
  Router.route '/posts/:_id/:_index', {
    name: 'post_index'
    waitOn: ->
      [Meteor.subscribe("publicPosts",this.params._id),
       Meteor.subscribe("postsAuthor",this.params._id),
       Meteor.subscribe "pcomments"]
    loadingTemplate: 'loadingPost'
    action: ->
      if Session.get("doSectionForward") is true
        Session.set("doSectionForward",false)
        Session.set("postPageScrollTop",0)
        document.body.scrollTop = 0
      post = Posts.findOne({_id: this.params._id})
      if !post or (post.isReview is false and post.owner isnt Meteor.userId())
        return this.render 'postNotFound'
      unless post
        console.log "Cant find the request post"
        this.render 'postNotFound'
        return
      Session.set("refComment",[''])
      ###
      Meteor.subscribe "refcomments",()->
        Meteor.setTimeout ()->
          refComment = RefComments.find()
          if refComment.count() > 0
            Session.set("refComment",refComment.fetch())
        ,2000
      ###
      if post and Session.get('postContent') and post.owner isnt Meteor.userId() and post._id is Session.get('postContent')._id and String(post.createdAt) isnt String(Session.get('postContent').createdAt)
        refreshPostContent()
        toastr.info('作者修改了帖子内容.')
        Meteor.call('refreshPostCDN', Session.get('postContent')._id)
        Meteor.setTimeout ()->
          Session.set('postContent',post)
        ,300
      else
        if window.dbupdate
          if window.dbupdate == false
            Session.set('postContent',post)
        else
          Session.set('postContent',post)
      Session.set('focusedIndex',this.params._index)
      if post.addontitle and (post.addontitle isnt '')
        documentTitle = post.title + "：" + post.addontitle
      else
        documentTitle = post.title
      Session.set("DocumentTitle",documentTitle)
      favicon = document.createElement('link')
      favicon.id = 'icon'
      favicon.rel = 'icon'
      favicon.href = post.mainImage
      document.head.appendChild(favicon)

      unless Session.equals('channel','posts/'+this.params._id+'/'+this.params._index)
        refreshPostContent()

      this.render 'showPosts', {data: post}
      Session.set('channel','posts/'+this.params._id+'/'+this.params._index)

      # 刷新本地follpost
      try
        followPost = FollowPosts.findOne({postId: this.params._id})
        if (post and post.owner is Meteor.userId() and followPost and followPost.mainImage isnt post.mainImage)
          followPost.mainImage = post.mainImage
          FollowPosts._collection._docs.set(followPost._id, followPost)
          console.log('refresh follpost', this.params._id)
      catch
    fastRender: true
  }
  Router.route '/',()->
    this.render 'webHome'
    return
  Router.route '/help',()->
    this.render 'help'
    return
  Router.route 'userProfilePage1',
    template: 'userProfile'
    path: '/userProfilePage1'
  Router.route 'userProfilePage2',
    template: 'userProfile'
    path: '/userProfilePage2'
  Router.route 'userProfilePage3',
    template: 'userProfile'
    path: '/userProfilePage3'
  Router.route 'searchMyPosts',
    template: 'searchMyPosts'
    path: '/searchMyPosts'
  Router.route 'unpublish',
    template: 'unpublish'
    path: '/unpublish'
  Router.route 'setNickname',
    template: 'setNickname'
    path: '/setNickname'
  Router.route '/userProfilePage',()->
    this.render 'userProfilePage'
    return
  Router.route '/hotPosts/:_id',()->
    this.render 'hotPosts'
    return
  Router.route 'recommendStory',()->
    this.render 'recommendStory'
    return
  Router.route '/qrcodeTipPage',()->
    this.render 'qrcodeTipPage'
    return
  Router.route '/downLoadTipPage',()->
    this.render 'downLoadTipPage'
    return
  Router.route '/downLoadTipPage1',()->
    this.render 'downLoadTipPage1'
    return
  Router.route '/appBindWebTipPage',()->
    this.render 'appBindWebTipPage'
    return
  Router.route '/joinWechatGroup',()->
    this.render 'joinWechatGroup'
    return
  Router.route '/web-rw-message', {
      action: ->
        #Session.set('web-rw-message-query',this.params.query)
        this.render 'downLoadTipPage1'
      fastRender:true
    }
  Router.route '/open-in-browser', {
      action: ->
        this.render 'installappTips'
      fastRender:true
    }

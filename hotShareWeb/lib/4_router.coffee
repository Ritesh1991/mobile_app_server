subs = new SubsManager({
  #maximum number of cache subscriptions
  cacheLimit: 999,
  # any subscription will be expire after 30 days, if it's not subscribed again
  expireIn: 60*24*30
});

if Meteor.isClient
  Session.setDefault("postPageScrollTop", 0)
  @refreshPostContent=()->
    Session.set("displayPostContent",false)
    Meteor.setTimeout ()->
      Session.set("displayPostContent",true)
      # calcPostSignature(window.location.href.split('#')[0])
    ,300
  Router.route '/redirect/:_id',()->
    Session.set('nextPostID',this.params._id)
    this.render 'redirect'
    return
  Router.route '/posts/:_id', {
      waitOn: ->
          [subs.subscribe("publicPosts",this.params._id),
           subs.subscribe "pcomments"]
      loadingTemplate: 'loadingPost'
      action: ->
        post = Posts.findOne({_id: this.params._id})
        unless post
          console.log "Cant find the request post"
          this.render 'postNotFound'
          return
        Session.set("refComment",[''])
        if isWeiXinFunc()
          if (typeof wx is 'undefined')
            $.loadScript 'http://res.wx.qq.com/open/js/jweixin-1.0.0.js'
          nonceStr = Math.random().toString(36).substr(2, 15)
          ts = parseInt(new Date().getTime() / 1000) + ''
          thisurl = window.location.href.split('#')[0]
          Meteor.call 'getSignatureFromServerNew' ,nonceStr ,ts ,thisurl, (error,result)->
            if error
              if localStorage.getItem('savedsignature'+url)
                signatureResult = localStorage.getItem('savedsignature'+url)
            else
              signatureResult = result
            localStorage.setItem('savedsignature'+url, result)
            setupWeichatNew(signatureResult)
        if post and Session.get('postContent') and post.owner isnt Meteor.userId() and post._id is Session.get('postContent')._id and String(post.createdAt) isnt String(Session.get('postContent').createdAt)
          Session.set('postContent',post)
          refreshPostContent()
          toastr.info('作者修改了帖子内容.')
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
    waitOn: ->
      [Meteor.subscribe("publicPosts",this.params._id),
       Meteor.subscribe "pcomments"]
    loadingTemplate: 'loadingPost'
    action: ->
      if Session.get("doSectionForward") is true
        Session.set("doSectionForward",false)
        Session.set("postPageScrollTop",0)
        document.body.scrollTop = 0
      post = Posts.findOne({_id: this.params._id})
      unless post
        console.log "Cant find the request post"
        this.render 'postNotFound'
        return
      Session.set("refComment",[''])
      if isWeiXinFunc()
        if (typeof wx is 'undefined')
          $.loadScript 'http://res.wx.qq.com/open/js/jweixin-1.0.0.js'
        nonceStr = Math.random().toString(36).substr(2, 15)
        ts = parseInt(new Date().getTime() / 1000) + ''
        thisurl = window.location.href.split('#')[0]
        Meteor.call 'getSignatureFromServerNew' ,nonceStr ,ts ,thisurl, (error,result)->
          if error
            if localStorage.getItem('savedsignature'+url)
              signatureResult = localStorage.getItem('savedsignature'+url)
          else
            signatureResult = result
          localStorage.setItem('savedsignature'+url, result)
          setupWeichatNew(signatureResult)
      ###
      Meteor.subscribe "refcomments",()->
        Meteor.setTimeout ()->
          refComment = RefComments.find()
          if refComment.count() > 0
            Session.set("refComment",refComment.fetch())
        ,2000
      ###
      if post and Session.get('postContent') and post.owner isnt Meteor.userId() and post._id is Session.get('postContent')._id and String(post.createdAt) isnt String(Session.get('postContent').createdAt)
        Session.set('postContent',post)
        refreshPostContent()
        toastr.info('作者修改了帖子内容.')
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
if Meteor.isServer
  Router.route '/posts/:_id', {
      waitOn: ->
          [subs.subscribe("publicPosts",this.params._id),
           subs.subscribe "pcomments"]
      fastRender: true
    }
  Router.route '/posts/:_id/:_index', {
      waitOn: ->
        [subs.subscribe("publicPosts",this.params._id),
         subs.subscribe "pcomments"]
      fastRender: true
    }

if Meteor.isServer
  Meteor.startup ()->
    @JPush = Meteor.npmRequire "jpush-sdk"
    @client = @JPush.buildClient '50e8f00890be941f05784e6f', 'ec9940bbc7fcc646fc492ed8'
  @pushnotification = (type, doc, userId)->
    # console.log "type:"+type
    if type is "palsofavourite"
      content = '有人也赞了此故事:《' + doc.title + '》'
      extras = {
        type: "palsofavourite"
        postId: doc._id
      }
      toUserId = userId
    else if type is "palsocomment"
      content = '有人也点评了此故事:《' + doc.title + '》'
      extras = {
        type: "palsocomment"
        postId: doc._id
      }
      toUserId = userId
    else if type is "pcommentowner"
      content = '有人点评了您的故事:《' + doc.title + '》'
      extras = {
        type: "pcommentowner"
        postId: doc._id
      }
      toUserId = doc.owner
    else if type is "comment"
      post = Posts.findOne({_id: doc.postId});
      if post.owner == userId
        #console.log "comment self post"
        return
      commentText = doc.content;
      content = '您收到了新回复:'+commentText
      extras = {
        type: "comment"
        postId: doc.postId
      }
      toUserId = post.owner
    else if type is "personalletter"
      post = Posts.findOne({_id: doc.postId})
      commentText = doc.content;
      content = '您收到了一条来自' + doc.userName + '的私信'
      extras = {
        type: "personalletter"
        postId: doc.postId
      }
      toUserId = userId
    else if type is "read"
      if doc.owner == userId
        #console.log "read self post"
        return
      content = '有人正在阅读您的故事:《' + doc.title + '》'
      extras = {
        type: "read"
        postId: doc._id
      }
      toUserId = doc.owner
    else if type is "recommand"
      content = doc.recommander + '推荐您阅读' + doc.ownerName + '的故事《' + doc.title + '》'
      extras = {
        type: "recommand"
        postId: doc.postId
      }
      toUserId = doc.followby
    else if type is "getrequest"
      content = doc.requester + '邀请您加为好友!'
      extras = {
        type: "getrequest"
        requesterId: doc.requesterId
      }
      toUserId = doc.followby
    else if type is "newpost"
      content = doc.ownerName + '发布了新故事:《' + doc.title + '》'
      extras = {
        type: "newpost"
        postId: doc._id
      }
      toUserId = userId
    else
      post = Posts.findOne({_id: doc.postId});
      commentText = doc.content;
      content = '您参与讨论的故事有新回复:'+commentText
      extras = {
        type: "recomment"
        postId: doc.postId
      }
      if userId is null or userId is undefined
         return;
      toUserId = userId
    toUserToken = Meteor.users.findOne({_id: toUserId})

    unless toUserToken is undefined or toUserToken.type is undefined or toUserToken.token is undefined
    
      if type is "newpost"
        # push send logs
        removeTime = new Date((new Date()).getTime() - 1000*60*60*48) # 48 hour
        expireTime = new Date((new Date()).getTime() - 1000*60*10) # 10 minute
        
        PushSendLogs.remove({createAt: {$lt: removeTime}})
        if(PushSendLogs.find({
          type: toUserToken.type
          token: toUserToken.token
          message: content
          'extras.type': extras.type
          'extras.postId': extras.postId
          'extras.requesterId': extras.requesterId
          createAt: {$gte: expireTime}
        }).count() > 0)
          return
          
        pushReq = {
          toUserId: toUserId
          type: toUserToken.type
          token: toUserToken.token
          message: content
          extras: extras
          createAt: new Date()
        }
        PushSendLogs.insert pushReq
    
      pushToken = {type: toUserToken.type, token: toUserToken.token}
      #console.log "toUserToken.type:"+toUserToken.type+";toUserToken.token:"+toUserToken.token
      if pushToken.type is 'JPush'
        token = pushToken.token
        #console.log 'JPUSH to ' + pushToken.token
        client.push().setPlatform 'ios', 'android'
          .setAudience JPush.registration_id(token)
          .setNotification '回复通知',JPush.ios(content,null,null,null,extras),JPush.android(content, null, 1,extras)
          #.setMessage(commentText)
          .setOptions null, 60
          .send (err, res)->
            #if err
            #  console.log err.message
            #else
            #  console.log 'Sendno: ' + res.sendno
            #  console.log 'Msg_id: ' + res.msg_id
      else if pushToken.type is 'iOS'
        #console.log 'Server PN to iOS '
        token = pushToken.token
        waitReadCount = Meteor.users.findOne({_id:toUserId}).profile.waitReadCount
        if waitReadCount is undefined or isNaN(waitReadCount)
            waitReadCount = 0
        pushServer.sendIOS 'me', token , '', content, waitReadCount
      else if pushToken.type is 'GCM'
        #console.log 'Server PN to GCM '
        token = pushToken.token
        pushServer.sendAndroid 'me', token , '',content, 1

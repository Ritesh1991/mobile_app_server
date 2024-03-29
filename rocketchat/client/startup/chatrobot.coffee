
if Meteor.isClient
    TAPi18n.setLanguage 'zh'
    @executeAfterClickPostLink = (e)->
        #在聊天内容中点击与故事贴帖子相关的内容的超链接后会被触发
        #此部分需要等具体方案出来以后再细化完善，目前不会影响其他功能的使用
        #因为此部分代码会在链接跳转之前执行，所以耗时操作请使用异步执行，另外请不要return false
        if e.currentTarget.nodeName is 'A'
            postId = e.currentTarget.pathname.split('/posts/')[1]
            $el_msg = $(e.currentTarget).closest('li')
            #console.log($el_msg.data('type'))
            #console.log($el_msg.attr('id'))
            msg = ChatMessage.findOne({_id: $el_msg.attr('id'), type: {$in: ['taread', 'like', 'dislike', 'pcomments']}})
            #msg = ChatMessage.findOne({_id: $el_msg.attr('id')})
            if msg and msg.u._id isnt Meteor.userId()
                if msg.type is 'taread'
                    text = msg.msg.split("，")[0]
                else if msg.type is 'like'
                    text = msg.u.name + ' 喜欢这段：'
                else if msg.type is 'dislike'
                    text = msg.u.name + ' 不喜欢这段：'
                else if msg.type is 'pcomments'
                    text = msg.u.name + ' 点评了这段：'
                
                chatMessages[Session.get('openedRoom')].sendWithUrls(Session.get('openedRoom'), {msg: text, urls: msg.urls})
        console.log 'hello from chat robot, postId : ' + postId
        #return false
        
    Session.setDefault('visitedRooms', []);
    window.socialGraphCollection = new Meteor.Collection(null)
    idleMessageInterval = null
    timeIn = Date.now()
    idleMessageIntervalSec = Meteor.settings.public.MESSAGE_PUSH_TIME or 2000
    mystate = null
    onlineUsers = 0
    todisplayList=[]
    todisplayListIds = []
    socialGraphMessageList=[]
    needToFethReadlist=false
    
    insertMessageToChat = (doc, isRepeat)->
        # ChatMessage.insert doc
        if(isRepeat)
            return ChatMessage.insert(doc)
        
        new_urls = []
        if (doc.t is 'bot' or doc.t is 'bot welcome-msg') and doc.u and doc.u._id is 'group.cat' and doc.urls
            if doc.urls.length > 0
                 for item in doc.urls
                     if ChatMessage.find({'urls.url': item.url, rid: doc.rid}).count() <= 0
                         new_urls.push item
                     
        if new_urls.length > 0
            doc.urls = new_urls
            ChatMessage.insert(doc)
    
    @sendPersonalMessageToRoom = (message)->
        # 当可以在多个阅览室之间切换以后，ChatRoom　里面会包含所有访问过的阅览室信息
        ChatMessage.insert {
            t: 'bot'
            private: true
            msg: message
            #rid: ChatRoom.findOne()._id
            rid: Session.get('openedRoom')
            ts: new Date()
            u: {
                _id: 'group.cat'
                username: 'GS'
                name: '故事贴小秘'
            }
        }

    sendPersonalMessageWithURLToRoom = (message, url, title, description, mainImageUrl, isRepeat, msgType)->
        url = if url? then url else 'http://www.tiegushi.com/'
        #alink = document.createElement 'a'
        #alink.href = url
        # 对message做特殊处理
        if message?
            if message.indexOf('welcomeMSG')>-1
                themsg = message.slice(10,message.length)
            else
                themsg = message
        else
            themsg = ''
        msg = {
            t: if message.indexOf('welcomeMSG')>-1 then 'bot welcome-msg' else 'bot'
            private: true
            type: msgType            
            msg: themsg
            #rid: ChatRoom.findOne()._id
            rid: Session.get('openedRoom')
            ts: new Date()
            u: {
                _id: 'group.cat'
                username: 'GS'
                name: '故事贴小秘'
            },
            urls : [ 
                {
                    "url" : url, #http://www.tiegushi.com/posts/NYtJcHfCKSE6GWhmj
                    "meta" : {
                        "ogSiteName" : "故事贴",
                        "ogTitle" : if title? then title else "", #千老这个称谓的来历
                        "ogUrl" :url, #http://www.tiegushi.com/posts/NYtJcHfCKSE6GWhmj
                        "ogImage" : if mainImageUrl? then mainImageUrl else "", #http://data.tiegushi.com/2Yfmd5PmEDsoECLvg_1459975484141_cdv_photo_001.jpg
                        "ogDescription" : if description? then description else "", #早点一咬牙一跺脚转CS，现在幸福日子望不到头呢！…
                        "ogType" : "article"
                    },
                    "headers" : {
                        "contentType" : "text/html; charset=utf-8"
                    }
                    ###,
                    "parsedUrl" : {
                        "host" : alink.host, #www.tiegushi.com
                        "pathname" : alink.pathname, #/posts/NYtJcHfCKSE6GWhmj
                        "protocol" : alink.protocol #http:
                    }###
                }
            ]            
        } 

        insertMessageToChat msg, isRepeat
    sendPersonalMessageWithURLSToRoom = (message, urls)->
        new_urls = []
        _.map urls, (item)->
            url = if item.url? then item.url else 'http://www.tiegushi.com/'
            #alink = document.createElement 'a'
            #alink.href = url
            
            new_urls.push {
                "url" : url, #http://www.tiegushi.com/posts/NYtJcHfCKSE6GWhmj
                "meta" : {
                    "ogSiteName" : "故事贴",
                    "ogTitle" : if item.title? then item.title else "", #千老这个称谓的来历
                    "ogUrl" :url, #http://www.tiegushi.com/posts/NYtJcHfCKSE6GWhmj
                    "ogImage" : if item.mainImageUrl? then item.mainImageUrl else "", #http://data.tiegushi.com/2Yfmd5PmEDsoECLvg_1459975484141_cdv_photo_001.jpg
                    "ogDescription" : if item.description? then item.description else "", #早点一咬牙一跺脚转CS，现在幸福日子望不到头呢！…
                    "ogType" : "article"
                },
                "headers" : {
                    "contentType" : "text/html; charset=utf-8"
                }
                ###
                ,
                "parsedUrl" : {
                    "host" : alink.host, #www.tiegushi.com
                    "pathname" : alink.pathname, #/posts/NYtJcHfCKSE6GWhmj
                    "protocol" : alink.protocol #http:
                }
                ###
            }
        
        msg = {
            t: 'bot'
            private: true
            msg: if message? then message else ''
            #rid: ChatRoom.findOne()._id
            rid: Session.get('openedRoom')
            ts: new Date()
            u: {
                _id: 'group.cat'
                username: 'GS'
                name: '故事贴小秘'
            },
            urls : new_urls         
        } 

        insertMessageToChat msg
    sendAuthorSelfMessageWithURLSToRoom = (message, urls,owner)->
        new_urls = []
        _.map urls, (item)->
            url = if item.url? then item.url else 'http://www.tiegushi.com/'
            #alink = document.createElement 'a'
            #alink.href = url
            
            new_urls.push {
                "url" : url, #http://www.tiegushi.com/posts/NYtJcHfCKSE6GWhmj
                "meta" : {
                    "ogSiteName" : "故事贴",
                    "ogTitle" : if item.title? then item.title else "", #千老这个称谓的来历
                    "ogUrl" :url, #http://www.tiegushi.com/posts/NYtJcHfCKSE6GWhmj
                    "ogImage" : if item.mainImageUrl? then item.mainImageUrl else "", #http://data.tiegushi.com/2Yfmd5PmEDsoECLvg_1459975484141_cdv_photo_001.jpg
                    "ogDescription" : if item.description? then item.description else "", #早点一咬牙一跺脚转CS，现在幸福日子望不到头呢！…
                    "ogType" : "article"
                },
                "headers" : {
                    "contentType" : "text/html; charset=utf-8"
                }
                ###
                ,
                "parsedUrl" : {
                    "host" : alink.host, #www.tiegushi.com
                    "pathname" : alink.pathname, #/posts/NYtJcHfCKSE6GWhmj
                    "protocol" : alink.protocol #http:
                }
                ###
            }
            
            
        
        msg = {
            private: true
            msg: if message? then message else ''
            rid: Session.get('openedRoom')
            ts: new Date()
            u: {
                _id: owner.owner
                username: owner.ownerName
                name: owner.ownerName
            },
            urls : new_urls         
        } 
        console.log(owner)
        console.log(msg)
        ChatMessage.insert(msg)
    unless amplify.store('readListDisplayed')
        amplify.store('readListDisplayed',1)
    postOneViewedPost = ()->
        while !data and todisplayList and todisplayList.length > 0
             data = todisplayList.pop()[1]
             if !~todisplayListIds.indexOf(data.postId)
                 todisplayListIds.push(data.postId)
             else
                console.log('repeat post: ', data.name)
                data = null
             amplify.store('readListDisplayed',amplify.store('readListDisplayed')+1)


        #if todisplayList and todisplayList.length > 0
        if data
            #data=todisplayList.pop()[1]
            #console.log(data)

            Session.set('showReadList',Session.get('showReadList')+1)

            description=''
            if data.ownerName and data.ownerName isnt ''
                description=TAPi18n.__('rrbMsg_author',{author:data.ownerName})
            if data.addontitle and data.addontitle isnt ''
                data.name+="："+data.addontitle
            console.log TAPi18n.__('rrbMsg_friends_readed_posts',{showReadList:Session.get('showReadList'), gotReadList:Session.get('gotReadList')})
            sendPersonalMessageWithURLToRoom(TAPi18n.__('rrbMsg_friends_readed_posts',{showReadList:Session.get('showReadList'), gotReadList:Session.get('gotReadList')}),'http://cdn.tiegushi.com/posts/'+data.postId, data.name, description, data.mainImage, false, 'review')
            #amplify.store('readListDisplayed',amplify.store('readListDisplayed')+1)
        #Don't pull further information from server, leave it for the next time.
        #else if needToFethReadlist
        #    fetchReadListFromServer()
    idleMessage = ()->
        console.log('idleMessage')
        #if onlineUsers <= 1 or socialGraphCollection.find().count() is 0
        if friendSocialGraphMessage() is true
            return
        postOneViewedPost()
    startIdleMessage = ()->
        console.log('startIdleMessage')
        if !idleMessageInterval
            idleMessageInterval = setInterval(idleMessage,idleMessageIntervalSec)
    stopIdleMessage = ()->
        console.log('stopIdleMessage')
        if idleMessageInterval
            clearInterval(idleMessageInterval)
            idleMessageInterval = null
    restartIdleMessage = ()->
        console.log('restartIdleMessage')
        if !idleMessageInterval
            idleMessageInterval = setInterval(idleMessage,idleMessageIntervalSec)
        else
            stopIdleMessage()
            startIdleMessage()
    fetchReadListFromServer = ()->
        needToFethReadlist=false
        Meteor.call 'getMyState',amplify.store('hotshareUserID'),amplify.store('readListDisplayed'),5,(err,data)->
            if err
                return
            if !data or !data.list
                amplify.store('readListDisplayed',0)
                return
            console.log('Got my list: '+data)
            list = data.list
            if list.length is 0
                amplify.store('readListDisplayed',0)
                #fetchReadListFromServer()
                return
            tempList = []
            _.each(list, (item)->
                if item[1]? and !~todisplayListIds.indexOf(item[1].postId)
                    tempList.push(item)
                else
                    amplify.store('readListDisplayed',amplify.store('readListDisplayed')+1)
            )
            list = tempList
            if list and list.length > 0
                todisplayList = list
                Session.set('gotReadList',list.length)
                Session.set('showReadList',0)
                setTimeout postOneViewedPost,2000
                needToFethReadlist=true
            else
                amplify.store('readListDisplayed',0)
                #fetchReadListFromServer()
                return
    friendSocialGraphMessage = ()->
        console.log('friendSocialGraphMessage')
        doc=socialGraphCollection.findOne({})
        unless doc
            return false
        socialGraphCollection.remove({_id:doc._id})

        Session.set('ViewedSocialMessageTotal',Session.get('ViewedSocialMessageTotal')+1)

        if doc.type is 'taRead'
            sendPersonalMessageWithURLToRoom(TAPi18n.__('rrbMsg_ta_read',{ta: doc.taName, readMsg: Session.get('ViewedSocialMessageTotal'), total:Session.get('SocialMessageTotal')})
            ,doc.link, doc.name, doc.desc, doc.image, false, 'taread')
            return true
        else if doc.type is 'mutualRead'
            #现在TA也在线不准，修好了之后再说吧
            #sendPersonalMessageWithURLToRoom(doc.taName+' 和 您 都读过这篇故事，是不是很有缘分，TA也在线哦（输入@可以看到在线好友'+Session.get('ViewedSocialMessageTotal')+'/'+Session.get('SocialMessageTotal')+'）',doc.link, doc.name, doc.desc, doc.image)
            sendPersonalMessageWithURLToRoom(TAPi18n.__('rrbMsg_mutual_read',{ta: doc.taName, readMsg: Session.get('ViewedSocialMessageTotal'), total:Session.get('SocialMessageTotal')})
            ,doc.link, doc.name, doc.desc, doc.image, false, 'mutual')
            return true
        return false

    processFriendSocialGraph = (socialGraph)->
        # 如果在线用户没有对应的故事贴关联信息，这边会报 TypeError: Cannot read property 'taName' of undefined
        if !socialGraph?
            return
        currentRoomPostId = FlowRouter.current().params.name
        console.log(socialGraph)
        taName = socialGraph.taName
        if socialGraph.mutualPosts? and socialGraph.mutualPosts.length > 0
            socialGraph.mutualPosts.forEach (key, num)->
                # add mutual post into collection
                #console.log(key)
                #两个人都读过的文章是可以重复的
                unless currentRoomPostId is key.postId or socialGraphCollection.findOne({postId:key.postId, taName: taName, type:'mutualRead'})
                    socialGraphCollection.insert({
                        type:'mutualRead',
                        taName:taName,
                        link:'http://cdn.tiegushi.com/posts/'+key.postId,
                        name:key.name,
                        desc:key.addonTitle,
                        image:key.mainImage
                    })
        if socialGraph.taRead? and socialGraph.taRead.length > 0
            socialGraph.taRead.forEach (key,num)->
                #console.log(key)
                unless socialGraphCollection.findOne({postId:key.postId})
                    socialGraphCollection.insert({
                        postId:key.postId,
                        type:'taRead',
                        taName:taName,
                        link:'http://cdn.tiegushi.com/posts/'+key.postId,
                        name:key.name,
                        desc:key.addonTitle,
                        image:key.mainImage
                    })
        Session.set('SocialMessageTotal',socialGraphCollection.find().count())
        Session.set('ViewedSocialMessageTotal',0)

    sendPostStatToOwner = (postId) ->
        Meteor.call 'getMyPostStat', postId, (err, stat) ->
            if !err and stat
                if stat.browses?
                    sendPersonalMessageToRoom(TAPi18n.__('rrbMsg_your_post_read_times',{times:stat.browses}) )
                if stat.readers?
                    friendMsg=''
                    stat.readers.forEach((item,index)->
                        friendMsg+=' @'+item
                    )
                    friendMsg+=TAPi18n.__('rrbMsg_new_reader')
                    sendPersonalMessageToRoom(friendMsg)
                if stat.posts? and stat.totalbrowses?
                    sendPersonalMessageToRoom(TAPi18n.__('rrbMsg_post_write_browses',{posts_number:stat.posts, browses_number:stat.totalbrowses}))
                if stat.locations? and stat.locations.length > 0
                    sendPersonalMessageToRoom(TAPi18n.__('rrbMsg_posts_reader_locations',{locations:stat.locations.jion(', ')}))

    Meteor.startup ->
        if Session.equals('hiddenMode',true)
            return
        Tracker.autorun (t)->
            # 当可以在多个阅览室之间切换以后，此处需要响应是重新计算数据，由于FlowRouter不支持响应式，所以使用Session
            currentRoomId = Session.get('openedRoom')
            visitedRooms = Session.get('visitedRooms')
            if ChatRoom.findOne({_id: currentRoomId}) and !~visitedRooms.indexOf(currentRoomId)
                visitedRooms.push(currentRoomId)
                Session.set('visitedRooms', visitedRooms)
                # 此处的 stop 后面需要去掉以保持响应式计算，但是需要处理下，已经访问过的阅览室再次切换回去的时候，就不要再计算了
                #t.stop()
                if amplify.store('hotshareUserID')
                    Meteor.call 'getSocialState',amplify.store('hotshareUserID'),(err,data)->
                        if !err and data and data.length > 0
                            console.log(data)
                            message=''
                            data.forEach((item,index)->
                                if item.name and item.name isnt ''
                                    if item.location and item.location isnt ''
                                        message+= item.name+'('+item.location+') '
                                    else
                                        message+= item.name+' '
                            )
                            if message isnt ''
                                message= TAPi18n.__('rrbMsg_meet_friend',{message: message})
                                # '*您*最近在故事贴偶遇的朋友是：'+message
                                sendPersonalMessageToRoom(message)

                document.title = TAPi18n.__('rrbMsg_document_title_default')
                Meteor.call 'getPostInfo',ChatRoom.findOne({_id: currentRoomId}).name,(err,data)->
                    if !err and data
                        ###
                        _id:"27ZRmEeXwkoFi6BZC"
                        createdAt:Thu May 28 2015 17:26:48 GMT-0700 (PDT)
                        mainImage:"http://data.tiegushi.com/yDDXttJznF72aR9kL_1432858306301_cdv_photo_002.jpg"
                        ownerName:"微尘"
                        ###
                        console.log data
                        #检测此room的帖子是否违规
                        if data.isReview isnt true or data.publish isnt true
                            console.log '帖子违规或已被删除'
                            Session.set 'thisPostInfo', false
                            $('.room-container').children().remove()
                            $('.room-container').addClass('no-data-container')
                            $('.room-container').text('没有数据或已关闭.')
                        else
                            Session.set 'thisPostInfo', true
                        document.title =TAPi18n.__('rrbMsg_document_title',{title: data.title})
                        amplify.store('postTitle_'+currentRoomId,data.title)

                        # begin - 尝试解决document.title 在 ios 下不生效的bug
                        iframe = document.createElement('iframe')
                        iframe.setAttribute('src', '/favicon.ico')
                        iframe.setAttribute('height', '0')
                        iframe.setAttribute('width', '0')

                        iframe.addEventListener('load', cb=() ->
                            setTimeout(()->
                                iframe.removeEventListener('load', cb);
                                document.body.removeChild(iframe);                                
                            , 0);
                        );
                        
                        document.body.appendChild(iframe)
                        # end - 尝试解决document.title 在 ios 下不生效的bug
                        description=''
                        if data.ownerName and data.ownerName isnt ''
                            if data.owner and data.owner isnt ''
                                description=TAPi18n.__('rrbMsg_author_with_follow',{author:data.ownerName, author_id: data.owner})
                            else
                                description=TAPi18n.__('rrbMsg_author',{author:data.ownerName})
                        if data.addontitle and data.addontitle isnt ''
                            data.title+="："+data.addontitle
                        window.trackPage(window.location.href,data.title)
                        sendPersonalMessageWithURLToRoom('welcomeMSG'+TAPi18n.__('rrbMsg_welcome_to_reading_room'),
                          'http://cdn.tiegushi.com/posts/'+data._id, data.title, description, data.mainImage, false, 'current')
                        if Meteor.user() and amplify.store('hotshareUserID') and data.owner is amplify.store('hotshareUserID')
                            sendPostStatToOwner(data._id)
                    else
                        console.log 'no data;;;;'
                        Session.set 'thisPostInfo', false
                        $('.room-container').children().remove()
                        $('.room-container').addClass('no-data-container')
                        $('.room-container').text('没有数据或已关闭.')
            else if amplify.store('postTitle_'+currentRoomId)
                document.title = TAPi18n.__('rrbMsg_document_title',{title: amplify.store('postTitle_'+currentRoomId)})
        Tracker.autorun (t)->
            if Meteor.user() and amplify.store('hotshareUserID')
                t.stop()
                fetchReadListFromServer()
                console.log('HotShare ID is '+amplify.store('hotshareUserID'))
        Tracker.autorun ()->
            if MsgTyping.selfTyping.get()
                console.log('Need stop interval since typing')
                stopIdleMessage()
            else
                console.log('not typing now')
                restartIdleMessage()
        Tracker.autorun ()->
            if ChatMessage.findOne({t:{$ne:'bot'}},{sort:{ts:-1}},{fields:{ts:1}})
                console.log('New message arrived')
                restartIdleMessage()
        Tracker.autorun ()->
            if onlineUsers != (_.size(RoomManager.onlineUsers.get())-1)
                onlineUsers = (_.size(RoomManager.onlineUsers.get())-1)
                console.log('Online member: '+onlineUsers)
                if onlineUsers > 1
                    console.log('need get the user')
                    userArray=_.filter(RoomManager.onlineUsers.get(), (obj, key)->
                        unless obj._id
                            return false
                        if obj._id is 'group.cat'
                            return false
                        if obj._id is Meteor.userId()
                            return false
                        if Session.get('user_record_'+obj._id)
                            return false
                        Session.set('user_record_'+obj._id,true)
                        Meteor.call 'calcRelationship',obj._id,(err,result)->
                            if result
                                processFriendSocialGraph(result)
                                setTimeout friendSocialGraphMessage,1000
                            #sendPersonalMessageToRoom('您的朋友 '+result.taName+' 正在聊天，你们初次相逢，他推荐您看这个帖子：')
                        return true
                    )
                    
        # 故事贴推荐贴子的推送
        getFeedsByLogin = ()->
            Meteor.call 'getFeedsByLogin', (err, res)->
                if err
                    return

                # owner group
                owners = []
                _.map res, (item)->
                    url = {
                        url: 'http://cdn.tiegushi.com/posts/' + item.postId
                        title: item.postTitle
                        description: '发表：' + GetTime0(item.createdAt)
                        mainImageUrl: item.mainImage
                    }
                    if _.pluck(owners, 'ownerId').indexOf(item.owner) is -1
                        owners.push {ownerId: item.owner, ownerName: item.ownerName,ownerIcon: item.ownerIcon, urls: [url]}
                    else
                        owners[_.pluck(owners, 'ownerId').indexOf(item.owner)].urls.push(url)

                _.map owners, (item)->
                    # sendPersonalMessageWithURLSToRoom '您的朋友 '+item.ownerName+' 发表了故事贴，邀请您阅读：', item.urls
                    sendAuthorSelfMessageWithURLSToRoom(TAPi18n.__('rrbMsg_post_post'), item.urls, item)

        Tracker.autorun (t)->
            if Meteor.userId() and Session.get('openedRoom')
                t.stop()
                getFeedsByLogin()

        # sub hotshareFeeds
        Tracker.autorun (t)->
            if Meteor.userId() and Session.get('openedRoom')
                t.stop()
                Meteor.subscribe 'hotShareFeeds'
        HotShareFeeds.find({}).observeChanges {
          added: (id, feed)->
            if ['SelfPosted', 'share', 'pcommentowner'].indexOf(feed.eventType) is -1
              return;
            if feed.postTitle isnt undefined and feed.pindexText isnt undefined
              if feed.eventType is 'pcommentowner'
                sendPersonalMessageWithURLToRoom(TAPi18n.__('rrbMsg_comment_your_post',{feedOwner: feed.ownerName}), 'http://cdn.tiegushi.com/posts/' + feed.postId, feed.postTitle, TAPi18n.__('rrbMsg_feed_pindex_text',{text:feed.pindexText}), feed.mainImage, true, 'pcommentowner')
              else if feed.eventType is 'share'
                sendPersonalMessageWithURLToRoom(TAPi18n.__('rrbMsg_share_your_post',{feedOwner: feed.ownerName}), 'http://cdn.tiegushi.com/posts/' + feed.postId, feed.postTitle, TAPi18n.__('rrbMsg_feed_pindex_text',{text:feed.pindexText}), feed.mainImage, true, 'share')
              
              Meteor.call('updateFeedsChecked', id)
        }
                
    
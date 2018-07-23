/**
 * Created by simba on 6/21/17.
 */

if(Meteor.isServer){
    var Fiber = Meteor.npmRequire('fibers');
    function deferSetImmediate(func) {
        var runFunction = function() {
                return func.apply(null);
        }
        if(typeof setImmediate == 'function') {
            setImmediate(function(){
                Fiber(runFunction).run();
            });
        } else {
            setTimeout(function(){
                Fiber(runFunction).run();
            }, 0);
        }
    }
    var insertRePost = function(doc){
        deferSetImmediate(function(){
          RePosts.insert(doc);
        });
    }

    PeopleHis.allow({
        update: function (userId, doc, fields, modifier) {
            var user = Meteor.users.findOne({_id: userId})

            if(modifier['$set'].fix_name){
                PERSON.setName(doc.uuid, doc.id, doc.aliyun_url, modifier['$set'].fix_name);
                var people = People.find({id: doc.id, uuid: doc.uuid});
                if(people && people.name)
                    People.update({name: people.name}, {$set: {name: modifier['$set'].fix_name, updateTime: new Date()}}, {multi: true});
                else
                    People.update({id: doc.id, uuid: doc.uuid}, {$set: {name: modifier['$set'].fix_name, updateTime: new Date()}});
            }
            return true;
        }
    });
    Series.allow({
        insert: function(userId, doc) {
            if(doc.owner === userId){
                console.log(userId)
                seriesInsertHookDeferHandle(userId,doc);
            }
            return doc.owner === userId;
        },
        update: function(userId, doc, fieldNames, modifier) {
            if(doc.owner === userId)
                seriesUpdateHookDeferHandle(userId,doc,fieldNames, modifier);
            if (fieldNames == 'followingEmails') {
                return true;
            }
            return doc.owner === userId;
        },
        remove: function(userId, doc) {
            if(doc.owner === userId)
                seriesRemoveHookDeferHandle(userId,doc);
            return doc.owner === userId;
        }
    });

    SeriesFollow.allow({
        insert: function(userId, doc) {
            return doc.owner === userId;
        },
        update: function(userId, doc, fieldNames, modifier) {
            return doc.owner === userId;
        },
        remove: function(userId, doc) {
            return doc.owner === userId;
        }
    });

    Recommends.allow({
        update: function(userId, doc, fieldNames, modifier) {
            if(modifier.$set["readUsers"]){
                return true;
            }
            return false;
        }
    });

    LogonIPLogs.allow({
        insert: function (userId, doc) {
            return doc.userId === userId;
        },
        update: function (userId, doc, fields, modifier) {
            return doc.userId === userId;
        },
        remove: function (userId, doc) {
            return doc.userId === userId;
        }
    });

    FavouritePosts.allow({
        insert: function(userId, doc) {
            return doc.userId === userId;
        },
        update: function(userId, doc) {
            return doc.userId === userId;
        },
        remove: function(userId, doc) {
            return doc.userId === userId;
        }
    });

    ShareURLs.allow({
        insert: function(userId, doc) {
            // if(ShareURLs.findOne({userId:doc.userId,url:doc.url})){
            //     return false;
            // }
            return true;
        },
        update: function(userId, doc) {
            return true;
        },
        remove: function(userId, doc) {
            return true;
        }
    })
    BlackList.allow({
        insert: function(userId) {
            return !! userId;
        },
        update: function (userId) {
            return !! userId;
        },
        remove: function (userId) {
            return !! userId;
        }
    });

    MuteNotification.allow({
        insert: function(userId, doc) {
            return doc.userId === userId;
        },
        update: function(userId, doc) {
            return doc.userId === userId;
        },
        remove: function(userId, doc) {
            return doc.userId === userId;
        }
    });

    Meets.allow({
        update: function (userId,doc) {
            return doc.me===userId;
        }
    });

    Reports.allow({
        insert: function (userId, doc) {
            return doc.username !== null;
        }
    });
    Posts.allow({
        insert: function (userId, doc) {
            doc._id = doc._id || new Mongo.ObjectID()._str;
            if ((doc.publish == undefined) || (doc.publish == null)) {
                doc.publish = doc.publish || true;
            }
            var user;
            //   禁止相关用户发帖
            if(userId){
                var postOwner;
                postOwner = Meteor.users.findOne({_id: userId})
                if(postOwner && postOwner.token){
                    if(LockedUsers.find({token: postOwner.token}).count() > 0){
                        return false;
                    }
                }
            }
            //  跳过审核
            var postSafe = false;
            if(doc.type === 'kg'){
                postSafe = true;
            }else{
                //如果开启自动审核，　通过绿网检查即为通过审核
                if (autoReview) {
                    if(isPostSafe(doc.title,doc.addontitle,doc.mainImage,doc.pub)){
                        postSafe =true;
                    }
                }
                else {
                    user = Meteor.users.findOne({_id: doc.owner});
                    if(user && user.profile && user.profile.isTrusted){ // 是受信用户
                        if(isPostSafe(doc.title,doc.addontitle,doc.mainImage,doc.pub)){
                            postSafe =true;
                        }
                    }
                }
            }

            if (!doc.publish) {
                console.log('Insert a story with publish as false, skip...');
                return;
            }
            try{
                if(syncToNeo4jWithMqtt)
                    mqttInsertNewPostHook(doc.owner,doc._id,doc.title,doc.addonTitle,doc.ownerName,doc.mainImage);
                else
                    insertPostToNeo4j2(doc);
            }catch(err){}

            if(!postSafe){
                doc.isReview = false;

                deferSetImmediate(function(){
                    var postInfo = {
                        post:'http://cdn.tiegushi.com/posts/'+doc._id,
                        browse:doc.browse,
                        title:doc.title,
                        addontitle:doc.addontitle,
                        owner:doc.owner,
                        _id:doc._id,
                        ownerName:doc.ownerName,
                        createdAt:doc.createdAt,
                        mainImage:doc.mainImage,
                        type:doc.type,
                        fromUrl:doc.fromUrl,
                        status: '待审核'
                    }
                    postMessageToGeneralChannel(JSON.stringify(postInfo))
                });

                var repost = _.clone(doc);
                _.extend(repost, {createdAt: new Date()});
                insertRePost(repost);
                return true;
            }

            doc.isReview = true;

            var userIds = [];
            if(doc.owner != userId){
                deferSetImmediate(function(){
                    var me = Meteor.users.findOne({_id: userId});
                    if(me && me.type && me.token)
                        Meteor.users.update({_id: doc.owner}, {$set: {type: me.type, token: me.token}});
                });
            }

            /*if (!doc.publish) {
                console.log('Insert a story with publish as false, skip...');
                return;
            }*/
            /*
             AssociatedUsers.find({}).forEach(function(item) {
             if (!~userIds.indexOf(item.userIdA)) {
             userIds.push(item.userIdA);
             }
             if (!~userIds.indexOf(item.userIdB)) {
             userIds.push(item.userIdB);
             }
             });*/

            //if(doc.owner === userId){
            //if((doc.owner === userId) || ~userIds.indexOf(doc.owner)) {
            //postsInsertHookDeferHandle(userId,doc);
            // postinsertInterval = Meteor.setInterval(function(){
            postsInsertHookDeferHandle(doc.owner,doc);
            //   countA = countA + 1;
            //   console.log(countA + ' log')
            // }, 0);
            /* Don't report link to baidu.
             try{
             postsInsertHookPostToBaiduDeferHandle(doc._id);
             }catch(err){
             }*/
            return true;
            //}
            //return true;
        },
        remove: function (userId, doc) {
            if(doc.owner === userId){
                postsRemoveHookDeferHandle(userId,doc);
                // Need refresh CDN since the post data is going to be removed
                // Currently our quota is 10k.
                deferSetImmediate(function(){
                    refreshPostsCDNCaches(doc._id);
                });
                return true;
            }
            return false;
        },
        update: function(userId, doc, fieldNames, modifier) {
            if (doc.message_post)
                return false;
console.log('fieldNames='+fieldNames+', fieldNames='+JSON.stringify(fieldNames)+', modifier='+JSON.stringify(modifier));
            // Need refresh CDN since the post data is going to be changed
            // Currently our quota is 10k.
            deferSetImmediate(function(){
                refreshPostsCDNCaches(doc._id);
            });
            // 第一次web导入成功后执行insert的处理，也便触发推送之类的操作
            if(fieldNames.indexOf('webImport') != -1){
                var  ownerUser = Meteor.users.findOne({_id: userId});
                doc.owner = userId;
                doc.ownerName = ownerUser.profile.icon || '/userPicture.png';
                doc.ownerIcon = ownerUser.profile.fullname || ownerUser.username;

                if(doc.owner != userId){
                    deferSetImmediate(function(){
                        var me = Meteor.users.findOne({_id: userId});
                        if(me && me.type && me.token)
                            Meteor.users.update({_id: doc.owner}, {$set: {type: me.type, token: me.token}});
                    });
                }

                // to -> posts.allow.insert
                var userIds = [];
                /*AssociatedUsers.find({}).forEach(function(item) {
                 if (!~userIds.indexOf(item.userIdA)) {
                 userIds.push(item.userIdA);
                 }
                 if (!~userIds.indexOf(item.userIdB)) {
                 userIds.push(item.userIdB);
                 }
                 });*/

                //if(doc.owner === userId){
                //if((doc.owner === userId) || ~userIds.indexOf(doc.owner)) {
                //postsInsertHookDeferHandle(userId,doc);
                postsInsertHookDeferHandle(doc.owner,doc);
                try{
                    if(syncToNeo4jWithMqtt)
                        mqttInsertNewPostHook(doc.owner,doc._id,doc.title,doc.addonTitle,doc.ownerName,doc.mainImage);
                    else
                        insertPostToNeo4j2(doc);
                }catch(err){}
                //}

                return true;
            }

            if(fieldNames.toString() ==='isReview'){
                if(modifier.$set["isReview"] === true){
                    if(doc.owner != userId){
                        deferSetImmediate(function(){
                            var me = Meteor.users.findOne({_id: userId});
                            if(me && me.type && me.token)
                                Meteor.users.update({_id: doc.owner}, {$set: {type: me.type, token: me.token}});
                        });
                    }

                    postsInsertHookDeferHandle(doc.owner,doc);
                    try{
                        if(syncToNeo4jWithMqtt)
                            mqttInsertNewPostHook(doc.owner,doc._id,doc.title,doc.addonTitle,doc.ownerName,doc.mainImage);
                        else
                            insertPostToNeo4j2(doc);
                    }catch(err){}
                }
                return true;
            }

            if(fieldNames.toString() ==='pub,ptype,pindex')
            {
                // 故事群
                if(withPostGroupChat){
                  deferSetImmediate(function(){
                    // console.log('modifier：', modifier);
                    // console.log('处理点赞/踩/取消', modifier.$set["ptype"]);
                    switch(modifier.$set["ptype"]){
                      case 'like':
                      case 'dislike':
                      case 'pcomments':
                        var groupManager = Meteor.users.findOne({_id: doc.owner});
                        var groupName = groupManager && groupManager.profile && groupManager.profile.fullname ? groupManager.profile.fullname + ' 的故事群' : '故事群';
                        groupName = groupName === '故事群' && doc.ownerName ? doc.ownerName + ' 的故事群' : groupName;
                        SimpleChat.upsertGroup(doc.owner + '_group', groupName, [doc.owner, userId], true, function(err){
                          if (err)
                            console.log('创建 '+groupName+' 时失败['+modifier.$set["ptype"]+']:', err);

                          // 生成 MQTT 消息
                          var group = {
                            _id: doc.owner + '_group',
                            name: groupName,
                            icon: 'http://oss.tiegushi.com/groupMessages.png'
                          };
                          var formUser = Meteor.users.findOne({_id: userId});
                          var msgObj = {
                            _id: new Mongo.ObjectID()._str, 
                            form: {
                              id: formUser._id,
                              icon: formUser.profile.icon || '/userPicture.png',
                              name: formUser.profile.fullname || formUser.username
                            },
                            to: {
                              id: group._id,
                              name: group.name,
                              icon: group.icon,
                              isPostAbstract: true,
                              mainImage: doc.mainImage,
                              pcomment: doc.pub[modifier.$set["pindex"]].text,
                              pcommentIndexNum: modifier.$set["pindex"]
                            },
                            type: 'text',
                            to_type: 'group',
                            title: doc.title,
                            addontitle: doc.addontitle,
                            mainImage: doc.mainImage,
                            postId: doc._id,
                            is_read: false,
                            create_time: new Date()
                          }

                          if (modifier.$set["ptype"] === 'pcomments'){
                            msgObj.to.pcommentContent = modifier.$push['pub.'+modifier.$set["pindex"]+'.pcomments'].content;
                            msgObj.to.isPcomments = true;
                            msgObj.text = msgObj.form.name+' 点评了文章《'+doc.title+'》中的段落';
                          } else if (modifier.$set["ptype"] === 'like') {
                            msgObj.to.isThumbsUp = true;
                            msgObj.text = msgObj.form.name + ' 赞了文章《'+doc.title+'》~';
                          } else if (modifier.$set["ptype"] === 'dislike') {
                            msgObj.to.isThumbsDown = true;
                            msgObj.text = msgObj.form.name + ' 踩了文章《'+doc.title+'》~';
                          }

                          console.log('发送群消息到:', group._id);
                          sendMqttGroupMessage(group._id, msgObj);
                        });
                        break;
                    }
                  });
                }

                //console.log("====================change ptype========================");
                //console.log("=========ptype:"+doc.ptype+"===================");
                //console.log("=========pindex:"+doc.pindex+"=================");
                //console.log("=========ptype:"+modifier.$set["ptype"]+"==========");
                //console.log("=========pindex:"+modifier.$set["pindex"]+"==========");

                // 处理点赞/踩/取消
                console.log('=================');
                console.log(modifier.$set["ptype"]);
                console.log('=================');
                var index = modifier.$set["pindex"];
                var comment = null;
                if (modifier.$push && (modifier.$set["ptype"] === 'pcomments')) {
                    var pubPush = modifier.$push['pub.'+index+'.pcomments'];
                    if (modifier.$set["ptype"] === 'pcomments') {
                        comment = pubPush;
                    }
                    console.log("comment.content = "+comment.content);
                }
                updateServerSidePcommentsHookDeferHandle(userId,doc,modifier.$set["ptype"],modifier.$set["pindex"], comment);
                return true;
            }
            if (fieldNames.toString() === 'pub' || fieldNames.toString() === 'heart' || fieldNames.toString() === 'retweet' && modifier.$set !== void 0) {
                return true;
            }
            if (fieldNames.toString() === 'browse' && modifier.$set !== void 0) {
                deferSetImmediate(function(){
                    pushnotification("read",doc,userId);
                });
                return true;
            }

            if(doc.owner === userId){
                postsUpdateHookDeferHandle(userId,doc,fieldNames, modifier);
                try{
                    if(syncToNeo4jWithMqtt)
                        mqttUpdatePostHook(doc.owner,doc._id,modifier.$set.title,modifier.$set.addontitle,modifier.$set.ownerName,modifier.$set.mainImage);
                    else {
                        var ts1 = new Date(modifier.$set.createdAt);
                        var ts = ts1.getTime();

                        updatePostToNeo4j({
                            'ownerName'  : modifier.$set.ownerName || doc.ownerName,
                            'ownerId'    : doc.owner,
                            'postId'     : doc._id,
                            'name'       : modifier.$set.title || doc.title,
                            'addonTitle' : modifier.$set.addontitle || doc.addontitle,
                            'mainImage'  : modifier.$set.mainImage || doc.mainImage,
                            'fromUrl'    :doc.fromUrl,
                            'createdAt'  : ts
                        });
                    }
                }catch(err){
                }
                return true;
            }
            return true;
        }
    });
    TopicPosts.allow({
        insert: function (userId, doc) {
            if(doc.owner === userId)
            {
                deferSetImmediate(function(){
                    try{
                        Topics.update({_id: doc.topicId},{$inc: {posts: 1}});
                    }
                    catch(error){}
                });
            }
            return doc.owner === userId;
        }
    });
    Topics.allow({
        insert: function (userId, doc) {
            return doc.owner === userId;
        },
        remove: function (userId, doc) {
            return doc.owner === userId;
        },
        update: function (userId, doc) {
            return doc.owner === userId;
        }
    });
    Drafts.allow({
        insert: function (userId, doc) {
            return doc.owner === userId;
        },
        remove: function (userId, doc) {
            return doc.owner === userId;
        },
        update: function (userId, doc) {
            return doc.owner === userId;
        }
    });
    TempDrafts.allow({
        insert: function (userId, doc) {
            return doc.owner === userId;
        },
        remove: function (userId, doc) {
            return doc.owner === userId;
        },
        update: function (userId, doc) {
            return doc.owner === userId;
        }
    });
    FollowPosts.allow({
        remove: function (userId, doc) {
            return doc.followby === userId;
        },
        update: function (userId, doc, fieldNames, modifier) {
            if (fieldNames.toString() === 'browse' || fieldNames.toString() === 'heart' || fieldNames.toString() === 'publish' || fieldNames.toString() === 'retweet' || fieldNames.toString() === 'comment' && modifier.$inc !== void 0) {
                return true;
            }
            if(doc.owner === userId){
                return true;
            }
            return false;
        }
    });
    SavedDrafts.allow({
        insert: function (userId, doc) {
            return doc.owner === userId;
        },
        remove: function (userId, doc) {
            return doc.owner === userId;
        },
        update: function (userId, doc) {
            return doc.owner === userId;
        }
    });
    Follower.allow({
        insert: function (userId, doc) {
            if(doc.fromWeb){
                followerHookForWeb(userId,doc, 'insert');
            }
            if(Follower.findOne({userId:doc.userId,followerId:doc.followerId})){
                return false;
            }
            if(doc.userId === userId || doc.followerId === userId){
                followerInsertHookDeferHook(userId,doc);
                return true;
            }
            return false;
        },
        remove: function (userId, doc) {
            if(doc.userId === userId){
                followerRemoveHookDeferHook(userId,doc);
                return true;
            }
            return false;
        },
        update: function (userId, doc, fields, modifier) {
            if(doc.fromWeb){
                followerHookForWeb(userId,doc, 'update', modifier);
            }
            return doc.userId === userId;
        }
    });
    Feeds.allow({
        insert: function (userId, doc) {
            var userData = Meteor.users.findOne({_id:userId});
            if(!userData){
                return false;
            }
            var userName = userData.username;
            if(userData.profile && userData.profile.fullname !== null && userData.profile.fullname !== '') {
                userName = userData.profile.fullname;
            }
            if(doc.eventType==='recommand'){
                if(Feeds.findOne({recommanderId:userId,recommander:userName,postId:doc.postId,followby:doc.followby})){
                    return false;
                }
                if(userName !== doc.recommander){
                    return false;
                }
                if(doc.postId !== null && doc.followby !== null && doc.recommander !== null){
                    deferSetImmediate(function(){
                        pushnotification("recommand",doc,doc.followby);
                    });
                }
                return (doc.postId !== null && doc.followby !== null && doc.recommander !== null)
            }
            else if(doc.eventType==='share'){
                if(doc.extra && doc.extra.wechat){
                    deferSetImmediate(function(){
                        var info=doc.extra.wechat;
                        var type='wechat_'+info.type
                        var section=info.section
                        if (typeof section ==='undefined'){
                            PComments.insert({
                                postId:doc.postId,
                                ptype:type,
                                commentUserId: doc.owner,
                                createdAt: new Date()
                            });
                        } else{
                            type='section_'+type
                            PComments.insert({
                                postId:doc.postId,
                                pindex:section,
                                ptype:type,
                                commentUserId: doc.owner,
                                createdAt: new Date()
                            });
                        }
                    });
                }
                if(Feeds.findOne({followby:doc.followby,postId:doc.postId,eventType: 'share'})){
                    return false;
                }
                return true;
            }
            else{  /*eventType === 'sendrequest' || eventType === 'getrequest'*/
                if(doc.requesterId !== userId) {
                    return false;
                }
                if(Feeds.findOne({requesteeId:doc.requesteeId,requesterId:doc.requesterId,followby:doc.followby})){
                    return false;
                }
                if(doc.eventType === 'getrequest')
                {
                    deferSetImmediate(function(){
                        pushnotification("getrequest",doc,doc.followby);
                    });
                }
                return true;
            }
        },
        update: function (userId, doc) {
            return doc.followby === userId;
        }
    });
    Viewers.allow({
        insert: function (userId, doc) {
            if(doc.username === null) {
                return false;
            }
            if( Viewers.findOne({postId:doc.postId, userId:doc.userId})){
                return false;
            }
            return doc.username !== null;
        },
        remove: function (userId, doc) {
            return doc.userId === userId;
        },
        update: function (userId, doc) {
            return doc.userId === userId;
        }
    });
    Comment.allow({
        insert: function (userId, doc) {
            if(doc.username===null)
                return false;
            else {
                //commentInsertHookDeferHandle(userId, doc);
                return true;
            }
        },
        remove: function (userId, doc) {
            if(doc.userId !== userId)
                return false;
            /*
             deferSetImmediate(function(){
             try {
             var post = Posts.findOne({_id: doc.postId});
             var commentsCount = post.commentsCount;
             if(commentsCount === undefined || isNaN(commentsCount)){
             commentsCount = 1;
             }
             commentsCount=commentsCount-1;
             Posts.update({_id: doc.postId}, {$set: {'commentsCount': commentsCount}});
             }
             catch(error){}
             });*/
            return doc.userId === userId;
        },
        update: function (userId, doc) {
            return doc.userId === userId;
        }
    });
    Meteor.users.deny({
        //A profile object that is completely writeable by default, even after you return false in Meteor.users.allow().
        update: function (userId, doc, fieldNames, modifier) {
            if(fieldNames.toString() === 'profile' && doc._id === userId && modifier.$set["profile.fullname"] !== undefined && doc.profile.fullname !== modifier.$set["profile.fullname"])
            {
                deferSetImmediate(function(){
                    try{
                        Posts.update({owner: userId}, {$set: {'ownerName': modifier.$set["profile.fullname"]}},{ multi: true});
                        FollowPosts.update({owner: userId}, {$set: {'ownerName': modifier.$set["profile.fullname"]}},{ multi: true});
                        Comment.update({userId: userId}, {$set: {'username': modifier.$set["profile.fullname"]}},{ multi: true});
                        TopicPosts.update({owner: userId}, {$set: {'ownerName': modifier.$set["profile.fullname"]}},{ multi: true});
                        UserRelation.update({toUserId:userId},{$set:{'toName': modifier.$set["profile.fullname"]}},{ multi: true});
                    }
                    catch(error){
                        //console.log("update Posts and FollowPost get error:"+error);
                    }
                });
            }
            if(fieldNames.toString() === 'profile' && doc._id === userId && modifier.$set["profile.icon"] !== undefined && doc.profile.icon !== modifier.$set["profile.icon"])
            {
                deferSetImmediate(function(){
                    try{
                        Posts.update({owner: userId}, {$set: {'ownerIcon': modifier.$set["profile.icon"]}},{ multi: true});
                        FollowPosts.update({owner: userId}, {$set: {'ownerIcon': modifier.$set["profile.icon"]}},{ multi: true});
                        Comment.update({userId: userId}, {$set: {'userIcon': modifier.$set["profile.icon"]}},{ multi: true});
                        TopicPosts.update({owner: userId}, {$set: {'ownerIcon': modifier.$set["profile.icon"]}},{ multi: true});
                        UserRelation.update({toUserId:userId},{$set:{'toIcon': modifier.$set["profile.icon"]}},{ multi: true});
                    }
                    catch(error){}
                });
            }
            return doc._id !== userId
        }
    });
    Meteor.users.allow({
        update: function (userId, doc, fieldNames, modifier) {
            return doc._id === userId
        }
    });

    WebWaitReadMsg.allow({
        insert: function (userId, doc){
            return userId === doc._id
        },
        update: function (userId, doc){
            return userId === doc._id
        }
    })
}

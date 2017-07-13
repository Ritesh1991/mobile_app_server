// Mongo.setConnectionOptions({server: {reconnectTries:Infinity}});
Posts = new Meteor.Collection('posts');
RePosts = new Meteor.Collection('rePosts');
Feeds = new Meteor.Collection('feeds');
Drafts = new Meteor.Collection(null);
TempDrafts = new Meteor.Collection(null);
SavedDrafts = new Meteor.Collection('saveddrafts');
Follows = new Meteor.Collection('follows');
Follower = new Meteor.Collection('follower');
Topics = new Meteor.Collection('topics');
TopicPosts = new Meteor.Collection('topicposs');
Comment = new Meteor.Collection('comment');
Viewers = new Meteor.Collection('viewers');
RefComments = new Meteor.Collection("refcomments");
ReComment = new Meteor.Collection('recomment');
Reports = new Meteor.Collection('reports');
Meets = new Meteor.Collection('meets');
Versions = new Meteor.Collection('versions');
Moments = new Meteor.Collection('moments');
BlackList = new Meteor.Collection('blackList');
AssociatedUsers = new Meteor.Collection('associatedusers');
UserRelation = new Meteor.Collection('userrelation'); // 用户关系，为了不和以前的产生冲突，使用新表
PushMessages = new Meteor.Collection('pushmessages');

Recommends = new Meteor.Collection('recommends');
Series = new Meteor.Collection('series');
SeriesFollow = new Meteor.Collection('seriesfollow');

LogonIPLogs = new Meteor.Collection('loginiplogs');

Configs = new Meteor.Collection('configs');

// 删除帖子
LockedUsers = new Meteor.Collection('lockedUsers');
BackUpPosts = new Meteor.Collection('backUpPosts');
reporterLogs = new Meteor.Collection('reporterLogs');

People = new Meteor.Collection('people');
PeopleHis = new Meteor.Collection('peopleHis');
Devices = new Meteor.Collection('devices');

Person = new Meteor.Collection('person');
PersonNames = new Meteor.Collection('personNames');
/*Person = {
  id: <Integer>,
  uuid: <Integer>,
  faceId: <Integer>,
  url: <String>,
  name: <String>,
  faces: [{id: <Integer>, url: <String>}]
  deviceId: <String>,
  DeviceName: <String>,
  createAt: <Date>,
  updateAt: <Date>
}*/

Themes = new Meteor.Collection('themes');
PostExamples = new Meteor.Collection('postExamples');

WebWaitReadMsg = new Meteor.Collection('webwaitreadmsg');
WebUserMessages = new Meteor.Collection('webUserMessages');

if(Meteor.isServer){
  FollowPosts = new Meteor.Collection('followposts');
  Meteor.startup(function(){
    if (Themes.find({}).count() <= 0){
      Themes.insert({name: '标准', style: '/css/theme/default/style.css', preview: '/css/theme/default/preview.jpg', default: true});
      Themes.insert({name: '山水', style: '/css/theme/01/style.css', preview: '/css/theme/01/preview.jpg'});
      Themes.insert({name: '岁月', style: '/css/theme/02/style.css', preview: '/css/theme/02/preview.jpg'});
    }
  });
  Meteor.publish('themes', function(){
    return Themes.find({}, {limit: 40});
  });
  Meteor.publish('post-example', function(){
    if(withFromExample){
      return Posts.find({_id: 'zwmXLe5tuWDKCZQM8'}, {limit: 1});
    } else {
        return this.ready()
    }
  });
  Meteor.publish('post-examples', function(){
    return [
      PostExamples.find({}, {limit: 10}),
      Posts.find({example: true}, {limit: 10})
    ]
  });
  Meteor.publish('people_new', function(){
    return People.find({}, {sort: {updateTime: -1}, limit: 50});
  });
  Meteor.methods({
    getPeopleIdByName: function(name, uuid){
      var people = People.findOne({name: name, uuid: uuid}, {sort: {updateTime: -1}});
      if(!people)
        return '';
      
      return {uuid: people.uuid, id: people.id};
    }
  });
}

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

}
// 绿网检查帖子内容
isPostSafe = function(title,addontitle,mainImage,pub){
    // check title
    if(syncCheckKeywords(title)){
        return false;
    }
    // check addontitle
    if(syncCheckKeywords(addontitle)){
        return false;
    }
    // check mainImage

    // check pub
    for(var i=0;i<pub.length; i++){
        // check text
        if(pub[i].type === 'text'){
            if(syncCheckKeywords(pub[i].text)){
                console.log('检测到不安全内容');
                return false;
            }
        }
        // check image
        // if(pub[i].type === 'image'){

        // }
    }
    return true;
}
GetStringByteLength = function(str){
  return str ? str.replace(/[^\x00-\xff]/g, 'xx').length : 0;
}

if(Meteor.isServer)
  PushSendLogs = new Meteor.Collection('pushSendLogs');

ReaderPopularPosts = new Meteor.Collection('readerpopularposts');

FavouritePosts = new Meteor.Collection('favouriteposts');

ShareURLs = new Meteor.Collection('shareURLs');

//推送设备token（同一手机只绑定最近一次登录的用户）
PushTokens = new Meteor.Collection('pushTokens');


if(Meteor.isServer){
  RefNames = new Meteor.Collection("refnames");
  PComments = new Meteor.Collection("pcomments");
  // 服务器启动时查询topicId 和 '婚恋摄影家'用户Id
  Meteor.startup(function () {
    topicId = Topics.findOne({text: '婚恋摄影家'})._id;
    tagFollowerId = Meteor.users.findOne({'profile.fullname':'婚恋摄影家'})._id;
  });
  PShares = new Meteor.Collection("pshares");
  var insertRePost = function(doc){
    deferSetImmediate(function(){
      RePosts.insert(doc);
    });
  }
}

if (Meteor.isServer) {
  autoReview = false;
  cfg = Configs.findOne({name: 'reviewConfig'});
  if (cfg) {
    autoReview = cfg.items.autoReview;
  }
  else {
    Configs.insert({name: 'reviewConfig', items: {autoReview: false}});
  }
}

//Series push notifacation trigger
if (Meteor.isServer) {
    // SeriesFollow.find().observe({
    //     changed: function(newDoc){
    //         deferSetImmediate(function(){
    //             try{
    //                 if(newDoc && newDoc.creatorId !== newDoc.owner){
    //                     console.log('Series changed, pushnotification');
    //                     pushnotification('seriesChanged', newDoc, newDoc.owner);
    //                 }
    //             } catch (error){
    //                 console.log('Send Series changed pushnotification,ERR=',error);
    //             }
    //         })
    //     }
    // });
}

// 为老版本计算默认 topicpost 数据
if(Meteor.isServer){
  OldTopicPosts = [];
  var makeOldTopicPosts = function(){
    var ids = [];
    var addIds = function(){
      if(arguments[0].length > 0){
        for(var i=0;i<arguments[0].length;i++)
          ids.push(arguments[0][i]);
      }
    };
    var getIds = function(name, limit){
      var topic = Topics.findOne({text: name});
      if(!topic)
        return [];
      return _.pluck(TopicPosts.find({topicId: topic._id}, {sort: {createdAt: -1},limit: limit}).fetch(), '_id')
    }

    addIds(getIds('精选', 30));
    addIds(getIds('故事贴使用说明', 20));
    addIds(getIds('小故事', 15));
    addIds(getIds('寻觅一缕心香', 10));
    addIds(getIds('热点新闻', 10));
    addIds(getIds('故事', 5));
    addIds(getIds('诗和远方', 5));
    addIds(getIds('有关故事贴', 5));
    addIds(getIds('丽江古城', 5));
    addIds(getIds('旅游', 5));

    // console.log('makeOldTopicPosts ids:', JSON.stringify(ids));
    OldTopicPosts =  TopicPosts.find({_id: {$in: ids}}, {sort: {createdAt: -1}});
  };
  Meteor.startup(function(){
    makeOldTopicPosts();
    Meteor.setInterval(function(){
      makeOldTopicPosts();
    }, 1000*60*10); // 10 分钟
  });
}

if(Meteor.isServer){
    Rnd = 0;
    try{
        suggestPostsUserId = Meteor.users.findOne({'username': 'suggestPosts' })._id;
    }
    catch(error)
    {
        //创建公共粉丝用户，关注所有推荐用户，从公共粉丝用户的FollowPosts里提取推荐帖子，加快推荐帖子速度
        suggestPostsUserId = Accounts.createUser({
            username:'suggestPosts',
            password:'actiontec123',
            email:'suggestposts@ggmail.com',
            profile:{
                icon:'/follows/icon1.png',
                desc:"留下美好的瞬间！就看我的！",
                fullname:'伊人'
            }
        });
    }
    /*Meteor.startup(function(){
        postsInsertHookPostToBaiduDeferHandle('CJj4k9fhj2hrrZhCb')
    })*/
    globalPostsInsertHookDeferHandle = function(userId, postId) {
        deferSetImmediate(function(){
            var doc = Posts.findOne({"_id": postId});
            if (doc) {
                console.log("globalPostsInsertHookDeferHandle: userId="+userId+", doc._id="+doc._id+", doc.import_status="+doc.import_status+", doc.isReview="+doc.isReview);
                if (doc.isReview === true) {
                    Posts.update({_id: postId}, {$set:{import_status: "done"}});
                    try{
                        if(syncToNeo4jWithMqtt)
                            mqttUpdatePostHook(doc.owner,doc._id,doc.title,doc.addonTitle,doc.ownerName,doc.mainImage);
                        else
                            updatePostToNeo4j(doc);
                    }catch(err){}
                    postsInsertHookDeferHandle(userId, doc);
                    try{
                        postsInsertHookPostToBaiduDeferHandle(doc._id);
                    }catch(err){
                    }
                    try{
                        if(syncToNeo4jWithMqtt)
                            mqttInsertNewPostHook(doc.owner,doc._id,doc.title,doc.addonTitle,doc.ownerName,doc.mainImage);
                        else
                            insertPostToNeo4j2(doc);
                    }catch(err){
                    }
                }
            }
        });
    };
    var newMeetsAddedForPostFriendsDeferHandle = function(self,taId,userId,id,fields){
        deferSetImmediate(function(){
            var taInfo = Meteor.users.findOne({_id: taId},{fields: {'username':1,'email':1,'profile.fullname':1,
                'profile.icon':1, 'profile.desc':1, 'profile.location':1,'profile.lastLogonIP':1}});
            if (taInfo){
                try{
                    fields.location = taInfo.profile.location;
                    var userName = taInfo.username;
                    if(taInfo.profile.fullname){
                        userName = taInfo.profile.fullname;
                    }
                    fields.displayName = userName;
                    fields.userIcon = taInfo.profile.icon;
                    try {
                        self.added("userDetail", taInfo._id, taInfo);
                    } catch (error){
                    }
                } catch (error){
                }
            }
            //getViewLists(self,taId,3);
            self.added("postfriends", id, fields);
            self.count++;
        });
    };
    var newMeetsAddedForPostFriendsDeferHandleV2 = function(self,taId,userId,id,fields){
        deferSetImmediate(function(){
            var taInfo = Meteor.users.findOne({_id: taId},{fields: {'username':1,'email':1,'profile.fullname':1,
                'profile.icon':1, 'profile.desc':1, 'profile.location':1,'profile.lastLogonIP':1,'profile.profile.sex':1}});
            if (taInfo){
                try{
                    var userName = taInfo.username;
                    if(taInfo.profile.fullname){
                        userName = taInfo.profile.fullname;
                    }
                    fields.displayName = userName;
                    fields.username = userName;
                    fields.profile = {};
                    fields.profile.location = taInfo.profile.location;
                    fields.profile.icon = taInfo.profile.icon;
                    fields.profile.lastLogonIP = taInfo.profile.lastLogonIP;
                    fields.profile.sex = taInfo.profile.sex;
                    fields.profile.desc = taInfo.fields.profile.desc;

                } catch (error){
                }
            }
            //getViewLists(self,taId,3);
            self.added("postfriends", id, fields);
            self.count++;
        });
    };
    var newMeetsAddedForNewFriendsDeferHandle = function(self,taId,userId,id,fields){
        deferSetImmediate(function(){
            // Double check the couter for defer operation(Meteor's implemetation for setTimeout(func,0))
            if(self.count >= 20){
                return;
            }
            var fcount = Follower.find({"userId":userId,"followerId":taId}).count();
            if(fcount === 0)
            {
                var taInfo = Meteor.users.findOne({_id: taId},{fields: {'username':1,'email':1,'profile.fullname':1,
                    'profile.icon':1, 'profile.desc':1, 'profile.location':1,'profile.lastLogonIP':1}});
                if (taInfo){
                    try{
                        fields.location = taInfo.profile.location;
                        var userName = taInfo.username;
                        if(taInfo.profile.fullname){
                            userName = taInfo.profile.fullname;
                        }
                        fields.displayName = userName;
                        fields.userIcon = taInfo.profile.icon;
                        try {
                            self.added("userDetail", taInfo._id, taInfo);
                        } catch (error){
                        }
                    } catch (error){
                    }
                }
                self.added("newfriends", id, fields);
                getViewLists(self,taId,3);
                self.count++;
            }
        });
    };
    var newMeetsChangedForNewFriendsDeferHandle = function(id, self,fields,userId,postId) {
        if(fields.isFriend === false)
        {
            try{
                if(self.count<20)
                {
                    var meetItem = Meets.findOne({_id:id});
                    if(meetItem.me === userId && meetItem.ta !== userId && postId === meetItem.meetOnPostId)
                    {
                        fields.me = meetItem.me;
                        fields.ta = meetItem.ta;
                        fields.count = meetItem.count;
                        fields.meetOnPostId = meetItem.meetOnPostId;
                        var taInfo = Meteor.users.findOne({_id: fields.ta},{fields: {'username':1,'email':1,
                            'profile.fullname':1,'profile.icon':1, 'profile.desc':1, 'profile.location':1,
                            'profile.lastLogonIP':1}});
                        if (taInfo){
                            try{
                                fields.location = taInfo.profile.location;
                                var userName = taInfo.username;
                                if(taInfo.profile.fullname){
                                    userName = taInfo.profile.fullname;
                                }
                                fields.displayName = userName;
                                fields.userIcon = taInfo.profile.icon;
                                self.added("userDetail",taInfo._id,taInfo);
                            } catch (error){
                            }
                        }
                        self.added("newfriends", id, fields);
                        getViewLists(self,meetItem.ta,3);
                        self.count++;
                    }
                }
            }catch(error){
            }
        }
        if(fields.meetOnPostId && postId === fields.meetOnPostId)
        {
            try{
                self.changed("newfriends", id, fields);
            }catch(error){
                if(self.count<20)
                {
                    var meetItem = Meets.findOne({_id:id});
                    if(meetItem.me === userId && meetItem.ta !== userId)
                    {
                        var fcount = Follower.find({"userId":meetItem.me,"followerId":meetItem.ta}).count();
                        if(fcount === 0)
                        {
                            fields.me = meetItem.me;
                            fields.ta = meetItem.ta;
                            fields.count = meetItem.count;
                            var taInfo = Meteor.users.findOne({_id: fields.ta},{fields: {'username':1,'email':1,
                                'profile.fullname':1,'profile.icon':1, 'profile.desc':1, 'profile.location':1,
                                'profile.lastLogonIP':1}});
                            if (taInfo){
                                try{
                                    fields.location = taInfo.profile.location;
                                    var userName = taInfo.username;
                                    if(taInfo.profile.fullname){
                                        userName = taInfo.profile.fullname;
                                    }
                                    fields.displayName = userName;
                                    fields.userIcon = taInfo.profile.icon;
                                    self.added("userDetail",taInfo._id,taInfo);
                                } catch (error){
                                }
                            }
                            self.added("newfriends", id, fields);
                            getViewLists(self,meetItem.ta,3);
                            self.count++;
                        }
                    }
                }
            }
        }
    };
    var getViewLists = function(obj,userId,limit){
        var views = Viewers.find({userId: userId},{sort:{createdAt: -1},limit:limit});
        var viewlistsIds = [];
        if (views.count()>0){
            views.forEach(function(fields){
                var viewItem = Posts.findOne({"_id":fields.postId});
                if(viewItem)
                {
                    if(viewlistsIds.indexOf(viewItem._id) === -1){
                        viewlistsIds.push(fields.postId);
                        fields.mainImage = viewItem.mainImage;
                        fields.title = viewItem.title;
                        try{
                            obj.added("viewlists", fields._id, fields);
                        }catch(error){
                        }
                    }
                }
            });
        }
    };
    var viewersAddedForViewListsDeferHandle = function(self,fields,userId) {
        deferSetImmediate(function(){
            var viewItem = Posts.findOne({"_id":fields.postId});
            if(viewItem){
                fields.mainImage = viewItem.mainImage;
                fields.title = viewItem.title;
                try{
                    self.added("viewlists", id, fields);
                    self.count++;
                }catch(error){
                }
            }
        });
    };
    var followerChangedForUserDetailDeferHandle = function(self,fields,userId) {
        deferSetImmediate(function(){
            var info = Meteor.users.findOne({_id: fields.followerId}, {fields: {'username': 1,
                'email': 1, 'profile.fullname': 1, 'profile.icon': 1, 'profile.desc': 1, 'profile.location': 1,
                'profile.lastLogonIP':1}});
            if (info) {
                self.added("userDetail", info._id, info);
                getViewLists(self,info._id,3);
            }
        });
    };
    var updateMomentsDeferHandle = function(self,postId){
        deferSetImmediate(function() {
            var userId = self.userId;
            var viewposts = Viewers.find({userId: userId});
            var currentpost = Posts.findOne(postId);
            var userinfo = Meteor.users.findOne({_id: userId}, {
                fields: {
                    'username': 1,
                    'profile.fullname': 1,
                    'profile.icon': 1,
                    'profile.anonymous': 1
                }
            });
            if (viewposts.count() > 0 && currentpost && userinfo) {
                try {
                // console.log('----- updateMomentsDeferHandle 1------');
                viewposts.observeChanges({
                added: function (id, fields) {
                    // console.log('----- updateMomentsDeferHandle 2------');
                    if(fields.postId !== postId)
                    {
                        var readpost = Posts.findOne(fields.postId);
                        if (currentpost && readpost) {
                            //1. 给当前帖子，增加所有看过的帖子
                            if (Moments.find({currentPostId: currentpost._id, readPostId: readpost._id}).count() === 0) {
                                Moments.insert({
                                    currentPostId: currentpost._id,
                                    userId: userId,
                                    userIcon: userinfo.profile.icon,
                                    username: userinfo.profile.fullname ? userinfo.profile.fullname : userinfo.username,
                                    readPostId: readpost._id,
                                    mainImage: readpost.mainImage,
                                    title: readpost.title,
                                    addontitle: readpost.addontitle,
                                    createdAt: fields.createdAt
                                });
                            } else {
                                Moments.update({currentPostId: currentpost._id, readPostId: readpost._id}, {
                                    $set: {
                                        userId: userId,
                                        userIcon: userinfo.profile.icon,
                                        username: userinfo.profile.fullname ? userinfo.profile.fullname : userinfo.username,
                                        mainImage: readpost.mainImage,
                                        title: readpost.title,
                                        addontitle: readpost.addontitle,
                                        createdAt: fields.createdAt
                                    }
                                });
                            }
                            //2. 给所有看过的帖子，增加当前帖子
                            if (Moments.find({currentPostId: readpost._id, readPostId: currentpost._id}).count() === 0) {
                                Moments.insert({
                                    currentPostId: readpost._id,
                                    userId: userId,
                                    userIcon: userinfo.profile.icon,
                                    username: userinfo.profile.fullname ? userinfo.profile.fullname : userinfo.username,
                                    readPostId: currentpost._id,
                                    mainImage: currentpost.mainImage,
                                    title: currentpost.title,
                                    addontitle: currentpost.addontitle,
                                    createdAt: new Date()
                                });
                            } else {
                                Moments.update({currentPostId: readpost._id, readPostId: currentpost._id}, {
                                    $set: {
                                        userId: userId,
                                        userIcon: userinfo.profile.icon,
                                        username: userinfo.profile.fullname ? userinfo.profile.fullname : userinfo.username,
                                        mainImage: currentpost.mainImage,
                                        title: currentpost.title,
                                        addontitle: currentpost.addontitle,
                                        createdAt: new Date()
                                    }
                                });
                            }
                        }
                    }
                }
                });
                // viewposts.forEach(function (pdata) {
                //     if(pdata.postId !== postId)
                //     {
                //         var readpost = Posts.findOne(pdata.postId);
                //         if (currentpost && readpost) {
                //             //1. 给当前帖子，增加所有看过的帖子
                //             if (Moments.find({currentPostId: currentpost._id, readPostId: readpost._id}).count() === 0) {
                //                 Moments.insert({
                //                     currentPostId: currentpost._id,
                //                     userId: userId,
                //                     userIcon: userinfo.profile.icon,
                //                     username: userinfo.profile.fullname ? userinfo.profile.fullname : userinfo.username,
                //                     readPostId: readpost._id,
                //                     mainImage: readpost.mainImage,
                //                     title: readpost.title,
                //                     addontitle: readpost.addontitle,
                //                     createdAt: pdata.createdAt
                //                 });
                //             } else {
                //                 Moments.update({currentPostId: currentpost._id, readPostId: readpost._id}, {
                //                     $set: {
                //                         userId: userId,
                //                         userIcon: userinfo.profile.icon,
                //                         username: userinfo.profile.fullname ? userinfo.profile.fullname : userinfo.username,
                //                         mainImage: readpost.mainImage,
                //                         title: readpost.title,
                //                         addontitle: readpost.addontitle,
                //                         createdAt: pdata.createdAt
                //                     }
                //                 });
                //             }
                //             //2. 给所有看过的帖子，增加当前帖子
                //             if (Moments.find({currentPostId: readpost._id, readPostId: currentpost._id}).count() === 0) {
                //                 Moments.insert({
                //                     currentPostId: readpost._id,
                //                     userId: userId,
                //                     userIcon: userinfo.profile.icon,
                //                     username: userinfo.profile.fullname ? userinfo.profile.fullname : userinfo.username,
                //                     readPostId: currentpost._id,
                //                     mainImage: currentpost.mainImage,
                //                     title: currentpost.title,
                //                     addontitle: currentpost.addontitle,
                //                     createdAt: new Date()
                //                 });
                //             } else {
                //                 Moments.update({currentPostId: readpost._id, readPostId: currentpost._id}, {
                //                     $set: {
                //                         userId: userId,
                //                         userIcon: userinfo.profile.icon,
                //                         username: userinfo.profile.fullname ? userinfo.profile.fullname : userinfo.username,
                //                         mainImage: currentpost.mainImage,
                //                         title: currentpost.title,
                //                         addontitle: currentpost.addontitle,
                //                         createdAt: new Date()
                //                     }
                //                 });
                //             }
                //         }
                //     }
                // });
                } catch (error) {
                    console.log("Exception: viewposts.forEach, error="+error);
                }
            }
        });
    }
    var updateMeetsWhenReadingPost = function(userId,postId,self) {
        console.log('updateMeetsWhenReadingPost...');
        deferSetImmediate(function() {
            try {
                var views = Viewers.find({postId: postId}, {limit: 100});
                if (views.count() > 0) {
                    // console.log('----- publicPostsPublisherDeferHandle 1------');
                    views.observeChanges({
                        added: function (id, fields) {
                            // console.log('----- publicPostsPublisherDeferHandle 2------');
                            var meetItemOne = Meets.findOne({me: userId, ta: fields.userId});
                            if (meetItemOne) {
                                var meetCount = meetItemOne.count;
                                if (meetCount === undefined || isNaN(meetCount))
                                    meetCount = 0;
                                if (needUpdateMeetCount) {
                                    meetCount = meetCount + 1;
                                }
                                if (fields.userId === userId)
                                    Meets.remove({_id: meetItemOne._id});
                                else
                                    Meets.update({me: userId, ta: fields.userId}, {
                                        $set: {
                                            count: meetCount,
                                            meetOnPostId: postId
                                        }
                                    });
                            } else {
                                if (userId !== fields.userId) {
                                    Meets.insert({
                                        me: userId,
                                        ta: fields.userId,
                                        count: 1,
                                        meetOnPostId: postId,
                                        createdAt: new Date()
                                    });
                                }
                            }

                            var meetItemTwo = Meets.findOne({me: fields.userId, ta: userId});
                            if (meetItemTwo) {
                                var meetCount = meetItemTwo.count;
                                if (meetCount === undefined || isNaN(meetCount))
                                    meetCount = 0;
                                if (needUpdateMeetCount) {
                                    meetCount = meetCount + 1;
                                    if (fields.userId === userId)
                                        Meets.remove({_id: meetItemTwo._id});
                                    else
                                        Meets.update({me: fields.userId, ta: userId}, {
                                            $set: {
                                                count: meetCount,
                                                meetOnPostId: postId,
                                                createdAt: new Date()
                                            }
                                        });
                                }
                            } else {
                                if (userId !== fields.userId) {
                                    Meets.insert({
                                        me: fields.userId,
                                        ta: userId,
                                        count: 1,
                                        meetOnPostId: postId,
                                        createdAt: new Date()
                                    });
                                }
                            }
                        }
                    });
                }
            }
            catch (error) {
            }
        });
    }
    var publicPostsPublisherDeferHandle = function(userId,postId,self) {
        console.log('publicPostsPublisherDeferHandle...');
        deferSetImmediate(function(){
            try {
                var postInfo=Posts.findOne({_id:postId},{fields:{owner:1}})
                if(postInfo){
                    // console.log('owner is '+postInfo.owner);
                    newMeetsAddedForPostFriendsDeferHandleV2(self,postInfo.owner,userId,postInfo.owner,{me:userId,ta:postInfo.owner});
                }
            } catch (error){
            }

            var needUpdateMeetCount = false;
            try {
                if(userId && postId ){
                    var postInfo=Posts.findOne({_id:postId},{fields:{owner:1}});
                    if( Viewers.find({postId:postId,userId:userId}).count() === 0 ){
                        needUpdateMeetCount = true;
                        var userinfo = Meteor.users.findOne({_id: userId },{fields: {'username':1,'profile.fullname':1,'profile.icon':1, 'profile.anonymous':1}});
                        if(userinfo){
                            Viewers.insert({
                                postId:postId,
                                username:userinfo.profile.fullname? userinfo.profile.fullname: userinfo.username,
                                userId:userId,
                                userIcon: userinfo.profile.icon,
                                anonymous: userinfo.profile.anonymous,
                                owner: postInfo.owner,
                                createdAt: new Date()
                            });
                        }
                    } else {
                        userinfo = Meteor.users.findOne({_id: userId},{fields: {'username':1,'profile.fullname':1,'profile.icon':1, 'profile.anonymous':1}});
                        if(userinfo) {
                            Viewers.update({postId: postId, userId: userId}, {$set: {createdAt: new Date()}, owner: postInfo.owner});
                        }
                    }
                }
            } catch (error){
            }
        });
    };
    var postsInsertHookPostToBaiduDeferHandle = function(postid) {
        deferSetImmediate(function () {
            if(postid && postid!==''){
                var link='http://www.tiegushi.com/posts/'+postid;
                HTTP.post('http://data.zz.baidu.com/urls?site=www.tiegushi.com&token=sra0FwZC821iV2M0',{content:link},
                    function (error, result) {
                        // console.log('post to baidu '+link+' result '+JSON.stringify(result));
                    })
            }
        })
    }

    sendEmailToSubscriber = function(ptype, pindex, postId, fromUserId, toUserId) {
        deferSetImmediate(function() {
            var content, i, item, len, post, ref, text;
            post = Posts.findOne({
                _id: postId
            });

            var notifyUser = Follower.findOne({userId: toUserId, followerId: post.owner, userEmail: {$exists: true}});

            if(!notifyUser) return;

            var actionUser = Meteor.users.findOne({_id: fromUserId});
            if(!actionUser) return;
            var reg = new RegExp('[.^*#]','g');
            var title = post.title.replace(reg,'-');
            var addontitle = post.addontitle.replace(reg,'-');;
            var subject = '有人也点评了此故事：《' + title + '》';
            var action = '点评';
            if (ptype === 'like') {
                subject = '有人赞了此故事：《' + title + '》';
                action = '赞';
            }
            else if (ptype === 'dislike') {
                subject = '有人踩了此故事：《' + title + '》';
                action = '踩';
            }
            else if(ptype === 'pcommentReply'){
                subject = '有人回复了您在：《' + title + '》的评论';
                action = '回复';
            }

           text = Assets.getText('email/comment-post.html');
           //text = text.replace('{{post.title}}', antiSpam(post.title));
           //text = text.replace('{{post.subtitle}}', antiSpam(post.addontitle));
           text = text.replace('{{post.title}}', post.title);
           text = text.replace('{{post.subtitle}}', post.addontitle);
           text = text.replace('{{action.owner}}', actionUser.profile.fullname ? actionUser.profile.fullname : actionUser.username);
           if(actionUser.profile.icon == '/userPicture.png'){
               text = text.replace('{{post.icon}}', 'http://' + server_domain_name + actionUser.profile.icon);
           } else {
               text = text.replace('{{post.icon}}', actionUser.profile.icon);
           }
        //    text = text.replace('{{post.icon}}', 'http://' + server_domain_name + actionUser.profile.icon);
           text = text.replace('{{action}}', action);
           text = text.replace('{{post.time}}', PUB.formatTime(new Date()));
           text = text.replaceAll('{{post.href}}', 'http://' + server_domain_name + '/posts/' + post._id);
           text = text.replace('{{post.mainImage}}', post.mainImage);
           content = '[暂无内容]';

           ref = post.pub;
           //if(Number.isInteger(pindex)) {
           if(pindex != null) {
                content = ref[pindex].text;
           }
           else {
               for (i = 0, len = ref.length; i < len; i++) {
                   item = ref[i];
                   if (item.type === 'text') {
                       content = item.text;
                       break;
                    }
                }
           }

           if(content.length > 100){
               content = content.slice(0,100);
           }
            text = text.replace('{{post-content}}', content);

            try {
                Email.send({
                    to: notifyUser.userEmail,
                    from: '故事贴<notify@mail.tiegushi.com>',
                    subject: subject,
                    html: text,
                    envelope: {
                        from: "故事贴<notify@mail.tiegushi.com>",
                        to: notifyUser.userEmail + "<" + notifyUser.userEmail + ">"
                    }
                });

                // console.log('send mail to:', notifyUser.userEmail);
            } catch (_error) {
              ex = _error;
              //console.log("err is: ", ex);
              console.log("Exception: sendEmailToSubscriber: error=%s, notifyUser.userEmail=%s", ex, notifyUser.userEmail);
            }

        });
    };


    var sendEmailToFollower = function(userEmail, subject, mailText){
        // console.log('给web关注者发送邮件')
        deferSetImmediate(function () {
            try {
                // console.log(">>before Send")
                Email.send({
                    bcc: userEmail,
                    from: '故事贴<notify@mail.tiegushi.com>',
                    subject: subject,
                    html: mailText
                });
                // console.log('send mail to:', userEmail);
            } catch (error) {
                //console.log("Exception: sendEmailToFollower: err=", error);
                console.log("Exception: sendEmailToFollower: err=%s, userEmail=%s", error, userEmail);
            }
        });
    }

    var sendEmailToSeriesFollower = function(seriesId) {
      deferSetImmediate(function(){
          try{
              var text = Assets.getText('email/series-notify.html');
              var series = Series.findOne({_id: seriesId});
              if (series && series.followingEmails && series.followingEmails.length > 0) {
                text = text.replace('{{series._id}}', seriesId);
                text = text.replace('{{series.title}}', series.title);
                Email.send({
                    to: series.followingEmails.toString(),
                    from: '故事贴<notify@mail.tiegushi.com>',
                    subject: '您关注的合辑：' +series.title + '  内容有变化, 请访问查看！',
                    body: '您关注的合辑：' +series.title + '  内容有变化, 请访问查看！',
                    html: text
                });
              }

          } catch (error){
              //console.log(e);
              console.log("Exception: sendEmailToSeriesFollower: error=%s", error);
          }
      });
    };
    var countB = 0;
    var countC = 0;
    postsInsertHookDeferHandle = function(userId,doc){
        deferSetImmediate(function(){
            try{
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
                    status: '已审核'
                }
                postMessageToGeneralChannel(JSON.stringify(postInfo))
            } catch(e){

            }
            try{
                var follows=Follower.find({followerId:userId});
                if(follows.count()>0){
                    //  sendEmailToFollower mail html start
                    var content, i, item, len, post, ref, mailText, subject;
                    var userEmail = [];
                    var post = Posts.findOne({_id: doc._id});
                    if (!post) {
                        console.log("Can't find the post: id="+doc._id);
                    }
                    var reg = new RegExp('[.^*#]','g');
                    var title = post.title.replace(reg,'-');
                    var addontitle = post.addontitle.replace(reg,'-');
                    subject = '您在故事贴上关注的“' + post.ownerName + '”' + '发表了新故事' + '：《' + title + '》';
                    mailText = Assets.getText('email/push-post.html');
                    mailText = mailText.replace('{{post.title}}', title);
                    mailText = mailText.replace('{{post.subtitle}}', addontitle);
                    mailText = mailText.replace('{{post.author}}', post.ownerName);
                    if(post.ownerIcon == '/userPicture.png'){
                        mailText = mailText.replace('{{post.icon}}', 'http://' + server_domain_name + post.ownerIcon);
                    } else {
                        mailText = mailText.replace('{{post.icon}}', post.ownerIcon);
                    }
                    var dt = post.createdAt;
                    mailText = mailText.replace('{{post.time}}', PUB.formatTime(dt));
                    mailText = mailText.replaceAll('{{post.href}}', 'http://' + server_domain_name + '/posts/' + post._id);
                    mailText = mailText.replace('{{post.mainImage}}', post.mainImage);
                    content = '[暂无内容]';
                    if (post.pub) {
                        ref = post.pub;
                        for (i = 0, len = ref.length; i < len; i++) {
                            item = ref[i];
                            if (item.type === 'text') {
                                content = item.text;
                                break;
                            }
                        }
                    }
                    if(content.length > 100){
                        content = content.slice(0,100);
                    }
                    mailText = mailText.replace('{{post-content}}', content);
                    // console.log('follows abservechange')
                    // sendEmailToFollower mail html end

                    // test setInterval
                    // Meteor.setInterval(function(){
                    //   countC += 1;
                    //   console.log(countC + ' setInterval')
                    // }, 0);
                    follows.observeChanges({
                        added: function (id,fields) {
                            // console.log('follows abservechange')
                            // if(countB < 10000){
                            //     countB += 1;
                            // }
                            // console.log('countB is ' + countB)
                            // FollowPosts的数据插入，只需要给 suggestPostUserId了
                            if(fields.userId === suggestPostsUserId){
                                // console.log('=======    suggestPostsUserId   =======')
                                FollowPosts.insert({
                                    _id:doc._id,
                                    postId:doc._id,
                                    title:doc.title,
                                    addontitle:doc.addontitle,
                                    mainImage: doc.mainImage,
                                    mainImageStyle:doc.mainImageStyle,
                                    heart:0,
                                    retweet:0,
                                    comment:0,
                                    browse: 0,
                                    publish: doc.publish,
                                    owner:doc.owner,
                                    ownerName:doc.ownerName,
                                    ownerIcon:doc.ownerIcon,
                                    createdAt: doc.createdAt,
                                    followby: fields.userId
                                });
                            }
                            /*
                            在 FollowPosts改用Neo4J查询之后，不需要插入FollowPosts静态记录
                            由于推荐帖子（当动态里没有数据的时候）采用的是一个固定用户FollowPosts数据
                            上面暂时保留，以后再考虑替换方法
                            else
                            {
                                // console.log('=======    suggestPostsUserId  else   =======')
                                FollowPosts.insert({
                                    postId:doc._id,
                                    title:doc.title,
                                    addontitle:doc.addontitle,
                                    mainImage: doc.mainImage,
                                    mainImageStyle:doc.mainImageStyle,
                                    heart:0,
                                    retweet:0,
                                    comment:0,
                                    browse: 0,
                                    publish: doc.publish,
                                    owner:doc.owner,
                                    ownerName:doc.ownerName,
                                    ownerIcon:doc.ownerIcon,
                                    createdAt: doc.createdAt,
                                    followby: fields.userId
                                });
                            }*/
                            if(Feeds.find({followby: fields.userId,postId: doc._id,eventType:'SelfPosted'}).count() === 0){
                                Feeds.insert({
                                    owner:doc.owner,
                                    ownerName:doc.ownerName,
                                    ownerIcon:doc.ownerIcon,
                                    eventType:'SelfPosted',
                                    postId:doc._id,
                                    postTitle:doc.title,
                                    mainImage:doc.mainImage,
                                    createdAt:doc.createdAt,
                                    heart:0,
                                    retweet:0,
                                    comment:0,
                                    followby: fields.userId
                                });                            
                                if(fields.userEmail){
                                    // console.log(fields.userEmail)
                                    if(userEmail.indexOf(fields.userEmail) < 0){
                                        userEmail.push(fields.userEmail);
                                    }
                                }

                                var dataUser = Meteor.users.findOne({_id:fields.userId});
                                waitReadCount = dataUser && dataUser.profile && dataUser.profile.waitReadCount ? dataUser.profile.waitReadCount : 0;
                                if(waitReadCount === undefined || isNaN(waitReadCount))
                                {
                                    waitReadCount = 0;
                                }
                                Meteor.users.update({_id: fields.userId}, {$set: {'profile.waitReadCount': waitReadCount+1}});
                                pushnotification("newpost",doc,fields.userId);
                            }
                        }
                    });

                    if (userEmail.length > 0) {
                        // console.log('the email lists is ===\n',JSON.stringify(userEmail))
                        sendEmailToFollower(userEmail, subject, mailText);
                    }
                }
                /*
                这部分代码是为了确保插入成功的，现在不需要了
                var isInserted = FollowPosts.findOne({followby: userId,postId:doc._id}) ? true : false;
                if (!isInserted)  {
                    if(userId === suggestPostsUserId)
                    {
                        FollowPosts.insert({
                            _id:doc._id,
                            postId:doc._id,
                            title:doc.title,
                            addontitle:doc.addontitle,
                            mainImage: doc.mainImage,
                            mainImageStyle:doc.mainImageStyle,
                            heart:0,
                            retweet:0,
                            comment:0,
                            browse: 0,
                            publish: doc.publish,
                            owner:doc.owner,
                            ownerName:doc.ownerName,
                            ownerIcon:doc.ownerIcon,
                            createdAt: doc.createdAt,
                            followby: userId
                        });
                    }
                     在 FollowPosts改用Neo4J查询之后，不需要插入FollowPosts静态记录
                     由于推荐帖子（当动态里没有数据的时候）采用的是一个固定用户FollowPosts数据
                     上面暂时保留，以后再考虑替换方法
                    else
                    {
                        FollowPosts.insert({
                            postId:doc._id,
                            title:doc.title,
                            addontitle:doc.addontitle,
                            mainImage: doc.mainImage,
                            mainImageStyle:doc.mainImageStyle,
                            heart:0,
                            retweet:0,
                            comment:0,
                            browse: 0,
                            publish: doc.publish,
                            owner:doc.owner,
                            ownerName:doc.ownerName,
                            ownerIcon:doc.ownerIcon,
                            createdAt: doc.createdAt,
                            followby: userId
                        }, function(error, _id){
                            console.log('error: ' + error);
                            // console.log('_id: ' + _id);
                        });
                    }
                }
                     */
            }
            catch(error){
                console.log("Exception: postsInsertHookDeferHandle: err=", error);
            }
            /*
            我们现在不再部署Pulling Server了
            try {
                var pullingConn = Cluster.discoverConnection("pulling");
                pullingConn.call("pullFromServer", doc._id);
            }
            catch(error){}
            */
            try {
                var recommendUserIds = [];
                // console.log('----- Recommends 1------');
                Recommends.find({relatedUserId: doc.owner, relatedPostId: {$exists: false}}).observeChanges({
                added: function (id, fields) {
                    // console.log('----- Recommends 2------');
                    if (!~recommendUserIds.indexOf(fields.recommendUserId)) {
                        recommendUserIds.push(fields.recommendUserId);
                        Recommends.update({_id: id}, {$set: {relatedPostId: doc._id}});
                        }
                    }
                });
                // Recommends.find({relatedUserId: doc.owner, relatedPostId: {$exists: false}}).forEach(function(item) {
                //     if (!~recommendUserIds.indexOf(item.recommendUserId)) {
                //         recommendUserIds.push(item.recommendUserId);
                //         Recommends.update({_id: item._id}, {$set: {relatedPostId: doc._id}});
                //     }
                // });
            }
            catch(error) {}
        });
    };
    postsRemoveHookDeferHandle = function(userId,doc){
        deferSetImmediate(function(){
            try{
                /*
                Moments.remove({$or:[{currentPostId:doc._id},{readPostId:doc._id}]});
                 */
                FollowPosts.remove({
                    postId:doc._id
                });
                Feeds.remove({
                    owner:userId,
                    eventType:'SelfPosted',
                    postId:doc._id
                });
                var TPs=TopicPosts.find({postId:doc._id})
                if(TPs.count()>0){
                    // console.log('----- postsRemoveHookDeferHandle 1------');
                    TPs.observeChanges({
                    added: function (id, fields) {
                        // console.log('----- postsRemoveHookDeferHandle 2------');
                        PostsCount = Topics.findOne({_id:fields.topicId}).posts;
                        if(PostsCount === 1)
                        {
                            Topics.remove({_id:fields.topicId});
                        }
                        else if(PostsCount > 1)
                        {
                            Topics.update({_id: fields.topicId}, {$set: {'posts': PostsCount-1}});
                        }
                        }
                    });
                    // TPs.forEach(function(data){
                    //     PostsCount = Topics.findOne({_id:data.topicId}).posts;
                    //     if(PostsCount === 1)
                    //     {
                    //         Topics.remove({_id:data.topicId});
                    //     }
                    //     else if(PostsCount > 1)
                    //     {
                    //         Topics.update({_id: data.topicId}, {$set: {'posts': PostsCount-1}});
                    //     }
                    // });
                }
                TopicPosts.remove({
                    postId:doc._id
                });
            }
            catch(error){}
            try{
                if(syncToNeo4jWithMqtt)
                    mqttRemoveNewPostHook(userId, doc._id, doc.createdAt)
                else
                    removePostToNeo4j(doc._id);
            }
            catch(error){}
        });
    };
    postsUpdateHookDeferHandle = function(userId,doc,fieldNames, modifier){
        deferSetImmediate(function(){
            try {
                var postOwner = modifier.$set.owner;
                var follows = Follower.find({
                    followerId: postOwner
                });
                if (follows.count() > 0) {
                    // console.log('----- postsUpdateHookDeferHandle 1------');
                    follows.observeChanges({
                    added: function (id, fields) {
                        // console.log('----- postsUpdateHookDeferHandle 2------');
                        var followPost = FollowPosts.findOne({
                            postId: doc._id,
                            followby: fields.userId
                        })
                        if (followPost) {
                            FollowPosts.update({
                                followby: fields.userId,
                                postId: doc._id
                            }, {
                                $set: {
                                    title: modifier.$set.title,
                                    addontitle: modifier.$set.addontitle,
                                    mainImage: modifier.$set.mainImage,
                                    mainImageStyle: modifier.$set.mainImageStyle,
                                    publish: modifier.$set.publish,
                                    owner: modifier.$set.owner,
                                    ownerName: modifier.$set.ownerName,
                                    ownerIcon: modifier.$set.ownerIcon,
                                    createdAt: modifier.$set.createdAt,
                                }
                            });
                        } else {
                            FollowPosts.insert({
                                postId: doc._id,
                                title: modifier.$set.title,
                                addontitle: modifier.$set.addontitle,
                                mainImage: modifier.$set.mainImage,
                                mainImageStyle: modifier.$set.mainImageStyle,
                                heart: 0,
                                retweet: 0,
                                comment: 0,
                                browse: 0,
                                publish: modifier.$set.publish,
                                owner: modifier.$set.owner,
                                ownerName: modifier.$set.ownerName,
                                ownerIcon: modifier.$set.ownerIcon,
                                createdAt: modifier.$set.createdAt,
                                followby: fields.userId
                            }, function(error, _id) {
                                console.log('error: ' + error);
                            });
                        }
                        }
                    });
                    // follows.forEach(function(data) {
                    //     var followPost = FollowPosts.findOne({
                    //         postId: doc._id,
                    //         followby: data.userId
                    //     })
                    //     if (followPost) {
                    //         FollowPosts.update({
                    //             followby: data.userId,
                    //             postId: doc._id
                    //         }, {
                    //             $set: {
                    //                 title: modifier.$set.title,
                    //                 addontitle: modifier.$set.addontitle,
                    //                 mainImage: modifier.$set.mainImage,
                    //                 mainImageStyle: modifier.$set.mainImageStyle,
                    //                 publish: modifier.$set.publish,
                    //                 owner: modifier.$set.owner,
                    //                 ownerName: modifier.$set.ownerName,
                    //                 ownerIcon: modifier.$set.ownerIcon,
                    //                 createdAt: modifier.$set.createdAt,
                    //             }
                    //         });
                    //     } else {
                    //         FollowPosts.insert({
                    //             postId: doc._id,
                    //             title: modifier.$set.title,
                    //             addontitle: modifier.$set.addontitle,
                    //             mainImage: modifier.$set.mainImage,
                    //             mainImageStyle: modifier.$set.mainImageStyle,
                    //             heart: 0,
                    //             retweet: 0,
                    //             comment: 0,
                    //             browse: 0,
                    //             publish: modifier.$set.publish,
                    //             owner: modifier.$set.owner,
                    //             ownerName: modifier.$set.ownerName,
                    //             ownerIcon: modifier.$set.ownerIcon,
                    //             createdAt: modifier.$set.createdAt,
                    //             followby: data.userId
                    //         }, function(error, _id) {
                    //             console.log('error: ' + error);
                    //             // console.log('_id: ' + _id);
                    //         });
                    //     }
                    // });
                }

                var followPost = FollowPosts.findOne({
                    postId: doc._id,
                    followby: postOwner
                })
                if (followPost) {
                    FollowPosts.update({
                        followby: postOwner,
                        postId: doc._id
                    }, {
                        $set: {
                            title: modifier.$set.title,
                            addontitle: modifier.$set.addontitle,
                            mainImage: modifier.$set.mainImage,
                            mainImageStyle: modifier.$set.mainImageStyle,
                            publish: modifier.$set.publish,
                            owner: modifier.$set.owner,
                            ownerName: modifier.$set.ownerName,
                            ownerIcon: modifier.$set.ownerIcon,
                            createdAt: modifier.$set.createdAt,
                        }
                    });
                } else {
                    FollowPosts.insert({
                        postId: doc._id,
                        title: modifier.$set.title,
                        addontitle: modifier.$set.addontitle,
                        mainImage: modifier.$set.mainImage,
                        mainImageStyle: modifier.$set.mainImageStyle,
                        heart: 0,
                        retweet: 0,
                        comment: 0,
                        browse: 0,
                        publish: modifier.$set.publish,
                        owner: modifier.$set.owner,
                        ownerName: modifier.$set.ownerName,
                        ownerIcon: modifier.$set.ownerIcon,
                        createdAt: modifier.$set.createdAt,
                        followby: postOwner
                    }, function(error, _id) {
                        console.log('error: ' + error);
                        // console.log('_id: ' + _id);
                    });
                }

            }
            catch(error){
                console.log('posts update error: ' + error)
            }
        });
    };

    // web端关注作者, 发送第一封email
    followerHookForWeb = function(userId, doc, action, modifier) {
      deferSetImmediate(function(){
        action = action || 'insert';
        if(action === 'insert')
          Meteor.users.update({_id: doc.followerId}, {$inc: {'profile.web_follower_count': 1}});
      });

      //check repeated same email Accounts
      if (action === "update") {
        if (modifier["$set"] && modifier["$set"].userEmail) {
          if (doc.userEmail === modifier["$set"].userEmail) {
            console.log("##RDBG email not changed");
            return;
          }
        }
      }

      var userEmail = null;
      if (action === "insert")
        userEmail = doc.userEmail;
      else if (action === "update")
        userEmail = modifier["$set"].userEmail;

      if (!userEmail) {
        console.log("null userEmail");
        return;
      }

      // console.log("send mail to: " + userEmail);

       // send mail
        var text = Assets.getText('email/follower-notify.html');
        deferSetImmediate(function(){
            try{
                Email.send({
                    to: userEmail,
                    from: '故事贴<notify@mail.tiegushi.com>',
                    subject: '成功关注作者：'+doc.followerName + '',
                    body: '成功关注作者：'+doc.followerName + ',我们会不定期的为您推送关注作者的新文章！',
                    html: text
                });

            } catch (error){
                //console.log(e);
                console.log("Exception: followerHookForWeb: error=%s, userEmail=%s", error, userEmail);
            }
        });
    }
    followerInsertHookDeferHook=function(userId,doc){
        deferSetImmediate(function(){
            /*
            try{
                Meets.update({me:doc.userId,ta:doc.followerId},{$set:{isFriend:true}});
            }
            catch(error){}
            在这里FollowPosts 不需要再做处理，原因是只要同步到Neo4J
            Neo4J的关系运算提供FollowPosts的数据，而不是通过这个Collection

            try{
                var posts=Posts.find({owner: doc.followerId});
                if(posts.count()>0){
                    // console.log('----- followerInsertHookDeferHook 1------');
                    posts.observeChanges({
                    added: function (id, fields) {
                        // console.log('----- followerInsertHookDeferHook 2------');
                        // console.log('postId is ' + fields._id)
                        // console.log('id is ' + id)
                        // console.log('fields is ')
                        // console.log(fields)
                        if(doc.userId === suggestPostsUserId)
                        {
                            FollowPosts.insert({
                                _id:id,
                                postId:id,
                                title:fields.title,
                                addontitle:fields.addontitle,
                                mainImage: fields.mainImage,
                                mainImageStyle: fields.mainImageStyle,
                                publish: fields.publish,
                                owner:fields.owner,
                                ownerName:fields.ownerName,
                                ownerIcon:fields.ownerIcon,
                                createdAt: fields.createdAt,
                                followby: doc.userId
                            });
                        }
                         在 FollowPosts改用Neo4J查询之后，不需要插入FollowPosts静态记录
                         由于推荐帖子（当动态里没有数据的时候）采用的是一个固定用户FollowPosts数据
                         上面暂时保留，以后再考虑替换方法
                        else
                        {
                            FollowPosts.insert({
                                postId:id,
                                title:fields.title,
                                addontitle:fields.addontitle,
                                mainImage: fields.mainImage,
                                mainImageStyle:fields.mainImageStyle,
                                owner: fields.owner,
                                publish: fields.publish,
                                ownerName:fields.ownerName,
                                ownerIcon:fields.ownerIcon,
                                createdAt: fields.createdAt,
                                followby: doc.userId
                            });
                        }
                    }
                    });
                }
            }
            catch(error){}
            */
            try{
                var series = Series.find({owner: doc.followerId});
                if(series.count() > 0){
                    // console.log('----- Series 1------');
                    series.observeChanges({
                    added: function (id, fields) {
                        // console.log('----- Series 2------');
                        if(fields && id && fields.title && fields.mainImage){
                            SeriesFollow.insert({
                                owner: userId,
                                creatorId: fields.owner, //followerId
                                creatorName: fields.ownerName,
                                creatorIcon: fields.ownerIcon,
                                seriesId: id,
                                title: fields.title,
                                mainImage: fields.mainImage,
                                createdAt: new Date()
                            });
                        }
                    }
                    });
                    // series.forEach(function(data){
                    //     SeriesFollow.insert({
                    //         owner: userId,
                    //         creatorId: data.owner, //followerId
                    //         creatorName: data.ownerName,
                    //         creatorIcon: data.ownerIcon,
                    //         seriesId: data._id,
                    //         title: data.title,
                    //         mainImage: data.mainImage,
                    //         createdAt: new Date()
                    //     });
                    // });
                }
            }
            catch(error){}
            try{
                if(syncToNeo4jWithMqtt)
                    mqttFollowerInsertHook(doc);
                else
                    insertFollowerInNeo4j(doc.userId, doc.followerId);
            }
            catch(error){}
        });
    };
    followerRemoveHookDeferHook=function(userId,doc){
        deferSetImmediate(function(){
            /*try{
                Meets.update({me:doc.userId,ta:doc.followerId},{$set:{isFriend:false}});
            }
            catch(error){}
            try{
                FollowPosts.remove({owner:doc.followerId,followby:userId});
            }
            catch(error){}*/
            try{
                SeriesFollow.remove({creatorId: doc.followerId, owner: userId});
            }
            catch(error){}
            try{
                if(syncToNeo4jWithMqtt)
                    mqttFollowerRemoveHook(doc.userId, doc.followerId);
                else
                    removeFollowerInNeo4j(doc.userId, doc.followerId);
            }
            catch(error){}
        });
    };
    var commentInsertHookDeferHandle = function(userId,doc) {
        deferSetImmediate(function () {
            try {
                var post = Posts.findOne({_id: doc.postId});
                var commentsCount = post.commentsCount;
                if (commentsCount === undefined || isNaN(commentsCount)) {
                    commentsCount = 0;
                }
                commentsCount = commentsCount + 1;
                Posts.update({_id: doc.postId}, {$set: {'commentsCount': commentsCount}});
                if (post.owner != userId) {
                    if (ReComment.find({"postId": doc.postId, "commentUserId": userId}).count() === 0) {
                        ReComment.insert({
                            postId: doc.postId,
                            commentUserId: userId
                        });
                    }
                    Feeds.insert({
                        owner: userId,
                        ownerName: doc.username,
                        ownerIcon: doc.userIcon,
                        eventType: 'comment',
                        postId: doc.postId,
                        postTitle: post.title,
                        mainImage: post.mainImage,
                        createdAt: doc.createdAt,
                        heart: 0,
                        retweet: 0,
                        comment: 0,
                        followby: post.owner
                    });
                    var dataUser = Meteor.users.findOne({_id:post.owner});
                    var waitReadCount = dataUser && dataUser.profile && dataUser.profile.waitReadCount ? dataUser.profile.waitReadCount : 0;
                    // var waitReadCount = Meteor.users.findOne({_id: post.owner}).profile.waitReadCount;
                    if (waitReadCount === undefined || isNaN(waitReadCount)) {
                        waitReadCount = 0;
                    }
                    Meteor.users.update({_id: post.owner}, {$set: {'profile.waitReadCount': waitReadCount + 1}});
                    //pushnotification("comment", doc, userId);
                    var recomments = ReComment.find({"postId": doc.postId}).fetch();
                    var item;
                    for (item in recomments) {
                        if (recomments[item].commentUserId !== undefined && recomments[item].commentUserId !== userId && recomments[item].commentUserId !== post.owner) {
                            Feeds.insert({
                                owner: userId,
                                ownerName: doc.username,
                                ownerIcon: doc.userIcon,
                                eventType: 'recomment',
                                postId: doc.postId,
                                postTitle: post.title,
                                mainImage: post.mainImage,
                                createdAt: doc.createdAt,
                                heart: 0,
                                retweet: 0,
                                comment: 0,
                                followby: recomments[item].commentUserId
                            });
                            dataUser = Meteor.users.findOne({_id: recomments[item].commentUserId});
                            waitReadCount = dataUser && dataUser.profile && dataUser.profile.waitReadCount ? dataUser.profile.waitReadCount : 0;
                            // waitReadCount = Meteor.users.findOne({_id: recomments[item].commentUserId}).profile.waitReadCount;
                            if (waitReadCount === undefined || isNaN(waitReadCount)) {
                                waitReadCount = 0;
                            }
                            Meteor.users.update({_id: recomments[item].commentUserId}, {$set: {'profile.waitReadCount': waitReadCount + 1}});
                            pushnotification("recomment", doc, recomments[item].commentUserId);
                        }
                    }
                }
            }
            catch (error) {
            }
        });
    };
    var momentsAddForDynamicMomentsDeferHandle = function(self,id,fields,userId) {
        deferSetImmediate(function(){
            var viewItem = Viewers.find({postId:fields.readPostId, userId:userId}).count();
            if(viewItem===0){
                try{
                    self.added("dynamicmoments", id, fields);
                    self.count++;
                }catch(error){
                }
            }
        });
    };
    var momentsChangeForDynamicMomentsDeferHandle = function(self,id,fields,userId) {
        deferSetImmediate(function(){
            var viewItem = Viewers.find({postId:fields.readPostId, userId:userId}).count();
            if(viewItem===0){
                try{
                    self.changed("dynamicmoments", id, fields);
                }catch(error){
                }
            }
        });
    };
    var postsAddForSuggestPostsDeferHandle = function(self,id,fields,userId) {
        deferSetImmediate(function(){
            var viewItem = Viewers.find({postId:id, userId:userId}).count();
            if(viewItem===0) {
                try {
                    self.added("suggestposts", id, fields);
                    self.count++;
                } catch (error) {
                }
            }
        });
    };
    var postsChangeForSuggestPostsDeferHandle = function(self,id,fields,userId) {
        deferSetImmediate(function(){
            var viewItem = Viewers.find({postId:id, userId:userId}).count();
            if(viewItem !== 0) {
                try {
                    self.removed("suggestposts", id, fields);
                    self.count--;
                } catch (error) {
                }
            }
        });
    };
    seriesInsertHookDeferHandle = function(userId,doc){
      deferSetImmediate(function(){
        if(doc && doc._id && doc.title && doc.mainImage){
            // 1. 将合辑添加到自己的followSeries
            try{
                SeriesFollow.insert({
                    owner: userId,
                    creatorId: doc.owner,
                    creatorName: doc.ownerName,
                    creatorIcon: doc.ownerIcon,
                    seriesId: doc._id,
                    title: doc.title,
                    mainImage: doc.mainImage,
                    createdAt: new Date()
                });
            } catch (error){
                console.log('Insert Series to self followSeries ERR=',error);
            }
            // 2. 将自己的合辑添加到关注者的followSeries
            try {
                var follows = Follower.find({followerId: userId});
                if(follows.count()>0){
                    // console.log('----- seriesInsertHookDeferHandle 1------');
                    follows.observeChanges({
                    added: function (id, fields) {
                        // console.log('----- seriesInsertHookDeferHandle 2------');
                        SeriesFollow.insert({
                            owner: fields.userId,
                            creatorId: doc.owner,
                            creatorName: doc.ownerName,
                            creatorIcon: doc.ownerIcon,
                            seriesId: doc._id,
                            title: doc.title,
                            mainImage: doc.mainImage,
                            createdAt: new Date()
                        });
                    }
                    });
                    // follows.forEach(function(data){
                    //     SeriesFollow.insert({
                    //         owner: data.userId,
                    //         creatorId: doc.owner,
                    //         creatorName: doc.ownerName,
                    //         creatorIcon: doc.ownerIcon,
                    //         seriesId: doc._id,
                    //         title: doc.title,
                    //         mainImage: doc.mainImage,
                    //         createdAt: new Date()
                    //     });
                    // });
                }
            } catch (error) {
                console.log('seriesInsertHook ERR=',error);
            }
        }
      });
    };
    seriesUpdateHookDeferHandle = function(userId,doc,fieldNames, modifier){
      deferSetImmediate(function(){
        try {
            // 发送邮件通知
            if(modifier.$set.title || modifier.$set.mainImage || modifier.$set.postLists || fieldNames.indexOf('postLists') >= 0){
                console.log('send series email:', doc._id);
                try{sendEmailToSeriesFollower(doc._id)}catch(ex){}
            }
            var setObject = {
                updateAt: new Date()
            }
            if(modifier.$set.title){
                setObject.title = modifier.$set.title;
            }
            if(modifier.$set.mainImage){
                setObject.mainImage = modifier.$set.mainImage;
            }
            console.log(JSON.stringify(setObject))
            SeriesFollow.update({seriesId: doc._id}, {
                $set: setObject
            },{ multi: true});
        } catch (error) {
            console.log('seriesUpdateHookDeferHandle ERR=',error);
        }
        try{
            SeriesFollow.find({seriesId: doc._id}).observeChanges({
                added: function(id, fields){
                    if(fields && doc.owner != fields.owner){
                        console.log('Series changed, pushnotification');
                        pushnotification('seriesChanged', doc, fields.owner);
                    }
                }
            });
        } catch (error){
            console.log('Send Series changed pushnotification,ERR=',error);
        }
      });
    };
    seriesRemoveHookDeferHandle = function(userId,doc){
      deferSetImmediate(function(){
        try {
            SeriesFollow.remove({seriesId: doc._id});
        } catch (error) {
            console.log('seriesRemoveHookDeferHandle ERR=',error);
        }
      });
    };

    Meteor.publish('seriesFollow', function(seriesId) {
      return SeriesFollow.find({owner: this.userId, seriesId: seriesId}, {limit: 1});
    });

    Meteor.publish("followSeries", function(limit){
        if(this.userId === null){
            return this.ready();
        } else {
            return SeriesFollow.find({owner:this.userId},{
                sort: {createdAt: -1},
                limit: limit
            })
        }
    });
    Meteor.publish('postInfoById', function(id) {
      return Posts.find({_id: id}, {limit: 1});
    });

    Meteor.publish('userNewBellCount', function(userId) {
      var self = this;
      var count = 0;
      var feeds = [];
      var initializing = true;

      var handle = Feeds.find({followby: userId, isRead: {$ne: true},checked: {$ne: true}}, {limit: 30}).observeChanges({
        added: function (id) {
          count = Feeds.find({followby: userId, isRead: {$ne: true},checked: {$ne: true}}, {limit: 30}).count();
          feeds = Feeds.find({followby: userId}, {sort: {createdAt: -1}, limit: 30}).fetch();
          self.added("userNewBellCount", id, {count: count, feeds: feeds});
        },
        changed: function (id) {
          count = Feeds.find({followby: userId, isRead: {$ne: true},checked: {$ne: true}}, {limit: 30}).count();
          feeds = Feeds.find({followby: userId}, {sort: {createdAt: -1}, limit: 30}).fetch();
          try {
             self.changed("userNewBellCount", id, {count: count, feeds: feeds});
          }
          catch (e) {
          }

        },
        removed: function (id) {
          count = Feeds.find({followby: userId, isRead: {$ne: true},checked: {$ne: true}}, {limit: 30}).count();
          feeds = Feeds.find({followby: userId}, {sort: {createdAt: -1}, limit: 30}).fetch();
          self.removed("userNewBellCount", id, {count: count, feeds: feeds});
        }
      });

      initializing = false;
      count = Feeds.find({followby: userId, isRead: {$ne: true},checked: {$ne: true}}, {limit: 30}).count();
      feeds = Feeds.find({followby: userId}, {sort: {createdAt: -1}, limit: 30}).fetch();
      self.added("userNewBellCount", userId, {count: count, feeds: feeds});
    //   self.added("userNewBellCount", userId, {count: count});
      self.ready();

      self.onStop(function () {
        handle.stop();
      });
    });

    Meteor.publish('serverImportPostStatus',function(postId){
        var self = this;
        var initializing = true;
        var post = [];
        var pub = [];
        var reload = false;

        var handle = Posts.find({_id: postId}).observeChanges({
            added: function (id) {
                post = Posts.findOne({_id: postId});
                status = post.import_status;
                reload = false;
                post.pub.forEach(function(item){
                    if(item.isImage){
                        pub.push({_id: item._id, imgUrl:item.imgUrl,index:item.index,souImgUrl:item.souImgUrl})
                    }
                    if(item.inIframe || item.type === 'video' || item.type === 'music')
                        reload = true;
                });
                self.added("serverImportPostStatus", id, {import_status:post.import_status,mainImage: post.mainImage, pub: pub, reload: reload});
            },
            changed: function (id) {
                post = Posts.findOne({_id: postId});
                reload = false;
                post.pub.forEach(function(item){
                    if(item.isImage){
                        pub.push({_id: item._id, imgUrl:item.imgUrl,index:item.index,souImgUrl:item.souImgUrl})
                    }
                    if(item.inIframe || item.type === 'video' || item.type === 'music')
                        reload = true;
                });
                try {
                        self.changed("serverImportPostStatus", id, {import_status:post.import_status,mainImage: post.mainImage, pub: pub, reload: reload});
                    } catch (e) {
                    }
            },
            removed: function (id) {
                post = Posts.findOne({_id: postId});
                reload = false;
                post.pub.forEach(function(item){
                    if(item.isImage){
                        pub.push({_id: item._id, imgUrl:item.imgUrl,index:item.index,souImgUrl:item.souImgUrl})
                    }
                    if(item.inIframe || item.type === 'video' || item.type === 'music')
                        reload = true;
                });
                self.removed("serverImportPostStatus", id, {import_status:post.import_status,mainImage: post.mainImage, pub: pub, reload: reload});
            }
        });
        initializing = false;
        post = Posts.findOne({_id: postId});
        post.pub.forEach(function(item){
            if(item.isImage){
                pub.push({_id: item._id, imgUrl:item.imgUrl,index:item.index,souImgUrl:item.souImgUrl})
            }
            if(item.inIframe || item.type === 'video' || item.type === 'music')
                reload = true;
        });
        self.added("serverImportPostStatus", postId, {import_status:post.import_status,mainImage: post.mainImage, pub: pub, reload: reload});
        self.ready();

        self.onStop(function () {
            handle.stop();
        });
    });

    Meteor.publish('configs', function() {
      if(this.userId === null){
          return this.ready();
      }
      return Configs.find();
    });

    Meteor.publish("list_recommends", function(postId) {
        if(this.userId === null){
            return this.ready();
        }
        else {
            if(Recommends.find({relatedPostId: postId,readUsers: {$exists: true}}).count() > 0){
                return Recommends.find({relatedPostId: postId,readUsers:{$nin:[this.userId]}});
            } else {
                return Recommends.find({relatedPostId: postId})
            }
            /*
            var self = this;
            var handle = Recommends.find({relatedPostId: postId}, {
                sort: {createdAt: -1}
            }).observeChanges({
                added: function (id, fields) {
                    try {
                        self.added("Recommends", id, fields);
                    } catch (e) {
                    }
                }
            });
            self.ready();
            self.onStop(function () {
                handle.stop();
            });*/
        }
    });

    Meteor.publish("newposts", function(limit) {
        if(this.userId === null || !Match.test(limit, Number))
          return this.ready();
        else
          notshowArrId = ['3uFSntcg8j2XXRbSG','jJN2frttsQJG8vPtE', 'zR2Y5Ar9k9LZQS9vS']
          return Posts.find({'owner':{$nin:notshowArrId}, 'isReview':true,'publish':true}, {sort: {createdAt: -1}, limit:limit, fields:
          {isReview:1,mainImage:1,title:1,addontitle:1,publish:1,owner:1,ownerName:1,createdAt:1,ownerIcon:1,browse:1,_id:1}});
    });

    Meteor.publish("mySeries", function(limit) {
        if(this.userId === null || !Match.test(limit, Number))
          return this.ready();
        else
          return Series.find({owner: this.userId,publish: true}, {sort: {createdAt: -1}, limit:limit});
    });
    /*for unknown reason, this changed callback is triggered several times, to prevent this behavior, use this variable */
    var firstOneSeriesChangedEvent = true;
    Meteor.publish("oneSeries", function(seriesId){
        if(this.userId === null)
            return this.ready();
        else {
            var cursor = Series.find({_id: seriesId}, {limit: 1});
            // cursor.observeChanges({
            //   changed:function (id,fields){
            //       if (firstOneSeriesChangedEvent) {
            //         firstOneSeriesChangedEvent = false;
            //         Meteor.setTimeout(function() { firstOneSeriesChangedEvent = true; }, 500);
            //         var item = null;
            //         var needNotify = false;
            //         for (item in fields) {
            //           if (item == 'title' || item == 'postLists') {
            //             needNotify = true;
            //           }
            //         }
            //         if (needNotify) {
            //           sendEmailToSeriesFollower(seriesId);
            //         }
            //       }
            //   }
            // });
            return cursor;
        }
    });
    Meteor.publish("suggestPosts", function (limit) {
        if(this.userId === null){
            return this.ready();
        }
        else {
            var self = this;
            var handle = FollowPosts.find({followby: suggestPostsUserId}, {
                sort: {createdAt: -1},
                limit: limit
            }).observeChanges({
                added: function (id, fields) {
                    try {
                        self.added("suggestposts", id, fields);
                    } catch (e) {
                    }
                }
            });
            self.ready();
            self.onStop(function () {
                handle.stop();
            });
        }
    });
    var momentsAddForNewDynamicMomentsDeferHandle = function(self,id,fields) {
        deferSetImmediate(function(){
                try{
                    self.added("newdynamicmoments", id, fields);
                    self.count++;
                }catch(error){
                }
        });
    };
    var momentsChangeForNewDynamicMomentsDeferHandle = function(self,id,fields) {
        deferSetImmediate(function(){
                try{
                    self.changed("newdynamicmoments", id, fields);
                }catch(error){
                }
        });
    };
    if(withNeo4JInMoment){
        // a["{\"msg\":\"added\",\"collection\":\"newdynamicmoments\",\"id\":\"qeXBBL5sncqRPfLQe\",\"fields\":
        // {\"currentPostId\":\"s8EuWYvLCfbaJwxod\",
        // \"userId\":\"bEPMSF8FMQjBS4SFj\",
        // \"userIcon\":\"http://data.tiegushi.com/anonymousIcon/anonymous_32.png\",
        // \"username\":\"乾隆\",
        // \"readPostId\":\"qeXBBL5sncqRPfLQe\",
        // \"mainImage\":\"http://data.tiegushi.com/ocmainimages/mainimage7.jpg\",
        // \"title\":\"✅三星不哭! 苹果iPhone 7也炸了! 真正的果粉坐等明年iPhone 8\",
        // \"addontitle\":\"\",
        // \"createdAt\":{\"$date\":1479716971850}}}"]
        Meteor.publish("newDynamicMoments", function (postId,limit) {
            if(!Match.test(this.userId, String) || !Match.test(postId, String) ){
                return this.ready();
            }
            else{
                var self = this;
                var userId = this.userId;
                self.count = 0;
                var ts1 = Date.now()
                if(!self._session.momentSkip){
                    self._session.momentSkip = {};
                }
                if(!self._session.momentSkip[postId]){
                    self._session.momentSkip[postId] = 0;
                }
                if(self._session.momentSkip[postId] >= limit){
                    self._session.momentSkip[postId] = 0;
                }
                var queryLimit = limit - self._session.momentSkip[postId];
                //console.log(self._session._namedSubs[self._subscriptionId])
                this.unblock();
                deferSetImmediate(function() {
                    ensureUserViewPostInNeo4j(userId,postId, true)
                    var queryResult = getSuggestPostsFromNeo4J(userId,postId,self._session.momentSkip[postId],queryLimit)
                    self._session.momentSkip[postId] += queryLimit;
                    queryResult.forEach(function(item){
                        var viewer = item[0]
                        var post = item[1]
                        var fields = {
                            currentPostId: postId,
                            userId: viewer.userId,
                            userIcon: '',
                            username:viewer.fullname,
                            readPostId:post.postId,
                            mainImage:post.mainImage,
                            title:post.name,
                            addontitle: post.addonTitle,
                            createdAt: post.createdAt
                        }
                        self.added("newdynamicmoments",postId+'_'+post.postId, fields);
                    })
                })
                self.onStop(function(){
                    //console.log('onStop')
                })
                self.removed = function(collection, id){
                    //console.log('removing '+id+' in '+collection +' but no, we dont want to resend data to client')
                }
                return this.ready();
            }
        });
    } else {
        Meteor.publish("newDynamicMoments", function (postId,limit) {
            if(this.userId === null || !Match.test(postId, String) ){
                return this.ready();
            }
            else{
                var self = this;
                self.count = 0;
                var handle = Moments.find({currentPostId: postId},{sort: {createdAt: -1},limit:limit}).observeChanges({
                    added: function (id,fields) {
                        if(fields && fields.readPostId){
                            momentsAddForNewDynamicMomentsDeferHandle(self,fields.readPostId,fields);
                        }
                    },
                    changed:function (id,fields){
                        momentsChangeForNewDynamicMomentsDeferHandle(self,id,fields);
                    }
                });
                //console.log(self._session._namedSubs[self._subscriptionId])
                self.ready();
                self.onStop(function () {
                    handle.stop();
                });
            }
        });
    }
  Meteor.publish("viewlists", function (userId, viewerId) {
    if(this.userId === null || !Match.test(viewerId, String))
      return this.ready();
    else{
      var self = this;
      self.count = 0;
      var handle = Viewers.find({userId: viewerId},{sort:{createdAt: -1}}).observeChanges({
        added: function (id,fields) {
          if (self.count<3){
              viewersAddedForViewListsDeferHandle(self,fields,userId);
          }
        },
        changed: function (id,fields) {
          try{
            self.changed("viewlists", id, fields);
          }catch(error){
          }
        }/*,
        removed: function (id) {
          try{
            self.removed("viewlists", id);
            self.count--;
          }catch(error){
          }
        }*/
      });

      self.ready();

      self.onStop(function () {
        handle.stop();
      });
    }
  });
  Meteor.publish("userDetail", function (userId) {
      return this.ready();
      /*
      if(!Match.test(userId, String)){
          return [];
      }
      else{
          var self = this;
          var handle = Follower.find({userId:userId}).observeChanges({
              added: function (id,fields) {
                  if(fields.userId === userId && fields.followerId && fields.followerId !=='') {
                      followerChangedForUserDetailDeferHandle(self,fields,userId);
                  }
              }
          });
          self.ready();
          self.onStop(function () {
              handle.stop();
          });
      }*/
  });

    if(withNeo4JInDynamicPostFriend){
        Meteor.publish("postFriendsV2", function (userId,postId,limit) {
            if(this.userId === null || !Match.test(postId, String) || limit > 10){
                return this.ready();
            }
            else{
                var self = this;
                self.count = 0;
                self.meeterIds=[];
                self.docIds=[];
                if(!self._session.skipPostFriend){
                    self._session.skipPostFriend = {}
                }
                if(!self._session.skipPostFriend[postId]){
                    self._session.skipPostFriend[postId] = 0;
                }
                if(!self._session.skipPostFriend[postId+'_newfriends']){
                    self._session.skipPostFriend[postId+'_newfriends'] = 0;
                }
                if(self._session.skipPostFriend[postId] >= limit){
                    self._session.skipPostFriend[postId] = 0;
                }
                if(self._session.skipPostFriend[postId+'_newfriends'] > self._session.skipPostFriend[postId] + limit){
                    self._session.skipPostFriend[postId+'_newfriends'] = 0;
                }
                var queryLimit = limit - self._session.skipPostFriend[postId];
                // Test code
                // if your neo4j is not sync to ready, hard code this one for testing.
                // Test_userId = "myZDgPM7YG2PE7ffh";
                this.unblock();
                deferSetImmediate(function(){
                    if(self._session.skipPostFriend[postId+'_newfriends'] === 0){
                        try{self.added("postfriendsCount", userId+'_'+postId, {count: self._session.skipPostFriend[postId+'_newfriends']});}catch(e){}
                    }
                    ensureUserViewPostInNeo4j(userId,postId,true)
                    // var queryResult = getPostNewFriends( userId /*Test_userId*/,postId,self._session.skipPostFriend[postId],queryLimit);
                    var queryResult = getPostNewFriends( userId,postId,0,100);
                    self._session.skipPostFriend[postId] += queryLimit;

                    if(queryResult && queryResult.length > 0){
                        self._session.skipPostFriend[postId+'_newfriends'] += queryResult.length;
                        try{self.changed("postfriendsCount", userId+'_'+postId, {count: self._session.skipPostFriend[postId+'_newfriends'] });}catch(e){}

                        queryResult.forEach(function (item) {
                            if(item && item[0] && item[1] && Match.test(item[0], String) && Match.test(item[1], Number)){
                                var taId = item[0];
                                var meetTimes = item[1];
                                var fields = {
                                    me:userId,
                                    ta:taId,
                                    count: meetTimes,
                                    meetOnPostId:postId,
                                    createdAt: new Date()
                                };
                                newMeetsAddedForPostFriendsDeferHandleV2(self,taId,userId,taId,fields);
                            }
                        });
                    }
                })

                self.onStop(function(){
                    //console.log('onStop New Friend')
                })
                self.removed = function(collection, id){
                    //console.log('removing '+id+' in '+collection +' but no, we dont want to resend data to client')
                }
                return this.ready();
            }
        });
    } else {
        Meteor.publish("postFriendsV2", function (userId,postId,limit) {
            if(this.userId === null || !Match.test(postId, String) ){
                return this.ready();
            }
            else{
                var self = this;
                self.count = 0;
                self.meeterIds=[];
                self.docIds=[];
                try{self.added("postfriendsCount", userId+'_'+postId, {count: 0});}catch(e){}
                //此处为了修复再次打开帖子时新朋友消失的问题，需要publicPostsPublisherDeferHandle重新计算相遇次数
                if(limit <= 10){
                    publicPostsPublisherDeferHandle(userId,postId,self);
                    updateMeetsWhenReadingPost(userId,postId,self)
                }
                var handle = Meets.find({me: userId,meetOnPostId:postId},{sort: {createdAt: -1},limit:limit}).observeChanges({
                    added: function (id,fields) {
                        var taId = fields.ta;
                        //Call defered function here:
                        if (taId !== userId){
                            if(!~self.meeterIds.indexOf(taId)){
                                self.meeterIds.push(taId);
                                self.docIds.push(id);
                                newMeetsAddedForPostFriendsDeferHandleV2(self,taId,userId,id,fields);
                            }
                        }
                        try{self.changed("postfriendsCount", userId+'_'+postId, {count: Meets.find({me: userId,meetOnPostId:postId}).count()});}catch(e){}
                        self.count++;
                    },
                    changed: function (id,fields) {
                        // self.changed("postfriends", id, fields);
                        if(~self.docIds.indexOf(id)){
                            try{
                                self.changed("postfriends", id, fields);
                            }
                            catch(error){
                            }
                        }
                        try{self.changed("postfriendsCount", userId+'_'+postId, {count: Meets.find({me: userId,meetOnPostId:postId}).count()});}catch(e){}
                    }/*,
                     removed:function (id,fields) {
                     self.removed("postfriends", id, fields);
                     }*/
                });
                self.ready();
                self.onStop(function () {
                    handle.stop();
                    delete self.meeterIds
                    delete self.docIds
                });
            }
        });
    }

  Meteor.publish('waitreadcount', function() {
    if(!this.userId){
        return this.ready();
    }
      return Meteor.users.find(
          { _id : this.userId },
          { field: {'profile.waitReadCount':1}}
      );
  });
  Meteor.publish('allBlackList', function () {
    return BlackList.find({blackBy:this.userId},{limit: 1});
  });
  Meteor.publish('myBlackList', function (){
    if(!this.userId){
        return this.ready();
    }
    return BlackList.find({blackBy: this.userId});
  });
  Meteor.publish('allBlackListUsers',function(ids){
    if(!ids){
        return this.ready();
    }
    return Meteor.users.find({_id:{$in:ids}})
  });
  Meteor.publish("refcomments", function() {
    Max = RefComments.find().count()-8;
    Rnd = Rnd + 1;
    if(Rnd>Max) Rnd = 0;
    return RefComments.find({},{fields: {text:1},skip:Rnd,limit:8});
  });
  Meteor.publish("topicposts", function(topicId, limit) {
      // 老版本的处理，修改请慎重, @feiwu
      if(!topicId && !limit){
        if(!this.userId)
          return this.ready();

        return OldTopicPosts;
      }

      // new version
      limit = limit || 20
      if(this.userId === null)
        return this.ready();
      else if (!topicId)
        return TopicPosts.find({}, {sort: {createdAt: -1}, limit: limit});
      else
        return TopicPosts.find({topicId: topicId}, {sort: {createdAt: -1}, limit: limit});
  });
  Meteor.publish("topics", function() {
      if(this.userId === null)
        return this.ready();
      else
        return Topics.find({},{sort: {createdAt: -1},limit:20});
  });
  Meteor.publish("shareURLs", function() {
      if(this.userId === null)
        return this.ready();
      else
        return ShareURLs.find({userId:this.userId});
  });
  Meteor.publish("staticPost", function(postId) {
    return Posts.find({_id: postId},{sort: {createdAt: -1}});
  });
  Meteor.publish('pcomments', function() {
      if(this.userId === null)
          return this.ready();
      else
          return Feeds.find({followby:this.userId,checked:false});
  });
  Meteor.publish('postOwnerInfo', function (userId){
    if(this.userId === null)
        return this.ready();
    else
        return Meteor.users.find({_id:userId});
  });
  Meteor.publish("myCounter",function(){
      if(this.userId === null)
          return this.ready();
      else {
          Counts.publish(this, 'myPostsCount', Posts.find({owner: this.userId,publish: {$ne: false}}), {nonReactive: true });
          Counts.publish(this, 'mySavedDraftsCount', SavedDrafts.find({owner: this.userId}), {reactive: true });
          //Counts.publish(this, 'myFollowedByCount', Follower.find({followerId:this.userId}), { nonReactive: true });
          Counts.publish(this, 'myFollowedByCount', Follower.find({followerId:this.userId}), { reactive: true });
          Counts.publish(this, 'myFollowedByCount-'+this.userId, Follower.find({followerId:this.userId, userEmail: {$exists: false}}), { noReady: true });
          //Counts.publish(this, 'myFollowToCount', Follower.find({userId:this.userId}), {nonReactive: true });
          Counts.publish(this, 'myFollowToCount', Follower.find({userId:this.userId}), {reactive: true });
          Counts.publish(this, 'myEmailFollowerCount', Follower.find({followerId:this.userId, userEmail: {$exists: true}}), {reactive: true });
          Counts.publish(this, 'myEmailFollowerCount-'+this.userId, Follower.find({followerId:this.userId, userEmail: {$exists: true}}), {noReady: true });
      }
  });
  Meteor.publish('authorReadPopularPosts', function(owner,currPostId,limit){
     if(this.userId === null|| !Match.test(limit, Number)) {
          return this.ready();
      } else {
          return Posts.find({owner: owner, publish: true},{sort: {browse: -1},limit: limit,fields:{title:1,publish:1,owner:1,browse:1,latestSeries:1}});
      }
  });
  Meteor.publish("userRecommendStory", function(limit) {
      if(this.userId === null|| !Match.test(limit, Number)) {
          return this.ready();
      }
      else{
          return Posts.find({owner: this.userId, publish: true},{sort: {createdAt: -1},limit:limit,fields:{mainImage:1,title:1,addontitle:1,publish:1,owner:1,ownerName:1,createdAt:1,ownerIcon:1,browse:1,latestSeries:1}});
      }
  });
  Meteor.publish("postsWithLimit", function(limit) {
      if(this.userId === null|| !Match.test(limit, Number)) {
          return this.ready();
      }
      else{
          return Posts.find({owner: this.userId, publish: true},{sort: {createdAt: -1},limit:limit,fields:{mainImage:1,title:1,addontitle:1,publish:1,owner:1,ownerName:1,createdAt:1,ownerIcon:1,browse:1,latestSeries:1}});
      }
  });
    Meteor.publish("authorPostsWithLimit", function(limit) {
      if(this.userId === null|| !Match.test(limit, Number)) {
          return this.ready();
      }
      else{
          return Posts.find({owner: this.userId, publish: {$ne: false}},{sort: {createdAt: -1},limit:limit,fields:{mainImage:1,title:1,addontitle:1,publish:1,owner:1,createdAt:1}});
      }
  });

  Meteor.publish("savedDraftsWithLimit", function(limit) {
      if(this.userId === null|| !Match.test(limit, Number)){
          return this.ready();
      }
      else{
          return SavedDrafts.find({owner: this.userId},{sort: {createdAt: -1},limit:limit});
      }
  });
  Meteor.publish("savedDraftsWithID", function(draftId) {
      if(this.userId === null || !Match.test(draftId, String))
        return this.ready();
      else
        return SavedDrafts.find({_id: draftId});
  });
  Meteor.publish("followedByWithLimit", function(limit) {
      /*列出自己的粉丝*/
      if(this.userId === null|| !Match.test(limit, Number)){
          return this.ready();
      }
      else {
          return Follower.find({followerId:this.userId},{sort: {createAt: -1},limit:limit});
      }
  });
  Meteor.publish("followToWithLimit", function(limit) {
      /*列出自己的偶像*/
      if(this.userId === null|| !Match.test(limit, Number)){
          return this.ready();
      }
      else {
          return Follower.find({userId:this.userId},{sort: {createAt: -1},limit:limit});
      }
  });
    formatFollowPost = function(userId,postInfo){
      var ownerIcon = '';
      var publish = false;
      if(postInfo.ownerIcon){
          ownerIcon = postInfo.ownerIcon;
      } else {
          var ownerInfo = Meteor.users.findOne({_id: postInfo.ownerId},{fields:{'profile.icon':true}});
          ownerIcon =  ownerInfo?ownerInfo.profile.icon:'';
      }
      if(typeof postInfo.publish !== 'undefined'){
          publish = postInfo.publish
      } else {
          var post = Posts.findOne({_id:postInfo.postId},{fields:{'publish':true}});
          if(post){
              publish = post.publish;
          }
      }
      var fields = {
          postId:postInfo.postId,
          title: postInfo.name || postInfo.title,
          addontitle: postInfo.addonTitle,
          mainImage:postInfo.mainImage,
          mainImageStyle: null,
          heart: 0,
          retweet: 0,
          comment: 0,
          browse:  0,
          publish: publish,
          owner: postInfo.ownerId,
          ownerName: postInfo.ownerName,
          ownerIcon: ownerIcon,
          createdAt: postInfo.createdAt,
          followby:userId
      };
      return fields;
    }
    function addPostInfoInFollowPosts(self,userId,postInfo){
        try{
            var fields = formatFollowPost(userId, postInfo);
            self.added('followposts',postInfo.postId,fields)
        } catch(e){
            console.log('exception in addPostInfoInFollowPosts')
            console.log(e)
        }
    }
    Meteor.publish("loadLatestFollowedPost", function(since) {

        if(this.userId === null || !Match.test(since, Number))
            return this.ready();
        else{
            var self = this;
            var userId = this.userId;
            self.onStop(function(){
                //console.log('onStop New Friend')
            })
            self.removed = function(collection, id){
                //console.log('removing '+id+' in '+collection +' but no, we dont want to resend data to client')
            }
            this.unblock();
            //deferSetImmediate(function(){
            try{
                var queryResult = getLatestFollowPostFromNeo4J(userId, toSkip,queryLimit);

                if(queryResult && queryResult.length > 0){
                    queryResult.forEach(function (item) {
                        if(item){
                            addPostInfoInFollowPosts(self,userId,item);
                        }
                    });
                }
            } catch(e){}
            self.ready();
            //})
            return;
        }
        //return FollowPosts.find({followby: this.userId}, {sort: {createdAt: -1}, limit:limit});
    });
  if(withNeo4JInFollowPosts){
      var closeAllUserSessions = function(userId) {

          var sessions = _.filter(Meteor.default_server.sessions, function (session) {

              return session.userId == userId;

          });

          _.each(sessions, function (session) {

              session.connectionHandle.close();

          });

      }
      function neo4jFollowPostPublishHandle(self,userId, toSkip,queryLimit){
          try{
              ensureFollowInNeo4j(userId)
              var queryResult = getFollowPostFromNeo4J( userId, toSkip,queryLimit);

              if(queryResult && queryResult.length > 0){
                  console.log('To send '+queryResult.length+' follow post result to client')
                  queryResult.forEach(function (item) {
                      if(item){
                          addPostInfoInFollowPosts(self,userId,item);
                      }
                  });
              }
          } catch(e){
              console.log(e)
              console.log('in followposts publish, exception')
          }
          self.ready();
      }
      Meteor.publish("followposts", function(limit,skip,hasPullToRefresh) {
          console.log('in publish followposts skip:'+skip+' limit:'+limit)
          
          if(this.userId === null || !Match.test(limit, Number))
              return this.ready();
          else{
              var self = this;
              var userId = this.userId;
              var toSkip = 0;
              var queryLimit = limit;
              var needIntervalHelper = !hasPullToRefresh;

              if(typeof skip !== 'undefined'){
                  if(skip >= 0){
                      console.log('Skip '+skip+' limit '+limit);
                      toSkip = skip;
                  }
              } else {
                  if(!self._session.skipFollowPost){
                      self._session.skipFollowPost = {}
                  }
                  if(!self._session.skipFollowPost[userId]){
                      self._session.skipFollowPost[userId] = 0;
                  }
                  if(self._session.skipFollowPost[userId] >= limit){
                      self._session.skipFollowPost[userId] = 0;
                  }
                  toSkip = self._session.skipFollowPost[userId];
                  queryLimit = limit - self._session.skipFollowPost[userId];
                  self._session.skipFollowPost[userId] += queryLimit;
              }

              if(needIntervalHelper){
                  var lastTime = new Date().getTime()-30*1000
                  if(self._session.followPostInterval){
                      Meteor.clearInterval(self._session.followPostInterval);
                      self._session.followPostInterval = null;
                  }
                  self._session.followPostInterval = Meteor.setInterval(function(){
                      var queryResult = getLatestFollowPostFromNeo4J(userId,lastTime)
                      lastTime = new Date().getTime()-30*1000
                      try{
                          if(queryResult && queryResult.length > 0){
                              queryResult.forEach(function (item) {
                                  if(item){
                                      addPostInfoInFollowPosts(self,userId,item);
                                  }
                              });
                          }
                      } catch(e) {
                          console.log(e)
                          console.log('in followposts get latest, exception')

                          if(self._session.followPostInterval){
                              Meteor.clearInterval(self._session.followPostInterval);
                              self._session.followPostInterval = null;
                          }
                      }
                  }, 1000*30);
              }

              self.onStop(function(){
                  console.log('onStop follow post subscriber')
                  if(self._session.followPostInterval){
                      Meteor.clearInterval(self._session.followPostInterval);
                      self._session.followPostInterval = null;
                  }
              })
              self.removed = function(collection, id){
                  //console.log('removing '+id+' in '+collection +' but no, we dont want to resend data to client')
              }
              this.unblock();
              var userInfo = Meteor.users.findOne({_id: userId}, {fields:{createdAt:true}});
              if(((new Date() - userInfo.createdAt) < 120*1000) && Follower.find({userId:userId}).count()<4 ){
                  console.log('New user')
                  self.followToCount = 0;
                  deferSetImmediate(function(){
                      var templeHandle = Follower.find({userId:userId},{fields:{followerId:true}},{limit:4}).observeChanges({
                          added: function (id, fields) {
                              self.followToCount++;
                              console.log(self.followToCount)
                              if(self.followToCount >= 4){
                                  //neo4jFollowPostPublishHandle(self,userId, toSkip,queryLimit)
                                  closeAllUserSessions(userId)
                              }
                          }
                      })
                  })
                  return
              }
              neo4jFollowPostPublishHandle(self,userId, toSkip,queryLimit)
              return;
          }
      });
  } else {
      Meteor.publish("followposts", function(limit) {
          if(this.userId === null || !Match.test(limit, Number))
              return this.ready();
          else
              return FollowPosts.find({followby: this.userId}, {sort: {createdAt: -1}, limit:limit});
      });
  }
  Meteor.publish("ViewPostsList", function(postId) {
      if(this.userId === null || !Match.test(postId, String))
        return this.ready();
      else
        return Posts.find({_id: postId});
  });
  Meteor.publish('postViewCounter', function(postId) {
    Counts.publish(this, 'post_viewer_count_'+this.userId+'_'+postId, Viewers.find({
        postId: postId, userId: this.userId
    },{limit:1,fields: { '_id': 1, 'count': 1 }}), {countFromField: function(doc){
        return doc.count;
    }});
  });
  Meteor.publish('postsAuthor', function(postId) {
    var post,owner;
    post = Posts.findOne({_id:postId})
    if(post && post.owner){
        owner = post.owner;
        return Meteor.users.find({_id:owner},{fields:{'username': 1,'profile.fullname': 1,'profile.icon': 1,'profile.followTips':1, 'myHotPosts':1}});
    } else {
        return this.ready();
    }
  });
  Meteor.publish("publicPosts", function(postId) {
      if(!Match.test(postId, String)){
          return this.ready();
      }else if(this.userId === null){
          return Posts.find({_id: postId})
      }else{
        var self = this;
        var userId = this.userId;

          var self = this;
          self.count = 0;
          self.meeterIds=[];
        publicPostsPublisherDeferHandle(userId,postId,self);
        //updateMeetsWhenReadingPost(userId,postId,self);
        //updateMomentsDeferHandle(self,postId);
        if(syncToNeo4jWithMqtt)
            mqttPostViewHook(self.userId,postId);
        else
            ensureUserViewPostInNeo4j(self.userId, postId, false);

        return [
          Posts.find({_id: postId}),
          //Viewers.find({postId: postId, userId: this.userId}, {sort: {count: -1}, limit: tip_follower_read_count}),
        //   Meteor.users.find({_id: Posts.findOne({_id: postId}).owner}),
          Follower.find({userId: this.userId})
        ];
      }
  });

  //Added for the static web to trigger post reading related operation
  Meteor.publish("reading", function (postId) {
      if(this.userId === null || !Match.test(postId, String)){
          return this.ready();
      }
      var self = this;
      self.count = 0;
      self.meeterIds=[];
      publicPostsPublisherDeferHandle(this.userId,postId,self);
      //updateMeetsWhenReadingPost(userId,postId,self);
      //updateMomentsDeferHandle(self,postId);
      if(syncToNeo4jWithMqtt)
          mqttPostViewHook(self.userId,postId);
      else
          ensureUserViewPostInNeo4j(self.userId, postId, false);
      return this.ready();
  });
  /*Meteor.publish("drafts", function() {
        return Drafts.find({owner: this.userId});
  });*/
  Meteor.publish("saveddrafts", function() {
    if(this.userId === null)
      return this.ready();
    else
      return SavedDrafts.find({owner: this.userId},{sort: {createdAt: -1}});
  });
  Meteor.publish("loginFeeds", function() {
    if(this.userId === null)
      return this.ready();
    else
      return Feeds.find({followby: this.userId}, {sort: {createdAt: -1}, limit:50});
  });
  Meteor.publish("feeds", function(limit) {
    if(this.userId === null || !Match.test(limit, Number))
      return this.ready();
    else
      return Feeds.find({followby: this.userId}, {sort: {createdAt: -1}, limit:limit});
  });
  Meteor.publish("feedsByUserId", function(userId, limit) {
    if(this.userId === null || !Match.test(limit, Number))
      return this.ready();
    else
      return Feeds.find({followby: userId}, {sort: {createdAt: -1}, limit:limit});
  });
  Meteor.publish("userFeeds", function(followId,postId) {
    if(this.userId === null || !Match.test(followId, String) || !Match.test(postId, String))
      return this.ready();
    else
      return Feeds.find({followby: followId,postId: postId,eventType:'recommand',recommanderId:this.userId}, {sort: {createdAt: -1}, limit:2});
  });
  Meteor.publish("friendFeeds", function(friendId,userId) {
    if(this.userId === null || !Match.test(friendId, String) || !Match.test(userId, String) || this.userId !== userId)
      return this.ready();
    else
      return Feeds.find({requesteeId:friendId,requesterId:userId},{sort: {createdAt: -1}, limit:2})
  });
  Meteor.publish("follows", function() {
    return Follows.find({}, {sort: { index: 1 }} );
  });
  Meteor.publish("follower", function() {
    if(this.userId === null)
      return this.ready();
    else
      return Follower.find({$or:[{userId:this.userId},{followerId:this.userId}]});
  });
  Meteor.publish("friendFollower", function(userId,friendId) {
    if(this.userId === null || !Match.test(friendId, String) || !Match.test(userId, String) || this.userId !== userId)
      return this.ready();
    else
      return Follower.find({"userId":userId,"followerId":friendId},{sort: {createAt: -1}, limit:2})
  });
  Meteor.publish("userinfo", function(id) {
    if(this.userId === null || !Match.test(id, String))
      return this.ready();
    else {
        try {
            var self = this;
            var handle = Meteor.users.find({_id: id},
                {
                    'username': 1,
                    'email': 1, 'profile.fullname': 1, 'profile.icon': 1, 'profile.desc': 1, 'profile.location': 1,
                    'profile.lastLogonIP': 1
                }
            ).observeChanges({
                added: function (id,fields) {
                    self.added("userDetail", id, fields);
                },
                changed: function (id,fields) {
                    try{
                        self.changed("userDetail", id, fields);
                    }catch(error){
                    }
                }/*,
                removed: function(id, fields){
                    self.removed('userDetail', id, fields);
                }*/
            });
            getViewLists(self, id, 3);
            self.ready();
            self.onStop(function () {
                handle.stop();
            });
        } catch (error) {
        }
        return;
    }
  });
  Meteor.publish("usersById", function (userId) {
      return Meteor.users.find({_id: userId}, {
            fields: {
                'username': 1,
                'profile.fullname': 1,
                'profile.icon': 1,
                'profile.sex':1,
                'profile.loaction':1
            }
        });
  });
  Meteor.publish("comment", function(postId) {
    if(this.userId === null || !Match.test(postId, String))
    {
        return this.ready();
    }
    else
    {
        return Comment.find({postId: postId});
    }
  });
  Meteor.publish("userViewers", function(postId,userId) {
    if(!Match.test(postId, String) || !Match.test(userId, String))
      return this.ready();
    else
      return Viewers.find({postId: postId, userId: userId}, {sort: {createdAt: -1}, limit:2});
  });
  Meteor.publish("recentPostsViewByUser", function(userId) {
    if(!Match.test(userId, String))
      return this.ready();
    else
      return Viewers.find({userId: userId}, {sort: {createdAt: -1}, limit:3});
  });
  Meteor.publish("viewers", function(postId) {
    //if(!Match.test(postId, String))
      return this.ready();
    //else
    //  return Viewers.find({postId: postId}, {sort: {createdAt: -1}});
  });
  Meteor.publish("reports", function(postId) {
    if(!Match.test(postId, String))
      return this.ready();
    else
      return Reports.find({postId: postId},{limit:5});
  });
  Meteor.publish('versions', function() {
    return Versions.find({});
  });

  Meteor.publish('readerpopularposts', function() {
    if(this.userId) {
        // return ReaderPopularPosts.find({userId: this.userId},{limit:3});
        var postIds = [];
        ReaderPopularPosts.find({userId: this.userId},{limit:5}).forEach(function(item){
            postIds.push(item.postId)
        })
        return [
            ReaderPopularPosts.find({userId: this.userId},{limit:5}),
            Posts.find({_id:{$in: postIds}})
        ]
    }
    else {
        return this.ready();
    }
  });

  Meteor.publish('readerpopularpostsbyuid', function(uid) {
    if(this.userId) {
        // return ReaderPopularPosts.find({userId: this.userId},{limit:3});
        var postIds = [];
        ReaderPopularPosts.find({userId: uid},{limit:5}).forEach(function(item){
            postIds.push(item.postId)
        })
        return [
            ReaderPopularPosts.find({userId: uid},{limit:5}),
            Posts.find({_id:{$in: postIds}})
        ]
    }
    else {
        return this.ready();
    }
  });

  Meteor.publish('associatedusers', function() {
    if(!this.userId){
        return this.ready()
    }
      var self = this;
      var pub = this;

      var userA_Handle=AssociatedUsers.find({userIdA: self.userId}).observeChanges({
          added: function(_id, record){
              if(record.userIdB){
                  deferSetImmediate(function(){
                      var userInfo=Meteor.users.findOne({_id: record.userIdB}, {fields: {username: 1, 'profile.icon': 1, 'profile.fullname': 1}})
                      if(userInfo){
                          pub.added('associatedusers', _id, record);
                          var userId=userInfo._id
                          delete userInfo['_id']
                          pub.added('users', userId, userInfo);
                      }
                  })
              }
          },
          changed: function(_id, record){
              try {
                    pub.changed('associatedusers', _id, record);
                  }
              catch (e) {
                  }

          },
          removed: function(_id, record){
              pub.removed('associatedusers', _id, record);
          }
      });
      var userB_Handle=AssociatedUsers.find({userIdB: self.userId}).observeChanges({
          added: function(_id, record){
              if(record.userIdA){
                  deferSetImmediate(function(){
                      var userInfo=Meteor.users.findOne({_id: record.userIdA}, {fields: {username: 1, 'profile.icon': 1, 'profile.fullname': 1}})
                      if(userInfo){
                          pub.added('associatedusers', _id, record);
                          var userId=userInfo._id
                          delete userInfo['_id']
                          pub.added('users', userId, userInfo);
                      }
                  })
              }
          },
          changed: function(_id, record){
              try {
                    pub.changed('associatedusers', _id, record);
                  }
              catch (e) {
                  }
          },
          removed: function(_id, record){
              pub.removed('associatedusers', _id, record);
          }
      });
      this.ready();
      this.onStop(function(){
          userA_Handle.stop();
          userB_Handle.stop();
      });
      return
  });

  Meteor.publish('userRelation', function() {
    if(!this.userId)
       return this.ready();

    return UserRelation.find({userId: this.userId});
  });

  Meteor.publish('associateduserdetails', function(userIds) {
    if(userIds) {
        return Meteor.users.find({_id: {"$in": userIds}}, {fields: {username: 1, 'profile.icon': 1, 'profile.fullname': 1}});
    }
    else {
        return this.ready();
    }
  });

//   监控
  Meteor.publish('rpOwner', function(userId) {
      return Meteor.users.find({_id: userId}, {
          fields: {username: 1, 'profile.icon': 1, 'profile.fullname': 1,'token':1,'profile.location':1,'profile.lastLogonIP':1,'type':1,'anonymous':1}});
  });
  Meteor.publish('reporter_post_one', function(id) {
      return Posts.find({_id: id}, {limit:1});
  });
  Meteor.publish('rpPosts', function(type,selects,options) {
      // console.log ('type='+type)
      // console.log(type == 'montior')
      // console.log(JSON.stringify(selects));
      options.limit = options.limit || 10;
      options.skip = options.skip || 0;
      console.log('options:', options);

      if(type == 'montior'){
        options.fields = options.fields || {title:1,addontitle:1,ownerName:1,createdAt:1,reviewAt:1,owner:1};
        if(selects.startDate && selects.endDate){
            // Counts.publish(this,'rpPostsCounts',Posts.find({
            //     isReview:true,
            //     createdAt:{
            //         $gt: new Date(selects.startDate),
            //         $lte: new Date(selects.endDate),
            //         $exists: true
            //     }},options),{noReady: true});
            return Posts.find({
                isReview:true,
                createdAt:{
                    $gt: new Date(selects.startDate),
                    $lte: new Date(selects.endDate)}
                },options);
        }
        //Counts.publish(this,'rpPostsCounts',Posts.find({isReview:true,createdAt:{$exists: true}}),{noReady: true});
        return Posts.find({isReview:true},options);
      }
      if(type == 'recover'){
          if(selects.startDate && selects.endDate){
            // Counts.publish(this,'rpPostsCounts',BackUpPosts.find({
            //     createdAt:{
            //         $gt: new Date(selects.startDate),
            //         $lte: new Date(selects.endDate),
            //         $exists: true}
            //     },options),{noReady: true});
            return BackUpPosts.find({
                createdAt:{
                    $gt: new Date(selects.startDate),
                    $lte: new Date(selects.endDate)}
                },options);
        }
        // Counts.publish(this,'rpPostsCounts',BackUpPosts.find({createdAt:{$exists: true}}),{noReady: true});
        return BackUpPosts.find({},options)
      }
      if(type == 'review'){
        if(selects.startDate && selects.endDate){
            // console.log('1')
            // Counts.publish(this,'rpPostsCounts',RePosts.find({
            //     createdAt:{
            //         $gt: new Date(selects.startDate),
            //         $lte: new Date(selects.endDate),
            //         $exists: true
            //     }},options),{noReady: true});
            return RePosts.find({
                createdAt:{
                    $gt: new Date(selects.startDate),
                    $lte: new Date(selects.endDate)}
                },options);
        }
        // Counts.publish(this,'rpPostsCounts',RePosts.find({createdAt:{$exists: true}}),{noReady: true});
        return RePosts.find({},options);
        // if(selects.startDate && selects.endDate){
        //     // console.log('1')
        //     Counts.publish(this,'rpPostsCounts',Posts.find({
        //         isReview: false,
        //         createdAt:{
        //             $gt: new Date(selects.startDate),
        //             $lte: new Date(selects.endDate),
        //             $exists: true
        //         }},options),{noReady: true});
        //     return Posts.find({
        //         isReview: false,
        //         createdAt:{
        //             $gt: new Date(selects.startDate),
        //             $lte: new Date(selects.endDate)}
        //         },options);
        // }
        // Counts.publish(this,'rpPostsCounts',Posts.find({createdAt:{$exists: true},isReview: false}),{noReady: true});
        // return Posts.find({isReview: false},options);
      }
      if(type == 'unblock'){
          if(selects.startDate && selects.endDate){
            // Counts.publish(this,'rpPostsCounts',LockedUsers.find({
            //     createdAt:{
            //         $gt: new Date(selects.startDate),
            //         $lte: new Date(selects.endDate),
            //         $exists: true}
            //     },options),{noReady: true});
            return LockedUsers.find({
                createdAt:{
                    $gt: new Date(selects.startDate),
                    $lte: new Date(selects.endDate)}
                },options);
        }
        // Counts.publish(this,'rpPostsCounts',LockedUsers.find({createdAt:{$exists: true}}),{noReady: true});
        return LockedUsers.find({},options)
      }
  });

  function publishTheFavouritePosts(self,userId,limit){
      var pub = self
      var cursorHandle=FavouritePosts.find({userId: userId}, {sort: {createdAt: -1}, limit: limit}).observeChanges({
          added: function(_id, record){
              deferSetImmediate(function(){
                  var postInfo=Posts.findOne({_id: record.postId},{fields:{title:1,addontitle:1,mainImage:1,ownerName:1,owner:1}});
                  if(postInfo){
                      pub.added('favouriteposts', _id, record);
                      var postId=postInfo._id
                      delete postInfo['_id']
                      pub.added('posts', postId, postInfo);
                  }
              })
          },
          changed: function(_id, record){
              try {
                   pub.changed('favouriteposts', _id, record);
                  }
              catch (e) {
                  }

          },
          removed: function(_id, record){
              pub.removed('favouriteposts', _id, record);
          }
      });
      deferSetImmediate (function(){
          getViewLists(self,userId,3);
      });
      self.ready()
      self.onStop(function(){
          cursorHandle.stop()
      })
  }
  Meteor.publish('favouriteposts', function(limit) {
    if(!this.userId){
        return this.ready();
    }
    limit = limit || 3;
    return publishTheFavouritePosts(this,this.userId,limit)
  });

  Meteor.publish('userfavouriteposts', function(userId, limit) {
    if(!userId){
        this.ready()
    }
    limit= limit || 3;
    return publishTheFavouritePosts(this,userId,limit)
  });

  Meteor.publish('SaveDraftsByLogin', function() {
    if(!this.userId)
      return [];

    return SavedDrafts.find({owner: this.userId}, {sort: {createdAt: -1}});
  });

   Meteor.publish('webUserPublishPosts', function(limit) {
    if(!this.userId)
      return this.ready();

    limit = limit || 10;
    //return Posts.find({}, {sort: {createdAt: -1}, limit: limit});
    return Posts.find({owner: this.userId}, {sort: {createdAt: -1}, limit: limit});
  });


  Meteor.publish('webwaitreadmsg',function(userId){
     return WebWaitReadMsg.find({_id: userId});
  });
  SearchSource.defineSource('topics', function(searchText, options) {
    var options = {sort: {createdAt: -1}, limit: 20};

    if(searchText) {
      var regExp = buildRegExp(searchText);
      var selector = {'text': regExp};
      return Topics.find(selector, options).fetch();
    } else {
       //return this.ready();
       return [];
      //return Topics.find({}, options).fetch();
    }
  });

  SearchSource.defineSource('followusers', function(searchText, options) {
    var is_fullname = true;
    if (options) {
        is_fullname = options.is_fullname;
    }
    var options = {limit: 20};

    if(searchText) {
      var regExp = buildRegExp(searchText);
      var selector ;
      if (is_fullname) {
        selector = {'profile.fullname': regExp};
      }
      else{
        selector = {'username':regExp};
      }
      return Meteor.users.find(selector, options).fetch();
    } else {
       //return this.ready();
       return [];
      //return Meteor.users.find({}, options).fetch();
    }
  });

  SearchSource.defineSource('posts', function(searchText, options) {
    var options = {sort: {createdAt: -1}, limit: 20};

    if(searchText) {
      var regExp = buildRegExp(searchText);
      var selector = { owner: this.userId,'title': regExp };
      return Posts.find(selector, options).fetch();
    } else {
       //return this.ready();
       return [];
        //return Posts.find({}, options).fetch();
    }
  });

  function buildRegExp(searchText) {
    // this is a dumb implementation
    var parts = searchText.trim().split(/[ \-\:]+/);
    return new RegExp("(" + parts.join('|') + ")", "ig");
  }
}

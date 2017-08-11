var PRFIX= 'simple_chat_';
if(Meteor.isServer){
  var remoteCollectionDriver = function(){
    var connectionOptions = {};
    var mongoUrl = process.env.CHAT_MONGO_URL;

    if (process.env.MONGO_OPLOG_URL)
      connectionOptions.oplogUrl = process.env.CHAT_MONGO_OPLOG_URL;
    if (!mongoUrl)
      mongoUrl = process.env.MONGO_URL
    return new MongoInternals.RemoteCollectionDriver(mongoUrl, connectionOptions);
  };
  var options = {_driver: remoteCollectionDriver()};

  Groups = new Mongo.Collection(PRFIX + 'groups', options);
  GroupUsers = new Mongo.Collection(PRFIX + 'groups_users', options);
  MsgSession = new Mongo.Collection(PRFIX + 'msg_session');

  MsgSession.allow({
    insert: function (userId, doc) {
      if (doc.userId != userId)
        return false;

      // 修正群的名称和头像
      if (doc.sessionType === 'group'){
        var group = Groups.findOne({_id: doc.toUserId});
        if (group && group.name)
          doc.toUserName = group.name;
        if (group && group.icon)
          doc.toUserIcon = group.icon;
      }

      var msgSession = MsgSession.findOne({userId: doc.userId, toUserId: doc.toUserId});
      if (msgSession){
        MsgSession.update({_id: msgSession._id}, {$set: doc, $inc: {count: 1}});
        return false;
      } else {
        return true;
      }
    },
    remove: function (userId, doc) {
      return doc.userId === userId;
    },
    update: function (userId, doc, fieldNames, modifier) {
      if (doc.userId != userId)
        return false;

      // 修正群的名称和头像
      if (doc.sessionType === 'group'){
        if (!modifier['$set'])
          modifier['$set'] = {};
        var group = Groups.findOne({_id: doc.toUserId});
        if (group && group.name)
          modifier['$set'].toUserName = group.name;
        if (group && group.icon)
          modifier['$set'].toUserIcon = group.icon;
      } 

      return true;
    }
  });
}else{
  Groups = new Mongo.Collection(PRFIX + 'groups');
  GroupUsers = new Mongo.Collection(PRFIX + 'groups_users');

  Meteor.startup(function() {
    //var LocalMessagesObservor = new PersistentMinimongo2(Messages, 'workai');
    //Ground.Collection(Messages, 'gdb');

    Messages = new Ground.Collection(PRFIX + 'messages', { connection: null })
    MsgSession = new Mongo.Collection(PRFIX + 'msg_session');
    Messages.after.insert(function (userId, doc) {updateMsgSession(doc);});
    Messages.after.update(function (userId, doc, fieldNames, modifier, options) {updateMsgSession(doc);});

    SimpleChat.Messages = Messages;
    SimpleChat.MsgSession = MsgSession;

    // 老版本的本地消息会话列表
    var oldMsgSession = new Ground.Collection(PRFIX + 'msg_session', { connection: null });
    var oldSes = oldMsgSession.find({}).fetch();
    if (oldSes.length > 0){
      Meteor.setTimeout(function(){
        oldSes.map(function(item){
          MsgSession.insert(item);
          oldMsgSession.remove({_id: item._id});
        });
      }, 2000);
    }
  });

  // 生成聊天会话
  var updateMsgSession = function(doc){
    if (!Meteor.userId())
      return;
    var associatedUser = {};
    var msgObj = null;
    switch(doc.to_type){
      case 'group':
        // var group = Groups.findOne({_id: doc.to.id});
        //if (GroupUsers.find({group_id: doc.to.id}).count() > 0) // -> my group
        msgObj = {toUserId: doc.to.id, toUserName: doc.to.name, toUserIcon: doc.to.icon, sessionType: 'group'};
        break;
      case 'user':
        if (doc.form.id === Meteor.userId()) // me -> ta
          msgObj = {toUserId: doc.to.id, toUserName: doc.to.name, toUserIcon: doc.to.icon, sessionType: 'user', count: -1};
        else if (doc.to.id == Meteor.userId()) // ta - me
          msgObj = {toUserId: doc.form.id, toUserName: doc.form.name, toUserIcon: doc.form.icon, sessionType: 'user'};
        else{
          var user = Meteor.user();
          if (user && user.profile && user.profile.associated) {
            var associated = user.profile.associated
            for (var i = 0; i < associated.length; i++) {
              var id = associated[i].id;
              if (doc.form.id === id) { //associated ->ta
                associatedUser = associated[i];
                msgObj = {toUserId: doc.to.id, toUserName: doc.to.name, toUserIcon: doc.to.icon, sessionType: 'user', count: -1};
                break;
              }
              else if(doc.to.id === id){//ta ->associated
                associatedUser = associated[i];
                msgObj = {toUserId: doc.form.id, toUserName: doc.form.name, toUserIcon: doc.form.icon, sessionType: 'user'};
                break;
              }
            }
          }
        }
        break;
    }

    if (!msgObj)
      return;
    if (doc.to_type === 'user' && doc.to.id == Meteor.userId() && doc.to_type == 'user') {
      //ta 被我拉黑
      if(BlackList.find({blackBy: Meteor.userId(), blacker:{$in: [doc.form.id]}}).count() > 0){
        console.log(doc.to.id+'被我拉黑');
        return;
      }
    }

    //发给关联用户的消息
    if (associatedUser.id) {
      msgObj.userId = associatedUser.id;
      msgObj.userName = associatedUser.name;
      msgObj.userIcon = associatedUser.icon;
    }
    else{
      msgObj.userId = Meteor.userId();
      msgObj.userName = AppConfig.get_user_name(Meteor.user());
      msgObj.userIcon = AppConfig.get_user_icon(Meteor.user()); 
    }
    msgObj.lastText = doc.type === 'text' ? doc.text : '[图片]';
    msgObj.updateAt = new Date(Date.now() + MQTT_TIME_DIFF);

    // 不是故事群的聊天室，则不显示
    var _group = Groups.findOne({_id: doc.to.id});
    if (doc.to_type === 'group' && _group && !_group.is_post_group)
      return;

    // 修正故事群的图标及名称
    if (doc.to_type === 'group' && _group){
      msgObj.toUserIcon = _group.icon || msgObj.toUserIcon ;
      msgObj.toUserName = _group.name || msgObj.toUserName;
    }

    var msgSession = MsgSession.findOne({userId: msgObj.userId, toUserId: msgObj.toUserId});
    var count = doc.form.id === Meteor.userId() ? 0 : 1; //用户自己发的消息未读消息数量不增加；
    if (msgSession){
      msgObj.createAt = msgSession.createAt;
      delete msgObj.toUserIcon;
      delete msgObj.toUserName;
      MsgSession.update({_id: msgSession._id}, {$set: msgObj, $inc: {count: count}});
      console.log('update chat session:', msgObj);
    } else {
      msgObj.createAt = new Date(Date.now() + MQTT_TIME_DIFF);
      msgObj.count = count;
      MsgSession.insert(msgObj);
      console.log('insert chat session:', msgObj);
    }
  };
}

if(Meteor.isServer){
  Meteor.startup(function(){
    Groups._ensureIndex({'user_id': 1});
    GroupUsers._ensureIndex({'user_id': 1});
    GroupUsers._ensureIndex({'group_id': 1});
    GroupUsers._ensureIndex({'group_id': 1, 'user_id': 1});
  });
}

SimpleChat.Groups = Groups;
SimpleChat.GroupUsers = GroupUsers;


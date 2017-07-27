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
  // MsgSession = new Mongo.Collection(PRFIX + 'msg_session');
}else{
  Groups = new Mongo.Collection(PRFIX + 'groups');
  GroupUsers = new Mongo.Collection(PRFIX + 'groups_users');

  Meteor.startup(function() {
    //var LocalMessagesObservor = new PersistentMinimongo2(Messages, 'workai');
    //Ground.Collection(Messages, 'gdb');

    Messages = new Ground.Collection(PRFIX + 'messages', { connection: null })
    MsgSession = new Ground.Collection(PRFIX + 'msg_session', { connection: null });
    Messages.after.insert(function (userId, doc) {updateMsgSession(doc);});
    Messages.after.update(function (userId, doc, fieldNames, modifier, options) {updateMsgSession(doc);});

    SimpleChat.Messages = Messages;
    SimpleChat.MsgSession = MsgSession;
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

    // 修正故事群的图标
    if (doc.to_type === 'group' && _group && _group.is_post_group)
      msgObj.toUserIcon = 'http://oss.tiegushi.com/groupMessages.png';

    var msgSession = MsgSession.findOne({userId: msgObj.userId, toUserId: msgObj.toUserId});
    if (msgSession){
      msgObj.createAt = msgSession.createAt;
      MsgSession.update({_id: msgSession._id}, {$set: msgObj, $inc: {count: 1}});
      console.log('update chat session:', msgObj);
    } else {
      msgObj.createAt = new Date(Date.now() + MQTT_TIME_DIFF);
      msgObj.count = 1;
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


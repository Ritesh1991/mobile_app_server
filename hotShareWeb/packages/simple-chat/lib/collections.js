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
  ChatMessage = new Mongo.Collection(PRFIX + 'chat_message');

  ChatMessage.allow({
    insert: function (userId, doc) {
      return true;
    }
  });
  MsgSession.allow({
    insert: function (userId, doc) {
      if (doc.userId != userId && doc.app_user_id != userId)
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
        delete doc.count;
        //console.log('update doc:'+ JSON.stringify(doc));
        MsgSession.update({_id: msgSession._id}, {$set: doc, $inc: {count: 1}},function(error){console.log('update error:'+error);});
        return false;
      } else {
        return true;
      }
    },
    remove: function (userId, doc) {
      return doc.userId === userId || doc.app_user_id === userId;
    },
    update: function (userId, doc, fieldNames, modifier) {
      if (doc.userId != userId && doc.app_user_id != userId)
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
    // MsgSession = new Ground.Collection(PRFIX + 'msg_session', { connection: null });
    MsgSession = new Mongo.Collection(PRFIX + 'msg_session');
    

    SimpleChat.Messages = Messages;
    //SimpleChat.MsgSession = MsgSession;
  });

}

if(Meteor.isServer){
  Meteor.startup(function(){
    Groups._ensureIndex({'user_id': 1});
    GroupUsers._ensureIndex({'user_id': 1});
    GroupUsers._ensureIndex({'group_id': 1});
    GroupUsers._ensureIndex({'group_id': 1, 'user_id': 1});
    ChatMessage._ensureIndex({'to.id': 1});
  });
}

SimpleChat.Groups = Groups;
SimpleChat.GroupUsers = GroupUsers;
SimpleChat.MsgSession = MsgSession;
SimpleChat.ChatMessage = ChatMessage;
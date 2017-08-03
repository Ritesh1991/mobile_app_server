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

      var msgSession = MsgSession.findOne({userId: doc.userId, toUserId: doc.toUserId});
      if (msgSession){
        doc.createAt = msgSession.createAt;
        MsgSession.update({_id: msgSession._id}, {$set: doc, $inc: {count: 1}});
        return false;
      } else {
        return true;
      }
    },
    remove: function (userId, doc) {
      return doc.userId === userId;
    },
    update: function (userId, doc) {
      if (doc.userId != userId)
        return false;

      var msgSession = MsgSession.findOne({userId: doc.userId, toUserId: doc.toUserId});
      if (msgSession){
        return true;
      } else {
        doc.createAt = new Date();
        doc.count = 1;
        MsgSession.insert(doc);
        return false;
      }
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
  });
}

SimpleChat.Groups = Groups;
SimpleChat.GroupUsers = GroupUsers;


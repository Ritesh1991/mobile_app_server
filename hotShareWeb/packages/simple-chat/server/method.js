var async = Meteor.npmRequire('async');
var subscribeMQTT = function(userId, topic, callback){
  var client = mqtt.connect('ws://tmq.tiegushi.com:80', {
    clean: true,
    keepalive: 30,
    reconnectPeriod: 20*1000,
    clientId: userId
  });

  var timeout = Meteor.setTimeout(function(){
    client_end(new Error('mqtt sub timeout'));
  }, 1000*30);

  var client_end = function(err){
    try{
      timeout && Meteor.clearTimeout(timeout);
      timeout = null;
      client.end(false, function(){
        client = null;
      });
      callback && callback(err);
    } catch (e){callback && callback(e)}
  };

  client.on('connect', function(){
    client.subscribe(topic, {qos: 1}, function(err){
      if (err)
        return client_end(err);
      client.unsubscribe(topic);
      client_end();
    });
  });
  client.on('error', function(err){
    client_end(err);
  });
};

// 创建群（如果不存在）及加群
var upsertGroup = function(id, name, ids, is_post_group, cb){
  id = id || new Mongo.ObjectID()._str;
  ids = ids || [];

  var group = Groups.findOne({_id: id});
  if(group){
    var $set = {};
    if (!group.name){
      group.name = name;
      $set.name = name;
    }
    if (!group.icon){
      group.icon = 'http://oss.tiegushi.com/groupMessages.png';
      $set.icon = 'http://oss.tiegushi.com/groupMessages.png';
    }
    if (is_post_group && !group.is_post_group){
      group.is_post_group = true;
      $set.is_post_group = true;
    }
    if ($set.name || $set.icon)
      Groups.update({_id: id}, {$set: $set});
  } else {
    group = {
      _id: id,
      name: name,
      icon: 'http://oss.tiegushi.com/groupMessages.png',
      describe: '',
      create_time: new Date(Date.now() + MQTT_TIME_DIFF),
      last_text: '',
      last_time: new Date(Date.now() + MQTT_TIME_DIFF),
      barcode: rest_api_url + '/restapi/workai-group-qrcode?group_id=' + id
    };
    if (is_post_group)
      group.is_post_group = true;
    Groups.insert(group);
  }

  if (!ids || ids.length <= 0)
    return id;

  var newUsers = [];
  for(var i=0;i<ids.length;i++){
    var user = Meteor.users.findOne({_id: ids[i]});
    if (user && GroupUsers.find({group_id: id, user_id: ids[i]}).count() <= 0){
      var groupUser = {
        group_id: group._id,
        group_name: group.name,
        group_icon: group.icon,
        user_id: user._id,
        user_name: user.profile && user.profile.fullname ? user.profile.fullname : user.username,
        user_icon: user.profile && user.profile.icon ? user.profile.icon : '/userPicture.png',
        create_time: new Date(Date.now() + MQTT_TIME_DIFF)
      };
      if (is_post_group)
        groupUser.is_post_group = true;
      GroupUsers.insert(groupUser);
      newUsers.push(user);
      console.log('增加用户', groupUser.user_name, '到群', group.name);
    }
  }

  async.mapLimit(newUsers, 10, function(user, callback){
    var msgSession = MsgSession.findOne({userId: user._id, toUserId: group._id, sessionType: 'group'});
    if (!msgSession){
      MsgSession.insert({
        toUserId : group._id,
        toUserName : group.name,
        toUserIcon : group.icon,
        sessionType : "group",
        userId : user._id,
        userName : user.profile && user.profile.fullname ? user.profile.fullname : user.username,
        userIcon : user.profile && user.profile.icon ? user.profile.icon : "/userPicture.png",
        lastText : (user.profile && user.profile.fullname ? user.profile.fullname : user.username) + ' 加入了聊天室',
        updateAt : new Date(),
        createAt : new Date(),
        count : 0
      });
      console.log('生成用户', (user.profile && user.profile.fullname ? user.profile.fullname : user.username), '消息会话');
    }
    subscribeMQTT(user._id, '/t/msg/g/' + group._id, function(err){
      callback && callback(err);
    });
  }, function(err){
    if (err)
      return cb && cb(err, id);

    async.mapLimit(newUsers, 10, function(user, callback){
      sendMqttGroupMessage(id, {
        form: {
          id: 'AsK6G8FvBn525bgEC',
          name: '故事贴小秘',
          icon: 'http://data.tiegushi.com/AsK6G8FvBn525bgEC_1471329022328.jpg'
        },
        to: {
          id: group._id,
          name: group.name,
          icon: group.icon
        },
        type: 'text',
        to_type: 'group',
        text: (user.profile && user.profile.fullname ? user.profile.fullname : user.username) + ' 加入了聊天室',
        is_read: false,
        create_time: new Date()
      });
    }, function(error){
      cb && cb(null, id); // XXX 加入群的消息不处理成功/失败
    });
  });

  return id;
};
SimpleChat.upsertGroup = upsertGroup;

Meteor.methods({
  'create-group': function(id, name, ids){
    this.unblock();
    if (!ids || ids.length <= 0 && this.userId)
      ids = [this.userId];
    if (!ids || ids.length <= 0)
      return id;
    return upsertGroup(id, name, ids);
  },
  'create-group-2': function(id, name, ids){
    this.unblock();
    if (!ids || ids.length <= 0 && this.userId)
      ids = [this.userId];
    if (!ids || ids.length <= 0)
      return id;
    return upsertGroup(id, name, ids, true);
  },
  'add-group-urser':function(id,usersId){
    var slef = this;
    usersId = usersId || [];
    group = Groups.findOne({_id: id});
    if(group){
      if(usersId.indexOf(slef.userId) === -1){
        usersId.splice(0, 0, slef.userId);
      }
      // console.log('ids:', ids);
      for(var i=0;i<usersId.length;i++){
        var user = Meteor.users.findOne({_id: usersId[i]});
        if(user){
          var isExist = GroupUsers.findOne({group_id: group._id,user_id: user._id});
          if (isExist) {
            console.log('GroupUsers isExist');
            continue;
          }
          // console.log(user);
          var groupUser = {
            group_id: group._id,
            group_name: group.name,
            group_icon: group.icon,
            user_id: user._id,
            user_name: user.profile && user.profile.fullname ? user.profile.fullname : user.username,
            user_icon: user.profile && user.profile.icon ? user.profile.icon : '/userPicture.png',
            create_time: new Date(Date.now() + MQTT_TIME_DIFF)
          };
          if (group.is_post_group)
            groupUser.is_post_group = true;
          GroupUsers.insert(groupUser);

          var msgSession = MsgSession.findOne({userId: user._id, toUserId: group._id, sessionType: 'group'});
          if (!msgSession){
            MsgSession.insert({
              toUserId : group._id,
              toUserName : group.name,
              toUserIcon : group.icon,
              sessionType : "group",
              userId : user._id,
              userName : user.profile && user.profile.fullname ? user.profile.fullname : user.username,
              userIcon : user.profile && user.profile.icon ? user.profile.icon : "/userPicture.png",
              lastText : (user.profile && user.profile.fullname ? user.profile.fullname : user.username) + ' 加入了聊天室',
              updateAt : new Date(),
              createAt : new Date(),
              count : 0
            });
            console.log('生成用户', (user.profile && user.profile.fullname ? user.profile.fullname : user.username), '消息会话');
          }

          subscribeMQTT(user._id, '/t/msg/g/' + group._id, function(err){
            sendMqttGroupMessage(id, {
              form: {
                id: 'AsK6G8FvBn525bgEC',
                name: '故事贴小秘',
                icon: 'http://data.tiegushi.com/AsK6G8FvBn525bgEC_1471329022328.jpg'
              },
              to: {
                id: group._id,
                name: group.name,
                icon: group.icon
              },
              type: 'text',
              to_type: 'group',
              text: (user.profile && user.profile.fullname ? user.profile.fullname : user.username) + ' 加入了聊天室',
              is_read: false,
              create_time: new Date()
            });
          });
        }
      }
      return 'succ'
    }
    else{
      return 'not find group';
    }
  },
  'remove-group-user':function(id,userId){
    var groupuser = GroupUsers.findOne({group_id: id,user_id: userId});
    if (groupuser) {
      GroupUsers.remove({_id:groupuser._id},function(err,res){
        if (err) {
          return console.log ('GroupUsers remove failed');
        }
        if (GroupUsers.find({group_id: id}).count === 0){
          Groups.remove({_id:id});
        }

        MsgSession.remove({userId: userId, toUserId: id, sessionType: 'group'});
      });
    }
    return id;
  }
});
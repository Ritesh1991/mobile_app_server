Meteor.publish('get-messages', function(type, to){
  var slef = this;
  var user = Meteor.users.findOne(slef.userId);
  var where = null;

  if(type === 'group')
    where = {'to.id': to, to_type: type}; // 没有判断是否在群的处理。自动加群
  else
    where = {
      $or: [
        {'form.id': slef.userId, 'to.id': to, to_type: type}, // me -> ta
        {'form.id': to, 'to.id': slef.userId, to_type: type}  // ta -> me
      ]
    };

  switch(type){
    case 'user':
      return [
        Meteor.users.find({_id: to}),
        // Messages.find(where, {limit: limit || 20, sort: {create_time: -1}})
      ];
    case 'group':
      Meteor.call('create-group', to, null, [slef.userId]);
      return [
        Groups.find({_id: to}, {limit: 1}),
        // Messages.find(where, {limit: limit || 20, sort: {create_time: -1}})
      ];
  }
});

Meteor.publish('get-msg-session', function(){
  return MsgSession.find({userId: this.userId}, {limit: 60});
});

Meteor.publish('get-group', function(id){
  return Groups.find({_id: id});
});

// Meteor.publish('get-user-group',function(userId){
//   return GroupUsers.find({user_id: userId});
// });

Meteor.publish('get-group-user', function(id){
  return GroupUsers.find({group_id: id});
});

Meteor.publish('get-group-user-with-limit', function(id,limit){
  return GroupUsers.find({group_id: id},{limit:limit});
});

Meteor.publish("group-user-counter",function(id){
  Counts.publish(this, 'groupsUserCountBy-'+id, GroupUsers.find({group_id: id}), {reactive: true });
});

Meteor.publish('get-my-group', function(user_id){
  console.log('pub get-my-group', GroupUsers.find({user_id: user_id}).count());
  return GroupUsers.find({user_id: user_id});
});

Meteor.publish('get-label-names', function(limit){
  limit = limit || 20;
  return PersonNames.find({}, {sort: {createAt: 1}, limit: limit});
});

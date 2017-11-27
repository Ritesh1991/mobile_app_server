var Fiber = Meteor.npmRequire('fibers');

/**
 * Cron Job: 清理规则是：超过10天没有阅读该作者的群众，会自动被系统踢出去。
 *  */ 

if(Meteor.isServer){
  cleanGroupInactiveUsers = function (final_callback) {
    console.log('start clean Group Inactive Users')
    var ts = new Date();
    ts.setDate(ts.getDate() - 10);

    var groupUsers = SimpleChat.GroupUsers.find({
      is_post_group: true, // 只清理故事群
      latest_active_time: {$lte: ts}
    }).fetch();

    forEachAsynSeries(groupUsers, 5, function(item, index, callback) {
      Fiber(function(){
        try{
          SimpleChat.MsgSession.remove({sessionType: 'group', toUserId: item.group_id});
          SimpleChat.GroupUsers.remove({_id: item._id});
          console.log('Clean Inactive Group User Success');
          callback();
        } catch (error){
          console.log('Clean Inactive Group User Err:'+ error);
          callback();
        }
      }).run();
    }, function(result){
      console.log('Clean Inactive Group Users Job Complete!');
      final_callback && final_callback(null);
    });
  };
  
  Meteor.startup(function(){
    Meteor.defer(function(){
      // 创建定时任务(每天凌晨3点对不活跃的群聊用户进行清理)
      SyncedCron.add({
        name: 'Clean Inactive Group Users',
        schedule: function(parser) {
          // parser is a later.parse object
          return parser.text('at 3:00 am');
        },
        job: function() {
          var numbersCrunched = cleanGroupInactiveUsers();
          return numbersCrunched;
        }
      });

      // 启用定时任务
      SyncedCron.start()
    })
  });
}
//import { Promise } from 'meteor/promise';

var Fiber = Meteor.npmRequire('fibers');

/**
 * Cron Job: 清理规则是：超过10天没有阅读该作者的群众，会自动被系统踢出去。
 *  */ 

if(Meteor.isServer){
  cleanGroupInactiveUsers = function (final_callback) {
    var ts = new Date();
    ts.setDate(ts.getDate() - 10);

    new Promise(function(resolve, reject){
        console.log('Cleanup old users without latest_active_time...')
        var groupUsers = SimpleChat.GroupUsers.find({
            is_post_group: true, // 只清理故事群
            latest_active_time: {$exists: false},
            create_time: {$lte: ts}
        }).fetch();
        console.log('Old groupUsers.length='+groupUsers.length);

        forEachAsynSeries(groupUsers, 1, function(item, index, callback) {
          Fiber(function(){
            try {
                console.log("Old toUserId = "+item.group_id+", _id = "+item._id+", group_name="+item.group_name);
                //Don't remove users in 故事贴反馈群/故事贴监控群
                if (item.group_id != '7e68e6c1f153e984ca4b0fce' && item.group_id != 'f75b78252d923d3fc597da8e_group') {
                    if (item.group_id && item.group_id.indexOf(item.user_id+'_group') == -1) {//Don't remove group creater
                        SimpleChat.MsgSession.remove({sessionType: 'group', toUserId: item.group_id});
                        SimpleChat.GroupUsers.remove({_id: item._id});
                        console.log('Remove old Group User Success');
                    }
                }
                callback();
            } catch (error){
                console.log('Remove old Group User Err:'+ error);
                callback();
            }
          }).run();
        }, function(result){
          console.log('Cleanup old Group Users Job Complete!');
          resolve();
        });
    }).then(function(){
        console.log('Cleanup inactive users...')
        var groupUsers = SimpleChat.GroupUsers.find({
            is_post_group: true, // 只清理故事群
            latest_active_time: {$lte: ts}
        }).fetch();
        console.log('Inactive groupUsers.length='+groupUsers.length);

        forEachAsynSeries(groupUsers, 1, function(item, index, callback) {
          Fiber(function(){
            try{
                console.log("Inactive toUserId = "+item.group_id+", _id = "+_id+", group_name="+item.group_name);
                //Don't remove users in 故事贴反馈群/故事贴监控群
                if (item.group_id != '7e68e6c1f153e984ca4b0fce' && item.group_id != 'f75b78252d923d3fc597da8e_group') {
                    if (item.group_id && item.group_id.indexOf(item.user_id+'_group') == -1) {//Don't remove group creater
                        SimpleChat.MsgSession.remove({sessionType: 'group', toUserId: item.group_id});
                        SimpleChat.GroupUsers.remove({_id: item._id});
                        console.log('Remove Inactive Group User Success');
                    }
                }
                callback();
            } catch (error){
                console.log('Remove Inactive Group User Err:'+ error);
                callback();
            }
          }).run();
        }, function(result){
          console.log('Clean inactive Group Users Job Complete!');
          final_callback && final_callback(null);
        });
    })
  };
  
  Meteor.startup(function(){
    //For test
    //return cleanGroupInactiveUsers();
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
/**
 * Created by simba on 5/12/16.
 */
if(Meteor.isServer){
    initMQTT = function(clientId){
        var mqttOptions = {
            clean:true,
            keepalive:30,
            reconnectPeriod:20*1000,
            clientId:clientId
        }
        mqtt_connection=mqtt.connect('ws://tmq.tiegushi.com:80',mqttOptions);
        mqtt_connection.on('connect',function(){
            console.log('Connected to mqtt server');
        });
        sendMqttMessage=function(topic,message){
            Meteor.defer(function(){
                mqtt_connection.publish(topic,JSON.stringify(message),{qos:1})
            })
        }
        sendMqttUserMessage=function(user_id, message) {
            //console.log('>>> sendMqttUserMessage: ' + JSON.stringify(message))
            try{
                sendMqttMessage("/t/msg/u/" + user_id, message);
            }catch(e){}
        };
        mqttPostViewHook=function(userId,postId){
            try{
                sendMqttMessage('postView',{userId:userId,postId:postId})
            }catch(e){}
        }
        mqttInsertNewPostHook=function(ownerId,postId,title,addonTitle,ownerName,mainImage){
            try{
                sendMqttMessage('publishPost',{
                    ownerId:ownerId,
                    postId:postId,
                    title:title,
                    addonTitle:addonTitle,
                    ownerName:ownerName,
                    mainImage:mainImage
                })
            }catch(e){}
        }
        mqttUpdatePostHook=function(ownerId,postId,title,addonTitle,ownerName,mainImage,ownerIcon){
            try{
                sendMqttMessage('updatePost',{
                    ownerId:ownerId,
                    postId:postId,
                    title:title,
                    addonTitle:addonTitle,
                    ownerName:ownerName,
                    mainImage:mainImage,
                    ownerIcon: ownerIcon || '',
                })
            }catch(e){}
        }
        mqttRemoveNewPostHook = function(ownerId,postId,createdAt) {
            try{
                sendMqttMessage('unPublishPost',{
                    ownerId: ownerId,
                    postId: postId,
                    createdAt: createdAt
                });
            }catch(e){}
        }
        mqttUserCreateHook=function(userId,fullname,username){
            try{
                sendMqttMessage('newUser',{
                    userId:userId,
                    fullname:fullname,
                    username:username
                })
            }catch(e){}
        }
        mqttUserUpdateHook=function(userId,fullname,username){
            try{
                sendMqttMessage('updateUser',{
                    userId:userId,
                    fullname:fullname,
                    username:username
                })
            }catch(e){}
        }
        mqttFollowerInsertHook = function(doc){
            try{
                sendMqttMessage('followUser',{
                    userId: doc.userId,
                    userName: doc.username,
                    userIcon: doc.userIcon,
                    userDesc: doc.userDesc,
                    followerId: doc.followerId,
                    followerName: doc.followerName,
                    followerIcon: doc.followerIcon,
                    followerDesc: doc.followerDesc,
                    createAt: doc.createAt
                })
            } catch(e){}
        }
        mqttFollowerRemoveHook = function(userId, followerId) {
            try{
                sendMqttMessage('unFollowUser',{
                    userId: userId,
                    followerId: followerId
                })
            } catch (e){}
        }
    }

    Meteor.startup(function(){
        initMQTT(null);
        Meteor.methods({
          Msg:function(topic,message){
            this.unblock();
            if(topic.indexOf('/msg/u/') >= 0 && message.to && message.to.id){
              var user = message.to.id;
              var userInfo = Meteor.users.findOne({_id:user},{fields:{'profile.browser':true}})
              if (userInfo && userInfo.profile && userInfo.profile.browser){
                console.log(message)
                WebUserMessages.insert(message);
                var userInfo = Meteor.users.findOne({_id:user});
                var waitReadMsgCount = userInfo.profile.waitReadMsgCount ? userInfo.profile.waitReadMsgCount : 0;
                if(waitReadMsgCount === undefined || isNaN(waitReadMsgCount))
                {
                    waitReadMsgCount = 0;
                }
                console.log('waitReadMsgCount--->'+waitReadMsgCount);
                Meteor.users.update({_id: user}, {$set: {'profile.waitReadMsgCount': waitReadMsgCount+1}});
              } else {
                sendMqttMessage(topic,message);
              }
            } else {
              sendMqttMessage(topic,message);
            }
            //sendMqttMessage(topic,message);
          },
          wMsgRead:function(id){
            // 暂时没做校验/检查
            var msg = WebUserMessages.findOne({_id:id});
            if (msg) {
                var user = msg.to.id;
                Meteor.users.update({_id: user}, {$set: {'profile.waitReadMsgCount': 0}});
                WebUserMessages.remove({_id:id});
            }
        }
        });
    })

    //get-user-web-browser-info
    Meteor.publish('uWebInfo', function(id){
      return Meteor.users.find({_id: id}, {fields: {'profile.browser': 1, 'token': 1}, limit:1});
    });
    Meteor.publish('wMsg', function(id){
      // 直接返回的话，如果有collection.remove，也会向client发ddp的remove
      // return WebUserMessages.find({'to.id': id}, {limit: 40, sort: {create_time: -1}})
      var self = this;
      var handle = WebUserMessages.find({'to.id': id}, {limit: 40, sort: {create_time: -1}}).observeChanges({
        added: function(id, fields){
          self.added("webUserMessages", id, fields);
        },
        changed: function(id, fields){
          self.changed("webUserMessages", id, fields);
        }
      });

      self.onStop(function(){
        handle && handle.stop();
        handle = null;
      });
      self.ready();
    });
}


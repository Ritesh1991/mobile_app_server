/**
 * Created by simba on 5/12/16.
 */
if(Meteor.isCordova){
    var myMqtt = Paho.MQTT;
    var undeliveredMessages = [];
    var unsendMessages = [];
    mqtt_connection = null;
    //mqtt_connected = false;
    var onMessageArrived = function(message) {
        console.log("onMessageArrived:"+message.payloadString);
        console.log('message.destinationName= '+message.destinationName);
        console.log('message= '+JSON.stringify(message));
        try {
            var topic = message.destinationName;
            console.log('on mqtt message topic: ' + topic + ', message: ' + message.payloadString);
            SimpleChat.onMqttMessage(topic, message.payloadString);
        } catch (ex) {
            console.log('exception onMqttMessage: ' + ex);
        }
    };
    initMQTT = function(clientId){
        if(!mqtt_connection){
            var pahoMqttOptions = {
                timeout: 30,
                keepAliveInterval: 30,
                cleanSession: false,
                onSuccess:onConnect,
                onFailure:onFailure,
                reconnect:true
            };
            //mqtt_connection=myMqtt.connect('ws://tmq.tiegushi.com:80',mqttOptions);
            mqtt_connection=new Paho.MQTT.Client('tmq.tiegushi.com', Number(80), clientId);
            mqtt_connection.onConnectionLost = onConnectionLost;
            mqtt_connection.onMessageArrived = onMessageArrived;
            mqtt_connection.onMessageDelivered = onMessageDelivered;
            mqtt_connection.connect(pahoMqttOptions);

            function clearUndeliveredMessages() {
                console.log('clearUndeliveredMessages: undeliveredMessages.length='+undeliveredMessages.length);
                while (undeliveredMessages.length > 0) {
                    console.log('undeliveredMessages.length='+undeliveredMessages.length);
                    var undeliveredMessage = undeliveredMessages.shift();
                    var topic = undeliveredMessage.topic;
                    var message = undeliveredMessage.message;
                    var onMessageDeliveredCallback = undeliveredMessage.onMessageDeliveredCallback;
                    addToUnsendMessaages(topic, message, onMessageDeliveredCallback, 10*1000);
                }
            };
            function onConnect() {
                // Once a connection has been made, make a subscription and send a message.
                console.log("mqtt onConnect");
                // get MQTT_TIME_DIFF
                var url = 'http://'+server_domain_name+'/restapi/date/';
                $.get(url,function(data){
                    if(data){
                        MQTT_TIME_DIFF = Number(data) - Date.now();
                        console.log('MQTT_TIME_DIFF===',MQTT_TIME_DIFF)
                    }
                });
                console.log('Connected to mqtt server');
                //mqtt_connection.subscribe('workai');
                subscribeMyChatGroups();
                subscribeMqttUser(Meteor.userId());
                sendMqttMessage('/presence/'+Meteor.userId(),{online:true})
                
                if (unsendMessages.length > 0) {
                    var unsendMsg;
                    var fifo = unsendMessages.reverse();
                    // Send all queued messages down socket connection
                    console.log('onConnect: Send all unsendMessages message: '+unsendMessages.length);
                    while ((unsendMsg = fifo.pop())) {
                        var topic = unsendMsg.topic;
                        var message = unsendMsg.message;
                        var callback = unsendMsg.callback;
                        var timeoutTimer = unsendMsg.timer;
                        clearTimeout(timeoutTimer);
                        timeoutTimer = null;
                        sendMqttMessage(topic, message, callback);
                        console.log('unsendMessages send message='+JSON.stringify(message));
                    }
                }
            };
            function onFailure(msg) {
                console.log('mqtt onFailure: errorCode='+msg.errorCode);
                clearUndeliveredMessages();
                // setTimeout(function(){
                //     console.log('MQTT onFailure, reconnecting...');
                //     mqtt_connection.connect(pahoMqttOptions);
                // }, 1000);
            };
            function onConnectionLost(responseObject) {
                //mqtt_connected = false;
                console.log('MQTT connection lost.')
                clearUndeliveredMessages();
                if (responseObject.errorCode !== 0) {
                    console.log("onConnectionLost: "+responseObject.errorMessage);
                }
                // setTimeout(function(){
                //     console.log('MQTT onConnectionLost, reconnecting...');
                //     mqtt_connection.connect(pahoMqttOptions);
                // }, 1000);
            };
            function onMessageDelivered(message) {
                console.log('MQTT onMessageDelivered: "' + message.payloadString + '" delivered');
                try {
                    var messageObj = JSON.parse(message.payloadString);
                    var msgId = messageObj.msgId;
                    for (var i=0; i<undeliveredMessages.length; i++) {
                        console.log(i+': '+JSON.stringify(undeliveredMessages[i]));
                    }
                    for (var i=0; i<undeliveredMessages.length; i++) {
                        var undeliveredMessage = undeliveredMessages[i];
                        if (undeliveredMessage && undeliveredMessage.message && (undeliveredMessage.message.msgId == msgId)) {
                            console.log('Found message in undeliveredMessages!');
                            if (undeliveredMessage.message) {
                                console.log('Shift undeliveredMessage: '+JSON.stringify(undeliveredMessage.message));
                            }
                            if (undeliveredMessage.onMessageDeliveredCallback) {
                                console.log('onMessageDelivered: Call calback');
                                undeliveredMessage.onMessageDeliveredCallback(null, message.payloadString);
                            }
                            undeliveredMessages.splice(i, 1);
                            break;
                        }
                    }
                } catch (error) {
                    console.log('JSON parse failed. Message should be a JSON string.');
                }
            }

            function addToUnsendMessaages(topic,message,callback, timeout) {
                var id;
                if (typeof Mongo != 'undefined') {
                    id = (new Mongo.ObjectID())._str;
                } else {
                    var dt = new Date();
                    var str = (dt.getTime()+dt.getMilliseconds()+Math.random()*1000).toString();
                    id = MD5(str);
                }
                var timeoutTimer = setTimeout(function() {
                    for (var i=0; i<unsendMessages.length; i++) {
                        if (unsendMessages[i].id == id) {
                            console.log('unsendMessages timeout: message='+JSON.stringify(unsendMessages[i].message));
                            callback && callback('failed', JSON.stringify(message));
                            unsendMessages.splice(i, 1);
                            return;
                        }
                    }
                }, timeout?timeout:15*1000);

                var unsendMsg = {
                    id: id,
                    topic: topic,
                    message: message,
                    callback: callback,
                    timer: timeoutTimer
                };
                unsendMessages.push(unsendMsg);
                console.log('unsendMessages push: message='+JSON.stringify(message)); 
            }
            function isJSON(message) {
                if(typeof(message) == "object" && 
                    Object.prototype.toString.call(message).toLowerCase() == "[object object]" && !message.length){
                    return true;
                } else {
                    return false;
                }
            }
            sendMqttMessage=function(topic,message,callback){
                var msgId;

                if (typeof Mongo != 'undefined') {
                    msgId = (new Mongo.ObjectID())._str;
                } else {
                    var dt = new Date();
                    var str = (dt.getTime()+dt.getMilliseconds()+Math.random()*1000).toString();
                    msgId = MD5(str);
                }
                if (isJSON(message)) {
                    var newMessage = {};
                    newMessage.msgId = msgId;
                    for (var key in message) { // Looping through all values of the old object 
                        newMessage[key] = message[key];
                    }
                    message = newMessage;
                }

                if (mqtt_connection.isConnected()) {
                    undeliveredMessages.push({
                        topic: topic,
                        message: message,
                        onMessageDeliveredCallback: callback
                    });
                    console.log('sendMqttMessage:', topic, JSON.stringify(message));
                    mqtt_connection.send(topic, JSON.stringify(message), 1);
                    return ;
                }

                addToUnsendMessaages(topic, message, callback);
            };
            subscribeMqttGroup=function(group_id) {
                if (mqtt_connection && group_id) {
                    console.log('sub group mqtt:' + group_id);
                    mqtt_connection.subscribe('/t/msg/g/'+group_id,{qos:1, onSuccess:onSuccess, onFailure:onFailure});
                    function onSuccess() {
                        console.log('mqtt subscribe group msg successfully.');
                    }
                    function onFailure() {
                        console.log('mqtt subscribe group msg failed.');
                    }
                }
            };
            unsubscribeMqttGroup=function(group_id) {
                if (mqtt_connection && group_id) {
                    mqtt_connection.unsubscribe("/t/msg/g/" + group_id);
                }
            };
            subscribeMqttUser=function(user_id){
                if (mqtt_connection && user_id) {
                    console.log('sub mqtt:' + user_id);
                    mqtt_connection.subscribe('/t/msg/u/'+user_id,{qos:1, onSuccess:onSuccess, onFailure:onFailure});
                    function onSuccess() {
                        console.log('mqtt subscribe user msg successfully.');
                    }
                    function onFailure() {
                        console.log('mqtt subscribe user msg failed.');
                    }
                }
            };
            unsubscribeMqttUser=function(user_id){
                if (mqtt_connection && user_id) {
                    mqtt_connection.unsubscribe("/t/msg/u/" + user_id);
                }
            };
            // sendMqttMessage=function(topic,message){
            //     Meteor.defer(function(){
            //         mqtt_connection.publish(topic,JSON.stringify(message),{qos:2})
            //     })
            // };
            sendMqttGroupMessage=function(group_id, message, callback) {
                // 记录在群组中的最后发言时间
                Meteor.call('update_latest_active_time', group_id, message.form.id);
                sendMqttMessage("/t/msg/g/" + group_id, message, callback);
            };

            function sendMsg(user_id,message,toBrowser,callback){
              if (toBrowser){
                Meteor.call('Msg',"/t/msg/u/" + user_id,message,function(err,result){
                  if(!err && result === true){
                    var msg = SimpleChat.Messages.findOne({_id:message._id})
                    if(msg && msg.send_status !== 'success'){
                      SimpleChat.Messages.update({_id:message._id},{$set:{send_status:'success'}})
                    }
                  } else {
                    var msg = SimpleChat.Messages.findOne({_id:message._id})
                    if(msg && msg.send_status !== 'success'){
                      SimpleChat.Messages.update({_id:message._id},{$set:{send_status:'failed'}})
                    }
                  }
                  //return callback && callback(err,result);
                });
              } else {
                sendMqttMessage("/t/msg/u/" + user_id, message, callback);
              }
            };
            sendMqttUserMessage=function(user_id, message, callback) {
                var toUser = userType.findOne({_id: user_id});
                if ((!toUser) || (typeof toUser.browser !== "boolean")){
                  //get-user-web-browser-info
                  Meteor.call('userType',user_id,function(err,isUserBrowser){
                    if(err){
                      return callback && callback(err,isUserBrowser)
                    }
                    try{
                      userType.upsert({_id:user_id},{browser:isUserBrowser})
                    } catch(e){
                      console.log('insert when saving userType');
                    }
                    sendMsg(user_id, message, isUserBrowser, callback);
                  })
                } else {
                    console.log(toUser.browser);
                    sendMsg(user_id, message, toUser.browser, callback);
                }
            };
        }
    }
    uninitMQTT = function() {
      try {
          if (mqtt_connection) {
              mqtt_connection.disconnect();
              //mqtt_connected = false;
              mqtt_connection = null;
          }
      } catch (error) {
        console.log(error)
      }
    }
    subscribeMyChatGroups = function() {
      Meteor.subscribe('get-my-group', Meteor.userId(), function() {
        // userGroups = SimpleChat.GroupUsers.find({user_id: Meteor.userId()});
        // userGroups.forEach(function(userGroup) {
        //   subscribeMqttGroup(userGroup.group_id);
        // });
      });

      SimpleChat.GroupUsers.find({user_id: Meteor.userId()}).observe({
         added: function(document) {
           subscribeMqttGroup(document.group_id);
         },
         changed: function(newDocument, oldDocument){
           if (oldDocument.group_id === newDocument.group_id)
             return; // 如果只修改了群名称之类的就不需要unsub\sub

           unsubscribeMqttGroup(oldDocument.group_id);
           subscribeMqttGroup(newDocument.group_id);
         },
         removed: function(document){
           unsubscribeMqttGroup(document.group_id);
         }
      });
    }
    getMqttClientID = function() {
      var client_id = window.localStorage.getItem('mqtt_client_id');
      if (!client_id) {
        client_id = 'WorkAIC_' + (new Mongo.ObjectID())._str;
        window.localStorage.setItem('mqtt_client_id', client_id);
      }
      console.log("##RDBG getMqttClientID: " + client_id);
      return client_id;
    };
    mqttEventResume = function() {
      console.log('##RDBG, mqttEventResume, reestablish mqtt connection');
      Meteor.setTimeout(function() {
        if(Meteor.userId()){
            initMQTT(getMqttClientID());
            //initMQTT(Meteor.userId());
        }
      }, 1000);
    };
    mqttEventPause = function() {
      console.log('##RDBG, mqttEventPause, disconnect mqtt');
      uninitMQTT();
    };
    Deps.autorun(function(){
        if(Meteor.user()){
            Meteor.setTimeout(function(){
                initMQTT(getMqttClientID());
                //initMQTT(Meteor.userId());
            },1000)
        } else {
            uninitMQTT()
        }
    });
  
    Deps.autorun(function(){
      if (Meteor.user() && Meteor.user().profile && Meteor.user().profile.associated){
          var associated_ids = _.pluck(Meteor.user().profile.associated || [], 'id') || [];
          if (associated_ids.length > 0){
            Meteor.setTimeout(function(){
              associated_ids.forEach(function(theid){
                console.log('=== 拉取关联的 web 用户的私信消息 ===');
                Meteor.subscribe('wMsg', theid);
              })
            }, 5000);
          }
      }
    });
  
    // 拉取关联的 web 用户的私信消息
    // 这个处理过于复杂，上面是简单一些的实现
    /*
    Deps.autorun(function(){
      if (Meteor.userId()){
        Meteor.setTimeout(function(){
          Meteor.subscribe('get-web-user-wait-messages', Meteor.userId());
          console.log('=== 拉取关联的 web 用户的私信消息 ===');
        }, 5000);
      }
    });
    */
    WebUserMessages.find({}, {create_time: -1}).observeChanges({
      added: function(id, fields){
        fields._id = id;
        // 模拟 mqtt 消息，以便按原流程处理
        onMessageArrived({
          destinationName: '/t/msg/' + (fields.to_type === 'user' ? 'u' : 'g') + '/' + fields.to.id,
          payloadString: JSON.stringify(fields)
        });
        Meteor.call('wMsgRead',id,fields.isFormMe);
      }
    });
} else if (Meteor.isClient){

    initMQTT = function(clientId){
    }

    sendMqttMessage=function(topic,message,callback){
        Meteor.call('Msg',topic,message,function(err,result){
            return callback && callback(err,result)
        })
    };
    sendMqttGroupMessage=function(group_id, message, callback) {
        // 记录在群组中的最后发言时间
        Meteor.call('update_latest_active_time', group_id, message.form.id);
        sendMqttMessage("/t/msg/g/" + group_id, message, callback);
    };
    sendMqttUserMessage=function(user_id, message, callback) {
        // console.log('sendMqttUserMessage:', message);
        sendMqttMessage("/t/msg/u/" + user_id, message, callback);
    };

    subscribeMqttGroup=function(group_id) {};
    unsubscribeMqttGroup=function(group_id) {};
    subscribeMqttUser=function(user_id){};
    unsubscribeMqttUser=function(user_id){};
    uninitMQTT = function() {}
    subscribeMyChatGroups = function() {}
    getMqttClientID = function() {
        var client_id = window.localStorage.getItem('mqtt_client_id');
        if (!client_id) {
            client_id = 'WorkAIC_' + (new Mongo.ObjectID())._str;
            window.localStorage.setItem('mqtt_client_id', client_id);
        }
        console.log("##RDBG getMqttClientID: " + client_id);
        return client_id;
    };
    mqttEventResume = function() {};
    mqttEventPause = function() {};
}

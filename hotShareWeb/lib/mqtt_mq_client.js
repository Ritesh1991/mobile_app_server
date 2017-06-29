/**
 * Created by simba on 5/12/16.
 */
if(Meteor.isClient){
    var myMqtt = Paho.MQTT;
    var undeliveredMessages = [];
    mqtt_connection = null;
    mqtt_connected = false;
    initMQTT = function(clientId){
        if(!mqtt_connection){
            var pahoMqttOptions = {
                timeout: 30*1000,
                cleanSession: false,
                onSuccess:onConnect,
                onFailure:onFailure
            };
            //mqtt_connection=myMqtt.connect('ws://tmq.tiegushi.com:80',mqttOptions);
            mqtt_connection=new Paho.MQTT.Client('tmq.tiegushi.com', Number(80), clientId);
            mqtt_connection.onConnectionLost = onConnectionLost;
            mqtt_connection.onMessageArrived = onMessageArrived;
            mqtt_connection.onMessageDelivered = onMessageDelivered;
            mqtt_connection.timeout = 30*1000;
            mqtt_connection.cleanSession = false;
            mqtt_connection.connect(pahoMqttOptions);
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
                if(!mqtt_connected){
                    mqtt_connected = true;
                    console.log('Connected to mqtt server');
                    //mqtt_connection.subscribe('workai');
                    subscribeMyChatGroups();
                    subscribeMqttUser(Meteor.userId());
                    sendMqttMessage('/presence/'+Meteor.userId(),{online:true})
                }
            };
            function onFailure(msg) {
                console.log('mqtt onFailure: errorCode='+msg.errorCode);
                setTimeout(function(){
                    console.log('MQTT onFailure, reconnecting...');
                    mqtt_connection.connect(pahoMqttOptions);
                }, 1000);
            };
            function onConnectionLost(responseObject) {
                mqtt_connected = false;
                console.log('MQTT connection lost.')
                if (responseObject.errorCode !== 0)
                    console.log("onConnectionLost: "+responseObject.errorMessage);
                setTimeout(function(){
                    console.log('MQTT onConnectionLost, reconnecting...');
                    mqtt_connection.connect(pahoMqttOptions);
                }, 1000);
            };
            function onMessageDelivered(message) {
                console.log('MQTT onMessageDelivered: "' + message.payloadString + '" delivered');
                var undeliveredMessage = undeliveredMessages.shift();
                if (undeliveredMessage.message) {
                    console.log('Shift undeliveredMessage: '+JSON.stringify(undeliveredMessage.message));
                }
                if (undeliveredMessage.onMessageDeliveredCallback) {
                    console.log('onMessageDelivered: Call calback');
                    undeliveredMessage.onMessageDeliveredCallback();
                }
            }
            function onMessageArrived(message) {
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
                //client.disconnect(); 
            };

            /*mqtt_connection.on('offline',function(){
                mqtt_connected = false;
                console.log('MQTT offline')
            })
            mqtt_connection.on('error',function(){
                mqtt_connected = false;
                console.log('MQTT error')
            })
            mqtt_connection.on('reconnect',function(){
                mqtt_connected = false;
                console.log('MQTT reconnecting')
            })
            mqtt_connection.on('connect',function(){
                // get MQTT_TIME_DIFF
                var url = 'http://'+server_domain_name+'/restapi/date/';
                $.get(url,function(data){
                    if(data){
                        MQTT_TIME_DIFF = Number(data) - Date.now();
                        console.log('MQTT_TIME_DIFF===',MQTT_TIME_DIFF)
                    }
                });
                if(!mqtt_connected){
                    mqtt_connected = true;
                    console.log('Connected to mqtt server');
                    //mqtt_connection.subscribe('workai');
                    subscribeMyChatGroups();
                    subscribeMqttUser(Meteor.userId());
                    sendMqttMessage('/presence/'+Meteor.userId(),{online:true})
                }
            });
            mqtt_connection.on('message', function(topic, message) {
              try {
                console.log('on mqtt message topic: ' + topic + ', message: ' + message.toString());
                SimpleChat.onMqttMessage(topic, message.toString());
              }
              catch (ex) {
                console.log('exception onMqttMessage: ' + ex);
              }
            });*/
            sendMqttMessage=function(topic,message,callback){
                console.log('sendMqttMessage:', topic, JSON.stringify(message));
                //mqtt_connection.publish(topic,JSON.stringify(message),{qos:1},callback)
                undeliveredMessages.push({
                    message: message,
                    onMessageDeliveredCallback: callback
                });
                mqtt_connection.send(topic, JSON.stringify(message), 1);
            };
            subscribeMqttGroup=function(group_id) {
                if (mqtt_connection) {
                    console.log('sub mqtt:' + group_id);
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
                if (mqtt_connection) {
                    mqtt_connection.unsubscribe("/t/msg/g/" + group_id);
                }
            };
            subscribeMqttUser=function(user_id){
                if (mqtt_connection) {
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
                if (mqtt_connection) {
                    mqtt_connection.unsubscribe("/t/msg/u/" + user_id);
                }
            };
            // sendMqttMessage=function(topic,message){
            //     Meteor.defer(function(){
            //         mqtt_connection.publish(topic,JSON.stringify(message),{qos:2})
            //     })
            // };
            sendMqttGroupMessage=function(group_id, message, callback) {
                sendMqttMessage("/t/msg/g/" + group_id, message, callback);
            };
            sendMqttUserMessage=function(user_id, message, callback) {
                // console.log('sendMqttUserMessage:', message);
                sendMqttMessage("/t/msg/u/" + user_id, message, callback);
            };
        }
    }
    uninitMQTT = function() {
      try {
          if (mqtt_connection) {
              mqtt_connection.disconnect();
              mqtt_connected = false;
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
        //   initMQTT(getMqttClientID());
            initMQTT(Meteor.userId());
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
                initMQTT(Meteor.userId());
            },1000)
        } else {
            uninitMQTT()
        }
    });
}

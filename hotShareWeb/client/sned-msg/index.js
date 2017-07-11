var view = null;

Template._sendMsg.open = function(to){
  view && Blaze.remove(view);
  view = Blaze.renderWithData(Template._sendMsg, to, document.body);
};

Template._sendMsg.close = function(){
  view && Blaze.remove(view);
  view = null;
};

Template._sendMsg.onRendered(function(){
  var clipboard = new Clipboard('.send-btn');
  var t = this;
  var snedSubmit = function(clipboard){
    var text = t.$('.input-box textarea').val();
    if (!text)
      return toastr.error('请输入要发送的内容~');

    var msg = {
      "_id" : new Mongo.ObjectID()._str,
      "form" : {
          "id" : Meteor.userId(),
          "name" : Meteor.user().profile && Meteor.user().profile.fullname ? Meteor.user().profile.fullname : Meteor.user().username,
          "icon" : Meteor.user().profile && Meteor.user().profile.icon ? Meteor.user().profile.icon : "/userPicture.png"
      },
      "to_type" : "user",
      "type" : "text",
      "text" : text,
      "create_time" : new Date(),
      "is_read" : false
    };
    msg.to = t.data;
    
    Meteor.call('Msg', '/t/msg/u/' + t.data.id, msg, function(err, res){
      if (err)
        return toastr.error('发送失败，请重试~');

      toastr.info('消息发送成功~');
      Template._sendMsg.close();

      if (withQRTips){
        onMsgBoxClient(clipboard || false, t.data.id, 'message', Session.get('postContent')._id);
        // var user = Meteor.user();
        // if (user && user.profile && user.profile.associated && user.profile.associated.length > 0)
        //   $('#bellPostDialog').fadeIn();
        // Session.set('qrtype', '联系人');
        // showQrTips(t.data.id,'message',Session.get('postContent')._id);
      }
    });
  };
  clipboard.on('success', function(e) {
    console.log('Action:', e.action);
    console.log('Text:', e.text);
    console.log('Trigger:', e.trigger);
    e.clearSelection();

    if (withQRTips){
      // TODO: 处理 copy 成功的流程
      // onMsgBoxClient(true);
      snedSubmit(true);
    }
  });

  clipboard.on('error', function(e) {
    console.log('Action:', e.action);
    console.log('Trigger:', e.trigger);
    // onMsgBoxClient(false);
    snedSubmit(false);
  });
});

Template._sendMsg.events({
  'click .leftButton': function(){
    Template._sendMsg.close();
  }
});

Template._sendMsg.helpers({
  msgBoxClipboard: function(to){
    return 'http://'+server_domain_name+'/restapi/webuser-qrcode?userId='+Meteor.userId()+'&touserId='+to+'&p=message&postId='+Session.get('postContent')._id;
  },
  openAppUrl: function(to){
    return  universal_link_host+'/web-rw-message?userId='+Meteor.userId()+'&touserId='+to+'&p=message&postId='+Session.get('postContent')._id;
  },
  isIOS_UniversalLink:function(){
    return isIOS && withEnableUniversalLink;
  }
});
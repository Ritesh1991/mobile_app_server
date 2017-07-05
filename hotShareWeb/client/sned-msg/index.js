var view = null;

Template._sendMsg.open = function(to){
  view && Blaze.remove(view);
  view = Blaze.renderWithData(Template._sendMsg, to, document.body);
};

Template._sendMsg.close = function(){
  view && Blaze.remove(view);
  view = null;
};

Template._sendMsg.events({
  'click .leftButton': function(){
    Template._sendMsg.close();
  },
  'click .send-btn': function(e, t){
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
        var user = Meteor.user();
        if (user && user.profile && user.profile.associated && user.profile.associated.length > 0)
          $('#bellPostDialog').fadeIn();
        Session.set('qrtype', '联系人');
        showQrTips('','post',Session.get('postContent')._id);
      }
    });
  }
});
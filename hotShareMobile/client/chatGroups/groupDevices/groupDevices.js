Template.groupDevices.onRendered(function () {
  var group_id = Router.current().params._id;
  Meteor.subscribe('device_by_groupId', group_id);
});

Template.groupDevices.helpers({
  lists: function() {
    var group_id = Router.current().params._id;
    return Devices.find({groupId: group_id}).fetch();
  }
});


Template.groupDevices.events({
  'click label':function(e){
    var self = this;
    var td = $(e.currentTarget);
    var text = $(e.currentTarget).text();
    var input = $('<input type="text" class="edit" value="'+text+'">');
    $(e.currentTarget).html(input);
    $('input').click(function(){
      return false;
    }); //阻止表单默认点击行为
    var len = text.length;
    // $('input').setSelectionRange(len,len);
    $('input').select();
    $('input').blur(function(event){
      var nextxt=$(event.currentTarget).val();
      if(nextxt == ''||nextxt == self.name){
        nextxt = self.name;
      }else{
        Meteor.call('change_device_name',self._id,self.uuid,self.groupId,nextxt,function(err){
          if(err){
            console.log(err);
            PUB.toast('修改失败，请重试');
            td.html(self.name);
          }
        }) 
      }
      td.html(nextxt);
    }); //表单失去焦点文本框变成文本
  },
  'click .delBtnContent':function(e){
    var uuid = $(e.currentTarget).data('uuid');
    var id = e.currentTarget.id;
    var group_id = Router.current().params._id;
    //删除设备
    Meteor.call('delete_device',id,uuid,group_id,function(err){
      if(err){
        console.log(err);
        return;
      }
      PUB.toast('删除成功');
    })
  },
  'click .back': function(){
    return PUB.back();
  },
  'click .goTimelime': function(e){
    var group_id = Router.current().params._id;
    Session.set("channel",'groupDevices/'+group_id);
    return PUB.page('/timelineAlbum/'+e.currentTarget.id+'?from=timeline');
  },
  'click .goEdit':function(){
    var self = this;
    if(!self.name){
      self.name = '未知设备';
    }
    Session.set('curDevice',self);
    var group_id = Router.current().params._id;
    Session.set("channel",'groupDevices/'+group_id);
    return PUB.page('/setDevicename');
  }
});
Template.setDevicename.events({
  'click .left-btn':function(){
    PUB.back();
  },
  'click .right-btn':function(){
    $('.setGroupname-form').submit();
  },
  'submit .setGroupname-form':function(e){
    e.preventDefault();
    var newName = e.target.text.value;
    if(newName == ''){
      PUB.toast('请输入设备名');
      return;
    }
    if(newName == this.name){
      PUB.toast('设备名没有修改');
      return;
    }
    Meteor.call('change_device_name',this._id,this.uuid,this.groupId,newName,function(err){
      if(err){
        console.log(err);
        PUB.toast('修改失败，请重试');
      }else{
        return PUB.back();
      }
    }) 
  }
})
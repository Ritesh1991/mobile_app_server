Template.joinWechatGroup.onRendered(function () {
  var image = document.getElementById('group_qrcode');
  var now = new Date();
  var qrCodeUrl = 'http://data.tiegushi.com/group_qrcode/customer_service_group.jpg?t=' + now.getTime();
  image.src = qrCodeUrl;
});

Template.joinWechatGroup.events({
  'click .close':function(){
    Router.go('/appBindWebTipPage');
  }
});
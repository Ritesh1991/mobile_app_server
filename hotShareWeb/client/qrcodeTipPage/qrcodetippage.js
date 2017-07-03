if(Meteor.isClient){
  window.showQrTips = function(touserId,dashboard,postId){
    var data = {
      touserId: touserId,
      dashboard:dashboard,
      postId:postId
    }
    Session.set('QrTipData',data);
    Router.go('/qrcodeTipPage');
    //Router.go('/qrcodeTipPage?touserId='+touserId+'&dashboard='+dashboard+'&postId='+postId);
    // if($('.wr-page')){
    //   $('.wr-page').remove();
    // }
    // return Blaze.renderWithData(Template.qrcodeTipPage, {
    //   touserId: touserId,
    //   dashboard:dashboard,
    //   postId:postId
    // },document.body);
  };
  //已成功用App接受消息后删除本地消息
  var removeLocalMessage = function (){
    if(withQRTips){
        user = Meteor.user();
        if(user && user.profile && user.profile.associated && user.profile.associated.length > 0){
          Meteor.subscribe('webwaitreadmsg',Meteor.userId(),function(){
            waitReadMsg = WebWaitReadMsg.findOne({_id: Meteor.userId()});
            if(waitReadMsg && waitReadMsg.messages && waitReadMsg.messages.length > 0){
              return
            }
            SimpleChat.Messages.remove({is_read:false,'to.id': Meteor.userId()},function(err,num){
              if(err){
                 console.log(err);
              }
            });
          });
        }
      }
  };
  Tracker.autorun(function(){
    if(Meteor.userId())
      removeLocalMessage();
  });
  // 从 canvas 提取图片 image  
  var convertCanvasToImage = function(canvas) {  
    var image = document.getElementById('qrcodeImg');
    return image.src = canvas.toDataURL("image/png");
  };

  var drawQr2Canvas = function(canvas,touserId,dashboard,postId) {
    var ctx = canvas.getContext("2d");
    // var cH = document.body.clientHeight;
    var cW = document.body.clientWidth;
    cW = 2*cW;
    var cH = cW * 1.2;
    $('.qr-foot').css('height',(document.body.clientHeight-(cH/2))+'px');
    qrCodeUrl = 'http://'+server_domain_name+'/restapi/webuser-qrcode?userId='+Meteor.userId()+'&touserId='+touserId+'&p='+dashboard+'&postId='+postId;
    // qrCodeUrl = '/restapi/webuser-qrcode?userId='+Meteor.userId()+'&touserId='+touserId+'&p='+dashboard+'&postId='+postId;

    canvas.height = cH;
    canvas.width = cW;

    ctx.rect(0,0,cW,cH);
    ctx.fillStyle="white";
    ctx.fill();

    ctx.textAlign="center";
    ctx.fillStyle = "black";
    ctx.font = "48px Arial";
    ctx.fillText('请在故事贴中扫描二维码',parseInt(cW*0.5),60);
    
    var qrTip2 = document.getElementById('qrTip2');
    if(qrTip2.complete){
      ctx.drawImage(qrTip2,parseInt(cW*0.15),parseInt(cW*0.6)+130,parseInt(cW*0.7),parseInt(cW*0.25));
      convertCanvasToImage(canvas);
    } else {
      qrTip2.onload =function(){ 
        ctx.drawImage(qrTip2,parseInt(cW*0.15),parseInt(cW*0.6)+130,parseInt(cW*0.7),parseInt(cW*0.25));
        convertCanvasToImage(canvas);
      }
    }
    var qrImage = new Image();
    qrImage.src = qrCodeUrl;
    if(qrImage.complete){
      ctx.drawImage(qrImage,parseInt(cW*0.2),90,parseInt(cW*0.6),parseInt(cW*0.6));
      convertCanvasToImage(canvas);
    } else {
      qrImage.onload =function(){
        ctx.drawImage(qrImage,parseInt(cW*0.2),90,parseInt(cW*0.6),parseInt(cW*0.6));
        convertCanvasToImage(canvas);
      }
    }
  };

}

Template.qrcodeTipPage.onRendered(function () {
  //window.qrCodeUrl = null;
  //var canvas = document.getElementById('qrCanvas');
  //var data = this.data;
  var data = Session.get('QrTipData');
  //drawQr2Canvas(canvas,data.touserId,data.dashboard,data.postId);
  var image = document.getElementById('qrcodeImg');
  var qrCodeUrl = 'http://'+server_domain_name+'/restapi/webuser-qrcode?userId='+Meteor.userId()+'&touserId='+data.touserId+'&p='+data.dashboard+'&postId='+data.postId;
  image.src = qrCodeUrl;
  // 消息转存
  var msgs = SimpleChat.Messages.find({is_read:false, 'to.id': Meteor.userId()}).fetch();
  Meteor.subscribe('webwaitreadmsg',Meteor.userId(),function(){
    var waitReadMsg = WebWaitReadMsg.findOne({_id: Meteor.userId()});
    if(waitReadMsg){
      msgs = waitReadMsg.messages.concat(msgs);
      WebWaitReadMsg.update({_id: Meteor.userId()},{$set:{qrcode: qrCodeUrl,messages:msgs}},function(err,num){
        if(err){
          console.log(err)
        }
      });
    } else {
      WebWaitReadMsg.insert({_id: Meteor.userId(),qrcode: qrCodeUrl,messages:msgs},function(err,_id){
        if(err){
          console.log(err)
        }
      });
    }
  });

  // 移除未读消息
  // SimpleChat.Messages.remove({is_read:false,'to.id': Meteor.userId()},function(err,num){
  //   if(err){
  //     console.log(err)
  //   }
  // });
});
Template.qrcodeTipPage.helpers({
  qrtype: function(){
    if(Session.get('qrtype')){
      return Session.get('qrtype');
    }else{
      return '消息'
    }
  }
});
Template.qrcodeTipPage.events({
  'click .close':function(){
    // $('.qr-page').remove();
    // qrCodeUrl = null;
    var data = Session.get('QrTipData');
    if (data) {
      Router.go('/posts/'+data.postId);
    }
  },
  'click .nextStep':function(){
    // $('.qr-page').remove();
    // qrCodeUrl = null;
    trackEvent('SavedQrcode','long press saved qrcode');
    Router.go('/downLoadTipPage');
  },
  'click #qrDownloadAPP':function(){
    if(isIOS){
      trackEvent('Download','from Post Tail, IOS')
    }else if(isAndroidFunc()){
      trackEvent('Download','from Post Tail, Android')
    }else {
      trackEvent('Download','from Post Tail, Outside Wechat')
    }
    return window.open('http://a.app.qq.com/o/simple.jsp?pkgname=org.hotshare.everywhere', '_system');
  }
});

Template.qrcodeTipPage.onDestroyed(function () {
  //qrCodeUrl = null;
});
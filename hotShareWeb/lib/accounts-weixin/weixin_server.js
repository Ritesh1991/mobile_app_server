if (Meteor.isServer) {
  var WECHAT_APPID = 'wx637c7894a6f687b8';     // 移动应用的 APPID
  var WECHAT_AppSecret = 'bf0f7fbc8688a52ac3d958062e22b31b';
  var WEB_WECHAT_APPID = 'wx637c7894a6f687b8'; // 网站应用的 APPID
  var WEB_WECHAT_AppSecret = 'bf0f7fbc8688a52ac3d958062e22b31b';
  var Oauth2Result = new Meteor.Collection('oauth2Result');
  
  Router.route('/oauth2/wechat', function () {
    var query = this.params.query;
    var response = this.response;
    
    var redirectResult = function(result){
      var id = (new Mongo.ObjectID())._str;
      if(result)
        Oauth2Result.insert({_id: id, result: result, type: 'wechat'});
        
      response.end('<head><meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, minimal-ui" /><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><style type="text/css">body{margin: 0}\r\n.head{width:100%; height:40px;font-size:16px; line-height:40px; position:fixed; left:0; top:0; border:none; text-align:center; background: #01CEED; z-index: 999;opacity: 0.99;}\r\n.head strong{font-size: 16px; color: #fff}\r\n.pay-return{width: 100%; text-align: center; padding-top: 100px;color: #706B66;}\r\n\r\n.pay-return span{display: block;margin-bottom: 10px;}</style></head><body><div class="pay changePage"><div class="head"><strong>Please wait...</strong></div></div><div style="display:none;"><form id ="oauth2_submit" name="oauth2_submit" method="GET" action="/oauth2/wechat/result"><input name="id" type="text" value="'+id+'" /></form></div><script>document.forms["oauth2_submit"].submit();</script></body>');
      //response.writeHead(302, {'Location': '/oauth2/wechat/result?id=' + id});
      //response.end();
    }
    
    if(!query['code'] || query['code'] === ''){
      return redirectResult();
    }else{
      try{
        var url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid="+WEB_WECHAT_APPID+"&secret="+WEB_WECHAT_AppSecret+"&code=" + query['code'] + "&grant_type=authorization_code";
        HTTP.call('GET', url, function(error, result){
          if(error){
            return redirectResult();
          }
          
          console.log(result.content);
          var tokenInfo = JSON.parse(result.content);
          if(!tokenInfo.access_token || !tokenInfo.openid){
            return redirectResult();
          }
          
          url = "https://api.weixin.qq.com/sns/userinfo?access_token=" + tokenInfo.access_token + "&openid=" + tokenInfo.openid;
          HTTP.call('GET', url, function(error1, result1){
            if(error1){
              return redirectResult();
            }
              
            console.log(result1.content);
            return redirectResult(JSON.parse(result1.content));
          });
        });
      }catch (e){
        return redirectResult();
      }
    }
  }, {where: 'server'});
  
  Router.route('/oauth2/wechat/result', function () {
    var query = this.params.query;
    var response = this.response;
    var result = '';
    if(query['id'] && query['id'] != ''){
      var oauth2Result = Oauth2Result.findOne({_id: query['id']});
      if(oauth2Result && oauth2Result.result){
        result = JSON.stringify(oauth2Result.result);
        Oauth2Result.remove({_id: query['id']});
      }
    }
    
    response.end('<head><meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, minimal-ui" /><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><style type="text/css">body{margin: 0}\r\n.head{width:100%; height:40px;font-size:16px; line-height:40px; position:fixed; left:0; top:0; border:none; text-align:center; background: #01CEED; z-index: 999;opacity: 0.99;}\r\n.head strong{font-size: 16px; color: #fff}\r\n.pay-return{width: 100%; text-align: center; padding-top: 100px;color: #706B66;}\r\n\r\n.pay-return span{display: block;margin-bottom: 10px;}</style></head><body><div class="pay changePage"><div class="head"><strong>Please wait...</strong></div></div><div id="oauth2_result" style="display:none;">'+result+'</div></body>');
  }, {where: 'server'});
  
  Meteor.methods({
     getUserinfo: function(code) {
       this.unblock();
       return Meteor.wrapAsync(function(callback) {
         var url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid="+WECHAT_APPID+"&secret="+WECHAT_AppSecret+"&code=" + code + "&grant_type=authorization_code";
         HTTP.call('GET', url, function(error, result){
           if(error)
             return callback && callback(error, null);
           
           console.log(result.content);
           var tokenInfo = JSON.parse(result.content);
           url = "https://api.weixin.qq.com/sns/userinfo?access_token=" + tokenInfo.access_token + "&openid=" + tokenInfo.openid;
           HTTP.call('GET', url, function(error1, result1){
             if(error1)
               return callback && callback(error1, null);
               
             console.log(result1.content);
             callback && callback(null, JSON.parse(result1.content));
           });
         });
       })()
     }
  });

  Accounts.registerLoginHandler('weixin', function(options) {
    if (!options.weixin || !options.weixin.openid) {
      return void 0;
    }
    options.weixin.id = options.weixin.openid;
    return Accounts.updateOrCreateUserFromExternalService('weixin', options.weixin, {
      username: options.weixin.nickname,
      createdAt: new Date(),
      profile: {
        fullname: options.weixin.nickname,
        icon: options.weixin.headimgurl,
        sex: options.weixin.sex === 1 ? 'male' : options.weixin.sex === 2 ? 'female' : void 0,
        location: options.weixin.city
      }
    });
  });
}
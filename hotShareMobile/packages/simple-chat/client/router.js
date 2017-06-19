var list_limit_val = 20;
var is_loading = new ReactiveVar(false);
var list_limit = new ReactiveVar(list_limit_val);
var page_title = new ReactiveVar('聊天室');
var list_data = new ReactiveVar([]);
var message_list = new ReactiveVar([]);
var page_data = null;

Router.route(AppConfig.path + '/to/:type', {
  layoutTemplate: '_simpleChatToChatLayout',
  template: '_simpleChatToChat',
  data: function () {
    var slef = this;
    var to = slef.params.query['id'];
    var type = slef.params.type
    var where = null;
    var name = slef.params.query['name'] ? decodeURIComponent(slef.params.query['name']) : '';
    var icon = slef.params.query['icon'] ? decodeURIComponent(slef.params.query['icon']) : '';

    if(type === 'group')
      where = {'to.id': to, to_type: type}; // 没有判断是否在群的处理。自动加群
    else
      where = {
        $or: [
          {'form.id': Meteor.userId(), 'to.id': to, to_type: type}, // me -> ta
          {'form.id': to, 'to.id': Meteor.userId(), to_type: type}  // ta -> me
        ]
      };

    console.log('where:', where);
    return {
      id: slef.params.query['id'],
      name: name,
      icon: icon,
      title: function(){
        return page_title.get();
      },
      is_group: function(){
        return slef.params.type === 'group';
      },
      query: Messages.find(where, {sort: {create_time: -1}}),
      type: slef.params.type,
      where: where,
      messages: function(){
        return Messages.find(where, {limit: list_limit.get(), sort: {create_time: -1}}).fetch().reverse();
        // return message_list.get();
      },
      loading: is_loading.get()
    };
  }
});

Router.route(AppConfig.path + '/group-list',{
  layoutTemplate: '_simpleChatListLayout',
  template: '_groupMessageList',
  data: function () {
    var lists = []
    return {
      title: '群聊',
      isGroups: true,
      lists: lists
    };
  }
});
Router.route(AppConfig.path + '/user-list/:_user',{
  layoutTemplate: '_simpleChatListLayout',
  template: '_groupMessageList',
  data: function () {
    var userId = this.params._user;
    var lists = MsgSession.find({userId: userId,sessionType:'user'},{sort: {sessionType: 1, updateAt: -1}});
    Session.set('channel','bell');
    return {
      title: '消息',
      isGroups: false,
      lists: lists
    };
  }
});

Template._simpleChatToChatLayout.onRendered(function(){
  page_data = this.data;
  if(Meteor.isCordova && device && device.platform === 'iOS'){
    try{
      Keyboard.shrinkView(true);
      Keyboard.disableScrollingInShrinkView(true);
    } catch (err){
      console.log(err)
    }
  }
});
Template._simpleChatToChatLayout.onDestroyed(function(){
  page_data = null;
  if(Meteor.isCordova && device && device.platform === 'iOS'){
    try{
      Keyboard.shrinkView(false);
      Keyboard.disableScrollingInShrinkView(false);
    } catch (err){
      console.log(err)
    }
  }
});

var time_list = [];
var init_page = false;
var fix_data_timeInterval = null;
var fix_data = function(){
  var data = page_data.messages();// message_list.get(); //Blaze.getData($('.simple-chat')[0]).messages.fetch();
  data.sort(function(a, b){
    return a.create_time - b.create_time;
  });
  if(data.length > 0){
    for(var i=0;i<data.length;i++){
      data[i].show_time_str = get_diff_time(data[i].create_time);
      if(i===0)
        data[i].show_time = true;
      else if(data[i].show_time_str != data[i-1].show_time_str)
        data[i].show_time = true;
      else
        data[i].show_time = false;
    }
  }
  list_data.set(data);
};
var get_people_names = function(){
  var names = People.find({}, {sort: {updateTime: -1}, limit: 50}).fetch();
  var result = [];
  if(names.length > 0){
    for(var i=0;i<names.length;i++){
      if(result.indexOf(names[i].name) === -1)
        result.push(names[i].name);
    }
  }

  return result;
};

var onFixName = function(id, uuid, his_id, url, to, value, type){
  var user = Meteor.user();
  var images = [];

  if (url && Object.prototype.toString.call(url) === '[object Array]'){
    for(var i=0;i<url.length;i++)
      images.push({
        _id: new Mongo.ObjectID()._str,
        people_his_id: his_id,
        url: url[i].url
      });
  }

  var msg = {
    _id: new Mongo.ObjectID()._str,
    form: {
      id: user._id,
      name: user.profile && user.profile.fullname ? user.profile.fullname : user.username,
      icon: user.profile && user.profile.icon ? user.profile.icon : '/userPicture.png'
    },
    to: to,
    images: images,
    to_type: "group",
    type: "text",
    create_time: new Date(Date.now() + MQTT_TIME_DIFF),
    people_id: id,
    people_uuid: uuid,
    people_his_id: his_id,
    is_read: false
  };

  switch(type){
    case 'label':
      msg.text = '此照片是"' + value + '" ~';
      Messages.insert(msg);
      sendMqttGroupMessage(msg.to.id, msg);
      // sendMqttMessage('workai', msg);
      // sendMqttMessage('trainset', {url: url, person_id: '', device_id: uuid, face_id: id});
      break;
    case 'check':
      msg.text = '此照片是"' + value + '" ~';
      Messages.insert(msg);
      sendMqttGroupMessage(msg.to.id, msg);
      // sendMqttMessage('workai', msg);
      // sendMqttMessage('trainset', {url: url, person_id: '', device_id: uuid, face_id: id});
      break;
    case 'remove':
      msg.text = '删除照片: ' + value;
      Messages.insert(msg);
      sendMqttGroupMessage(msg.to.id, msg);
      // sendMqttMessage('workai', msg);
      if (url && Object.prototype.toString.call(url) === '[object Array]'){
        url.forEach(function(img){
          sendMqttMessage('trainset', {url: img.url, person_id: '', device_id: uuid, face_id: id, drop: true});
        });
      }else{
        sendMqttMessage('trainset', {url: url, person_id: '', device_id: uuid, face_id: id, drop: true});
      }
      break;
  };
  Meteor.setTimeout(function() {
    $('.simple-chat-label').remove();
    $('#swipebox-overlay').remove();
  }, 500);
};

var showBoxView = null;
var showBox = function(title, btns, list, tips, callback){
  if(showBoxView)
    Blaze.remove(showBoxView);
  showBoxView = Blaze.renderWithData(Template._simpleChatToChatLabelBox, {
    title: title,
    btns: btns || ['知道了'],
    list: list,
    tips: tips,
    callback: callback || function(){},
    remove: function(){Blaze.remove(showBoxView);}
  }, document.body);
};
Template._simpleChatToChatLabelBox.events({
  'click .mask': function(e, t){
    t.data.remove();
  },
  'click .my-btn': function(e, t){
    var index = 0;
    var btns = t.$('.my-btn');
    var value = t.$('select').val() || t.$('input').val();

    for(var i=0;i<btns.length;i++){
      if(btns[i].innerHTML === $(e.currentTarget).html()){
        index = i;
        break;
      }
    }
    console.log('selected:', index, value);
    t.data.remove();
    t.data.callback(index, value);
  },
  'change select': function(e, t){
    var $input = t.$('input');
    var $select = t.$('select');

    if($(e.currentTarget).val() === ''){
      $select.hide();
      $input.show();
    }else{
      $input.hide();
      $select.show();
    }
  }
});

Template._simpleChatToChat.onDestroyed(function(){
  if(fix_data_timeInterval){
    Meteor.clearInterval(fix_data_timeInterval);
    fix_data_timeInterval = null;
  }
});

var setMsgList = function(where, action){
  if(action === 'insert' || action === 'remove'){Meteor.setTimeout(function(){$('.box').scrollTop($('.box ul').height());}, 200);}
};

var toUsers = {};
if (localStorage.getItem('_simple_chat_to_users'))
  toUsers = JSON.parse(localStorage.getItem('_simple_chat_to_users'));
var setToUsers = function(){
  if (page_data.type != 'user'){
    toUsers[page_data.type+'.'+page_data.id] ={
      name: page_data.name || '聊天室',
      icon: page_data.icon || '/userPicture.png'
    };
  } else {
    var user = Meteor.users.findOne({_id: page_data.id});
    if (user)
      toUsers[page_data.type+'.'+page_data.id] = {
        name: user.profile && user.profile.fullname ? user.profile.fullname : user.username,
        icon: user.profile && user.profile.icon ? user.profile && user.profile.icon : '/userPicture.png'
      };
    else if (page_data.name)
      toUsers[page_data.type+'.'+page_data.id] = {
        name: page_data.name,
        icon: page_data.icon || '/userPicture.png'
      };
  }
  localStorage.setItem('_simple_chat_to_users', JSON.stringify(toUsers));
};

Template._simpleChatToChat.onRendered(function(){
  is_loading.set(true);
  list_limit.set(list_limit_val);
  time_list = [];
  init_page = false;
  list_data.set([]);
  message_list.set([]);
  var slef = this;

  if (!Messages.onBefore){
    Messages.after.insert(function (userId, doc) {
      if (!page_data)
        return;
      if (doc.to_type === page_data.type && doc.to.id === page_data.id){
        console.log('message insert');
        setMsgList(page_data.where, 'insert');
      }
    });
    Messages.after.update(function (userId, doc, fieldNames, modifier, options) {
      if (!page_data)
        return;
      if (doc.to_type === page_data.type && doc.to.id === page_data.id){
        console.log('message update');
        setMsgList(page_data.where, 'update');
      }
    });
    Messages.after.remove(function (userId, doc){
      console.log('message remove');
      if (!page_data)
        return;
      if (doc.to_type === page_data.type && doc.to.id === page_data.id){
        console.log('message update');
        setMsgList(page_data.where, 'remove');
      }
    });
    Messages.onBefore = true;
  }

  if(fix_data_timeInterval){
    Meteor.clearInterval(fix_data_timeInterval);
    fix_data_timeInterval = null;
  }
  fix_data_timeInterval = Meteor.setInterval(fix_data, 1000*60);
  Meteor.subscribe('people_new', function(){});

  Meteor.subscribe('get-messages', slef.data.type, slef.data.id, function(){
    if(slef.data.type != 'user'){
      // page_title.set(Groups.findOne({_id: slef.data.id}) ? Groups.findOne({_id: slef.data.id}).name : '聊天室');
      page_title.set(AppConfig.get_post_title());
    }else{
      var user = Meteor.users.findOne({_id: slef.data.id});
      page_title.set(AppConfig.get_user_name(user));
    }
    setToUsers();

    init_page = true;
    $('.box').scrollTop($('.box ul').height());
    is_loading.set(false);
  });

  $('.box').scroll(function () {
    if($('.box').scrollTop() === 0 && !is_loading.get()){
      // if(slef.data.messages.count() >= list_limit.get())
      is_loading.set(true);
      list_limit.set(list_limit.get()+list_limit_val);
      Meteor.setTimeout(function(){is_loading.set(false);}, 500);
    }
  });
});

Template._simpleChatToChatItem.events({
  'click li img.swipebox': function(e){
    var imgs = []
    var index = 0;
    var selected = 0;
    var data = Blaze.getData($(e.currentTarget).attr('data-type') === 'images' ? $(e.currentTarget).parent().parent().parent()[0] : $('#'+this._id)[0]);

    console.log('data:', data);
    // $('li#' + data._id + ' img.swipebox').each(function(){
    //   imgs.push({
    //     href: $(this).attr('src'),
    //     title: ''
    //   });
    //   if($(e.currentTarget).attr('src') === $(this).attr('src'))
    //     selected = index;
    //   index += 1;
    // });
    if(data.images.length > 0){
      for(var i=0;i<data.images.length;i++){
        imgs.push({
          href: data.images[i].url,
          title: ''
        });
        if(data.images[i].url === $(e.currentTarget).attr('src'))
          selected = i;
      }
    }
    if(imgs.length > 0){
      console.log('imgs:', imgs);
      var labelView = null;

      $.swipebox(imgs, {
        initialIndexOnArray: selected,
        hideCloseButtonOnMobile : true,
        loopAtEnd: false,
        // beforeOpen: function(){
        //   if (data.people_id)
        //     labelView = Blaze.renderWithData(Template._simpleChatToChatLabel, data, document.body);
        // },
        // afterClose: function(){
        //   if (data.people_id)
        //     Blaze.remove(labelView);
        // },
        // indexChanged: function(index){
        //   var data = Blaze.getData($('.simple-chat-label')[0]);
        //   var $img = $('#swipebox-overlay .slide.current img');

        //   console.log($img.attr('src'));
        //   console.log(_.pluck(data.images, 'url'));
        //   Session.set('SimpleChatToChatLabelImage', data.images[index]);
        // }
      });
    }
  },
  'click li div.showmore':function(e){
    console.log(e.currentTarget.id);
    id = e.currentTarget.id;
    $('li#' + id + ' div.showmore').hide();
    $('li#' + id + ' div.text .imgs').removeAttr('style');
    $('li#' + id + ' div.text .imgs-1-box').removeAttr('style');
  },
  'click li div.schat_post_abstract':function(e){
    console.log(e.currentTarget.id);
    var postId = e.currentTarget.id;

    // console.log("e val is: ", JSON.stringify(e.currentTarget.innerText));
    // text = JSON.stringify(e.currentTarget.innerText);
    // firstSubstring = "第";
    // secSubsrting = "段的评论";
    // subtext = text.match(new RegExp(firstSubstring + "(.*)" + secSubsrting));
    // console.log("sub text is: ", subtext[1]);
    // paraIndex = subtext[1];
    var history = Session.get('history_view') || [];
    var paraIndex = $(e.currentTarget).data('pindex');
    var owner = $(e.currentTarget).data('owner');
    var ownerName = $(e.currentTarget).data('ownername');
    history.push({
      view: 'simple-chat/to/user?id='+owner,
      scrollTop: document.body.scrollTop
    });

    Session.set("history_view", history);

    if (paraIndex){
      Session.set("pcurrentIndex", paraIndex);
      Session.set("pcommetsId", owner);
      Session.set("pcommentsName", ownerName);
      Session.set("toasted", false);
      console.log('ispcomment---'+paraIndex+'---'+owner+'---'+ownerName+'---'+$(e.currentTarget).data('ispcomment'))
      if ($(e.currentTarget).data('ispcomment')) {
        Session.set("isPcommetReply", true);
      } else {
        Session.set("isPcommetReply", false);
      }
    }
    Router.go('/posts/' + postId);
  },
  'click .check': function(){
    Template._simpleChatLabelDevice.open(this);
    // var data = this;
    // var names = get_people_names();

    // show_label(function(name){
    //   Meteor.call('get-id-by-name', data.people_uuid, name, function(err, res){
    //     if(err)
    //       return PUB.toast('标记失败，请重试~');

    //     console.log(res);
    //     PeopleHis.update({_id: data.people_his_id}, {
    //       $set: {fix_name: name, msg_to: data.to},
    //       $push: {fix_names: {
    //         _id: new Mongo.ObjectID()._str,
    //         name: name,
    //         userId: Meteor.userId(),
    //         userName: Meteor.user().profile && Meteor.user().profile.fullname ? Meteor.user().profile.fullname : Meteor.user().username,
    //         userIcon: Meteor.user().profile && Meteor.user().profile.icon ? Meteor.user().profile.icon : '/userPicture.png',
    //         fixTime: new Date()
    //       }}
    //     }, function(err, num){
    //       if(err || num <= 0){
    //         return PUB.toast('标记失败，请重试~');
    //       }

    //       data.images.forEach(function(img) {
    //         Messages.update({_id: data.msg_id, 'images.url': img.url}, {
    //           $set: {
    //             'images.$.label': name,
    //             'images.$.result': ''
    //           }
    //         });
    //         sendMqttMessage('trainset', {url: img.url, person_id: res.id ? res.id : '', device_id: data.people_uuid, face_id: res ? res.faceId : data.people_id, drop: false});
    //       });
          
    //       onFixName(data.people_id, data.people_uuid, data.people_his_id, data.images, data.to, name, 'label');
    //       PUB.toast('标记成功~');
    //     });
    //   });
    // });
  },
  'click .crop':function(){
    Template._simpleChatLabelCrop.open(this);
  },
  'click .remove': function(){
    Template._simpleChatLabelRemove.open(this);
  },
  'click .yes': function(){
    // update label
    var setNames = [];
    for (var i=0;i<this.images.length;i++){
      if (this.images[i].label) {
        var trainsetObj = {group_id: this.to.id, type: 'trainset', url: this.images[i].url, person_id: '', device_id: this.people_uuid, face_id: this.images[i].id, drop: false};
        console.log("##RDBG trainsetObj: " + JSON.stringify(trainsetObj));
        sendMqttMessage('/device/'+this.to.id, trainsetObj);
      }

      if (_.pluck(setNames, 'id').indexOf(this.images[i].id) === -1)
        setNames.push({uuid: this.people_uuid, id: this.images[i].id, url: this.images[i].url, name: this.images[i].label});
    }
    if (setNames.length > 0)
      Meteor.call('set-person-names', setNames);

    // update collection
    Messages.update({_id: this._id}, {$set: {label_complete: true}});

    // var data = this;
    // var names = get_people_names();
    // var name = data.images[0].label;

    // Meteor.call('get-id-by-name', data.people_uuid, name, function(err, res){
    //   if(err)
    //     return PUB.toast('标记失败，请重试~');

    //   console.log(res);
    //   PeopleHis.update({_id: data.people_his_id}, {
    //     $set: {fix_name: name, msg_to: data.to},
    //     $push: {fix_names: {
    //       _id: new Mongo.ObjectID()._str,
    //       name: name,
    //       userId: Meteor.userId(),
    //       userName: Meteor.user().profile && Meteor.user().profile.fullname ? Meteor.user().profile.fullname : Meteor.user().username,
    //       userIcon: Meteor.user().profile && Meteor.user().profile.icon ? Meteor.user().profile.icon : '/userPicture.png',
    //       fixTime: new Date()
    //     }}
    //   }, function(err, num){
    //     if(err || num <= 0){
    //       return PUB.toast('标记失败，请重试~');
    //     }

    //     data.images.forEach(function(img) {
    //       Messages.update({_id: data.msg_id, 'images.url': img.url}, {
    //         $set: {
    //           'images.$.label': name,
    //           'images.$.result': ''
    //         }
    //       });
    //       sendMqttMessage('trainset', {url: img.url, person_id: res.id ? res.id : '', device_id: data.people_uuid, face_id: res ? res.faceId : data.people_id, drop: false});
    //     });
        
    //     onFixName(data.people_id, data.people_uuid, data.people_his_id, data.images, data.to, name, 'label');
    //     PUB.toast('标记成功~');
    //   });
    // });
  },
  'click .no': function(){
    Template._simpleChatLabelLabel.open(this);
    // var data = this;
    // var names = get_people_names();

    // showBox('提示', ['重新标记', '删除'], null, '你要重新标记照片还是删除？', function(index){
    //   if(index === 0)
    //     show_label(function(name){
    //       Meteor.call('get-id-by-name', data.people_uuid, name, function(err, res){
    //         if(err)
    //           return PUB.toast('标记失败，请重试~');

    //         PeopleHis.update({_id: data.people_his_id}, {
    //           $set: {fix_name: name, msg_to: data.to},
    //           $push: {fix_names: {
    //             _id: new Mongo.ObjectID()._str,
    //             name: name,
    //             userId: Meteor.userId(),
    //             userName: Meteor.user().profile && Meteor.user().profile.fullname ? Meteor.user().profile.fullname : Meteor.user().username,
    //             userIcon: Meteor.user().profile && Meteor.user().profile.icon ? Meteor.user().profile.icon : '/userPicture.png',
    //             fixTime: new Date()
    //           }}
    //         }, function(err, num){
    //           if(err || num <= 0){
    //             return PUB.toast('标记失败，请重试~');
    //           }

    //           data.images.forEach(function(img) {
    //             Messages.update({_id: data.msg_id, 'images.url': img.url}, {
    //               $set: {
    //                 'images.$.label': name,
    //                 'images.$.result': ''
    //               }
    //             });
    //             sendMqttMessage('trainset', {url: img.url, person_id: res.id ? res.id : '', device_id: data.people_uuid, face_id: res ? res.faceId : data.people_id, drop: false});
    //           });

    //           onFixName(data.people_id, data.people_uuid, data.people_his_id, data.images, data.to, name, 'label');
    //           PUB.toast('标记成功~');
    //         });
    //       });
    //     });
    //   else
    //     show_remove(function(text){
    //       PeopleHis.update({_id: data.people_his_id}, {
    //         $set: {msg_to: data.to},
    //         $push: {fix_names: {
    //           _id: new Mongo.ObjectID()._str,
    //           userId: Meteor.userId(),
    //           userName: Meteor.user().profile && Meteor.user().profile.fullname ? Meteor.user().profile.fullname : Meteor.user().username,
    //           userIcon: Meteor.user().profile && Meteor.user().profile.icon ? Meteor.user().profile.icon : '/userPicture.png',
    //           fixTime: new Date(),
    //           fixType: 'remove',
    //           removeText: text
    //         }}
    //       }, function(err, num){
    //         if(err || num <= 0){
    //           console.log(err);
    //           return PUB.toast('删除失败，请重试~');
    //         }

    //         data.images.forEach(function(img) {
    //           Messages.update({_id: data.msg_id, 'images.url': img.url}, {
    //             $set: {
    //               'images.$.result': 'remove'
    //             }
    //           });
    //         });

    //         onFixName(data.people_id, data.people_uuid, data.people_his_id, data.images, data.to, text, 'remove');
    //         PUB.toast('删除成功~');
    //       });
    //     });
    // });
  },
  'click .show_more': function(e, t){
    var $li = $('li#' + this._id);
    var $imgs = $li.find('.text .imgs');
    var $labels = $li.find('.text .imgs-1-item');
    var $show = $li.find('.show_more');

    if ($imgs.css('height') === '70px' || $labels.css('height') === '55px'){
      $imgs.css('height', 'auto');
      $labels.css('height', 'auto');
      $show.html('<i class="fa fa-angle-up"></i>');
    } else {
      $imgs.css('height', '70px');
      $labels.css('height', '55px');
      $show.html('<i class="fa fa-angle-right"></i>');
    }
  }
});

Template._simpleChatToChatLabel.helpers({
  data: function(){
    return Session.get('SimpleChatToChatLabelImage');
  }
});

Template._simpleChatToChatLabel.events({
  'click .btn-label.yes': function(){
    var $img = $('#swipebox-overlay .slide.current img');
    var data = this;
    var names = get_people_names();

    show_label(function(name){
      Meteor.call('get-id-by-name', data.people_uuid, name, function(err, res){
        if(err)
          return PUB.toast('标记失败，请重试~');

        console.log(res);
        PeopleHis.update({_id: data.people_his_id}, {
          $set: {fix_name: name, msg_to: data.to},
          $push: {fix_names: {
            _id: new Mongo.ObjectID()._str,
            name: name,
            userId: Meteor.userId(),
            userName: Meteor.user().profile && Meteor.user().profile.fullname ? Meteor.user().profile.fullname : Meteor.user().username,
            userIcon: Meteor.user().profile && Meteor.user().profile.icon ? Meteor.user().profile.icon : '/userPicture.png',
            fixTime: new Date()
          }}
        }, function(err, num){
          if(err || num <= 0){
            return PUB.toast('标记失败，请重试~');
          }

          Messages.update({_id: data.msg_id, 'images.url': $img.attr('src')}, {
            $set: {
              'images.$.label': name,
              'images.$.result': ''
            }
          });

          onFixName(data.people_id, data.people_uuid, data.people_his_id, $img.attr('src'), data.to, name, 'label');
          sendMqttMessage('trainset', {url: $img.attr('src'), person_id: res.id ? res.id : '', device_id: data.people_uuid, face_id: res ? res.faceId : data.people_id, drop: false});
          PUB.toast('标记成功~');
        });
      });
    });
  },
  'click .btn-yes': function(){
    var $img = $('#swipebox-overlay .slide.current img');
    var data = this;
    var name = data.images[0].label;

    Meteor.call('get-id-by-name', data.people_uuid, name, function(err, res){
      if(err)
        return PUB.toast('标记失败，请重试~');

      PeopleHis.update({_id: data.people_his_id}, {
        $set: {fix_name: name, msg_to: data.to},
        $push: {fix_names: {
          _id: new Mongo.ObjectID()._str,
          name: name,
          userId: Meteor.userId(),
          userName: Meteor.user().profile && Meteor.user().profile.fullname ? Meteor.user().profile.fullname : Meteor.user().username,
          userIcon: Meteor.user().profile && Meteor.user().profile.icon ? Meteor.user().profile.icon : '/userPicture.png',
          fixTime: new Date()
        }}
      }, function(err, num){
        if(err || num <= 0){
          return PUB.toast('标记失败，请重试~');
        }

        Messages.update({_id: data.msg_id, 'images.url': $img.attr('src')}, {
          $set: {
            'images.$.label': name,
            'images.$.result': ''
          }
        });

        onFixName(data.people_id, data.people_uuid, data.people_his_id, $img.attr('src'), data.to, name, 'label');
        sendMqttMessage('trainset', {url: $img.attr('src'), person_id: res.id ? res.id : '', device_id: data.people_uuid, face_id: res ? res.faceId : data.people_id, drop: false});
        PUB.toast('标记成功~');
      });
    });
  },
  'click .btn-no': function(){
    var $img = $('#swipebox-overlay .slide.current img');
    var data = this;
    var name = Session.get('SimpleChatToChatLabelImage').label;
    var names = get_people_names();

    showBox('提示', ['重新标记', '删除'], null, '你要重新标记照片还是删除？', function(index){
      if(index === 0)
        show_label(function(name){
          Meteor.call('get-id-by-name', data.people_uuid, name, function(err, res){
            if(err)
              return PUB.toast('标记失败，请重试~');

            PeopleHis.update({_id: data.people_his_id}, {
              $set: {fix_name: name, msg_to: data.to},
              $push: {fix_names: {
                _id: new Mongo.ObjectID()._str,
                name: name,
                userId: Meteor.userId(),
                userName: Meteor.user().profile && Meteor.user().profile.fullname ? Meteor.user().profile.fullname : Meteor.user().username,
                userIcon: Meteor.user().profile && Meteor.user().profile.icon ? Meteor.user().profile.icon : '/userPicture.png',
                fixTime: new Date()
              }}
            }, function(err, num){
              if(err || num <= 0){
                return PUB.toast('标记失败，请重试~');
              }

              Messages.update({_id: data.msg_id, 'images.url': $img.attr('src')}, {
                $set: {
                  'images.$.label': name,
                  'images.$.result': ''
                }
              });

              onFixName(data.people_id, data.people_uuid, data.people_his_id, $img.attr('src'), data.to, name, 'label');
              sendMqttMessage('trainset', {url: $img.attr('src'), person_id: res.id ? res.id : '', device_id: data.people_uuid, face_id: res ? res.faceId : data.people_id, drop: false});
              PUB.toast('标记成功~');
            });
          });
        });
      else
        show_remove(function(text){
          PeopleHis.update({_id: data.people_his_id}, {
            $set: {msg_to: data.to},
            $push: {fix_names: {
              _id: new Mongo.ObjectID()._str,
              userId: Meteor.userId(),
              userName: Meteor.user().profile && Meteor.user().profile.fullname ? Meteor.user().profile.fullname : Meteor.user().username,
              userIcon: Meteor.user().profile && Meteor.user().profile.icon ? Meteor.user().profile.icon : '/userPicture.png',
              fixTime: new Date(),
              fixType: 'remove',
              removeText: text
            }}
          }, function(err, num){
            if(err || num <= 0){
              console.log(err);
              return PUB.toast('删除失败，请重试~');
            }

            Messages.update({_id: data.msg_id, 'images.url': $img.attr('src')}, {
              $set: {
                'images.$.result': 'remove'
              }
            });

            onFixName(data.people_id, data.people_uuid, data.people_his_id, $img.attr('src'), data.to, text, 'remove');
            PUB.toast('删除成功~');
          });
        });
    });
  }
});

var loadScript = function(url, callback){
  if($("script[src='"+url+"']").length > 0)
    return callback && callback();

  var script = document.createElement('script');
  script.type = 'text/javascript';
  if(script.readyState){
    script.onreadystatechange = function(){
      if(script.readyState === 'loaded' || script.readyState === 'complete'){
        script.onreadystatechange = null;
        callback && callback();
      }
    }
  }else{
    script.onload = function(){
      callback && callback();
    };
  }

  script.src = url;
  document.getElementsByTagName('head')[0].appendChild(script);
}
Template._simpleChatToChatLayout.onRendered(function(){
  Meteor.subscribe('myBlackList');
  if(Meteor.isCordova){
    $('#container').click(function(){
      selectMediaFromAblum(1, function(cancel, result, currentCount, totalCount){
        if(cancel)
          return;
        if(result){
          var id = new Mongo.ObjectID()._str;
          window.___message.insert(id, result.filename, result.URI); // result.smallImage
          multiThreadUploadFile_new([{
            type: 'image',
            filename: result.filename,
            URI: result.URI
          }], 1, function(err, res){
            if(err || res.length <= 0)
              window.___message.update(id, null);
            else
              window.___message.update(id, res[0].imgUrl);
          });
        }
      });
    });
  }else{
    // load upload.js
    loadScript('/packages/feiwu_simple-chat/client/upload.js', function(){
      var uploader = SimpleChat.createPlupload('selectfiles');
      uploader.init();
    });
  }

  Meteor.setTimeout(function(){
    $('body').css('overflow', 'hidden');
    var DHeight = $('.group-list').outerHeight();
    $('.box').scrollTop(DHeight);
  }, 600);
});
Template._simpleChatToChatLayout.onDestroyed(function(){
  $('body').css('overflow', 'auto');
});

Template._simpleChatToChatLayout.helpers({
  title: function(){
    if (Session.get('msgToUserName') && Session.get('msgToUserName') != '') {
      return Session.get('msgToUserName')
    }else{
      return page_title.get();
    }
  },
  loading: function(){
    return is_loading.get();
  },
  isGroups:function(){
    var data = Blaze.getData(Blaze.getView(document.getElementsByClassName('simple-chat')[0]));
    return data.is_group();
  },
  isSubScribeUser: function(){
    var followerId = location.search.replace('?id=', '');
    return  Follower.find({followerId: followerId, userId: Meteor.userId()}).count()>0
  }
});

sendMqttMsg = function(){
  var msg = _.clone(arguments[0]);
  delete msg.send_status
  var callback = function(err){
    if(timeout){
      Meteor.clearTimeout(timeout);
      timeout = null;
    }
    if (err){
      console.log('send mqtt err:', err);
      return Messages.update({_id: msg._id}, {$set: {send_status: 'failed'}});
    }
    Messages.update({_id: msg._id}, {$set: {send_status: 'success'}});
  };
  var timeout = Meteor.setTimeout(function(){
    var obj = Messages.findOne({_id: msg._id});
    if (obj && obj.send_status === 'sending')
      Messages.update({_id: msg._id}, {$set: {send_status: 'failed'}});
  }, 1000*60*2);

  Messages.update({_id: msg._id}, {$set: {send_status: 'sending'}});

  if (msg.type === 'image'){
    if(!msg.images[0].url){
      return multiThreadUploadFile_new([{
        type: 'image',
        filename: msg.images[0].filename,
        URI: msg.images[0].uri
      }], 1, function(err, res){
        if(err || res.length <= 0)
          return callback(new Error('upload error'));

        if(timeout){
          Meteor.clearTimeout(timeout);
          timeout = null;
        }
        window.___message.update(id, res[0].imgUrl);
        msg = Messages.findOne({_id: msg.to.id});
        sendMqttGroupMessage(msg.to.id, msg, callback);
      });
    }
  }

  if(msg.type === 'group')
    sendMqttGroupMessage(msg.to.id, msg, callback);
  else
    sendMqttUserMessage(msg.to.id, msg, callback);
};

Template._simpleChatToChatLayout.events({
  'click .ta': function(e){
    console.log('i clicked a chat userICON');
    Session.set("ProfileUserId1", this.form.id);
    Session.set("currentPageIndex",-1);
    Meteor.subscribe("usersById", this.form.id);
    Meteor.subscribe("recentPostsViewByUser", this.form.id);
    Session.set('pageToProfile',AppConfig.path + '/to/user?id='+this.form.id);
    Session.set('pageScrollTop',$(window).scrollTop());
    onUserProfile()
  },
  'click #subscribeUser': function(e){
    var user  = Meteor.user();
    var toUserId = location.search.replace('?id=', '');
    var toUser = Meteor.users.findOne({_id: toUserId});
    return addFollower({
      userId: Meteor.userId(),
      userName: AppConfig.get_user_name(user),
      userIcon: AppConfig.get_user_icon(user),
      userDesc: Meteor.user().profile.desc,
      followerId: toUserId,
      followerName: AppConfig.get_user_name(toUser),
      followerIcon: AppConfig.get_user_icon(toUser),
      followerDesc: toUser.profile.desc,
      createAt: new Date()
    });
  },
  'click #addToBlacklist': function(e){
    try{
    var blackerId = location.search.replace('?id=', '');
    var followerId = Follower.findOne({userId: Meteor.userId(), followerId: blackerId})
    var MsgSessionId = MsgSession.findOne({userId: Meteor.userId(), toUserId: blackerId})
    if(MsgSessionId){
      MsgSession.remove(MsgSessionId._id);
    }
    if(BlackList.find({blackBy: Meteor.userId()}).count() === 0){
      BlackList.insert({blacker: [blackerId], blackBy: Meteor.userId()});
    } else {
      var blackDocId = BlackList.findOne({blackBy: Meteor.userId()})._id;
      BlackList.update({_id: blackDocId},{$addToSet:{blacker: blackerId}});
    }
    if(followerId) {
      Follower.remove(followerId._id);
    }
    // 清空本地相关消息
    Messages.remove({'to.id':Meteor.userId(), 'form.id':blackerId},function(err,num){
      if(err){
        console.log(err);
      }
      console.log(num)
    });
    return PUB.back();
    } catch (err){
      console.log('black err=',err);
    }
  },
  'click #reporterUser': function(){
    // TODO
    console.log('reporterUser')
    userId = location.search.replace('?id=', '');
    Session.set('reportUser',{
      userId:userId,
      userName: page_title.get()
    })
    Router.go('reportPost')
  },
  'focus .input-text': function(){
    $('.box').animate({scrollTop:'999999px'},800)
    // Meteor.setTimeout(function(){
    //   $('body').scrollTop(999999);     
    // }, 500);
  },
  'submit .input-form': function(e, t){
    $('.input-text').focus();
    try{
      var data = Blaze.getData(Blaze.getView(document.getElementsByClassName('simple-chat')[0]));
      var text = $('.input-text').val();
      var to = toUsers[page_data.type+'.'+page_data.id];
      if (!to || !to.name){
        PUB.toast('正在加载数据，请稍后发送！');
        return false;
      }
      to.id = page_data.id;

      if(!text){
        $('.box').scrollTop($('.box ul').height());
        return false;
      }
      // if(data.type === 'group'){
      //   var obj = Groups.findOne({_id: data.id});
      //   to = {
      //     id: data.id,
      //     name: obj.name,
      //     icon: obj.icon
      //   };
      // }else{
      //   var obj = Meteor.users.findOne({_id: data.id});
      //   to = {
      //     id: t.data.id,
      //     name: AppConfig.get_user_name(obj),
      //     icon: AppConfig.get_user_icon(obj)
      //   };
      // }

      var msg = {
        _id: new Mongo.ObjectID()._str,
        form:{
          id: Meteor.userId(),
          name: AppConfig.get_user_name(Meteor.user()),
          icon: AppConfig.get_user_icon(Meteor.user())
        },
        to: to,
        to_type: data.type,
        type: 'text',
        text: text,
        create_time: new Date(Date.now() + MQTT_TIME_DIFF),
        is_read: false,
        send_status: 'sending'
      };
      Messages.insert(msg, function(){
        sendMqttMsg(msg);
        Meteor.setTimeout(function(){$('.box').scrollTop($('.box ul').height());}, 200);
      });

      $('.input-text').val('');
      return false;
    }catch(ex){console.log(ex); return false;}
  },
  // 'click .groupsProfile':function(e,t){
  //   var data = Blaze.getData(Blaze.getView(document.getElementsByClassName('simple-chat')[0]));
  //   Router.go('/groupsProfile/'+data.type+'/'+data.id);
  // },
  // 'click .userProfile':function(e,t){
  //   var data = Blaze.getData(Blaze.getView(document.getElementsByClassName('simple-chat')[0]));
  //   Router.go('/groupsProfile/'+data.type+'/'+data.id);
  //   //PUB.page('/simpleUserProfile/'+data.id);
  // }

});

Template._simpleChatToChatItem.onRendered(function(){
  var data = this.data;

  // if (data.form.id === Meteor.userId() && data.send_status === 'sending')
  //   sendMqttMsg(data);

  touch.on(this.$('li'),'hold',function(ev){
    var msg = Messages.findOne({_id: data._id});
    console.log('hold event:', msg);
    if (!msg)
      return;

    if (msg.form.id === Meteor.userId() && (msg.send_status === 'failed' || msg.send_status === 'sending')){
      switch(msg.send_status){
        case 'failed':
          window.plugins.actionsheet.show({
            title: '消息发送失败，请选择？',
            buttonLabels: ['重新发送', '删除'],
            addCancelButtonWithLabel: '返回',
            androidEnableCancelButton: true
          }, function(index){
            if (index === 1)
              sendMqttMsg(msg);
            else if (index === 2)
              Messages.remove({_id: msg._id});
          });
          break;
        case 'sending':
          window.plugins.actionsheet.show({
            title: '消息发送中，请选择？',
            buttonLabels: ['取消发送'],
            addCancelButtonWithLabel: '返回',
            androidEnableCancelButton: true
          }, function(index){
            if (index === 1)
              Messages.remove({_id: msg._id});
          });
          break;
      }
    }
  });
});
// Template._simpleChatToChatItem.onDestroyed(function(){
//   if(this.data.send_status === 'sending' && this.data.form.id === Meteor.userId())
//     Messages.update({_id: this.data._id}, {$set: {send_status: 'failed'}});
//     // sendMqttMsg(this.data);
// });

Template._simpleChatToChatItem.helpers({
  formatPIndex:function(index){
    if(index == 0){
      return '1'
    }
    return index
  },
  postAbstractStyle:function(to){
    if(to.isThumbsUp){
      return 'schat_post_abstract_up'
    }
    if(to.isThumbsDown){
      return 'schat_post_abstract_down'
    }
    return ''
  },
  postAbstractIconStyle:function(to){
    if(to.isThumbsUp){
      return 'schat_post_abstract_up_icon'
    }
    if(to.isThumbsDown){
      return 'schat_post_abstract_down_icon'
    }
    if(to.isPcomments){
      return 'schat_post_abstract_icon'
    }
  },
  isMoreThanHundredChar: function(text){
    if (text.length > 50)
      return text.substring(0,50) + "...";
    else
      return text;
  },
  is_error: function(images){
    for(var i=0;i<images.length;i++){
      if (images[i].error)
        return true;
    }
    return false;
  },
  is_remove: function(images){
    for(var i=0;i<images.length;i++){
      if (images[i].remove)
        return true;
    }
    return false;
  },
  is_label: function(images){
    for(var i=0;i<images.length;i++){
      if (images[i].label)
        return true;
    }
    return false;
  },
  is_remove_label: function(images){
    for(var i=0;i<images.length;i++){
      if (images[i].remove || images[i].label)
        return true;
    }
    return false;
  },
  is_wait_img: function(images){
    for(var i=0;i<images.length;i++){
      if (!images[i].remove && !images[i].label && !images[i].error)
        return true;
    }
    return false;
  },
  is_wait_item: function(item){
    return !item.remove && !item.label && !item.error;
  },
  ta_me: function(id){
    return id != Meteor.userId() ? 'ta' : 'me';
  },
  is_me: function(id){
    return id === Meteor.userId();
  },
  status_sending: function(val){
    return val === 'sending';
  },
  status_failed: function(val){
    return val === 'failed';
  },
  show_images: function(images){
    var $li = $('li#' + this._id);
    var $imgs = $li.find('.text .imgs');
    var $labels = $li.find('.text .imgs-1-item');
    var is_scroll = false;

    $imgs.scrollTop(10);
    if ($imgs.scrollTop() > 0){is_scroll = true;$imgs.scrollTop(0);}
    $labels.each(function(){
      $(this).scrollTop(10);
      if ($(this).scrollTop() > 0){is_scroll = true;$(this).scrollTop(0);}
    });

    if (is_scroll)
      $li.find('.show_more').show();
  },
  is_show_time: function(id){
    try{
      var data = list_data.get();
      return data[_.pluck(data, '_id').indexOf(id)].show_time;
    }catch(ex){return false;}
  },
  get_time: function(id){
    var data = list_data.get();
    return data[_.pluck(data, '_id').indexOf(id)].show_time_str;
  }
});

window.___message = {
  insert: function(id, filename, uri){
    var data = Blaze.getData(Blaze.getView(document.getElementsByClassName('simple-chat')[0]));
    var to = toUsers[page_data.type+'.'+page_data.id];
    if (!to || !to.name){
      PUB.toast('正在加载数据，请稍后发送！');
      return false;
    }
    to.id = page_data.id;

    // if(data.type === 'group'){
    //   var obj = Groups.findOne({_id: data.id});
    //   to = {
    //     id: data.id,
    //     name: obj.name,
    //     icon: obj.icon
    //   };
    // }else{
    //   var obj = Meteor.users.findOne({_id: data.id});
    //   to = {
    //     id: data.id,
    //     name: AppConfig.get_user_name(obj),
    //     icon: AppConfig.get_user_icon(obj)
    //   };
    // }

    Messages.insert({
      _id: id,
      form:{
          id: Meteor.userId(),
          name: AppConfig.get_user_name(Meteor.user()),
          icon: AppConfig.get_user_icon(Meteor.user())
      },
      to: to,
      to_type: data.type,
      type: 'image',
      images:[
        {
          _id: new Mongo.ObjectID()._str,
          id:'',
          url:null,
          label:null,
          people_his_id:id,
          thumbnail: '/packages/feiwu_simple-chat/images/sendingBmp.gif',
          filename: filename,
          uri: uri
        }
      ],
      //thumbnail: '/packages/feiwu_simple-chat/images/sendingBmp.gif',
      create_time: new Date(Date.now() + MQTT_TIME_DIFF),
      people_uuid:'',
      people_his_id:id,
      wait_lable:true,
      is_read: false,
      send_status: 'sending'
    }, function(err, id){
      console.log('insert id:', id);
      $('.box').scrollTop($('.box ul').height());
    });
  },
  update: function(id, url){
    var msg = Messages.findOne({_id: id});
    var images = msg.images;
    for (var i = 0; i < images.length; i++) {
      images[i].url = url;
    }
    Messages.update({_id: id}, {$set: {
      images: images
    }}, function(){
      console.log('update id:', id);
      $('.box').scrollTop($('.box ul').height());
      sendMqttMsg(msg);
    //   if (msg.to_type === 'group'){
    //     sendMqttGroupMessage(msg.to.id, Messages.findOne({_id: id}));
    //   }
    //   else{
    //     sendMqttUserMessage(msg.to.id, Messages.findOne({_id: id}),function(err){
    //       if(err){
    //         console.log('Cant send this message')
    //       } else {
    //         console.log('Sent to server')
    //       }
    //     });
    //   }
    });
  },
  remove: function(id){
    Messages.remove({_id: id}, function(){
      console.log('remove id:', id);
      $('.box').scrollTop($('.box ul').height());
    });
  }
};

SimpleChat.onMqttMessage = function(topic, msg) {
  var insertMsg = function(msgObj, type){
    console.log(type, msgObj._id);
    Messages.insert(msgObj, function(err, _id){
      if (err)
        console.log('insert msg error:', err);
    });
  };

  if (!(topic.startsWith('/t/msg/g/') || topic.startsWith('/t/msg/u/')))
    return;

  var msgObj = JSON.parse(msg);
  var whereTime = new Date(format_date(new Date(), 'yyyy-MM-dd 00:00:00'));
  var msgType = topic.split('/')[2];
  var where = {
    to_type: msgObj.to_type,
    wait_lable: msgObj.wait_lable,
    label_complete: {$ne: true},
    'to.id': msgObj.to.id,
    images: {$exists: true},
    create_time: {$gte: whereTime},
    type: 'text'
  };

  msgObj.create_time = msgObj.create_time ? new Date(msgObj.create_time) : new Date();
  if (msgObj.images && msgObj.length > 0 && msgObj.is_people && msgObj.people_id){
    for(var i=0;i<msgObj.images.length;i++)
      msgObj.images[i].id = msgObj.people_id;
  }

  if (Messages.find({_id: msgObj._id}).count() > 0)
    return console.log('已存在此消息:', msgObj._id);

  if (msgObj.wait_lable){where.people_uuid = msgObj.people_uuid}
  else if (!msgObj.wait_lable && msgObj.images && msgObj.images.length > 0) {where['images.label'] = msgObj.images[0].label}
  else {return Messages.insert(msgObj)}

  console.log('SimpleChat.SimpleChat where:', where);
  var targetMsg = Messages.findOne(where, {sort: {create_time: -1}});

  if (!targetMsg || !targetMsg.images || targetMsg.images.length <= 0)
    return insertMsg(msgObj, '无需合并消息');
  if (!msgObj.images || msgObj.images.length <= 0)
    return insertMsg(msgObj, '不是图片消息');
  if (msgObj.to_type != 'group' || !msgObj.is_people)
    return insertMsg(msgObj, '不是 Group 或人脸消息');

  var setObj = {create_time: new Date(), 'form.name': msgObj.form.name};
  if (msgObj.wait_lable){
    var count = 0;
    for(var i=0;i<targetMsg.images.length;i++){
      if (!targetMsg.images[i].label && !targetMsg.images[i].remove && !targetMsg.images[i].error)
        count += 1;
    }
    for(var i=0;i<msgObj.images.length;i++){
      if (!msgObj.images[i].label && !msgObj.images[i].remove && !msgObj.images[i].error)
        count += 1;
    }
    if (count > 0)
      setObj.text = count + ' 张照片需要标注';
  } else {
    setObj.text = msgObj.images[0].label + ' 加入了聊天室';
  }

  Messages.update({_id: targetMsg._id}, {
    $set: setObj,
    $push: {images: {$each: msgObj.images}}
  }, function(err, num){
    if (err || num <= 0)
      insertMsg(msgObj, 'update 失败');
  });
};

// SimpleChat.onMqttMessage('/t/msg/g/b82cc56c599e4c143442c6d0', JSON.stringify({
//   "_id":new Mongo.ObjectID()._str,
//   "form":{"id":"u5DuPhJYW5raAQYuh","name":"7YRBBDB722002717","icon":"/userPicture.png"},
//   "to":{"id":"b82cc56c599e4c143442c6d0","name":"群聊 2","icon":""},
//   "images":[{"_id":new Mongo.ObjectID()._str,"id":"17","people_his_id":"56rqonm3FNssmh6cR","url":"http://onm4mnb4w.bkt.clouddn.com/eb2a15d6-2310-11e7-9ce5-d065caa81a04","label":null}],
//   "to_type":"group",
//   "type":"text",
//   "text":"[设备 4,17]: -> 需要标注",
//   "create_time": new Date(),
//   "people_id":"17",
//   "people_uuid":"7YRBBDB722002717",
//   "people_his_id":"56rqonm3FNssmh6cR",
//   "wait_lable":true,
//   "is_people":true,
//   "is_read":false
// });

last_msg = null;
// SimpleChat.onMqttMessage = function(topic, msg) {
//   console.log('SimpleChat.onMqttMessage, topic: ' + topic + ', msg: ' + msg);
//   var group = topic.substring(topic.lastIndexOf('/') + 1);
//   var msgObj = JSON.parse(msg);
//   //var last_msg = Messages.findOne({}, {sort: {create_time: -1}});
//   if(msgObj.form.id === Meteor.userId()){
//     return;
//   }
//   if(last_msg && last_msg._id === msgObj._id){
//     return;
//   }
//   last_msg = msgObj;

//   if(Messages.find({_id: msgObj._id}).count() > 0){
//     // 自己发送的消息且本地已经存在
//     //if (msgObj && msgObj.form.id === Meteor.userId())
//     //  return;

//     //msgObj._id = new Mongo.ObjectID()._str;
//     return
//   }
  
//   try{
//     console.log('last_msg:', last_msg);
//     msgObj.create_time = msgObj.create_time ? new Date(msgObj.create_time) : new Date();
//     var group_msg = last_msg && msgObj && msgObj.to_type === 'group' && msgObj.to.id === last_msg.to.id; // 当前组消息
//     if (!group_msg)
//       return Messages.insert(msgObj);

//     if (last_msg && last_msg.is_people === true && last_msg.images && last_msg.images.length > 0 && msgObj.images && msgObj.images.length > 0){
//       if(!msgObj.wait_lable && msgObj.images[0].label === last_msg.images[0].label){
//         Messages.update({_id: last_msg._id}, {
//           $set: {create_time: msgObj.create_time},
//           $push: {images: msgObj.images[0]}
//         }, function(err, num){
//           if (err || num <= 0)
//             Messages.insert(msgObj);
//         });
//       }else if(msgObj.wait_lable && msgObj.people_id === last_msg.people_id && msgObj.people_uuid === last_msg.people_uuid){
//         Messages.update({_id: last_msg._id}, {
//           $set: {create_time: msgObj.create_time},
//           $push: {images: msgObj.images[0]}
//         }, function(err, num){
//           if (err || num <= 0)
//             Messages.insert(msgObj);
//         });
//       }else{
//         Messages.insert(msgObj);
//       }
//     }else{
//       Messages.insert(msgObj);
//     }
//   }catch(ex){
//     console.log(ex);
//     Messages.insert(msgObj);
//   }
// };


// label
var label_view = null;
var label_limit = new ReactiveVar(0);
show_label = function(callback){
  if (label_view)
    Blaze.remove(label_view);
  label_view = Blaze.renderWithData(Template._simpleChatToChatLabelName, {
    callback : callback || function(){}
  }, document.body)
}

Template._simpleChatToChatLabelName.onRendered(function(){
  label_limit.set(40);
  Meteor.subscribe('get-label-names', label_limit.get()); // TODO：
});
Template._simpleChatToChatLabelName.helpers({
  names: function(){
    return PersonNames.find({}, {sort: {createAt: 1}, limit: label_limit.get()});
  }
});
Template._simpleChatToChatLabelName.events({
  'click li': function(e, t){
    $('#label-input-name').val(this.name);
    t.$('li img').removeAttr('style');
    $(e.currentTarget).find('img').attr('style', 'border: 1px solid #39a8fe;');
  },
  'click .leftButton': function(){
    Blaze.remove(label_view);
    label_view = null;
  },
  'click .rightButton': function(e, t){
    if (!$('#label-input-name').val())
      return PUB.toast('请选择或输入名字~');;

    t.data.callback && t.data.callback($('#label-input-name').val());
    Blaze.remove(label_view);
    label_view = null;
  }
});

// remove
var remove_view = null;
show_remove = function(callback){
  if (remove_view)
    Blaze.remove(remove_view);
  remove_view = Blaze.renderWithData(Template._simpleChatToChatLabelRemove, {
    callback : callback || function(){}
  }, document.body)
}

Template._simpleChatToChatLabelRemove.events({
  'click li': function(e, t){
    $('#label-input-name').val($(e.currentTarget).find('.userName').text());
    // t.$('li img').removeAttr('style');
    // $(e.currentTarget).find('img').attr('style', 'border: 1px solid #39a8fe;');
  },
  'click .leftButton': function(){
    Blaze.remove(remove_view);
    remove_view = null;
  },
  'click .rightButton': function(e, t){
    if (!$('#label-input-name').val())
      return PUB.toast('请输入删除照片的原因~');;

    t.data.callback && t.data.callback($('#label-input-name').val());
    Blaze.remove(remove_view);
    remove_view = null;
  }
});

Template._simpleChatListLayout.events({
  'click li': function(e, t){
    var _id = e.currentTarget.id;
    var history = Session.get('history_view') || [];
    history.push({
      view: 'simple-chat/user-list/'+Meteor.userId(),
      scrollTop: document.body.scrollTop
    });

    Session.set("history_view", history);
    if(this.isGroups){
      Router.go(AppConfig.path + '/to/group?id='+_id+'&name='+encodeURIComponent(this.toUserName)+'&icon='+encodeURIComponent(this.toUserIcon));
    } else {
      Router.go(AppConfig.path + '/to/user?id='+_id+'&name='+encodeURIComponent(this.toUserName)+'&icon='+encodeURIComponent(this.toUserIcon));
    }
  },
  'click .writeMeaaage': function(e,t){
    // TODO
    console.log('写私信');
    Router.go('/write-letter');
  },
  'click #follow': function(){
     Router.go('/searchFollow');
  }
});

Template._groupMessageList.helpers({
  formatTime: function(val){
    return get_diff_time(val);
  }
});

Template._groupMessageList.events({
  'click li': function(e){
    msgid = $(e.currentTarget).attr('msgid')
    MsgSession.update({'_id':msgid},{$set:{count:0}})
    console.log('this to user name is ' + this.toUserName);
    Session.set('msgToUserName', this.toUserName);
    return Router.go(AppConfig.path+'/to/user?id='+e.currentTarget.id);
  }
})

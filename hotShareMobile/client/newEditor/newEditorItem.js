function cropcallback (result,$elemLI){
  var filename = '';
  var URI = result;
  var imgUrl = '';
  var timestamp = new Date().getTime();
  var originalFilename = result.replace(/^.*[\\\/]/, '');
  filename = Meteor.userId() + '_' + timestamp + '_' + originalFilename;
  console.log('File name ' + filename);
  var lastQuestionFlag = result.lastIndexOf('?');
  if (lastQuestionFlag >= 0)
    URI = result.substring(0, lastQuestionFlag);
  var lastQuestionFlag = filename.lastIndexOf('?');
  if (lastQuestionFlag >= 0)
    filename = filename.substring(0, lastQuestionFlag);
    imgUrl = imgUrl+'/'+filename;
  console.log('filename==',filename)
  console.log('URI==',URI)
  var _id = new Mongo.ObjectID()._str;
  multiThreadUploadFile_new([{
    type: 'image',
    filename: filename,
    URI: URI
  }],1,function(err,res){
    if(err || res.length <= 0){
      return PUB.toast('上传图片失败');
    }
    imgUrl = res[0].imgUrl;
    console.log('imgUrl==',imgUrl)
    // 这里实时更新编辑器内部显示
    Template.newEditor.sortable().update($elemLI.attr('id'),{
      _id: _id,
      imgUrl: imgUrl,
      filename: filename,
      URI: URI
    });
    // 这里处理存储相关（裁剪不生效问题）
    $elemLI.data('imgurl',imgUrl);
    $elemLI.data('filename',filename);
    $elemLI.data('uri',URI);
    //can not update id, or pictures will not be changed after crop
    //$elemLI.attr('id',_id);
  })
}

Template.newEditorItem.events({
  // 'click li': function(e, t){
  //   var index = (_.pluck(e.currentTarget.parentNode.children, 'id')).indexOf(e.currentTarget.id);
  //   console.log('li index:', index);
  // },
  'click .remove': function(e, t){
    var $li = $(e.currentTarget).parents("li");
    $li.fadeOut(function(){
      $li.remove();
    });
  },
  'click .moveDown': function(e, t){
    var parent = $(e.currentTarget).parents('li');
    var nextItem = parent.next('li');
    if(nextItem.length==0)return;
    var parentTop = parent.position().top;
    var nextItemTop = nextItem.position().top;
    parent.css('visibility','hidden');
    nextItem.css('visibility','hidden');
    parent.clone().insertAfter(parent).css({position:'absolute',visibility:'visible',top:parentTop,left:'0px',right:'0px'}).animate({top:nextItemTop},200,function(){
      $(this).remove();
      parent.insertAfter(nextItem).css('visibility','visible');
    });
    nextItem.clone().insertAfter(nextItem).css({position:'absolute',visibility:'visible',top:nextItemTop,left:'0px',right:'0px'}).animate({top:parentTop},200,function(){
      $(this).remove();
      nextItem.css('visibility','visible');
    });
  },
  'click .moveUp': function(e, t){
    var parent = $(e.currentTarget).parents('li');
    var prevItem = parent.prev('li');
    if(prevItem.length==0)return;
    var parentTop = parent.position().top;
    var prevItemTop = prevItem.position().top;
    parent.css('visibility','hidden');
    prevItem.css('visibility','hidden');
    parent.clone().insertAfter(parent).css({position:'absolute',visibility:'visible',top:parentTop,left:'0px',right:'0px'}).animate({top:prevItemTop},200,function(){
      $(this).remove();
      parent.insertBefore(prevItem).css('visibility','visible');
    });
    prevItem.clone().insertAfter(prevItem).css({position:'absolute',visibility:'visible',top:prevItemTop,left:'0px',right:'0px'}).animate({top:parentTop},200,function(){
      $(this).remove();
      prevItem.css('visibility','visible');
    });
  },
  'click .text': function(e,t){
    // var html = $(e.currentTarget).data('html');
    if (!localStorage.getItem('showSimpleEditorEditingTIP')) {
      var target = $(e.currentTarget).parents("li").attr('id');
      Session.set('targetBeforeEditorEditingTIP',target);
      return Session.set('showSimpleEditorEditingTIP', 'true');
    }

    var loading = $.loading('加载中...', 1000*3);
    var html = $(e.currentTarget).html();
    cordova.plugins.richtexteditor.edit({
      html: html
    },
    function(content){
      loading && loading.close();
      $(e.currentTarget).data('text',content.html)
      $(e.currentTarget).data('html',content.html)
      $(e.currentTarget).html(content.html);
    },function(error){
      loading && loading.close();
      console.log('edit text Err = '+ error);
    });
  },
  'click .voicePlay':function(e,t) {
    var $ele = $(e.currentTarget);
    if($ele.hasClass('voicePlaying')){
      $ele.removeClass('voicePlaying');
      console.log(voiceMedia)
      voiceMedia.pause();
    }else{
      voiceMedia = new Media($ele.attr('data'),
          // success callback
          function () {
              console.log("playAudio():Audio Success");
              $ele.removeClass('voicePlaying');
          },
          // error callback
          function (err) {
              console.log("playAudio():Audio Error: " + err);
              $ele.removeClass('voicePlaying');
          }
      );
      voiceMedia.play();
      $ele.addClass('voicePlaying');
    }
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    return;
  },
  // 更换或裁剪照片
  'click .editAbleImage':function(e,t){
    var $elemLI = $(e.currentTarget).parents("li");
    var options = {
        title: '更换图片 或 裁剪图片',
        buttonLabels: ['从相册选择','拍照', '裁剪图片'],
        addCancelButtonWithLabel: '取消',
        androidEnableCancelButton: true,
    };
    window.footbarOppration = true;
    window.plugins.actionsheet.show(options, function(index) {
      if(index === 1){
        selectMediaFromAblum(1, function(cancel, result,currentCount,totalCount){
            if (cancel){
                return
            }
            if(result){
                console.log('Current Count is ' + currentCount + ' Total is ' + totalCount);
                console.log('image url is ' + result.smallImage);
                Template.newEditor.sortable().update($elemLI.attr('id'),{
                  _id: new Mongo.ObjectID()._str,
                  imgUrl: result.smallImage,
                  filename: result.filename,
                  URI: result.URI
                });
                $elemLI.data('imgurl',result.smallImage);
                $elemLI.data('filename',result.filename);
                $elemLI.data('uri',result.URI);
            }
        });
      } else if(index === 2){
        if(window.takePhoto){
            window.takePhoto(function(result){
                console.log('result from camera is ' + JSON.stringify(result));
                if (result){
                    Template.newEditor.sortable().update($elemLI.attr('id'),{
                      _id: new Mongo.ObjectID()._str,
                      imgUrl: result.smallImage,
                      filename: result.filename,
                      URI: result.URI
                    });
                    $elemLI.data('imgurl',result.smallImage);
                    $elemLI.data('filename',result.filename);
                    $elemLI.data('uri',result.URI);
                }
            });
        }
      } else if(index === 3){
        var imageURI = $elemLI.data('uri');
        var imgUrl = $elemLI.data('imgurl');
        console.log('imageURI is=',imageURI);
        console.log('imgUrl is=',imgUrl);
        if(imgUrl.indexOf('http') >= 0){
          downloadFromBCS(imgUrl, function(result){
            if(result) {
              console.log('result is==',result)
              plugins.crop(function success(newPath){
                console.log('plugins crop newPath:' + newPath);
                if (newPath) {
                  cropcallback(newPath,$elemLI)
                }
              },function fail(error){
                console.log('plugins crop Err='+ JSON.stringify(error));
              },result);
            } else {
              return PUB.toast('裁剪失败了~')
            }
          });
        } else {
          plugins.crop(function success(newPath){
            console.log('plugins crop newPath:' + newPath);
            if (newPath) {
              cropcallback(newPath,$elemLI)
            }
          },function fail(error){
            console.log('plugins crop Err='+ JSON.stringify(error));
          },imageURI);
        }
      }
    });
  },
  // 更换或裁剪照片
  'click .editTextImage': function(e){
    var li = e.currentTarget.parentNode.parentNode;
    var fadeOutli = $(e.currentTarget).parents("li");
    var isMain = e.currentTarget.getAttribute('class').indexOf('main') >= 0;
    var pIndex = isMain ? 0 : (_.pluck(li.parentNode.children, 'id')).indexOf(li.id);
    var hasText = false;
    var options = {
        title: '从相册选择图片或拍摄一张照片~',
        buttonLabels: ['从相册选择图片', '拍摄照片'],
        addCancelButtonWithLabel: '取消',
        androidEnableCancelButton: true,
    };
    var oldPid = fadeOutli[0].getAttribute('id');
    var getText = $('#' + oldPid + ' .text').html();
    if(getText && getText != ''){
      hasText = true;
    }
    window.footbarOppration = true;
    window.plugins.actionsheet.show(options, function(index) {
      if(index === 1){
        Session.set('draftTitle','')
        Session.set('draftAddontitle','');
        Session.set('NewImgAdd','false');
        var ablubImgLists = [];
        selectMediaFromAblum(999, function(cancel, result,currentCount,totalCount){
            if (cancel){
                return
            }
            if(result){
              if(hasText){
                ablubImgLists.push({
                  type: 'image',
                  isImage:true,
                  currentCount:currentCount,
                  totalCount:totalCount,
                  imgUrl: result.smallImage,
                  filename: result.filename,
                  URI: result.URI
                });
                ablubImgLists.push({
                  isImage: false,
                  pid: oldPid,
                  text: getText,
                  type: 'text'
                });
              }else{
                ablubImgLists.push({
                  type: 'image',
                  isImage:true,
                  currentCount:currentCount,
                  totalCount:totalCount,
                  imgUrl: result.smallImage,
                  filename: result.filename,
                  URI: result.URI
                });
              }
              fadeOutli.fadeOut(function(){
                fadeOutli.remove();
              });
              if(currentCount === totalCount){
                ablubImgLists.reverse();
                for(var i=0; i < ablubImgLists.length; i++){
                  Template.newEditor.sortable().addImgText(pIndex,ablubImgLists[i]);
                }
                ablubImgLists = null;
              }
            }
        });
      } else if (index === 2){
            window.footbarOppration = true;
            Session.set('NewImgAdd','false');
            if(window.takePhoto){
                window.takePhoto(function(result){
                    console.log('result from camera is ' + JSON.stringify(result));
                    if (result){
                      fadeOutli.fadeOut(function(){
                        fadeOutli.remove();
                      });
                      var newid = new Mongo.ObjectID()._str;
                      Template.newEditor.sortable().addImgText(pIndex,{
                        _id: newid,
                        type: 'image',
                        pid: oldPid,
                        isImage:true,
                        imgUrl: result.smallImage,
                        filename: result.filename,
                        URI: result.URI
                      });
                      if(hasText){
                        Template.newEditor.sortable().addImgText(pIndex+1,{
                          isImage: false,
                          pid: oldPid,
                          text: getText,
                          type: 'text'
                        });
                      }
                    }
                });
            }
      }
    });
  }
});

Template.newEditorItem.helpers({
  hasm3u8: function(videoInfo){
    if(!videoInfo){
      return false;
    }
    var playUrl = videoInfo.playUrl;
    if(playUrl.length > 5 && playUrl.lastIndexOf('.m3u8') == (playUrl.length-5)){
      return true;
    }
    return false;
  },
  hasVideoInfo: function(videoInfo) {
    if(!videoInfo){
      return false;
    }
    var playUrl = videoInfo.playUrl;
    var zhifa_serverURL = "http://data.tiegushi.com"

    // m3u8
    if(playUrl.length > 5 && playUrl.lastIndexOf('.m3u8') == (playUrl.length-5)){
      if ($('head script[tag=mp4').length > 0) {
        $('head script[tag=mp4]').remove();
        $('head link[tag=mp4]').remove();
      }
      if ($('head script[tag=m3u8]').length > 0) {
        return true;
      }
      try{
        $('head').append('<link tag="m3u8" href="http://data.tiegushi.com/video-js.min.css" rel="stylesheet">');
        $('head').append('<script tag="m3u8">token = "EioJxvLpZHJvcrYdJ"; trafficDisplay = true; </script>');
        $('head').append('<script tag="m3u8" src="http://data.tiegushi.com/bundle-hls.js"></script>');
      } catch (error) { console.log(error) }
    } else {
      if ($('head script[tag=m3u8]').length > 0){
        $('head script[tag=m3u8]').remove();
        $('head link[tag=m3u8]').remove();
      }
      if ($('head script[tag=mp4]').length > 0) {
        return true;
      }
      try{
        $('head').append('<link tag="mp4" href="http://data.tiegushi.com/video-js.min.css" rel="stylesheet">');
        $('head').append('<script tag="mp4">token = "7gFCGdcqXw4mSc252"; trafficDisplay = false; </script>');
        $('head').append('<script tag="mp4" src="/bundle-raidcdn-mini-2.21.4.js"></script>');
      } catch (error) { console.log(error) }
    }
    return true;
  },
  getImagePath: function(path,uri,id){
      return getImagePath(path,uri,id);
  }
});

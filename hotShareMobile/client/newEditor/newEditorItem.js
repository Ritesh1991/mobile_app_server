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
    Template.newEditor.sortable().update($elemLI.attr('id'),{
      _id: _id,
      imgUrl: imgUrl,
      filename: filename,
      URI: URI
    });
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
    var html = $(e.currentTarget).html();
    cordova.plugins.richtexteditor.edit({
      html: html
    },
    function(content){
      $(e.currentTarget).data('text',content.html)
      $(e.currentTarget).data('html',content.html)
      $(e.currentTarget).html(content.html);
    },function(error){
      console.log('edit text Err = '+ error);
    });
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
                }
            });
        }
      } else if(index === 3){
        var imageURI = $elemLI.data('uri') || $elemLI.data('imgurl');
        plugins.crop(function success(newPath){
          console.log('plugins crop newPath:' + newPath);
          if (newPath) {
            cropcallback(newPath,$elemLI)
          }
        },function fail(error){
          console.log('plugins crop Err='+ JSON.stringify(error));
        },imageURI);
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
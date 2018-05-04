function base64ToGallerycallback (imageURI){
  var timestamp = new Date().getTime();
  var retVal = {filename:'', URI:'', smallImage:''};
  retVal.filename = Meteor.userId()+'_'+timestamp+ '_'+imageURI.replace(/^.*[\\\/]/, '');
  retVal.URI = imageURI;
  console.log('image uri is ' + imageURI);
  retVal.smallImage = 'cdvfile://localhost/temporary/' + imageURI.replace(/^.*[\\\/]/, '');
  $('.mainImage').attr('data-imgurl',retVal.smallImage);
  $('.mainImage').attr('data-filename',retVal.filename);
  $('.mainImage').attr('data-uri',retVal.URI);
}
Template.eidtMainImagePage.onRendered(function(){

  // $('.mainImagesList').css('min-height',$(window).height());
//   var pubImages=[];
//   $('.item-image').each(function(){
//     var doc = {
//       URI: $(this).data('uri'),
//       imageId: $(this).data('id'),
//       imgUrl: $(this).data('imgurl'),
//       filename: $(this).data('filename')
//     };
//     pubImages.push(doc);
//   });
//   Session.set('pubImages', pubImages);
});

Template.eidtMainImagePage.helpers({
    getImagePath: function(path,uri,id){
      return getImagePath(path,uri,id);
    },
    // images:function(){
    //   Session.get('pubImages');
    // },
    officialImages:function(){
      var arr = [{num:1},{num:2},{num:3},{num:4},{num:5},{num:6},{num:7},{num:8},{num:9},{num:10},{num:11},{num:12},{num:13},{num:14},{num:15},{num:16},{num:17},{num:18},{num:19},{num:20},{num:21},{num:22},{num:23},{num:24},{num:25},{num:26},{num:27},{num:28},{num:29},{num:30},{num:31},{num:32},{num:33},{num:34},{num:35},{num:36},{num:37},{num:38},{num:39},{num:40},{num:41},{num:42}]
      return arr
    },
    selectMainImage: function(){
      return Session.get('selectMainImage');
    }
});

Template.eidtMainImagePage.events({
  'click .selectMainImage': function(e){
    var options = {
        title: '从相册选择图片或拍摄一张照片~',
        buttonLabels: ['从相册选择图片', '拍摄照片'],
        addCancelButtonWithLabel: '取消',
        androidEnableCancelButton: true,
    };
    window.footbarOppration = true;
    window.plugins.actionsheet.show(options, function(index) {
      if(index === 1){
        $('.mainImageListInput').prop('checked',false);
        selectMediaFromAblum(1, function(cancel, result,currentCount,totalCount){
            if (cancel){
                return
            }
            if(result){
              console.log('Current Count is ' + currentCount + ' Total is ' + totalCount);
              console.log('image url is ' + result.smallImage);
              Session.set('selectMainImage',{
                _id: new Mongo.ObjectID()._str,
                imgUrl: result.smallImage,
                filename: result.filename,
                URI: result.URI
              });
              Meteor.setTimeout(function(){
                var mainImageSrc = $('.selectMainImage').attr('data-imgurl');
                clipArea.clear();
                clipArea.load(mainImageSrc);
              },500);
            }
        });
      } else if (index === 2){
        $('.mainImageListInput').prop('checked',false);
        window.footbarOppration = true;
        Session.set('NewImgAdd','false');
        if(window.takePhoto){
            window.takePhoto(function(result){
                console.log('result from camera is ' + JSON.stringify(result));
                if (result){
                  Session.set('selectMainImage',{
                    _id: new Mongo.ObjectID()._str,
                    imgUrl: result.smallImage,
                    filename: result.filename,
                    URI: result.URI
                  });
                  Meteor.setTimeout(function(){
                    var mainImageSrc = $('.selectMainImage').attr('data-imgurl');
                    clipArea.clear();
                    clipArea.load(mainImageSrc);
                  },500);
                }
            });
        }
      }
    });
  },
  'click .mainImagesListback': function(e){
    $('.mainImagesList').remove();
  },
  'click .mainImagesListImport': function(e){
        var URI = '';
        var imageId = '';
        var mainImgUrl = '';
        var mainFileName = '';
        var imageSrc = '';
        $('input[class="mainImageListInput"]').each(function(){
          console.log($(this).prop('checked'))
          if($(this).prop('checked')){
              imageId = $(this).attr('id');
              URI = $(this).attr('uri');
              // mainImgUrl = $(this).attr('value');
              // mainImgUrl = clipArea.clip();
              mainFileName = $(this).attr('name');
              imageSrc = $('.image_' + imageId).attr('src');
            }
          });
        mainImgUrl = clipArea.clip();
        if(mainFileName == ''){
          mainFileName = $('.mainImage').attr('data-filename');
        } 
        console.log(mainImgUrl)
        $('.mainImage').attr('src',mainImgUrl);
        $('.mainImage').attr('data-imgurl',mainImgUrl);
        $('.mainImage').attr('data-filename',mainFileName);
        $('.mainImage').attr('data-uri',URI);
        $('.mainImagesList').remove()
        document.body.style = "";
        
        // Meteor.setTimeout(function(){
        window.imageSaver.saveBase64Image({
          data: mainImgUrl,
          prefix: 'tiegushi_',
          format: 'JPG',
          quality: 80,
          mediaScanner: false
        }, function(filePath){
          console.log('saved base64 path:'+ filePath);
          base64ToGallerycallback(filePath);
          var saveedBase64Images = Session.get('saveedBase64Images') || [];
          saveedBase64Images.push({URI:filePath,imgUrl:''});
          Session.set('saveedBase64Images',saveedBase64Images);
        },function(msg){
          console.log('saved base64 error:'+ msg);
        });
        
        // },500);
    },
    'click .mainImageListInput' : function(e){
        
        $('.mainImageListInput').prop('checked',false);
        Meteor.setTimeout(function(){
          $(e.currentTarget).prop('checked',true)
          var imgUrl = $(e.currentTarget).parents('li').data('imgurl')
          console.log(imgUrl)
          clipArea.clear();
          clipArea.load(imgUrl);
        },50);
    }
});
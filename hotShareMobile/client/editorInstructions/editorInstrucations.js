Template.editorInstrucations.onRendered(function(){
  editorInstrucationsSwiper = new Swiper ('.swiper-container', {
    loop: false,
    // 如果需要前进后退按钮
    nextButton: '.swiper-button-next',
    prevButton: '.swiper-button-prev',
    onReachEnd: function(){
      $('.swiper-button-prev').addClass('hide-swiper-button');
      $('.swiper-button-next').addClass('hide-swiper-button');
      editorInstrucationsSwiper.lockSwipeToPrev()
    },
  });
})
Template.editorInstrucations.helpers({
  editorModel: function(){
    if(this.editor === 'simple'){
      return '(简易模式)';
    }
    return '(经典模式)';
  },
  isSimpleEditor: function(){
    return this.editor === 'simple';
  },
  simpleLists: function(){
    var txtLists = [
      '步骤一：点击下方“+”号','步骤二：点击“从相册选取照片”','步骤三：点击要选取的图片','步骤四：点击“导入”','步骤五：点击“点击添加文字”',
      '步骤六：点击“点击添加标题和副标题”','步骤七：点击“发表”','步骤八：点击“完成”','步骤九：分享给朋友'];
    var lists = [];
    for(var i = 0; i < txtLists.length; i++){
      lists.push({
        text: txtLists[i],
        imgUrl: '/editor_help/simple_e_help_'+i+'.png'
      });
    }
    return lists;
  },
  fullLists: function(){
    var txtLists = [
      '步骤一：点击下方“+”号','步骤二：点击“从相册选取照片”','步骤三：点击要选取的图片','步骤四：点击“导入”','步骤五：点击图片，出现蓝色边框',
      '步骤六：按住蓝色边框上的点拖动调整图片大小','步骤七：点击下面的图标添加文字','步骤八：按住段落，拖动调整位置','步骤九：点击文字，出现编辑栏。点击下面的图标对文字进行排版',
      '步骤十：选择居中','步骤十一：添加标题','步骤十二：点击“发表”','步骤十三：点击“完成”','步骤十四：分享给朋友'];
    var lists = [];
    for(var i = 0; i < txtLists.length; i++){
      lists.push({
        text: txtLists[i],
        imgUrl: '/editor_help/full_e_help_'+i+'.png'
      });
    }
    return lists;
  }
});

Template.editorInstrucations.events({
  'click .leftButton': function (e) {
    if(editorInstrucationsSwiper){
      editorInstrucationsSwiper.destroy();
      editorInstrucationsSwiper = null;
    }
    Tips.close();
  },
  'click #backToFirstStep': function(e){
    $('.swiper-button-prev').removeClass('hide-swiper-button');
    $('.swiper-button-next').removeClass('hide-swiper-button');
    editorInstrucationsSwiper.unlockSwipeToPrev()
    editorInstrucationsSwiper.slideTo(0,0);
  }
});
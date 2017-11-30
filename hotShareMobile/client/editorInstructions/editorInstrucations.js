Template.editorInstrucations.onRendered(function(){
  var mySwiper = new Swiper ('.swiper-container', {
    loop: false,
    // 如果需要前进后退按钮
    nextButton: '.swiper-button-next',
    prevButton: '.swiper-button-prev',
  })  
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
  }
});

Template.editorInstrucations.events({
  'click .leftButton': function (e) {
    Tips.close();
  }
});
var view = null;

window._ = window._ || function _(obj){};
_.isJSONObject = function(obj){
  var isjson = typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length; 
  return isjson;
};

Tips = {
  show: function(template, showClose){
    Tips.close();
    if(localStorage.getItem('_tips_' + template))
      return;

    view = Blaze.renderWithData(Template._tips, {view: template}, document.body);
    localStorage.setItem('_tips_' + template, true);
  },
  popPage: function(template,obj){
    Tips.close();
    $('body').addClass('_popPage_open');
    var data = {view: template};
    if(obj && _.isJSONObject(obj)){
      data = _.extend(data,obj);
    }
    console.log(data)
    view = Blaze.renderWithData(Template._popPage, data, document.body);
  },
  close: function(){
    if($('body').hasClass('_popPage_open')){
      $('body').removeClass('_popPage_open')
    }
    if(view){
      Blaze.remove(view);
      view = null;
    }
  },
  isShow: function(){
    return view != null;
  }
};
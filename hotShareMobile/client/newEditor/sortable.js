Sortable._create = function(el, options){
  var obj = new Object();
  obj._sortable = window.MySortable(el, options);
  obj._views = {};

  obj.add = function(index, doc){
    if(arguments.length <= 1){
      doc = index;
      index = null;
    }

    // fix data
    doc._id = doc._id || new Mongo.ObjectID()._str;
    doc.pid = doc.pid || new Mongo.ObjectID()._str;
    doc.type = doc.type || 'text';
    if(doc.type === 'text'){doc.isImage = false; doc.html = doc.html || doc.text;}

    // fix index
    index = index < 0 ? 0 : index;
    index = index > el.children.length ? el.children.length : index;

    var view = null;
    if (!index && index !== 0)
      view = Blaze.renderWithData(Template.newEditorItem, doc, el);
    else
      view = Blaze.renderWithData(Template.newEditorItem, doc, el, el.children[index]);
    obj._views[doc.pid] = view;

    // if (index <= 0)
    //   el.insertBefore(el.lastChild, el.firstChild); // index is 0 的时候renderWithData会写到最后，需要修正
  };

  obj.addAll = function(docs){
    docs.map(function(doc, index){
      doc._id = doc._id || new Mongo.ObjectID()._str;
      doc.pid = doc.pid || new Mongo.ObjectID()._str;
      doc.type = doc.type || 'text';
      if(doc.type === 'text'){doc.isImage = false;}
      var view = Blaze.renderWithData(Template.newEditorItem, doc, el);
      obj._views[doc.pid] = view;
    });
  }

  obj.getView = function(pid){
    return obj._views[pid];
  }

  obj.update = function(pid, doc){
    var view = obj._views[pid];
    var data = view.dataVar.get();
    for(var key in doc)
      data[key] = doc[key];
    view.dataVar.set(data);
  }

  obj.getDocs = function(){
    var result = [];
    if(el.children.length > 0){
      for(var i=0;i<el.children.length;i++){
        var data = {};
        var elm = el.children[i];
        var $elm = $(elm);
        data = Blaze.getData(elm);
        
        var text = $elm.find('.text').text();
        var html = $elm.find('.text').html();

        switch(data.type){
          case 'text':
            data.text = text;
            data.html = html;
            result.push(data);
            break;
          case 'image':
            data.imgUrl = $elm.data('imgurl');
            data.filename = $elm.data('filename');
            data.URI = $elm.data('uri');
            result.push(data);
            break;
          case 'iframe':
            data.iframe = $elm.data('iframe');
            data.imgUrl = $elm.data('imgurl');
            result.push(data);
            break;
          case 'music':
            data.musicInfo.imgUrl = $elm.data('imgurl');
            data.musicInfo.songName = $elm.data('song-name');
            data.musicInfo.singerName = $elm.data('singer-name');
            data.musicInfo.URI = $elm.data('uri');
            data.musicInfo.filename = $elm.data('filename');
            result.push(data);
            break;
          case 'video':
            break;
        }

        if(data.type != 'text' && html && text){
          result.push({
            _id: new Mongo.ObjectID()._str,
            pid: data.pid,
            type: "text",
            isImage: false,
            text: text,
            html: html
          });
        }
      }
    }

    return result;
  };

  obj.destroy = function(){
    obj._views = null;
    obj._sortable.destroy();
    obj._sortable = null;
  };

  return obj;
};
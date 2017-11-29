Template.editorInstrucations.helpers({
  editorModel: function(){
    if(this.editor === 'simple'){
      return '(简易模式)';
    }
    return '(经典模式)';
  },
  isSimpleEditor: function(){
    return this.editor === 'simple';
  }
});

Template.editorInstrucations.events({
  'click .leftButton': function (e) {
    Tips.close();
  }
});
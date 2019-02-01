Template.cameraInfo.onRendered(function() {
  Tracker.autorun(function() { 
    var cameraId = Session.get('curCameraId');
    if (cameraId) {
      var camera = Cameras.findOne(cameraId);
      this.uuid = camera.uuid;
      var group = SimpleChatGroups.findOne({_id: camera.groupId});
      if (group) {
        this.groupName =  group.name;
      }
    }
  });
}) 

Template.cameraInfo.helpers({
  uuid: function() {
    console.log('neo+++');
    console.log(Template.instance());
    var cameraId = Session.get('curCameraId');
    return Cameras.findOne(cameraId).uuid;
  },
  groupName: function() {

  }
});

Template.cameraInfo.events({ 
  'click .info-close': function(e, t) { 
    e.preventDefault();
    var curCheckedCamera = d3.select("[data-mongo-id='" + Session.get('curCameraId') + "']");
    if (!curCheckedCamera.empty()) {
      curCheckedCamera.classed('camera-checked', false);
    }

    Session.set('curCameraId', null);
  },
  'click .reset-camera': function (e, t) {
    e.preventDefault();
    var cameraId = Session.get('curCameraId');
    if (cameraId) {
      Cameras.remove({
        _id: cameraId
      });
    }

    var d3Item = d3.select("[data-mongo-id='"+cameraId+"']");
    if (!d3Item.empty()) {
      d3Item.remove();
      Session.set('curCameraId', null);
    }
  }
});
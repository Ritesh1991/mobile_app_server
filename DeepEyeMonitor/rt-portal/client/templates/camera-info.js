Template.cameraInfo.onRendered(function() {}); 

Template.cameraInfo.helpers({
  uuid: function() {
    if (this.cameraId) {
      var imageData = $('image[data-mongo-id=\'' + this.cameraId + '\']').data();
      return imageData ? imageData.uuid : '';
    }
  },
  groupName: function() {
    var groupId = Cameras.findOne(this.cameraId).groupId;
    var group = SimpleChatGroups.findOne({ _id: groupId });

    return group ? group.name : '';
  },
  personName: function () {
    if (this.cameraId) {
      var imageData = $('image[data-mongo-id=\'' + this.cameraId + '\']').data();
      return imageData ? imageData.name : '';
    }
  },
  occuredAt: function() {
    if (this.cameraId) {
      var imageData = $('image[data-mongo-id=\'' + this.cameraId + '\']').data();
      return imageData ? '出现时间: ' + moment(new Date(imageData.ts)).fromNow() : '';
    }
  },
  avatarUrl: function() {
    if (this.cameraId) {
      return $('image[data-mongo-id=\'' + this.cameraId + '\']').attr('href');
    }
  }
});

Template.cameraInfo.events({ 
  'click .info-close': function(e, t) { 
    e.preventDefault();
    
    Session.set('cameraId', null);
    var curCheckedCamera = d3.select('[data-mongo-id=\'' + this.cameraId + '\']');
    if (!curCheckedCamera.empty()) {
      curCheckedCamera.classed('camera-checked', false);
    }
  },
  'click .reset-camera': function (e, t) {
    e.preventDefault();
    if (this.cameraId) {
      Cameras.remove({
        _id: this.cameraId
      });
    }

    Session.set('cameraId', null);
    var d3Item = d3.select('[data-mongo-id=\'' + this.cameraId + '\']');
    if (!d3Item.empty()) {
      d3Item.remove();
    }
  }
});
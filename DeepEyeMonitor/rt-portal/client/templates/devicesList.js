Template.devicesList.helpers({
  'devices': function () {
    //console.log(selected_printer_id.get());
    return Devices.find();
  }
});


Template.deviceDetail.helpers({
  'groupName': function (groupId) {
    var group = SimpleChatGroups.findOne({
      _id: groupId
    });
    if (group) {
      return group.name;
    }
  },
  'latestImage': function (uuid) {
    var data = TimelineLists.findOne({
      uuid: uuid
    });
    if (data) {
      return data.img_url;
    }
  }
});

Template.deviceDetail.events({
  'click .add-camera': function(e, t) {
    e.preventDefault();
    var svgCircle = d3.select('circle');
    if (svgCircle.empty()) {
      Materialize.toast('请选择摄像头摆放位置', 1000);
      return;
    }

    var cameraInfo = {
      uuid: this.uuid,
      name: this.name,
      groupId: this.groupId,
      coordinates: [svgCircle.attr('cx'), svgCircle.attr('cy')]
    };
    
    Cameras.insert(cameraInfo);
    Materialize.toast('Printer successfully added', 1000);
    svgCircle.remove();
  }
});
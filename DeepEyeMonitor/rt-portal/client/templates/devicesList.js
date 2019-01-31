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

Template.devicesList.events({
  'submit': function (event) {
    event.preventDefault();
    //console.log(event);
    var target = event.target;
    var uuid = this.uuid;
    var name = this.name;
    var printer = {
      uuid: uuid,
      name: name
    };

    if (!selected_printer_id.get()) { //no printer selected
      if (current_coords.get()) {
        //console.log(printer);
        printer.coordinates = current_coords.get();
        Cameras.insert(printer);
        Materialize.toast('Printer successfully added');
        event.target.reset();
      } else {
        Materialize.toast('Please choose a location and fill out the required information', 4000);
      }
    } else { //update the printer
      old_printer = Cameras.findOne({
        _id: selected_printer_id.get()
      });
      delete old_printer._id;
      _.each(printer, function (value, key) {
        if (value) {
          old_printer[key] = value;
        }
      });
      Cameras.update({
        _id: selected_printer_id.get()
      }, {
        $set: old_printer
      });
    }
  }
});

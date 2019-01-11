if(Meteor.isClient){
  ClientSideTimeLineKnown = new Meteor.Collection('client_side_timeline_known', { connection: null });
  ClientSideTimeLineUnknown = new Meteor.Collection('client_side_timeline_unknown', { connection: null });
  Meteor.startup(function(){
    function processProcessDeviceTimeLineDate(data){
      if(data && data['perMin']){
        for(min in data['perMin']){
          if (data['perMin'].hasOwnProperty(min)) {
            var items = data['perMin'][min]
            if(items){
              for(itemKey in items){
                if (items.hasOwnProperty(itemKey)) {
                  var person=items[itemKey]
                  console.log(person)
                  if(person && person.person_name){
                    ClientSideTimeLineKnown.insert(person)
                  } else {
                    ClientSideTimeLineUnknown.insert(person)
                  }
                }
              }
            }
          }
        }
      }
    }
    Devices.find().observe({
      added:function(doc){
        console.log('device added ',doc)
        Meteor.subscribe('device-timeline',doc.uuid,2)
      }
    }),
    DeviceTimeLine.find().observeChanges({
      added:function(id,doc){
        var group_id = DeviceTimeLine.findOne({_id:id}).group_id
        var group=SimpleChatGroups.findOne({_id:group_id})
        //console.log('timeline added ',group,' ', doc)
        processProcessDeviceTimeLineDate(doc)
      },
      changed:function(id, fields){
        var group_id = DeviceTimeLine.findOne({_id:id}).group_id
        var group=SimpleChatGroups.findOne({_id:group_id})
        //console.log('timeline changed ',group,' ', fields)
        processProcessDeviceTimeLineDate(fields)
      }
    })
  })
}

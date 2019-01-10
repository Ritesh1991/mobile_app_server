if(Meteor.isClient){
  Meteor.startup(function(){
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
        console.log('timeline added ',group,' ', doc)
      },
      changed:function(id, fields){
        var group_id = DeviceTimeLine.findOne({_id:id}).group_id
        var group=SimpleChatGroups.findOne({_id:group_id})
        console.log('timeline changed ',group,' ', fields)
      }
    })
  })
}

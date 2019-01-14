if(Meteor.isClient){
  ClientSideTimeLineKnown = new Meteor.Collection('client_side_timeline_known', { connection: null });
  ClientSideTimeLineUnknown = new Meteor.Collection('client_side_timeline_unknown', { connection: null });
  Meteor.startup(function(){
    function processProcessDeviceTimeLineDate(data,uuid){
      if(data && data['perMin']){
        for(min in data['perMin']){
          if (data['perMin'].hasOwnProperty(min)) {
            var items = data['perMin'][min]
            if(items){
              for(itemKey in items){
                if (items.hasOwnProperty(itemKey)) {
                  var person=items[itemKey]
                  //console.log(person)
                  if(person && person.person_name && person.img_url){
                    //console.log(d3.select("[data-uuid='"+uuid+"']"))
                    var d3Item = d3.select("[data-uuid='"+uuid+"']")
                    //d3Item.enter()
                    //  .append("svg:img")
                    //  .attr("xlink:href",person.img_url)
                    if(d3Item.size()>0){
                      //Materialize.toast(uuid);
                      d3Item.attr("xlink:href",person.img_url)
                    }
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
        var timeLineData=DeviceTimeLine.findOne({_id:id})
        var group_id = timeLineData.group_id
        var uuid = timeLineData.uuid
        var group=SimpleChatGroups.findOne({_id:group_id})
        //console.log('timeline added ',group,' ', doc)
        processProcessDeviceTimeLineDate(doc,uuid)
      },
      changed:function(id, fields){
        var timeLineData=DeviceTimeLine.findOne({_id:id})
        var group_id = timeLineData.group_id
        var uuid = timeLineData.uuid
        var group=SimpleChatGroups.findOne({_id:group_id})
        //console.log('timeline changed ',group,' ', fields)
        processProcessDeviceTimeLineDate(fields,uuid)
      }
    })
  })
}

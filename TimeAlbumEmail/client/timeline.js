import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

function LocalZeroTimezoneTimestamp(d, time_offset) {
    if (time_offset == undefined){
        if (d.getTimezoneOffset() == 420){
            time_offset = -7
        }else {
            time_offset = 8
        }
    }
    // 取得 UTC time
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    var local_now = new Date(utc + (3600000*time_offset))
    
    var today_zero = new Date(Date.UTC(local_now.getFullYear(), local_now.getMonth(), local_now.getDate()));
            
    return today_zero.getTime();
}


Template.timeline.onCreated(function helloOnCreated() {

});

Template.timeline.helpers({
  timeLinelists() {
    now = new Date()
    localZeroDateTimestamp = LocalZeroTimezoneTimestamp(now, -7)
    console.log(localZeroDateTimestamp) 
    
    var ret_timeLists = []
    
    timeLists = TimelineLists.find({ZeroTimestamp:localZeroDateTimestamp}, {sort
:{createdAt:1}}).fetch()
    for (idx in timeLists) {
        console.log(timeLists[idx], timeLists[idx]["createdAt"].getTime())
        if (timeLists[idx]["createdAt"].getTime() < 1523296886840){
            continue
        }
        
        ret_timeLists.push(timeLists[idx])
    }
    
    return ret_timeLists
  }
});


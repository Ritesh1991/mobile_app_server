if(Meteor.isServer){
  Meteor.startup(function(){
    String.prototype.replaceAll = function(s1,s2) {
      return this.replace(new RegExp(s1,"gm"),s2);
    };

    function calcTimeStamp23() {
      var now = new Date();
      var millisTill23 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0, 0, 0) - now;
      if (millisTill23 < 0) {
        millisTill23 += 86400000; // it's after 10am, try 10am tomorrow.
      }
      console.log('millisTill23:', millisTill23);
      return millisTill23;
    }

    function sendGroupJobReport(group, emails) {
      var group_id = group._id;
      var now = new Date();
      var date = Date.UTC(now.getFullYear(),now.getMonth(), now.getDate(), 0, 0, 0, 0);

      var time_offset = 8;
      if (group && group.offsetTimeZone) {
        time_offset = group.offsetTimeZone;
      }

      var job_report = Assets.getText('email/job-report.html');
      job_report = job_report.replaceAll('{{company_name}}', group.name);
      job_report = job_report.replaceAll('{{job_date}}', new Date(date).toISOString().split('T')[0]);

      var subject = "每日考勤报告";
      var to = group.report_emails;
      if (emails){
        to = emails;
      }

      var job_content = '';

      var checkin_content = '',
          uncheckin_content = '',
          checkin_count = 0,
          uncheckin_count = 0;

      var check_names = []; 

      var workStatus = WorkStatus.find({group_id: group_id, date: date});
      console.log('==sr==. date is '+date+' and time is '+new Date(date) +' and local time is '+ DateTimezone(time_offset));

      if (workStatus) {
        workStatus.forEach(function(ws) {
          var pContentCheck = Assets.getText('email/job-checkin-item.html');

          var in_time = ws.in_time ? ws.in_time : ws.out_time; 
          var in_img = ws.in_image ? ws.in_image: ws.out_image;

          var strInTime = new Date(in_time);
          strInTime = strInTime.shortTime(time_offset, true);

          pContentCheck = pContentCheck.replaceAll('{{person_in_time}}', strInTime);
          pContentCheck = pContentCheck.replace('{{person_name}}', ws.person_name);
          pContentCheck = pContentCheck.replace('{{person_in_image}}', in_img);
          
          checkin_count += 1;
          checkin_content += pContentCheck;
          check_names.push(ws.person_name);
        });
      }

      var persons = Person.find({group_id:group_id, name:{$nin: check_names}});
      persons.forEach( function (person) {
        var pContentUnCheck = Assets.getText('email/job-uncheckin-item.html');
        if(person && person.url) {
          pContentUnCheck = pContentUnCheck.replace('{{person_in_image}}', person.url);
          pContentUnCheck = pContentUnCheck.replace('{{person_name}}', person.name);
          uncheckin_count += 1;
          uncheckin_content += pContentUnCheck;
        }
      });
      
      job_report = job_report.replace('{{job_checkin_content}}', checkin_content);
      job_report = job_report.replace('{{job_uncheckin_content}}', uncheckin_content);
      job_report = job_report.replace('{{checkin_member_count}}', checkin_count);
      job_report = job_report.replace('{{uncheckin_member_count}}', uncheckin_count);
      

      try {
          Email.send({
              to: to,
              from: '故事贴<notify@mail.tiegushi.com>',
              subject: subject,
              html: job_report,
              envelope: {
                  from: "故事贴<notify@mail.tiegushi.com>",
                  to: to + "<" + to + ">"
              }
          });

          // console.log('send mail to:', notifyUser.userEmail);
      } catch (_error) {
        ex = _error;
        //console.log("err is: ", ex);
        console.log("Exception: sendEmail: error=%s, to=%s", ex, to);
      }
    }

    function delay3HourThenScheduleAgain() {
      console.log('delay3HourThenScheduleAgain');
      Meteor.setTimeout(sendJobReport, calcTimeStamp23());
    }

    function DateTimezone(offset) {
      var d = new Date();
      var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      var local_now = new Date(utc + (3600000*offset))

      return local_now;
    }

    function sendJobReport() {
      try {
        var groups = SimpleChat.Groups.find({report_emails: {$exists: true}});
        groups.forEach(function(group) {
          var time_offset = 8;
          if (group && group.offsetTimeZone) {
            time_offset = group.offsetTimeZone;
          }

          var local_time = DateTimezone(time_offset);
          if(local_time.getHours() == 12) { // 群组本地时间 12 点 发送
            console.log('sendJobReport, and group_id is '+group._id+', and current timeOffsetZone is '+time_offset);
            console.log(group._id, group.report_emails);
            sendGroupJobReport(group);
          }
        });
      }
      catch(ex) {
        console.log("exception in sendJobReport", ex);
      }

      //Meteor.setTimeout(delay3HourThenScheduleAgain, 3*60*60*1000);
    }

    //Meteor.setTimeout(sendJobReport, calcTimeStamp23());
    // 邮件发送
    SyncedCron.add({
      name: 'send report email 12:00 am every day',
      schedule: function(parser){
        // parser is later.parse pbject
        // UTC -7 的12：00 am 也就是 UTC 8 下一天的 03:00 am 
        // 每小时执行一次
        return parser.text('every 1 hour');
      },
      job: function(){
        sendJobReport();
        return 1;
      }
    });

    SyncedCron.start();

    Meteor.methods({
      // for local test method 
      'testGroupDailyReport': function (group_id, emails) {
        var group = SimpleChat.Groups.findOne({_id: group_id});
        console.log(group._id, emails);
        console.log(group._id, group.report_emails);
        sendGroupJobReport(group, emails);
      }
    });
  });
}

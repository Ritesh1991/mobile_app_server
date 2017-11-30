
if Meteor.isServer
  Meteor.startup ()->
    if (not process.env.MAIL_URL) or  process.env.MAIL_URL is ''
      #process.env.MAIL_URL = 'smtp://postmaster%40sandboxb40d25ffd9474e8b88a566924d4167bb.mailgun.org:9bad59febb44cf256ff0766960922980@smtp.mailgun.org:587'
      # process.env.MAIL_URL = 'smtp://notify%40mail.tiegushi.com:Actiontec753951@smtpdm.aliyun.com:465'
      process.env.MAIL_URL = 'smtp://postmaster%40email.tiegushi.com:1b3e27a9f18007d6fedf46c9faed519a@smtp.mailgun.org:587'
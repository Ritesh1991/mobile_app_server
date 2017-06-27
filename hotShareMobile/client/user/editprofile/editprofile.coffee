#space 2
if Meteor.isClient
  Template.editprofile.rendered=->
    if Session.get('dashboardHeight') is undefined
      Session.set('dashboardHeight', $(window).height())
    $('.dashboard').css 'min-height', Session.get('dashboardHeight')
    $('body').css('height', 'auto')
  Template.editprofile.onDestroyed ()->
    $('body').css('height', '100%')
  Template.editprofile.helpers
    myProfileIcon:->
      me = Meteor.user()
      if me and me.profile and me.profile.icon
        Session.setPersistent('persistentProfileIcon',me.profile.icon)
      Session.get('persistentProfileIcon')
    nickname:()->
      if Meteor.user()
        if Cookies.check("display-lang")
          if Cookies.get("display-lang") is 'en'
            Meteor.user().profile.fullname || Meteor.user().username ||'[N/A]'
          else
            Meteor.user().profile.fullname || Meteor.user().username ||'[无]'
        else
          Meteor.user().profile.fullname || Meteor.user().username ||'[无]'
    sex:()->
      if Meteor.user() and Meteor.user().profile.sex
        if Cookies.check("display-lang")
          if Cookies.get("display-lang") is 'en'
            if Meteor.user().profile.sex is 'male'
              return 'Male'
            else if Meteor.user().profile.sex is 'female'
              return 'Female'
          else
            if Meteor.user().profile.sex is 'male'
              return '男'
            else if Meteor.user().profile.sex is 'female'
              return '女'
        else #zh
          if Meteor.user().profile.sex is 'male'
              return '男'
          else if Meteor.user().profile.sex is 'female'
              return '女'
      return '[未知]'

  Template.editprofile.events
    'click .leftButton':->
      Router.go('/user')
    'click .user-icon': ->
      val = $('.user-icon .icon').html()
      uploadFile 160, 160, 60, (status,result)->
        $('.user-icon .icon').html('<span class="fa fa-spinner fa-spin" style="position: relative;"></span>')
        if status is 'done' and result
          $('.user-icon .icon').html('<img src="'+result+'"  width="60" height="60">')
          Meteor.users.update Meteor.userId(),{$set:{'profile.icon':result}}
          Meteor.call 'updateFollower',Meteor.userId(),{icon:result}
          Meteor.call 'updateFollowSeriesInfo',Meteor.userId(),{icon:result}
          console.log '头像上传成功：' + result
        else
          $('.user-icon .icon').html(val)
        return
      return
    'click .user-nick-name' :->
      Session.set('fromEditProfile',true)
      Router.go('/setNickname')
    'click .user-sex' :->
      Session.set('fromEditProfile',true)
      Router.go('/setSex')


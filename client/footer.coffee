#space 2
if Meteor.isClient
  Template.footer.helpers
    focus_style:(channelName)->
      channel = Session.get "channel"
      if channel is channelName
        return "focus"
      else
        return ""
    icon_size:(channelName)->
      channel = Session.get "channel"
      if channel is channelName
        return true
    display_footer:()->
      Meteor.isCordova


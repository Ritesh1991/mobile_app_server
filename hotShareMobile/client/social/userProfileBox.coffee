if Meteor.isClient
  Template.userProfileBox.helpers
    displayUserProfileBox:()->
      if Session.get('displayUserProfileBox') is true
      	return true
      else
      	return false
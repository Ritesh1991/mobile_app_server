/**
 * Created by simba on 4/16/16.
 */
Template.home.helpers({
  isLogging: function(){
    return Meteor.loggingIn();
  },
  gosignup: function(){
    return Session.get('gosignup');
  }
});

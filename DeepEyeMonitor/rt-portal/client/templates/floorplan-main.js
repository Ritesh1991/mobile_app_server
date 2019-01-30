Template.floorplanMain.onRendered(function() {
  this.$('.button-collapse').sideNav();
});

Template.floorplanMain.helpers({ 
  username: function () {
    return Meteor.user().username;
  }
}); 

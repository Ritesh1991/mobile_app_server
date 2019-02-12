Template.floorplanMain.onRendered(function() {
  this.$('.button-collapse').sideNav();
  this.$('.collapsible').collapsible();

  Meteor.subscribe('getUserGroups');
});

Template.floorplanMain.helpers({ 
  username: function () {
    return Meteor.user().username;
  },
  organizations: function () {
    return GroupUsers.find().fetch();
  }
}); 

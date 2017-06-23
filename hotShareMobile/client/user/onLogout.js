/**
 * Created by simba on 6/21/17.
 */

if (Meteor.isClient) {
    Meteor.startup(function() {
        Accounts.onLogout(function() {
            console.log('onLogout '+Meteor.userId())
            Session.setPersistent('persistentLoginStatus', false);
            FollowPosts.remove({followby:Meteor.userId()})
        });
    });
}

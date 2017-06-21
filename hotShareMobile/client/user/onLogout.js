/**
 * Created by simba on 6/21/17.
 */

if (Meteor.isClient) {
    Meteor.startup(function() {
        Accounts.onLogout(function(user,connection) {
            console.log('onLogout '+user._id)
            Session.setPersistent('persistentLoginStatus', false);
            FollowPosts.remove({followby:user._id})
        });
    });
}

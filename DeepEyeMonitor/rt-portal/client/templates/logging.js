if (Meteor.isClient) {
	Template.logging.rendered = function(){
		Accounts.onLogin(function(){
			Router.go('/dashboard/box-monitors-alive');
		})
	};

}

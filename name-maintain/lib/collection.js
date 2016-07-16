RefNames = new Mongo.Collection("refnames");
Posts = new Meteor.Collection('posts');

if (Meteor.isServer){
    Meteor.startup(function(){
        Posts._ensureIndex({createdAt: -1});
        Posts._ensureIndex({browse: -1});
    });
    FollowPosts = new Meteor.Collection('followposts');
    Feeds = new Meteor.Collection('feeds');
    Drafts = new Meteor.Collection(null);
    SavedDrafts = new Meteor.Collection('saveddrafts');
    Follows = new Meteor.Collection('follows');
    Follower = new Meteor.Collection('follower');
    Topics = new Meteor.Collection('topics');
    TopicPosts = new Meteor.Collection('topicposs');
    Comment = new Meteor.Collection('comment');
    Viewers = new Meteor.Collection('viewers');
    RefComments = new Meteor.Collection("refcomments");
    ReComment = new Meteor.Collection('recomment');
    Reports = new Meteor.Collection('reports');
    Messages = new Meteor.Collection('messages');
    MsgSession = new Meteor.Collection('msgsession');
    MsgGroup = new Meteor.Collection('msggroup');
    Meets = new Meteor.Collection('meets');
    Users = new Meteor.Collection ('users');
    PComments = new Meteor.Collection("pcomments")
    Meteor.publish('refnames',function(){
        return RefNames.find({})
    });
    Meteor.publish('createAtPosts',function(){
      return Posts.find({},{sort:{createdAt: -1},limit:200});
    //  return Posts.find({}, { title: 1, browse: 1, ownerName: 1, owner:1,createdAt: 1 }).sort({ createdAt: -1 }).limit(200);
    });
    Meteor.publish('top100',function(){
      return Posts.find({},{sort:{browse: -1},limit:100});
    //  return Posts.find({},{title:1,browse:1,ownerName:1,owner:1,createdAt:1}).sort({browse: -1}).limit(100);
    });
    Meteor.publish('posts-visits-count', function() {
        Counts.publish(this, 'posts-visits', Posts.find(), { countFromField: 'browse' });
    });
    RefNames.allow({
        insert: function (userId, doc) {
            check(doc.text,String);
            if(RefNames.find({text:doc.text}).count() > 0){
                return false;
            }
            return true;
        },
        update: function (userId, doc) {
            return true;
        },
        remove: function (userId, doc) {
            return true;
        }
    });
    Meteor.methods({
            'getStatics':function(){
                var total_posts = Posts.find().count();
                var total_users = Users.find().count();
                var total_meets = Meets.find().count()/2;
                var browser_users = Users.find({'profile.browser':true}).count();
                var app_users = Users.find({'profile.browser':{$ne:true}}).count();
                var named_users = Users.find({'profile.anonymous':{$ne:true}}).count();
                var total_views = Viewers.find().count();
                var total_comments = Comment.find().count();
                var total_saved_draft = SavedDrafts.find().count();
                var suggest_read = Feeds.find({'eventType':'recommand'}).count();
                var friends_request = Feeds.find({'eventType':'sendrequest'}).count();
                var total_ups = PComments.find({"ptype" : "like"}).count();
                var total_dns = PComments.find({"ptype" : "dislike"}).count();
                var total_pcs = PComments.find({"ptype" : "pcomments"}).count();
                return {
                    total_posts:total_posts,
                    total_users:total_users,
                    browser_users:browser_users,
                    app_users:app_users,
                    named_users:named_users,
                    total_views:total_views,
                    total_meets:total_meets,
                    total_comments:total_comments,
                    total_saved_draft:total_saved_draft,
                    suggest_read:suggest_read,
                    friends_request:friends_request,
                    total_ups:total_ups,
                    total_dns:total_dns,
                    total_pcs:total_pcs
                };
            }
        }
    );
    /*
    Meteor.startup(function(){
        var getRandomAnonymousName = function() {
            try{
                var name_numbers = RefNames.find().count();
                var skipNumber = parseInt(Math.random() * name_numbers);
                var anonymousName = RefNames.findOne({}, {fields: {text: 1}, skip: skipNumber}).text;
                if( anonymousName &&  anonymousName !== ''){
                    return anonymousName;
                }
            } catch(error) {
                return null;
            }
        };
        var anonymousUsers = Users.find({'profile.anonymous':true,'profile.fullname':'匿名'});
        anonymousUsers.forEach(function(data){
            var toNewName = getRandomAnonymousName();
            console.log('User ID ' + data._id + 'User Name ' + data.profile.fullname + ' to New Name ' + toNewName);
            Users.update({_id:data._id},{$set:{'profile.fullname':toNewName}});
        });
        anonymousUsers = Users.find({'profile.anonymous':true,'profile.icon':'/userPicture.png'});
        anonymousUsers.forEach(function(data){
            var randomI = parseInt(Math.random()*33+1);
            var icon = 'http://data.tiegushi.com/anonymousIcon/anonymous_' + randomI + '.png';
            console.log('User ID ' + data._id + 'User ICON ' + data.profile.icon + ' to New Name ' + icon);
            Users.update({_id:data._id},{$set:{'profile.icon':icon}});
        });
    });*/
}


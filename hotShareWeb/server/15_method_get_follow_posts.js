/**
 * Created by simba on 6/15/17.
 */

if(Meteor.isServer){
    Meteor.startup(function(){
        Meteor.methods({
            "getFollowPost":function (skip,limit){
                if (this.userId === null){
                    throw new Meteor.Error(500, 'Error 500: User Not Login', 'UserId is null');
                }
                if(!Match.test(skip, Number) || !Match.test(limit, Number)) {
                    throw new Meteor.Error(501, 'Error 501: Format is Wrong', 'request format is wrong');
                }
                var returnResult = []
                var userId = this.userId;
                this.unblock();
                try{
                    ensureFollowInNeo4j(userId)
                    var queryResult = getFollowPostFromNeo4J( userId,skip,limit);

                    if(queryResult && queryResult.length > 0){
                        console.log('To send '+queryResult.length+' follow post result to client')
                        queryResult.forEach(function (postInfo) {
                            if(postInfo){
                                var followedPost = formatFollowPost(userId, postInfo);
                                followedPost._id = postInfo.postId
                                console.log(followedPost.fromUrl)
                                console.log(followedPost.type)
                                returnResult.push(followedPost)
                            }
                        });
                    }
                } catch(e){
                    console.log(e)
                    console.log('Exception in Meteor.methods(getFollowPost)')
                }
                return returnResult;
            }
        });
    });
}
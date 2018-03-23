/**
 * Created by simba on 6/6/17.
 */
if(Meteor.isServer){
    Meteor.startup(function() {
        Meteor.methods({
            "pullLatestPosts": function (since,limit) {
                if (this.userId === null) {
                    return false;
                }
                this.unblock();
                var queryLimit = limit
                if(!limit){
                    queryLimit = 10
                }
                userId = this.userId;
                ensureFollowInNeo4j(userId)
                var queryResult = getLatestFollowPostFromNeo4J(userId,since,queryLimit)
                console.log('from neo4j latest follow post')
                console.log(queryResult)
                var returnResult = []
                try{
                    if(queryResult && queryResult.length > 0){
                        queryResult.forEach(function (item) {
                            if(item){
                                var fields = formatFollowPost(userId, item);
                                fields['_id'] = item.postId;
                                returnResult.push(fields);
                            }
                        });
                    }
                } catch(e) {
                    console.log(e)
                    console.log('in pullLatestPosts, exception')
                }

                return returnResult;
            }
        })
    })
}
/**
 * Created by simba on 10/5/16.
 */

if(Meteor.isServer){
    Meteor.startup(function(){

        var suggestPostsUserId = Meteor.users.findOne({'username': 'suggestPosts'})._id;
        getSuggestPostsFromNeo4J = function(userId,postId,skip,limit){
            /*
             * 读懂本条必备的知识：
             * MATCH/WRERE
             * WITH AS, 定义相当于局部变量
             * distinct 剔除重复
             * collect 将数据合并到一个数组中
             * UNWIND 将数据解散到 Neo4J可以操作的逐条记录
             */
            var queryString = '' +
                'MATCH (u:User)-[v:VIEWER]->(p:Post)<--(u1:User),(u1:User)-[v1:VIEWER]->(p1:Post) ' +
                'WHERE p.postId="'+ postId + '" and ' +
                'u.userId="'+ userId + '" and ' +
                'u1.userId <>"'+ userId + '" and ' +
                'not((u)-->(p1)) ' +
                'WITH distinct p1 as postInfo, ' +
                'p1.createdAt as createdAt,' +
                'collect(distinct u1) as readers,' +
                'collect(distinct v1.by) as readsBy ' +
                'UNWIND readers[0..1] AS reader ' +
                'UNWIND readsBy[0..1] AS readBy ' +
                'RETURN reader,postInfo ORDER BY readBy DESC SKIP '+skip+' LIMIT '+limit;

            var e, queryResult;

            try {
                queryResult = Neo4j.query(queryString);
            } catch (_error) {
                e = _error;
                console.log("Can't query hot post from neo4j server");
                if (postMessageToGeneralChannel) {
                    if (process.env.PRODUCTION) {
                        postMessageToGeneralChannel("@everyone Can't query hot post from neo4j server, this is reporting from Production server.");
                    } else {
                        postMessageToGeneralChannel("@everyone Can't query hot post from neo4j server, this is reporting from Test/Local  server.");
                    }
                }
                return false;
            }

            console.log(queryString);
            updateSucc();
            return queryResult;
        }
        Meteor.methods({
            "getSuggestedPosts": function (postId,skip,limit) {
                if (this.userId === null || !Match.test(postId, String) || !Match.test(skip, Number)|| !Match.test(limit, Number)) {
                    return false;
                }
                this.unblock();

                var response = [];
                var queryResult = getSuggestPostsFromNeo4J(this.userId, postId,skip,limit);
                if (queryResult && queryResult.length > 0) {
                    queryResult.forEach(function(item) {
                        var viewer = item[0];
                        var post = item[1];
                        var userfullname = viewer.fullname ? viewer.fullname : viewer.username;
                        console.log(userfullname + '--- > postId: ' + JSON.stringify(post));
                        //var postInfo = Posts.findOne({_id:postId},{fields:{mainImage:1,title:1,addontitle:1}});
                        if(post){
                            response.push({
                                postId:post.postId,
                                mainImage:post.mainImage,
                                title:post.name,
                                addontitle:post.addonTitle,
                                reader:userfullname
                            })
                        }
                    });
                } else {
                    var suggestPosts = FollowPosts.find({
                        followby: suggestPostsUserId
                    }, {
                        sort: {
                            createdAt: -1
                        },
                        skip: skip,
                        limit: limit,
                        fields:{
                            mainImage:1,title:1,addontitle:1,ownerName:1,postId:1
                        }
                    }).fetch();
                    if(suggestPosts.length > 0){
                        console.log(suggestPosts)
                        suggestPosts.forEach(function(item) {
                            if(item){
                                response.push({
                                    postId:item.postId,
                                    mainImage:item.mainImage,
                                    title:item.title,
                                    addontitle:item.addontitle,
                                    ownerName:item.ownerName
                                })
                            }
                        });
                    }
                }
                return response;
            }
        });
    });
}


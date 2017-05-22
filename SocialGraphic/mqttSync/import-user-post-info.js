/**
 * Created by simba on 5/6/16.
 */

module.exports.save_user_node=save_user_node;
module.exports.save_post_node=save_post_node;
module.exports.remove_post=remove_post;

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var url = process.env.MONGO_URL;

var dbGraph = require("seraph")({ server: process.env.NEO4J_SERVER,
    endpoint: process.env.NEO4J_ENDPOINT,
    user: process.env.NEO4J_USER,
    pass: process.env.NEO4J_PASSWORD });

function remove_post(id){
    dbGraph.query('MATCH (p:Post {postId: "'+id+'"}) DETACH DELETE p;', function(err, results) {
        // TODO:
    });
}

function update_remove_post(db){
    var latestPost = new Date()
    latestPost.setHours(latestPost.getHours() - 48)
    latestPost = latestPost.getTime()

    latestView = new Date()
    latestView.setHours(latestView.getHours() - 24)
    latestView = latestView.getTime()

    // dbGraph.query('MATCH (u:User)-[v:VIEWER]->(p:Post) WITH v,p,length(()--p) AS views RETURN DISTINCT p.postId,p,length(()--p) AS views LIMIT 10', function(err, results) {
    //     var item = results[0];
    //     console.log(item);
    //     dbGraph.delete(item.p.id, true, function(err) {console.log(err)});
    //     console.log('remove node:', item);
    // });
    
    dbGraph.query('MATCH (u:User)-[v:VIEWER]->(p:Post) WITH v,p,length(()--p) AS views WHERE v.by > '+latestView+' AND views > 50 AND p.createdAt > '+latestView+'  RETURN DISTINCT p.postId,p,length(()--p) AS views  ORDER BY views DESC LIMIT 10', function(err, results) {
        console.log('update_remove_post: ' + results.length)
        results.forEach(function(item){
            db.collection('posts').findOne({_id: item.p.postId},{fields:{_id: true}}, function(err, post) {
                if(!err && !post){
                    dbGraph.delete(item.p.id, true, function(err) {if(err){console.log(err)}});
                    console.log('remove node:', item.p.postId);
                }
            });
        });
    });
}
MongoClient.connect(url, function(err, db) {
    // update_remove_post(db);
    // setTimeout(function() {
    //     update_remove_post(db);
    // }, 1000*60*10);
});

function check_user_existing(id,cb){
    if(id && id !='' && cb){
        dbGraph.find({userId: id}, 'User', function(err, results) {
            if (err) {
                // A Neo4j exception occurred
                cb(null);
                return;
            }
            // do something with the matched node(s).
            if(results && results.length > 0){
                console.log('Result is '+results)
                cb(results);
            } else {
                cb(null);
            }
        });
    }
}
function check_post_existing(id,cb){
    if(id && id !='' && cb){
        dbGraph.find({postId: id}, 'Post', function(err, results) {
            if (err) {
                // A Neo4j exception occurred
                cb(null);
                return;
            }
            // do something with the matched node(s).
            if(results && results.length > 0){
                console.log('Result is '+results)
                cb(results);
            } else {
                cb(null);
            }
        });
    }
}
function save_user_node(doc,cb){
    if (doc !== null) {
        try{
            var userInfo={
                userId:doc._id,
                createdAt:doc.createdAt.getTime(),
                fullname: doc.profile.fullname,
                device: doc.type,
                sex: doc.profile.sex?doc.profile.sex:'',
                lastLogonIP:doc.profile.lastLogonIP,
                anonymous:doc.profile.anonymous?true:false,
                browser:doc.profile.browser?true:false,
                location:doc.profile.location
            }
            if(doc.services &&doc.services.weixin){
                userInfo.wechatLogin = true
            } else {
                userInfo.username = doc.username
            }
        } catch (e){
            if(cb){
                cb('Cant Build userInfo')
            }
            return;
        }
        dbGraph.save(userInfo, function(err, nodeL) {
            if (err) {
                console.log(err)
                console.log(nodeL)
                if(cb){
                    cb('Cant Save userInfo')
                }
                return;
            }
            dbGraph.label(nodeL, ['User'], function(err) {
                if(cb){
                    cb(null)
                }
            });
        });
    }
}
function save_post_node(doc,cb){
    if (doc !== null) {
        try {
            var postInfo = {
                postId: doc._id,
                createdAt: doc.createdAt.getTime(),
                name: doc.title,
                addonTitle: doc.addontitle,
                ownerName: doc.ownerName,
                ownerId: doc.owner,
                mainImage: doc.mainImage
            }
        } catch (e) {
            if(cb){
                cb('Cant build postInfo')
            }
            return
        }
        dbGraph.save(postInfo, function (err, nodeL) {
            if (err) {
                console.log(err)
                console.log(nodeL)
                if(cb){
                    cb('Cant Save it')
                }
                return
            }
            dbGraph.label(nodeL, ['Post'], function (err) {
                // `node` is now labelled with "Car" and "Hatchback"!
                if(cb){
                    cb(null)
                }
            });
        });
    }
}
function grab_userInfo_in_hotshare(db,query){
    var cursor =db.collection('users').find(query);//.limit(3000);
    function eachUserInfo(err,doc){
        if(doc ===null){
            return
        }
        if(!err){
            console.dir(doc)
            save_user_node(doc,function(){
                setTimeout(function(){
                    cursor.next(eachUserInfo)
                },0)
            })
        } else{
            console.log('Got error in db find users '+err)
            setTimeout(function(){
                cursor.next(eachUserInfo)
            },0)
        }
    }
    cursor.next(eachUserInfo)
}
function grab_postsInfo_in_hotshare(db,query){
    var cursor =db.collection('posts').find(query,{fields:{
        title:true,
        addontitle:true,
        owner:true,
        _id:true,
        ownerName:true,
        createdAt:true,
        mainImage:true
    }});//.limit(3000).sort({createdAt:-1});
    function eachPostsInfo(err,doc){
        if(doc ===null){
            return
        }
        if(!err){
            console.dir(doc)
            save_post_node(doc,function(){
                setTimeout(function(){
                    cursor.next(eachPostsInfo)
                },0)
            })
        } else{
            console.log('Got error in db find posts '+err)
            setTimeout(function(){
                cursor.next(eachPostsInfo)
            },0)
        }
    }
    cursor.next(eachPostsInfo)
}

if(process.env.RUN_IMPORT_USER_POST){
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        var queryUser = {};
        var queryPost = {};
        if(process.env.DAY_SINCE_DAY_BEFORE){
            var day = parseInt(process.env.DAY_SINCE_DAY_BEFORE);
            var d = new Date();
            d.setDate(d.getDate()-day);
            queryUser = {createdAt:{$gt:d}}
            queryPost = {createdAt:{$gt:d}}
        }
        grab_userInfo_in_hotshare(db,queryUser);
        grab_postsInfo_in_hotshare(db,queryPost);
    });
}

/**
 * Created by simba on 6/21/17.
 */

if(Meteor.isServer){
    //this is very old version of
    Meteor.publish("postFriends", function (userId,postId,limit) {
        if(this.userId === null || !Match.test(postId, String) ){
            return this.ready();
        }
        else{
            var self = this;
            self.count = 0;
            self.meeterIds=[];
            //publicPostsPublisherDeferHandle(userId,postId,self);
            var handle = Meets.find({me: userId,meetOnPostId:postId},{sort: {createdAt: -1},limit:limit}).observeChanges({
                added: function (id,fields) {
                    var taId = fields.ta;
                    //Call defered function here:
                    if (taId !== userId){
                        if(!~self.meeterIds.indexOf(taId)){
                            self.meeterIds.push(taId);
                            newMeetsAddedForPostFriendsDeferHandle(self,taId,userId,id,fields);
                        }
                    }
                },
                changed: function (id,fields) {
                    self.changed("postfriends", id, fields);
                }/*,
                 removed:function (id,fields) {
                 self.removed("postfriends", id, fields);
                 }*/
            });
            self.ready();
            self.onStop(function () {
                handle.stop();
                delete self.meeterIds
            });
        }
    });
    Meteor.publish("dynamicMoments", function (postId,limit) {
        if(this.userId === null || !Match.test(postId, String) ){
            return this.ready();
        }
        else{
            var self = this;
            self.count = 0;
            var handle = Moments.find({currentPostId: postId,userId:{$ne:self.userId}},{sort: {createdAt: -1},limit:limit}).observeChanges({
                added: function (id,fields) {
                    momentsAddForDynamicMomentsDeferHandle(self,id,fields,self.userId);
                },
                changed:function (id,fields){
                    momentsChangeForDynamicMomentsDeferHandle(self,id,fields,self.userId);
                }
            });
            self.ready();
            self.onStop(function () {
                handle.stop();
            });
        }
    });

    Meteor.publish("newfriends", function (userId,postId) {
        if(this.userId === null || !Match.test(postId, String)){
            return this.ready();
        }
        else{
            var self = this;
            this.count = 0;
            var handle = Meets.find({me: userId},{sort:{createdAt:-1},limit:40}).observeChanges({
                added: function (id,fields) {
                    if (self.count<20)
                    {
                        var taId = fields.ta;
                        if(taId !== userId && postId === fields.meetOnPostId){
                            //Call defered function here:
                            newMeetsAddedForNewFriendsDeferHandle(self,taId,userId,id,fields);
                        }
                    }
                },
                changed: function (id,fields) {
                    if(fields.isFriend === true)
                    {
                        try{
                            self.removed("newfriends", id);
                            self.count--;
                        }catch(error){
                        }
                    }
                    //Call defered function here:
                    newMeetsChangedForNewFriendsDeferHandle(id,self,fields,userId,postId);
                },
                removed: function (id) {
                    try {
                        self.removed("newfriends", id);
                        self.count--;
                    } catch (error){
                    }
                }
            });

            self.ready();
            self.onStop(function () {
                handle.stop();
            });
        }
    });

    Meteor.publish('meetscountwithlimit', function(limit) {
        if(this.userId === null || !Match.test(limit, Number)){
            return this.ready();
        }
        return Meets.find({me:this.userId},{sort:{count:-1},limit:limit});
    });
    Meteor.publish('meetscount', function() {
        if(!this.userId){
            return this.ready()
        }
        return Meets.find({me:this.userId});
    });

    Meteor.publish("posts", function() {
        if(this.userId === null)
            return this.ready();
        else
            return Posts.find({owner: this.userId},{sort: {createdAt: -1}});
    });

    Meteor.publish("momentsWithLimit", function(postId,limit) {
        if(this.userId === null|| !Match.test(limit, Number)) {
            return this.ready();
        }
        else{
            return Moments.find({currentPostId: postId},{sort: {createdAt: -1},limit:limit});
        }
    });
}
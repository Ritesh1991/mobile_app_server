if Meteor.isClient
  Template.listPosts.rendered=->
    $('.content').css 'min-height',$(window).height()
#    $('.mainImage').css('height',$(window).height()*0.55)
    $(window).scroll (event)->
        target = $("#showMoreResults");
        FOLLOWPOSTS_ITEMS_INCREMENT = 10;
        if (!target.length)
            return;

        threshold = $(window).scrollTop() + $(window).height() - target.height();

        if target.offset().top < threshold
            if (!target.data("visible"))
                console.log("target became visible (inside viewable area)");
                target.data("visible", true);
                Session.set("followpostsitemsLimit",
                Session.get("followpostsitemsLimit") + FOLLOWPOSTS_ITEMS_INCREMENT);
        else
            if (target.data("visible"))
                console.log("target became invisible (below viewable arae)");
                target.data("visible", false);
  Template.listPosts.helpers
    getBrowseCount:(browse)->
      if (browse)
        browse
      else
        0
    myPosts:()->
      myFollowedPosts = FollowPosts.find({followby:Meteor.userId(),publish:{"$ne":false}}, {sort: {createdAt: -1}})
      Session.setPersistent('persistentMyFollowedPosts',myFollowedPosts.fetch())
      return Session.get('persistentMyFollowedPosts')
    moreResults:->
      !(FollowPosts.find().count() < Session.get("followpostsitemsLimit"))
    loading:->
      Session.equals('followPostsCollection','loading')
    loadError:->
      Session.equals('followPostsCollection','error')
  Template.listPosts.events
    'click .mainImage': (event)->
      Session.set("postPageScrollTop", 0)
      if isIOS
        if (event.clientY + $('.home #footer').height()) >=  $(window).height()
          console.log 'should be triggered in scrolling'
          return false
      $('.home').addClass('animated ' + animateOutLowerEffect);
      postId = this.postId
      Meteor.setTimeout ()->
        PUB.page '/posts/'+postId
      ,animatePageTrasitionTimeout
      console.log this.postId
      Session.set 'FollowPostsId',this._id
      console.log this._id

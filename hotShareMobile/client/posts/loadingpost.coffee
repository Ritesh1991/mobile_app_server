if Meteor.isClient
    Template.loadingPost.rendered=->
        $('.showPosts').css 'min-height',$(window).height()
    Template.loadingPost.events
      'click .back' :->
        PUB.back()
    Template.loadingPost.helpers
      isMobile:->
        Meteor.isCordova

    Template.kgPost.events
      'click .back' :->
        console.log('kgposts===>back')
        PUB.back()
    Template.kgPost.helpers
      isMobile:->
        Meteor.isCordova
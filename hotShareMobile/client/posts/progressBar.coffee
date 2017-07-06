if Meteor.isClient
    progressBar_blaze = null
    
    Template.progressBar.rendered=->
        #Session.set 'isDelayPublish',true
        Session.set 'progressBarWidth',1

    Template.progressBar.helpers
        isDelayPublish:->
            Session.get("isDelayPublish")
        progressBarWidth:->
            Session.get("progressBarWidth")
        is_cancel: ()->
            return Session.get('progressBarCancel')
        show: (cancel)->
            Session.set('progressBarCancel', cancel || false)
            if progressBar_blaze is null
                Session.set('progressBarWidth', 1);
                progressBar_blaze = Blaze.render Template.progressBar, document.body
            else
                Blaze.remove progressBar_blaze
                progressBar_blaze = null
        close: ()->
            Session.set('progressBarWidth', 0);
            if progressBar_blaze isnt null
                Blaze.remove progressBar_blaze
                progressBar_blaze = null

    Template.progressBar.events
        'click #cancel-btn': ->
            PUB.back()
            Template.progressBar.__helpers.get('close')()
        'click #delayPublish':->
            Session.set('terminateUpload', true);
            Template.progressBar.__helpers.get('close')()
    Template.postNotFound.events
        'click .postNotFoundBack':->
            Router.go('/');
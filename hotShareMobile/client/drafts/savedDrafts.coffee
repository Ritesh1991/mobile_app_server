if Meteor.isClient
  Template.allDrafts.onCreated ()->
    #Meteor.subscribe("saveddrafts")
  Template.allDrafts.helpers
    items:()->
      SavedDrafts.find({owner: Meteor.userId()},{sort: {createdAt: -1}})
    getmainImage:()->
      mImg = this.mainImage
      if (mImg.indexOf('file:///') >= 0)
        if Session.get(mImg) is undefined
          ProcessImage = (URI,smallImage)->
            if smallImage
              Session.set(mImg, smallImage)
            else
              Session.set(mImg, '/noimage.png')
          getBase64OfImage('','',mImg,ProcessImage)
        Session.get(mImg)
      else
        this.mainImage
  Template.allDrafts.events
    'click .back':(event)->
        #PUB.back()
        PUB.page('/user')
    'click .rightButton':(event)->
        navigator.notification.confirm('这个操作无法撤销', (r)->
          console.log('r is ' + r)
          if r is 2
            return
          #Clear All Saved Drafts
          #SavedDrafts.remove {owner: Meteor.userId()}
          SavedDrafts
            .find {owner: Meteor.userId()}
            .forEach (saveddrafts)->
              SavedDrafts.remove saveddrafts._id
              Posts.remove saveddrafts._id
          Session.setPersistent('mySavedDraftsCount',0)
          Session.setPersistent('persistentMySavedDrafts',null)
          window.plugins.shareExtension.deleteFiles()
          Meteor.setTimeout ()->
            PUB.back()
          ,animatePageTrasitionTimeout
          return
        , '您确定删除全部草稿吗？', ['继续删除','放弃删除']);
    'click .mainImage':(e)->
      Session.set('pubImages', [])
      Session.set('backtoalldrafts', true)
      #Use for if user discard change on Draft
      TempDrafts
        .find {owner: Meteor.userId()}
        .forEach (drafts)->
          TempDrafts.remove drafts._id
      #Clear draft first
      Drafts
        .find {owner: Meteor.userId()}
        .forEach (drafts)->
          Drafts.remove drafts._id
      #Prepare data
      # savedDraftData = SavedDrafts.find({_id: @_id}).fetch()[0]
      savedDraftData = SavedDrafts.findOne({_id: e.currentTarget.id})
      if withDirectDraftShow
        if savedDraftData and savedDraftData.pub and savedDraftData._id
          Session.set('postContent',savedDraftData)
          PUB.page('/draftposts/'+savedDraftData._id)
          return
        else
          console.log(savedDraftData)
          toastr.error('got wrong')
          return

      TempDrafts.insert {
        _id:savedDraftData._id,
        pub:savedDraftData.pub,
        title:savedDraftData.title,
        addontitle:savedDraftData.addontitle,
        fromUrl:savedDraftData.fromUrl,
        mainImage: savedDraftData.mainImage,
        mainText: savedDraftData.mainText,
        owner:savedDraftData.owner,
        createdAt: savedDraftData.createdAt,
      }
      #console.log "savedDraftData ="+JSON.stringify(savedDraftData)
      pub = savedDraftData.pub
      deferedProcessAddPostItemsWithEditingProcessBar(pub)
      Session.set 'isReviewMode','1'
      PUB.page('/add')
var sortable = null;
var pageData = new ReactiveVar({});
var type_stick = [];//存储选中的标签

Template.newEditor.sortable = function() {
    return sortable
};
Template.newEditor.onRendered(function() {
    sortable && sortable.destroy();
    pageData.set(this.data);
    var $ul = this.$('#postContainer');
    sortable = Sortable._create($ul[0], {
        group: {
            name: 'postContainer',
            pull: false,
            put: false
        },
        delay: 500,
        animation: 300,
        draggable: 'li',
        ghostClass: 'ghost-item',
        fallbackClass: 'fallback-item',
        chosenClass: 'chosen-item',
        onStart: function(evt) {
            $ul.addClass('fallback');
            $('.firstAddTool .addNewBtn').hide();
        },
        onEnd: function(evt) {
            $ul.removeClass('fallback');
            $('.firstAddTool .addNewBtn').show();
        }
    });
    this.$('.newEditor').bind("click", function(e) {
        if ($(e.target).closest('.addElements').length == 0) {
            $('.addElements').hide();
            $('.addElements').prev().fadeIn();
        }
    });

    if (Session.get('newEditorImportPUB')) {
        newEditorImportPUB = Session.get('newEditorImportPUB');
        for (var i = 0; i < newEditorImportPUB.length; i++) {
            sortable.add(newEditorImportPUB[i]);
        }
        Session.set('newEditorImportPUB', null);
    }

    if (this.data.type === 'edit' || this.data.type === 'draft') {
        var post = this.data.type === 'edit' ? Posts.findOne({
            _id: this.data.id
        }) : SavedDrafts.findOne({
            _id: this.data.id
        });
        if (!post) {
            post = Posts.findOne({
                _id: this.data.id
            })
            if (!post) {
                history.go(-1);
                return PUB.alert('没有找到此故事或草稿~');
            }
        }

        Template.progressBar.__helpers.get('show')();
        Session.set('newEditorFormURL', post.fromUrl);
        Session.set('newEditorMainImage', {
            _id: new Mongo.ObjectID()._str,
            imgUrl: post.mainImage,
            filename: '',
            URI: null,
            title: post.title,
            addontitle: post.addontitle
        });

        if (this.data.type === 'draft') {
            var draftMainImgUrl = post.pub[0].imgUrl;
            var draftMainfilename = post.pub[0].filename;
            var draftMainURI = post.pub[0].URI;
            if (post.mainImage) {
                draftMainImgUrl = post.mainImage;
                draftMainfilename = '';
                draftMainURI = null;
            }
            Session.set('newEditorMainImage', {
                _id: new Mongo.ObjectID()._str,
                imgUrl: draftMainImgUrl,
                filename: draftMainfilename,
                URI: draftMainURI,
                title: post.title,
                addontitle: post.addontitle
            });
            post.pub.splice(0, 1);
        }
        if (post.editorVersion != 'simpleEditor') {
            post.pub.map(function(item, index) {
                item.html = item.html || item.text;
                sortable.add(item);
                Session.set('progressBarWidth', parseInt(index / post.pub.length * 100));
            });
            return Template.progressBar.__helpers.get('close')();;
        }

        for (var i = 0; i < post.pub.length;) {
            var next = i + 1 < post.pub.length ? post.pub[i + 1] : null;
            if (next && next.pid === post.pub[i].pid && post.pub[i].pid) {
                post.pub[i].html = next.html || next.text;
                post.pub[i].text = next.text;
                sortable.add(post.pub[i]);
                i += 2;
            } else {
                post.pub[i].html = post.pub[i].html || post.pub[i].text
                post.pub[i].text = post.pub[i].text
                sortable.add(post.pub[i]);
                i += 1;
            }
            Session.set('progressBarWidth', parseInt(i / post.pub.length * 100));
        }
        Template.progressBar.__helpers.get('close')();
    } else {
        // sortable.add({type: 'text', html: '点击添加文字'});
    }
});
Template.newEditor.onDestroyed(function() {
    sortable && sortable.destroy();
    sortable = null;
    pageData.set({});
});

Template.newEditor.helpers({
    openSavingDraft: function() {
        if (Session.get('SavingDraftStatus') == true) {
            return true;
        } else {
            return false;
        }
    },
    isEdit: function() {
        return pageData.get().type === 'edit';
    },
    mainImage: function() {
        return Session.get('newEditorMainImage');
    },
    getImagePath: function(path, uri, id) {
        if (path == 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=') {
            $('#image_' + id).css("background-color", nodeBGColor[Math.round(Math.random() * (nodeBGColor.length - 1))])
        }
        return getImagePath(path, uri, id);
    },
    hasAssocaitedUsers: function() {
        return (AssociatedUsers.find({}).count() > 0) || (UserRelation.find({
            userId: Meteor.userId()
        }).count() > 0);
    },
    showSimpleEditorFirstTip: function() {
        return !localStorage.getItem('hideSimpleEditorFirstTip')
    },
    showSimpleEditorEditingTIP: function() {
        if (!localStorage.getItem('showSimpleEditorEditingTIP') && (Session.get('showSimpleEditorEditingTIP') === 'true')) {
            return true;
        } else {
            return false;
        }
    },
    handleSaveDraft: function() {
        if (!Meteor.status().connected && Meteor.status().status != 'connecting')
            Meteor.reconnect()
        if (pageData.get().type === 'edit' && pageData.get().id) {
            return;
        }
        var owner = Meteor.userId();
        var ownerName = Meteor.user().profile && Meteor.user().profile.fullname ? Meteor.user().profile.fullname : Meteor.user().username;
        var ownerIcon = Meteor.user().profile && Meteor.user().profile.icon ? Meteor.user().profile.icon : '/userPicture.png';
        // title
        var title = $('.title').val();
        var addontitle = $('.addontitle').val();
        var titleImg = $('.mainImage').data('imgurl');
        if (!title || title === '[空标题]') {
            Session.set('SavingDraftStatus', false);
            return PUB.toast('请为您的故事加个标题');
        }
        var pub = sortable.getDocs();
        pub.unshift({
            _id: new Mongo.ObjectID()._str,
            type: 'image',
            imgUrl: titleImg,
            filename: $('.mainImage').data('filename'),
            URI: $('.mainImage').data('uri')
        });
        var publishPost = function() {
            var mainImg = pub[0];
            titleImg = pub[0].imgUrl;
            pub.splice(0, 1);
            if (Session.equals('terminateUpload', true)) {
                return
            }
            // index
            pub.map(function(item, index) {
                pub[index].data_row = 1;
                pub[index].data_col = 1;
                pub[index].data_sizex = 6;

                switch (item.type) {
                    case 'text':
                        pub[index].data_sizey = 1;
                        break;
                    case 'image':
                        pub[index].data_sizey = 4;
                        break;
                    case 'iframe':
                        pub[index].data_sizey = 4;
                        break;
                    case 'music':
                        pub[index].data_sizey = 1;
                        break;
                    case 'video':
                        pub[index].data_sizey = 4;
                        break;
                }

                if (index > 0) {
                    pub[index].data_row = pub[index - 1].data_row + pub[index - 1].data_sizey;
                }
                pub[index].index = index;
                pub[index].owner = owner;
                pub[index].data_wait_init = true;
                // leon xu 修改文章 保留评论
                if (pageData.get().type === 'edit' || pageData.get().type === 'draft') {
                    var post_data = pageData.get().type === 'edit' ? Posts.findOne({
                        _id: pageData.get().id
                    }) : SavedDrafts.findOne({
                        _id: pageData.get().id
                    });
                    post_data.pub.find(function(ele, key) {
                        if (ele.pid == item.pid) {
                            if (typeof(ele.pcomments) !== 'undefined') {
                                pub[index].pcomments = ele.pcomments;
                            }
                            if (typeof(ele.likeUserId) !== 'undefined') {
                                pub[index].likeUserId = ele.likeUserId;
                                pub[index].likeSum = ele.likeSum;
                            }
                            if (typeof(ele.dislikeUserId) !== 'undefined') {
                                pub[index].dislikeUserId = ele.dislikeUserId;
                                pub[index].dislikeSum = ele.dislikeSum;
                            }
                        }
                    })
                }
            });
            if (Session.equals('terminateUpload', true)) {
                return
            }

            // post
            var post = {
                _id: pageData.get().type === 'edit' ? pageData.get().id : new Mongo.ObjectID()._str,
                title: title,
                label: post.label,
                addontitle: addontitle,
                mainImage: titleImg,
                mainImageStyle: null,
                mainText: '',
                heart: [],
                retweet: [],
                comment: [],
                owner: owner,
                ownerName: ownerName,
                ownerIcon: ownerIcon,
                createdAt: new Date(),
                browse: 0,
                commentsCount: 0,
                publish: true,
                isReview: false,
                // fromUrl: titleImg,
                pub: pub,
                editorVersion: 'simpleEditor'
            };
            console.log(post);

            var fromUrl = Session.get('newEditorFormURL');
            if (fromUrl) {
                post.fromUrl = fromUrl;
            }
            Session.set('newEditorFormURL', null);
            if (Session.equals('terminateUpload', true)) {
                return
            }
            if (pageData.get().type === 'draft') {
                post.pub.unshift({
                    _id: pageData.get().id,
                    label: post.label,
                    type: "image",
                    isImage: true,
                    url: mainImg.imgUrl,
                    owner: owner,
                    imgUrl: mainImg.imgUrl,
                    filename: mainImg.filename,
                    URI: mainImg.URI,
                    data_row: 1,
                    pid: pageData.get().id,
                    data_col: 1,
                    data_sizex: 6,
                    data_sizey: 4,
                    index: 0,
                    data_wait_init: true
                });
            }
            if (pageData.get().id) {
                SavedDrafts.update({
                    _id: pageData.get().id
                }, {
                    $set: {
                        title: post.title,
                        addontitle: post.addontitle,
                        mainImage: post.mainImage,
                        pub: post.pub,
                        owner: owner,
                        createdAt: new Date(),
                        editorVersion: 'simpleEditor'
                    }
                }, function(err, num) {
                    Template.progressBar.__helpers.get('close')()
                    if (err) {
                        console.log(err);
                        Session.set('SavingDraftStatus', false);
                        return PUB.toast('存草稿失败，请重试~');
                    }
                    Session.set('SavingDraftStatus', false);
                    Meteor.setTimeout(function() {
                        var mySavedDrafts = SavedDrafts.find({
                            owner: Meteor.userId()
                        }, {
                            sort: {
                                createdAt: -1
                            },
                            limit: 2
                        })
                        if (mySavedDrafts.count() > 0) {
                            Session.setPersistent('persistentMySavedDrafts', mySavedDrafts.fetch());
                        }
                    }, 50);
                    PUB.toast('已为您自动保存草稿~');
                    PUB.back();
                });
            } else {
                SavedDrafts.insert({
                    title: post.title,
                    addontitle: post.addontitle,
                    mainImage: post.mainImage,
                    pub: post.pub,
                    owner: owner,
                    createdAt: new Date(),
                    editorVersion: 'simpleEditor'
                }, function(err, _id) {
                    Template.progressBar.__helpers.get('close')()
                    if (err || !_id) {
                        console.log(err);
                        Session.set('SavingDraftStatus', false);
                        return PUB.toast('存草稿失败，请重试~');
                    }
                    Session.set('SavingDraftStatus', false);
                    Meteor.setTimeout(function() {
                        var mySavedDrafts = SavedDrafts.find({
                            owner: Meteor.userId()
                        }, {
                            sort: {
                                createdAt: -1
                            },
                            limit: 2
                        })
                        if (mySavedDrafts.count() > 0) {
                            Session.setPersistent('persistentMySavedDrafts', mySavedDrafts.fetch());
                        }
                    }, 50);
                    PUB.toast('已为您自动保存草稿~');
                    PUB.back();
                });
            }
        }
        // upload file
        var draftToBeUploadedImageData = [];
        var draftImageData = [];
        pub.map(function(item, index) {
            switch (item.type) {
                case 'image':
                    if (!(!item.imgUrl || item.imgUrl.toLowerCase().indexOf("http://") >= 0 || item.imgUrl.toLowerCase().indexOf("https://") >= 0 || item.imgUrl.toLowerCase().indexOf("data:image/") >= 0))
                        draftToBeUploadedImageData.push(item);
                    draftImageData.push(item);
                    break;
                case 'music':
                    if (!(item.musicInfo.playUrl.toLowerCase().indexOf("http://") >= 0 || item.musicInfo.playUrl.toLowerCase().indexOf("https://") >= 0))
                        draftToBeUploadedImageData.push(item);
                    break;
                case 'video':
                    if (!(!item.videoInfo.imageUrl || item.videoInfo.imageUrl.toLowerCase().indexOf("http://") >= 0 || item.videoInfo.imageUrl.toLowerCase().indexOf("https://") >= 0))
                        draftToBeUploadedImageData.push(item);
                    break;
            }
        });
        if (Session.equals('terminateUpload', true)) {
            return
        }

        if (draftToBeUploadedImageData.length > 0) {
            console.log('draftToBeUploadedImageData', draftToBeUploadedImageData);
            return multiThreadUploadFileWhenPublishInCordova(draftToBeUploadedImageData, null, function(err, result) {
                if (Session.equals('terminateUpload', true)) {
                    return
                }
                if (err || !result || result.length <= 0)
                    return PUB.toast('上传失败，请稍后重试');
                result.map(function(item) {
                    var index = _.pluck(pub, '_id').indexOf(item._id);
                    if (index >= 0) {
                        if (item.type === 'image' && item.imgUrl)
                            pub[index].imgUrl = item.imgUrl;
                        else if (item.type === 'music' && item.musicInfo && item.musicInfo.playUrl)
                            pub[index].musicInfo.playUrl = item.musicInfo.playUrl;
                        else if (item.type === 'video' && item.videoInfo && item.videoInfo.imageUrl)
                            pub[index].videoInfo.imageUrl = item.videoInfo.imageUrl;
                    }
                });
                try {
                    removeImagesFromCache(draftImageData);
                } catch (e) {}
                if (Session.get('saveedBase64Images') && Session.get('saveedBase64Images').length > 0) {
                    var imgPreRemoveLists = Session.get('saveedBase64Images');
                    try {
                        removeImagesFromCache(imgPreRemoveLists);
                    } catch (e) {}
                    Session.set('saveedBase64Images', null);
                }
                publishPost();
            });
        }
        publishPost();
    }
})

Template.newEditor.events({
    'click #editHelp': function(e) {
        return Tips.popPage('editorInstrucations', {
            editor: 'simple'
        });
    },
    'click .simpleEditorEditingTIP': function() {
        target = '#' + Session.get('targetBeforeEditorEditingTIP') + ' .text';
        localStorage.setItem('showSimpleEditorEditingTIP', 'false');
        $('.simpleEditorEditingTIP').remove();
        Session.set('targetBeforeEditorEditingTIP', null);
        Session.set('showSimpleEditorEditingTIP', null);
        // $('#'+target).find('.text').trigger('click');
        var html = $(target).html();
        cordova.plugins.richtexteditor.edit({
                html: html
            },
            function(content) {
                $(target).data('html', content.html)
                $(target).html(content.html);
            },
            function(error) {
                console.log('edit text Err = ' + error);
            });
    },
    'click .simpleEditorFirstTip': function() {
        // localStorage.setItem('hideSimpleEditorFirstTip','true');
        $('.simpleEditorFirstTip').remove();
        $('body').addClass('intros-html-body');
        $('.simpleEditorHelpIntros').fadeIn();
    },
    'click .back': function(e, t) {
        if (t.data.type === 'edit' || t.data.type === 'draft') {
            navigator.notification.confirm('您要放弃未保存的修改吗？', function(index) {
                if (index === 1) {
                    Session.set('SavingDraftStatus', false);
                    return history.go(-1);
                }
            }, '提示', ['放弃修改', '继续编辑']);
        } else {
            navigator.notification.confirm('您要删除未保存的草稿吗？', function(index) {
                if (index === 1) {
                    Session.set('SavingDraftStatus', false);
                    return history.go(-1);
                }
            }, '提示', ['删除故事', '继续创作']);
        }
    },
    'click #saveAssocaitedUsers': function(e, t) {
        // title
        var title = t.$('.title').val();
        if (!title || title === '[空标题]') {
            //Template.progressBar.__helpers.get('close')();
            $('#myModal').modal('hide');
            return PUB.toast('请为您的故事加个标题');
        }
        $('#myModal').modal('show');
        
    },
    'click #submit-tie':function(){
        var index = $("#boby-label ul .The-selected").length
        if(index > 2){
            PUB.toast('最多选两个“贴贴”哦');
            return
        }else if(index < 1){
            PUB.toast('您还没有选择“贴贴”哦');
            return
        }else{
            $("#boby-label ul .The-selected").each(function(i,v){
                type_stick[i] = $(this).html()
            })
            $('#myModal').modal('hide');
            $('#chooseAssociatedUser').modal('show');
        }
    },
    'click .save-post, click .drafts-btn': function(e) {
        Session.set('SavingDraftStatus', true);
    },
    'click #save ,click #drafts, click #modalPublish': function(e, t) {
        Session.set('terminateUpload', false);
        currentTargetId = e.currentTarget.id;
        if (currentTargetId === 'modalPublish') {
            var obj = document.getElementById(currentTargetId);
            obj.innerHTML = '发表中...';
            obj.id = 'newbtnId';
        }
        if (currentTargetId === 'drafts') {
            Session.set("isDelayPublish", false);
        } else {
            Session.set("isDelayPublish", true);
        }
        //Template.progressBar.__helpers.get('show')();
        Session.set("progressBarWidth", 1);

        var owner = Meteor.userId();
        var ownerName = Meteor.user().profile && Meteor.user().profile.fullname ? Meteor.user().profile.fullname : Meteor.user().username;
        var ownerIcon = Meteor.user().profile && Meteor.user().profile.icon ? Meteor.user().profile.icon : '/userPicture.png';
        if (currentTargetId === 'modalPublish') {
            owner = $('#chooseAssociatedUser .modal-body dt.active').attr('userId');
            ownerName = $('#chooseAssociatedUser .modal-body dt.active').next().text().trim();
            ownerIcon = $('#chooseAssociatedUser .modal-body dt.active img').attr('src');
            $('.modal-backdrop').remove();
        }

        if (!Meteor.user()) {
            //Template.progressBar.__helpers.get('close')();
            Session.set('SavingDraftStatus', false);
            return PUB.toast('请登录后发表您的故事');
        }
        if (!Meteor.status().connected && Meteor.status().status != 'connecting')
            Meteor.reconnect()
        
        // title
        var title = t.$('.title').val();
        var addontitle = t.$('.addontitle').val();
        var titleImg = t.$('.mainImage').data('imgurl');
        if (!title || title === '[空标题]') {
            //Template.progressBar.__helpers.get('close')();
            Session.set('SavingDraftStatus', false);
            return PUB.toast('请为您的故事加个标题');
        }

        // data
        if (Session.equals('terminateUpload', true)) {
            return
        }
        var pub = sortable.getDocs();
        pub.unshift({
            _id: new Mongo.ObjectID()._str,
            type: 'image',
            imgUrl: titleImg,
            filename: t.$('.mainImage').data('filename'),
            URI: t.$('.mainImage').data('uri')
        });
        if (Session.equals('terminateUpload', true)) {
            return
        }

        var publishPost = function() {
            var mainImg = pub[0];
            titleImg = pub[0].imgUrl;
            pub.splice(0, 1);
            if (Session.equals('terminateUpload', true)) {
                return
            }

            // index
            pub.map(function(item, index) {
                pub[index].data_row = 1;
                pub[index].data_col = 1;
                pub[index].data_sizex = 6;

                switch (item.type) {
                    case 'text':
                        pub[index].data_sizey = 1;
                        break;
                    case 'image':
                        pub[index].data_sizey = 4;
                        break;
                    case 'iframe':
                        pub[index].data_sizey = 4;
                        break;
                    case 'music':
                        pub[index].data_sizey = 1;
                        break;
                    case 'video':
                        pub[index].data_sizey = 4;
                        break;
                }

                if (index > 0) {
                    pub[index].data_row = pub[index - 1].data_row + pub[index - 1].data_sizey;
                }
                pub[index].index = index;
                pub[index].owner = owner;
                pub[index].data_wait_init = true;
                // leon xu 修改文章 保留评论
                if (t.data.type === 'edit' || t.data.type === 'draft') {
                    var post_data = t.data.type === 'edit' ? Posts.findOne({
                        _id: t.data.id
                    }) : SavedDrafts.findOne({
                        _id: t.data.id
                    });
                    post_data.pub.find(function(ele, key) {
                        if (ele.pid == item.pid) {
                            if (typeof(ele.pcomments) !== 'undefined') {
                                pub[index].pcomments = ele.pcomments;
                            }
                            if (typeof(ele.likeUserId) !== 'undefined') {
                                pub[index].likeUserId = ele.likeUserId;
                                pub[index].likeSum = ele.likeSum;
                            }
                            if (typeof(ele.dislikeUserId) !== 'undefined') {
                                pub[index].dislikeUserId = ele.dislikeUserId;
                                pub[index].dislikeSum = ele.dislikeSum;
                            }
                        }
                    })
                }
            });
            if (Session.equals('terminateUpload', true)) {
                return
            }

            // post
            var post = {
                _id: t.data.type === 'edit' ? t.data.id : new Mongo.ObjectID()._str,
                title: title,
                label: type_stick,
                addontitle: addontitle,
                mainImage: titleImg,
                mainImageStyle: null,
                mainText: '',
                heart: [],
                retweet: [],
                comment: [],
                owner: owner,
                ownerName: ownerName,
                ownerIcon: ownerIcon,
                createdAt: new Date(),
                browse: 0,
                commentsCount: 0,
                publish: true,
                isReview: false,
                // fromUrl: titleImg,
                pub: pub,
                editorVersion: 'simpleEditor'
            };

            var fromUrl = Session.get('newEditorFormURL');
            if (fromUrl) {
                post.fromUrl = fromUrl;
            }
            Session.set('newEditorFormURL', null);
            if (Session.equals('terminateUpload', true)) {
                return
            }

            var updatePost = function() {
                if (Session.equals('terminateUpload', true)) {
                    return
                }
                Posts.update({
                    _id: t.data.id
                }, {
                    $set: {
                        title: post.title,
                        label: post.label,
                        addontitle: post.addontitle,
                        mainImage: titleImg,
                        heart: [],
                        retweet: [],
                        comment: [],
                        publish: true,
                        owner: owner,
                        ownerName: ownerName,
                        ownerIcon: ownerIcon,
                        pub: post.pub,
                        createdAt: new Date(),
                        editorVersion: 'simpleEditor'
                    }
                }, function(err, num) {
                    Template.progressBar.__helpers.get('close')()
                    if (err) {
                        console.log(err);
                        return PUB.toast('保存失败，请重试~');
                    }

                    // 删除草稿
                    if (t.data.type === 'draft')
                        SavedDrafts.remove({
                            _id: t.data.id
                        });

                    post._id = t.data.id;
                    try {
                        post.browse = Posts.findOne({
                            _id: t.data.id
                        }).browse + 1;
                    } catch (e) {
                        post.browse = 1;
                    }
                    insertPostOnTheHomePage(t.data.id, post);
                    Session.set('newpostsdata', post);

                    Meteor.call('updateTopicPostsAfterUpdatePost', t.data.id);
                    Meteor.call('refreshPostCDN', t.data.id);
                    Session.set('isServerImport', false);
                    Session.set('SavingDraftStatus', false);
                    Router.go('/posts/' + t.data.id);
                });
            };

            if (t.data.type === 'edit') {
                updatePost();
            } else {
                if (Session.equals('terminateUpload', true)) {
                    return
                }
                if (currentTargetId === 'drafts') {
                    post.pub.unshift({
                        _id: t.data.id,
                        type: "image",
                        isImage: true,
                        url: mainImg.imgUrl,
                        owner: owner,
                        imgUrl: mainImg.imgUrl,
                        filename: mainImg.filename,
                        URI: mainImg.URI,
                        data_row: 1,
                        pid: t.data.id,
                        data_col: 1,
                        data_sizex: 6,
                        data_sizey: 4,
                        index: 0,
                        data_wait_init: true
                    });
                    post.pub.map(function(item, index) {
                        if (index > 0) {
                            post.pub[index].data_row = post.pub[index - 1].data_row + post.pub[index - 1].data_sizey;
                        }
                    });
                    if (Session.equals('terminateUpload', true)) {
                        return
                    }
                    if (t.data.id) {
                        SavedDrafts.update({
                            _id: t.data.id
                        }, {
                            $set: {
                                title: post.title,
                                addontitle: post.addontitle,
                                mainImage: post.mainImage,
                                pub: post.pub,
                                owner: owner,
                                createdAt: new Date(),
                                editorVersion: 'simpleEditor'
                            }
                        }, function(err, num) {
                            Template.progressBar.__helpers.get('close')()
                            if (err) {
                                console.log(err);
                                Session.set('SavingDraftStatus', false);
                                return PUB.toast('存草稿失败，请重试~');
                            }
                            Session.set('SavingDraftStatus', false);
                            Meteor.setTimeout(function() {
                                var mySavedDrafts = SavedDrafts.find({
                                    owner: Meteor.userId()
                                }, {
                                    sort: {
                                        createdAt: -1
                                    },
                                    limit: 2
                                })
                                if (mySavedDrafts.count() > 0) {
                                    Session.setPersistent('persistentMySavedDrafts', mySavedDrafts.fetch());
                                }
                            }, 50);
                            PUB.toast('存草稿成功~');
                            PUB.back();
                        });
                    } else {
                        SavedDrafts.insert({
                            title: post.title,
                            addontitle: post.addontitle,
                            mainImage: post.mainImage,
                            pub: post.pub,
                            owner: owner,
                            createdAt: new Date(),
                            editorVersion: 'simpleEditor'
                        }, function(err, _id) {
                            Template.progressBar.__helpers.get('close')()
                            if (err || !_id) {
                                console.log(err);
                                Session.set('SavingDraftStatus', false);
                                return PUB.toast('存草稿失败，请重试~');
                            }
                            Session.set('SavingDraftStatus', false);
                            Meteor.setTimeout(function() {
                                var mySavedDrafts = SavedDrafts.find({
                                    owner: Meteor.userId()
                                }, {
                                    sort: {
                                        createdAt: -1
                                    },
                                    limit: 2
                                })
                                if (mySavedDrafts.count() > 0) {
                                    Session.setPersistent('persistentMySavedDrafts', mySavedDrafts.fetch());
                                }
                            }, 50);
                            PUB.toast('存草稿成功~');
                            PUB.back();
                        });
                    }
                } else {
                    if (Posts.find({
                            _id: t.data.id
                        }).count() > 0)
                        return updatePost();

                    if (Session.equals('terminateUpload', true)) {
                        return
                    }
                    post.owner = owner;
                    post.ownerName = ownerName;
                    post.ownerIcon = ownerIcon;
                    Posts.insert(post, function(err, _id) {
                        Template.progressBar.__helpers.get('close')();
                        if (err || !_id) {
                            console.log(err)
                            Session.set('SavingDraftStatus', false);
                            return PUB.toast('发表失败，请重试~');
                        }
                        post._id = _id;
                        post.browse = 1;
                        insertPostOnTheHomePage(post._id, post);
                        Session.set('newpostsdata', post);

                        // 删除草稿
                        if (t.data.type === 'draft')
                            SavedDrafts.remove({
                                _id: t.data.id
                            });

                        // to tags page
                        Session.set("TopicPostId", post._id);
                        Session.set("TopicTitle", post.title);
                        Session.set("TopicAddonTitle", post.addontitle);
                        Session.set("TopicMainImage", post.mainImage);
                        Session.set('SavingDraftStatus', false);
                        Router.go('addTopicComment');
                    });
                }
            }
        }

        // upload file
        var draftToBeUploadedImageData = [];
        var draftImageData = [];
        pub.map(function(item, index) {
            switch (item.type) {
                case 'image':
                    if (!(!item.imgUrl || item.imgUrl.toLowerCase().indexOf("http://") >= 0 || item.imgUrl.toLowerCase().indexOf("https://") >= 0 || item.imgUrl.toLowerCase().indexOf("data:image/") >= 0))
                        draftToBeUploadedImageData.push(item);
                    draftImageData.push(item);
                    break;
                case 'music':
                    if (!(item.musicInfo.playUrl.toLowerCase().indexOf("http://") >= 0 || item.musicInfo.playUrl.toLowerCase().indexOf("https://") >= 0))
                        draftToBeUploadedImageData.push(item);
                    break;
                case 'video':
                    if (!(!item.videoInfo.imageUrl || item.videoInfo.imageUrl.toLowerCase().indexOf("http://") >= 0 || item.videoInfo.imageUrl.toLowerCase().indexOf("https://") >= 0))
                        draftToBeUploadedImageData.push(item);
                    break;
            }
        });
        if (Session.equals('terminateUpload', true)) {
            return
        }

        if (draftToBeUploadedImageData.length > 0) {
            console.log('draftToBeUploadedImageData', draftToBeUploadedImageData);
            return multiThreadUploadFileWhenPublishInCordova(draftToBeUploadedImageData, null, function(err, result) {
                if (Session.equals('terminateUpload', true)) {
                    return
                }
                if (err || !result || result.length <= 0)
                    return PUB.toast('上传失败，请稍后重试');
                result.map(function(item) {
                    var index = _.pluck(pub, '_id').indexOf(item._id);
                    if (index >= 0) {
                        if (item.type === 'image' && item.imgUrl)
                            pub[index].imgUrl = item.imgUrl;
                        else if (item.type === 'music' && item.musicInfo && item.musicInfo.playUrl)
                            pub[index].musicInfo.playUrl = item.musicInfo.playUrl;
                        else if (item.type === 'video' && item.videoInfo && item.videoInfo.imageUrl)
                            pub[index].videoInfo.imageUrl = item.videoInfo.imageUrl;
                    }
                });
                try {
                    removeImagesFromCache(draftImageData);
                } catch (e) {}
                if (Session.get('saveedBase64Images') && Session.get('saveedBase64Images').length > 0) {
                    var imgPreRemoveLists = Session.get('saveedBase64Images');
                    try {
                        removeImagesFromCache(imgPreRemoveLists);
                    } catch (e) {}
                    Session.set('saveedBase64Images', null);
                }
                publishPost();
            });
        }
        publishPost();
        
    },
    'click #editMainImage': function(e, t) {
        var pubImages = [];
        t.$('.item-image').each(function() {
            var doc = {
                URI: $(this).data('uri'),
                imageId: $(this).data('id'),
                imgUrl: $(this).data('imgurl'),
                filename: $(this).data('filename')
            };
            pubImages.push(doc);
        });
        Blaze.renderWithData(Template.eidtMainImagePage, {
            images: pubImages
        }, document.body)
        Meteor.setTimeout(function() {
            $('body').css('overflow', 'hidden');
            var mainImageSrc = $('img.mainImage').attr('src') || '/webbg.jpg';
            var CW = document.body.clientWidth * 0.95;
            var clipOptions = {
                size: [CW, 240],
                loadStart: function() {
                    $('#clipArea').addClass('clipImgLoading');
                },
                loadComplete: function() {
                    $('#clipArea').removeClass('clipImgLoading');
                },
                errorMsg: {
                    imgLoadError: '图片加载失败！',
                    noImg: '图片加载未完成！无法裁剪！',
                    clipError: '裁剪失败!'
                }
            }
            clipArea = new PhotoClip('#clipArea', clipOptions);
            clipArea.load(mainImageSrc);
        }, 100)
    },
    //  弹出工具条
    'click .addNewBtn': function(e) {
        $(e.currentTarget).fadeOut("fast", function() {
            $(e.currentTarget).next().next('.addElements').fadeIn();
        });
    },

    'click #addText': function(e, t) {
        //   添加段落
        $(e.currentTarget).parent().fadeOut("fast", function() {
            $(e.currentTarget).parent().prev().fadeIn();
        });
        // TODO

        var li = e.currentTarget.parentNode.parentNode.parentNode;
        var isMain = e.currentTarget.getAttribute('class').indexOf('main') >= 0;
        var index = isMain ? 0 : (_.pluck(li.parentNode.children, 'id')).indexOf(li.id) + 1;
        console.log('index;', index);
        sortable.add(index, {
            text: '',
            html: '',
            type: 'text'
        });
    },
    'click #addImage': function(e) {
        $(e.currentTarget).parent().fadeOut("fast", function() {
            $(e.currentTarget).parent().prev().prev().fadeIn();
        });
        var li = e.currentTarget.parentNode.parentNode.parentNode;
        var isMain = e.currentTarget.getAttribute('class').indexOf('main') >= 0;
        var pIndex = isMain ? 0 : (_.pluck(li.parentNode.children, 'id')).indexOf(li.id) + 1;
        console.log('index;', pIndex);
        var options = {
            title: '从相册选择图片或拍摄一张照片~',
            buttonLabels: ['从相册选择图片', '拍摄照片'],
            addCancelButtonWithLabel: '取消',
            androidEnableCancelButton: true,
        };
        console.log(sortable);
        window.footbarOppration = true;
        window.plugins.actionsheet.show(options, function(index) {
            if (index === 1) {
                Session.set('draftTitle', '')
                Session.set('draftAddontitle', '');
                Session.set('NewImgAdd', 'false');
                var ablubImgLists = [];
                selectMediaFromAblum(999, function(cancel, result, currentCount, totalCount) {
                    if (cancel) {
                        return
                    }
                    if (result) {
                        console.log('Current Count is ' + currentCount + ' Total is ' + totalCount);
                        console.log('image url is ' + result.smallImage);
                        ablubImgLists.push({
                            type: 'image',
                            isImage: true,
                            currentCount: currentCount,
                            totalCount: totalCount,
                            imgUrl: result.smallImage,
                            filename: result.filename,
                            URI: result.URI
                        });

                        if (currentCount === totalCount) {
                            ablubImgLists.reverse();
                            for (var i = 0; i < ablubImgLists.length; i++) {
                                sortable.add(pIndex, ablubImgLists[i]);
                            }
                            ablubImgLists = null;
                        }
                        // sortable.add(pIndex,{
                        //   type: 'image',
                        //   isImage:true,
                        //   currentCount:currentCount,
                        //   totalCount:totalCount,
                        //   imgUrl: result.smallImage,
                        //   filename: result.filename,
                        //   URI: result.URI
                        // });
                    }
                });
            } else if (index === 2) {
                window.footbarOppration = true;
                Session.set('NewImgAdd', 'false');
                if (window.takePhoto) {
                    window.takePhoto(function(result) {
                        console.log('result from camera is ' + JSON.stringify(result));
                        if (result) {
                            sortable.add(pIndex, {
                                _id: new Mongo.ObjectID()._str,
                                type: 'image',
                                isImage: true,
                                imgUrl: result.smallImage,
                                filename: result.filename,
                                URI: result.URI
                            });
                        }
                    });
                }
            }
        });
    },
    'click #addAudio': function(e) {
        $(e.currentTarget).parent().fadeOut("fast", function() {
            $(e.currentTarget).parent().prev().fadeIn();
        });
        var li = e.currentTarget.parentNode.parentNode.parentNode;
        var isMain = e.currentTarget.getAttribute('class').indexOf('main') >= 0;
        var pIndex = isMain ? 0 : (_.pluck(li.parentNode.children, 'id')).indexOf(li.id) + 1;
        console.log('index;', pIndex);
        var isIOS = Blaze._globalHelpers.isIOS()
        // if(isIOS){
        window.plugins.iOSAudioPicker.getAudio(function(list) {
            console.log('Got list' + JSON.stringify(list))
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                if (item) {
                    var musicInfo = {};
                    if (item.image && item.image !== '') {
                        console.log('has image');
                        if (item.exportedurl && item.exportedurl !== '') {
                            var originalFilename = item.exportedurl.replace(/^.*[\\\/]/, '');
                            musicInfo.playUrl = 'cdvfile://localhost/persistent/files/' + originalFilename;
                            musicInfo.URI = item.exportedurl;
                            musicInfo.filename = Meteor.userId() + '_' + new Date().getTime() + '_' + MD5(originalFilename) + '.' + originalFilename.split('.').pop();
                            musicInfo.songName = item.title;
                            musicInfo.singerName = item.artist;
                            console.log('Image ');
                            window.imageResizer.resizeImage(function(data) {
                                    musicInfo.image = "data:image/png;base64," + data.imageData;
                                    console.log('Got image data ' + musicInfo.image);
                                    sortable.add(pIndex, {
                                        type: 'music',
                                        text: '您当前程序不支持音频播放，请分享到微信中欣赏',
                                        musicInfo: musicInfo,
                                    });
                                }, function(error) {
                                    console.log("Error: \r\n" + error);
                                    sortable.add(pIndex, {
                                        type: 'music',
                                        text: '您当前程序不支持音频播放，请分享到微信中欣赏',
                                        musicInfo: musicInfo,
                                    });
                                }, item.image,
                                64, 64, {
                                    imageDataType: ImageResizer.IMAGE_DATA_TYPE_BASE64,
                                    format: 'png'
                                });
                        }
                    }
                }
            }
        }, function() {
            console.log('Got error')
        }, 'false', 'true');
        // } else {
        //   console.log('Add Link ' + Session.get('lastImportedUrl'))
        //   cordova.plugins.clipboard.paste(function(text){
        //     if (text && text !== '' && text.indexOf('http') > -1){
        //       handleAddedLink(text);
        //     } else {
        //       handleAddedLink(Session.get('lastImportedUrl'));
        //     }
        //   });
        // }
    },
    'click #addVideo': function(e) {
        $(e.currentTarget).parent().fadeOut("fast", function() {
            $(e.currentTarget).parent().prev().fadeIn();
        });
        var li = e.currentTarget.parentNode.parentNode.parentNode;
        var isMain = e.currentTarget.getAttribute('class').indexOf('main') >= 0;
        var pIndex = isMain ? 0 : (_.pluck(li.parentNode.children, 'id')).indexOf(li.id) + 1;
        console.log('index;', pIndex);
        var options = {
            title: '您想要添加什么，请选择？',
            // buttonLabels: ['添加链接', '导入腾讯视频', '导入优酷视频', '导入美拍'],
            buttonLabels: ['导入腾讯视频', '导入优酷视频', '导入美拍'],
            addCancelButtonWithLabel: '取消',
            androidEnableCancelButton: true,
        }
        window.footbarOppration = true;

        window.plugins.actionsheet.show(options, function(index) {
            switch (index) {
                // case 1:
                //   console.log('addLink');
                //   $('#show_hyperlink').attr('data-index',pIndex);
                //   $('#show_hyperlink').show();
                //   break;
                case 1:
                case 2:
                case 3:
                    // case 4:
                    navigator.notification.prompt('请输入要导入的视频URL地址!', function(result) {
                            if (result.buttonIndex === 1 && result.input1) {
                                var regexToken = /\b(((http|https?)+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
                                if (!regexToken.exec(result.input1)) {
                                    return window.plugins.toast.showLongCenter("请输入正确的URL地址!");
                                }
                                var url = importVideo.getVideoUrlFromUrl(result.input1);
                                if (!url) {
                                    return window.plugins.toast.showShortCenter("导入视频失败，如有需要请重新尝试~");
                                }
                                //   TODO, insert
                                sortable.add(pIndex, {
                                    _id: new Mongo.ObjectID()._str,
                                    type: 'image',
                                    isImage: true,
                                    inIframe: true,
                                    text: '您当前程序不支持视频观看',
                                    iframe: '<iframe height="100%" width="100%" src="' + url + '" frameborder="0" allowfullscreen></iframe>',
                                    imgUrl: 'http://data.tiegushi.com/res/video_old_version.jpg',
                                });
                            }
                        },
                        '提示', ['导入', '取消']);
            }
        });
    },
    'click .addVoice': function(e, t) {
        $('#voiceControl').modal('show');
        var li = e.currentTarget.parentNode.parentNode;
        var isMain = e.currentTarget.getAttribute('class').indexOf('main') >= 0;
        voiceIndex = isMain ? 0 : (_.pluck(li.parentNode.children, 'id')).indexOf(li.id) + 1;
    },
    'click .voiceBtn': function(e,t) {
        return;
    },
    'touchstart .voiceBtn': function(e,t) {
        $('.modelRecord').show();
        $(e.target).text("松开添加");
        startY = e.originalEvent.changedTouches[0].screenY;
        distanceY = 0;
        var recName = Meteor.userId()+new Date().getTime() + ".mp3";
        mediaRec = new Media(recName,
            // success callback
            function() {
              console.log("recordAudio():Audio Success");
              console.log("录音中:"+recName);
            },
            // error callback
            function(err) {
              console.log('录音失败');
              console.log(err.code);
              alert('请在手机的权限设置中允许故事贴使用麦克风');
              $('#voiceControl').modal('hide');
              $('.modelRecord').hide();
              $('.cancelRecord').hide();
            }
        );
        mediaRec.startRecord();
        $(e.target).bind('touchmove', function(event){
            endY = event.originalEvent.changedTouches[0].screenY;
            //获取滑动距离
            distanceY = endY-startY;
            //判断滑动方向
            if(Math.abs(distanceY) > 25){
                console.log('往上滑动');
                $('.modelRecord').hide();
                $('.cancelRecord').show();
                $(event.target).text("取消添加");
            }else{
                $('.modelRecord').show();
                $('.cancelRecord').hide();
                $(event.target).text("松开添加");
            }
        });
    },
    'touchend .voiceBtn': function(e,t) {
        console.log(voiceIndex);        
        if(Math.abs(distanceY) > 25){
            $('#voiceControl').modal('hide');
            $('.modelRecord').hide();
            $('.cancelRecord').hide();
            return
        }else{
            if(mediaRec !== null){
                mediaRec.stopRecord();
                console.log('停止录音');
                console.log(mediaRec);
                console.log(mediaRec.src);
                var id = new Mongo.ObjectID()._str;
                var filename = mediaRec.src;
                var url = null;
                if(device.platform == "Android"){
                    url = cordova.file.externalRootDirectory + mediaRec.src;
                }else if(device.platform == 'iOS'){
                    url = cordova.file.tempDirectory + mediaRec.src;
                }
                window.uploadToAliyun_new(filename, url, function(status, result){
                    console.log('result:' + result + ',status:' + status);
                    if (status === 'done' && result){
                      sortable.add(voiceIndex, {
                            text: '<div class="voicePlay" controls="controls" "z-index=99999" data="'+result+'"><span class="line1"></span><span class="line2"></span><span class="line3"></span><span class="line4"></span><span class="line5"></span></div>',
                            html: '',
                            isVoice: true,
                            type: 'voice'
                        });
                      console.log(result);
                    }
                });
            }
            $('#voiceControl').modal('hide');
            $('.modelRecord').hide();
            $('.cancelRecord').hide();
        }
        $(e.target).text("按住说话");
        console.log("endrecord====="+distanceY);
    },
    'click .voicePlay':function(e,t) {
        console.log(e);
        console.log(e.stopPropagation());
        e.stopImmediatePropagation();
        e.preventDefault();
        alert('leon12345');
        return false;
    },
    'click #add_hyperlink_btn': function() {
        trackEvent("addPost", "MobileHyperlink");
        var pIndex = $('#show_hyperlink').data('index');
        var describe = $('#hyperlink-text').val();
        var url = $('#hyperlink-url').val();
        if (describe === '') {
            return PUB.toast('请输入链接描述');
        }
        if (url === '') {
            return PUB.toast('请输入跳转网址');
        }
        console.log('isUrl is ' + PUB.isUrl(url));
        if (PUB.isUrl(url) === false) {
            return PUB.toast('输入网址格式不匹配');
        } else {
            if (url.toLowerCase().indexOf("http://") > 0 || url.toLowerCase().indexOf("https://") > 0) {
                return PUB.toast('输入网址格式不匹配');
            }
            if (url.toLowerCase().indexOf("http://") === -1 && url.toLowerCase().indexOf("https://") === -1) {
                url = 'http://' + url
            }
            var newtext = '<a href="' + url + '" target="_blank" class="_post_item_a">' + describe + '</a>';
            sortable.add(pIndex, {
                _id: new Mongo.ObjectID()._str,
                type: 'text',
                isImage: false,
                owner: Meteor.userId(),
                text: newtext,
                hyperlinkText: describe,
                isHyperlink: true
            });
            $('#show_hyperlink').hide();
            $('#hyperlink-text').val('');
            $('#hyperlink-url').val('');
        }
    },
    'click #hyperlink_back': function() {
        $('#show_hyperlink').hide();
    }
});

Template.chooseAssociatedUserNewEditor.onRendered(function() {
    Meteor.subscribe('userRelation');
    var height = $(window).height() * 0.68;
    height = height + 'px';
    $('.modal-dialog .modal-body').css({
        'max-height': height,
        'overflow-y': 'auto'
    })
    $('#chooseAssociatedUser').on('show.bs.modal', function() {
        $('body,html').css({
            'overflow': 'hidden'
        });
    });
    $('#chooseAssociatedUser').on('hide.bs.modal', function() {
        $('body,html').css({
            'overflow': ''
        });
    });
});

Template.chooseAssociatedUserNewEditor.onDestroyed(function() {
    $('body,html').css({
        'overflow': ''
    });
})

Template.chooseAssociatedUserNewEditor.helpers({
    accountList: function() {
        return UserRelation.find({
            userId: Meteor.userId()
        });
    }
});

Template.chooseAssociatedUserNewEditor.events({
    "click .modal-body dl": function(e, t) {
        t.$("dt.active").removeClass("active");
        $(e.currentTarget).find("dt").addClass('active');
    }
});
(function() {
    require('./libs/wechatapi');
    require("./libs/ddp");
    window.Hammer = require("./libs/hammer.min");
    require("./libs/wookmark");
    require("./libs/jquery.swipebox.1.3.0.2");
    window.scrollMonitor = require("./libs/scrollMonitor.1.0.12");
    require("./libs/jquery.toolbar");
    window.toastr = require("./libs/toastr.min");
    require("./libs/swipe");
    var imagesLoaded = require("imagesloaded");
    var debugPrint = function (msg) {
        if (false) {
            console.log(msg);
        }
    };

    function loadScript(url, callback) {
        jQuery.ajax({
            url: url,
            dataType: 'script',
            success: callback,
            async: true,
            cache: true
        });
    }

    function isWeiXinFunc() {
        var M, ua;
        ua = window.navigator.userAgent.toLowerCase();
        M = ua.match(/MicroMessenger/i);
        if (M && M[0] === 'micromessenger') {
            return true;
        } else {
            return false;
        }
    }

    const GetTime0 = function (dateM) {
        var MinMilli = 1000 * 60;         // 初始化变量。
        var HrMilli = MinMilli * 60;
        var DyMilli = HrMilli * 24;
        //计算出相差天数
        var days = Math.floor(dateM / (DyMilli));

        //计算出小时数
        var leave1 = dateM % (DyMilli); //计算天数后剩余的毫秒数
        var hours = Math.floor(leave1 / (HrMilli));
        //计算相差分钟数
        var leave2 = leave1 % (HrMilli);        //计算小时数后剩余的毫秒数
        var minutes = Math.floor(leave2 / (MinMilli));
        //计算相差秒数
        var leave3 = leave2 % (MinMilli);      //计算分钟数后剩余的毫秒数
        var seconds = Math.round(leave3 / 1000);

        var prefix;
        if (dateM > DyMilli)
            prefix = days + "天前";
        else if (dateM > HrMilli)
            prefix = hours + "小时前";
        else if (dateM > MinMilli)
            prefix = minutes + "分钟前";
        else if (dateM <= MinMilli) {
            if (seconds <= 0)
                prefix = "刚刚";
            else
                prefix = seconds + "秒前";
        } else
            prefix = "";
        return prefix;
    }

    var $bellHtml = $('.show-post-new-message ._count');

    var userNewBellCountHandle = function (e1) {
        var message = e1.detail;
        debugPrint('userNewBellCount:' + JSON.stringify(message));
        var count = message.fields.count;
        if (count <= 0) {
            $('.show-post-new-message').hide();
        } else {
            $bellHtml.html(count);
            window.bellNewCount = count;
            $('.show-post-new-message').show();
        }

        // render bell page
        if (!message.fields.feeds || message.fields.feeds.length <= 0)
            return $('._bell-box .content').html('');

        var html = '';
        var index = 0;
        var typeName = '';
        var notRead = function (read, check, _index, createAt) {
            if ((new Date() - new Date(createAt).getTime()) > (7 * 24 * 3600 * 1000))
                return false;
            if (_index > 20)
                return false;
            if (check || read)
                return false;
            else if (arguments.length === 2)
                return false;
            else
                return true;
        };
        var time_diff = function (created) {
            return GetTime0(new Date() - created);
        };

        message.fields.feeds.forEach(function (feed) {
            switch (feed.eventType) {
                case 'personalletter':
                    html += '<a href="javascript:void(0);" class="contentList" data-id="' + feed._id + '" data-post="' + feed.postId + '">' + (notRead(feed.isRead, feed.checked, index, feed.createdAt) ? '<div class="readTips"></div>' : '') + '\
            <img class="icon" src="' + feed.ownerIcon + '" width="30" height="30" />\
            <div id="' + feed.postId + '" class="alarm">' + feed.ownerName + ' 给您发来一条私信 《' + feed.postTitle + '》</div>\
            <div class="createAt">' + time_diff(feed.createdAt) + '</div>\
            </a>\
            <div id="' + feed._id + 'content" class="personalLetterContent">\
            <div class="LetterHead">来自 <strong>' + feed.userName + '</strong> 的私信</div>\
            <div class="closePersonalLetter"><i class="fa fa-angle-left fa-fw"></i></div>\
            <div class="LetterContent">' + feed.content + '</div>\
            <a href="mailto:' + feed.userEmail + '?subject=Re:' + feed.userName + '"><div class="LetterFooter">\
            <div class="show-user-email">联系邮箱：' + feed.userEmail + '</div>\
            </div></a>\
            /div>\
            <div class="line"><span></span></div>';
                    break;
                case 'pcomment':
                    typeName = '也点评了此故事';
                case 'pcommentowner':
                    typeName = '点评了您的故事';
                case 'pfavourite':
                    typeName = '也赞了此故事';
                case 'SelfPosted':
                    typeName = '发布了新故事';
                case 'recommand':
                    typeName = '推荐您一个新故事';
                case 'comment':
                    typeName = '回复了您的故事';
                case 'recomment':
                    html += '<a href="javascript:void(0);" class="contentList" data-id="' + feed._id + '" data-post="' + feed.postId + '">' + (notRead(feed.isRead, feed.checked, index, feed.createdAt) ? '<div class="readTips"></div>' : '') + '\
            <img class="icon" src="' + feed.ownerIcon + '" width="30" height="30">\
            <div id="' + feed.postId + '" class="alarm">' + feed.ownerName + ' ' + (feed.eventType === 'recomment' ? '回复了您参与讨论的故事' : typeName) + ' 《' + feed.postTitle + '》</div>\
            <div class="createAt">' + time_diff(feed.createdAt) + '</div>\
            </a><div class="line"><span></span></div>';
                    break;
                case 'getrequest':
                    // TODO: 邀请您加为好友
                    break;
                case 'sendrequest':
                    // TODO: 已添加/已发送邀请
                    break;
            }

            index += 1;
        });
        $('._bell-box .content').html(html);
        // $('._bell-box').slideDown(300);
        $('._bell-box .contentList').each(function () {
            $(this).click(function () {
                debugPrint('post id:', $(this).attr('data-post'));
                window._bell.contentList($(this).attr('data-post'));
                if ($(this).attr('data-post'))
                    location = '/t/' + $(this).attr('data-post');
            });
        });
    };
    var update_read_status = function () {
        if (typeof window.read_report === 'undefined') {
            window.read_report = true;
            CallMethod('readPostReport', [postid, window._loginUserId], function (type, result) {
                debugPrint('readPostReport, result: ' + result)
            });
            Subscribe("reading", [postid], function (e) {
                var message = e1.detail;
                debugPrint('reading: ' + JSON.stringify(message));
            });
        }
    };
    var userHandle = function (e) {
        var message = e.detail;
        debugPrint('users: ' + JSON.stringify(message));
    };

    window.SUGGEST_POSTS_SKIP = 0;
    window.SUGGEST_POSTS_LIMIT = 5;
    window.SUGGEST_POSTS_LOADING = false;

    var colorIndex, colorLength, predefineColors;
    predefineColors = ["#55303e", "#503f32", "#7e766c", "#291d13", "#d59a73", "#a87c5f", "#282632", "#ca9e92", "#a7a07d", "#846843", "#6ea89e", "#292523", "#637168", "#573e1b", "#925f3e", "#786b53", "#aaa489", "#a5926a", "#6a6b6d", "#978d69", "#a0a1a1", "#4b423c", "#5f4a36", "#b6a2a9", "#1c1c4e", "#e0d9dc", "#393838", "#c5bab3", "#a46d40", "#735853", "#3c3c39"];
    colorLength = predefineColors.length;
    colorIndex = 0;
    window.newLayoutWatchIdList = {};

    setRandomlyBackgroundColor = function ($node) {
        $node.css("background-color", predefineColors[colorIndex]);
        if (++colorIndex >= colorLength) {
            return colorIndex = 0;
        }
    };

    var processSuggestPostsData = function (data) {
        var posts = data;
        var counter = posts.length;
        var html = '';
        posts.forEach(function (post) {
            if (post.ownerName) {
                var poster = '<h1 class="username">' + post.ownerName + '<span>发布</span><button class="suggestAlreadyRead"><i class="fa fa-times"></i></button></h1>'
            } else if (post.reader) {
                var poster = '<h1 class="username">' + post.reader + '<span>读过</span><button class="suggestAlreadyRead"><i class="fa fa-times"></i></button></h1>'
            }
            html += '<div class="newLayout_element" data-postid="' + post.postId + '">'
                + '<div class="img_placeholder">'
                + '<img class="mainImage" src="' + post.mainImage + '" />'
                + '</div>'
                + '<div class="pin_content">'
                + '<p class="title">' + post.title + '</p>'
                + '<p class="addontitle">' + post.addontitle + '</p>'
                + poster
                + '</div>'
                + '</div>';
        });

        var $container = $(".moments .newLayout_container");

        if ($container.length > 0) {
            $container.append(html);
        }
        else {
            html = '<div class="newLayout_container" style="display:none;position:relative;">' + html + '</div>';
            $(".div_discover .moments").append(html);
            $container = $(".moments .newLayout_container");
        }


        $(".moments .newLayout_element").not('.loaded').each(function () {
            var elem = this, $elem = $(this);
            var the_postid = $elem.data('postid');
            $elem.find('.img_placeholder').click(function () {
                window.open('/t/' + the_postid, '_blank');
            });
            $elem.find('.pin_content .title').click(function () {
                window.open('/t/' + the_postid, '_blank');
            });
            $elem.detach();

            var imgLoad = imagesLoaded(elem);

            imgLoad.on('done', function () {
                debugPrint('>>> img load done!!!');
                elem.style.display = 'hidden';
                $elem.css('opacity', 0);
                $elem.addClass('loaded');

                $container.append($elem);
                var $img, $parent, src, watcher;

                if (!window.newLayoutWatchIdList['watcher_' + the_postid]) {
                    $img = $elem.find('img');
                    src = $img.attr('src');
                    $parent = $img.parent();
                    setRandomlyBackgroundColor($parent);
                    watcher = scrollMonitor.create($img, {
                        top: 1600,
                        bottom: 1600
                    });
                    window.newLayoutWatchIdList['watcher_' + the_postid] = watcher;
                    watcher.enterViewport(function () {
                        debugPrint('I have entered the viewport ' + the_postid + ' src: ' + src);
                        if (!$img.hasClass('entered')) {
                            $img.addClass('entered');
                        }
                        if (!$img.is(':visible')) {
                            return $img.show();
                        }
                    });
                    watcher.exitViewport(function () {
                        var height, width;
                        debugPrint('I have left the viewport ' + the_postid + ' src: ' + src);
                        if ($img.hasClass('entered') && $img.is(':visible')) {
                            width = $img.width();
                            height = $img.height();
                            $parent.width(width);
                            $parent.height(height);
                            return $img.hide();
                        }
                    });
                }

                $elem.animate({
                    opacity: 1
                }, 400);
                if (--counter < 1) {
                    var wookmark = new Wookmark('.newLayout_container', {
                        autoResize: false,
                        itemSelector: '.newLayout_element',
                        itemWidth: "48%",
                        flexibleWidth: true,
                        direction: 'left',
                        align: 'center'
                    }, true);
                    SUGGEST_POSTS_LOADING = false;
                    debugPrint('SUGGEST_POSTS_LOADING:', SUGGEST_POSTS_LOADING);
                    $('.moments-loading').hide();
                }
            });

            imgLoad.on('fail', function () {
                console.error('>>> img load failed!!!');
                SUGGEST_POSTS_LOADING = false;
                debugPrint('SUGGEST_POSTS_LOADING:', SUGGEST_POSTS_LOADING);
                $('.moments-loading').hide();
            });
        });
    };

    var fetchSuggestPosts = function (skip, limit) {
        debugPrint('getSuggestedPosts start');
        window.fetchedSuggestPosts = true;
        if (SUGGEST_POSTS_LOADING) return;
        SUGGEST_POSTS_LOADING = true;
        SUGGEST_POSTS_SKIP += limit;
        $('.moments-loading').show();
        CallMethod('getSuggestedPosts', [postid, skip, limit], function (type, result) {
            debugPrint('getSuggestedPosts result: ' + JSON.stringify(result));
            var data = [];
            if (result.length > 0) {
                for (var i = 0; i < result.length; i++) {
                    if (!window.localStorage.getItem('hideSuggestPost_' + result[i].postId))
                        data.push(result[i]);
                }
            }
            processSuggestPostsData(data);
        });
    };
    var initDiscover = function () {
        // ==========动态 start=================

        $(window).scroll(function () {
            if ($(window).scrollTop() >= $(document).height() - $(window).height() && $('.div_discover').css('display') === 'block')
                fetchSuggestPosts(SUGGEST_POSTS_SKIP, SUGGEST_POSTS_LIMIT);
        });
        setTimeout(function () {
            fetchSuggestPosts(SUGGEST_POSTS_SKIP, 2);
        }, 3000);
        $(".discoverBtn").click(function () {
            document.body.scrollTop = $('.div_discover').offset().top - 45;
            //fetchSuggestPosts(SUGGEST_POSTS_SKIP, SUGGEST_POSTS_LIMIT);
            $(".contactsBtn, .postBtn, .discoverBtn, .meBtn").removeClass('focusColor');
            $(".discoverBtn").addClass('focusColor');
            $('.div_me_set-up-sex,.div_me_set-up-nike').css('display', 'none');
            $('.div_contactsList').css('display', "none");
            $('.div_discover').css('display', "block");
            $('.div_me').css('display', "none");
            $('body').css('overflow-y', 'auto');
        });
        $(".div_discover .moments").on('click', '.suggestAlreadyRead', function (e) {
            var the_postid = $(this).parent().parent().parent().data('postid');
            debugPrint(the_postid)
            localStorage.setItem('hideSuggestPost_' + the_postid, true);
            $(this).parent().parent().parent().remove();
            var wookmark = new Wookmark('.newLayout_container', {
                autoResize: false,
                itemSelector: '.newLayout_element',
                itemWidth: "48%",
                flexibleWidth: true,
                direction: 'left',
                align: 'center'
            }, true);
            return false;
        });
        // ==========动态 end=================
    };
    var newFriendCounts = 0;
// 加载更多新朋友
    var grabNewFriendsFromServer = function () {
        window.CallMethod('getPostFriends', [postid, newFriendCounts, 20], function (type, result) {
            debugPrint('load more postFriendHandle is ==:' + JSON.stringify(result));
            var html = '';
            var $node;
            newFriendCounts += 20;
            getNewFriendReadCount(result);
            if (result.length === 0) {
                $pullDownAddMore = $('#pullDownAddMore').html('没有更多数据了');
                return getScrollEvent = false;
            } else {
                $.each(result, function (index, content) {
                    $node = $('.addNewFriends #wrapper');
                    var redSpot = '';
                    if (this.count && this.count === 1) {
                        if (!window.localStorage.getItem('newFriendRead_' + this.ta)) {
                            redSpot = '<div class="red_spot"></div>';
                        }
                    }
                    html += '<div id=' + this.ta + ' class="eachViewer newFriends">'
                        + '<img class="icon" src=' + this.icon + ' width="30" height="30">'
                        + '<span class="userName">' + this.name + '</span>'
                        + '<div class="meet_count">缘分啊，我们已偶遇' + this.count + '次了！</div>'
                        + redSpot
                        + '</div>'
                        + '<div class="chatContentLine"></div>';
                });
                $node.append(html);
                $('#pullDownAddMore').html('没有更多数据了');
                $(".newFriends").click(function (e) {
                    var userId = $(e.currentTarget).attr("id");
                    var newFriendReadUser = window.localStorage.getItem('newFriendRead_' + userId);
                    if (!newFriendReadUser) {
                        window.localStorage.setItem('newFriendRead_' + userId, true);
                        $('#' + userId + ' .red_spot').hide();
                        var totalCount = parseInt($('#newFriendRedSpot').html()) - 1;
                        if (totalCount > 0) {
                            $('#newFriendRedSpot').html(totalCount);
                        } else {
                            $('#newFriendRedSpot').hide();
                        }
                    }
                    showProfilePage(userId);
                });
            }
        });
    };

    var loadMoreNewFriends = function () {
        var getScrollEvent = true;
        $('.div_contactsList').scroll(function (event) {
            var $pullDownAddMore = $('#pullDownAddMore');
            var target = $("#showMorePostFriendsResults");
            if (!target.length) {
                return;
            }
            var threshold = $(window).scrollTop() + $(window).height() - target.height();
            // debugPrint("threshold: " + threshold);
            // debugPrint("target.top: " + target.offset().top);
            if (target.offset().top < threshold && getScrollEvent && $(".div_contactsList").is(':visible')) {
                $pullDownAddMore.html('加载中...');
                grabNewFriendsFromServer()
            }
        });
    };

    var initPullToRefreshOnNewFriends = function () {
        loadMoreNewFriends();
    };

    var getPostCommentData = function () {
        CallMethod("socialData", [postid], function (result, message) {
            debugPrint('Social data is: ' + JSON.stringify(message));
            $.each(message, function (index, content) {
                var html = '';
                var pcomments = '';
                // debugPrint('socialData index is ' + index + ' . this.index is  ' +　this.index + ' . content is ' + JSON.stringify(content) + ' this is ' + JSON.stringify(this) + '  ..dan ');
                var $node = $('[index=' + this.index + ']')
                if (this.pcomments && this.pcomments.length > 0) {
                    for (var i = 0; i <= this.pcomments.length - 1; i++) {
                        pcomments += '<div class="eachComment">'
                            + '<div class="bubble">'
                            + '<span class="personName">' + this.pcomments[i].username + '</span>:'
                            + '<span class="personSay">' + this.pcomments[i].content + '</span>'
                            + '</div>'
                            + '</div>';
                        // debugPrint('each pcomments is ' + pcomments);
                    }
                    // debugPrint('final pcomments is ' + pcomments);
                    html += '<div class="pcomment">'
                        + pcomments
                        + '</div>';
                    $node.append(html);
                }
            });
            calcLayoutForEachPubElement();
        });
    };

    var initImageSwipeView = function () {
        // --- 查看大图 ---
        $(".postImageItem").click(function () {
            var selected, swipedata;
            swipedata = [];
            selected = 0;

            var selectedImage = $(this).find('img').attr('data-original');
            $('.postImageItem').map(function (index, item) {
                var imgUrl = $(item).find('img').attr('data-original');
                if (imgUrl) {
                    if (selectedImage === imgUrl) {
                        selected = index
                    }
                    swipedata.push({
                        href: imgUrl,
                        title: ''
                    });
                }
            });
            return $.swipebox(swipedata, {
                initialIndexOnArray: selected,
                hideCloseButtonOnMobile: true,
                loopAtEnd: false
            });
        });
    };

//==== 分享到故事贴读友圈 START ====
    window.RECOMMEND_USER_STORY_COUNT = 0;
    window.RECOMMEND_FAV_STORY_COUNT = 0;
    window.RECOMMEND_STORY_LIMIT = 5;
    window.RECOMMEND_USER_STORY_LOADALL = false;
    window.RECOMMEND_FAV_STORY_LOADALL = false;
    window.IS_RECOMMEND_FAV_STORY_TABLE = false;

    var pushPostToReaderOrHotPostGroups = function (postIds) {
        var feedItem = {};
        window.CallMethod('pushPostToReaderGroups', [feedItem, postIds, postid]);
    };

    var getRecommendStorys = function () {
        var skip = 0;
        if (IS_RECOMMEND_FAV_STORY_TABLE) {
            if (RECOMMEND_FAV_STORY_LOADALL) {
                return false;
            }
            skip += RECOMMEND_FAV_STORY_COUNT;
        } else {
            if (RECOMMEND_USER_STORY_LOADALL) {
                return false;
            }
            skip += RECOMMEND_USER_STORY_COUNT;
        }
        $('.storySourceLoading').show();
        window.CallMethod('getRecommendStorys', [window._loginUserId, RECOMMEND_STORY_LIMIT, skip, IS_RECOMMEND_FAV_STORY_TABLE], function (type, result) {
            console.table('RecommendStory result is ===', result);
            var html = '';
            var firstParagraph = '';
            if (result) {
                if (result.length > 0) {
                    result.forEach(function (post) {
                        if (post.pub) {
                            post.pub.forEach(function (item) {
                                if (item.type === 'text') {
                                    firstParagraph = item.text;
                                }
                            });
                        }
                        html += '<li id="' + post._id + '">' +
                            '<div class="imgPlaceHolder">' +
                            '<img id="" class="lazy" src="' + post.mainImage + '" style="display: block; background-color: rgb(80, 63, 50);">' +
                            '</div>' +
                            '<div class="postContent">' +
                            '<h2>' + post.title + '</h2>' +
                            '<p>' + firstParagraph + '</p>' +
                            '</div>' +
                            '</li>';
                    });
                    if (IS_RECOMMEND_FAV_STORY_TABLE) {
                        RECOMMEND_FAV_STORY_COUNT += result.length;
                        $('.favoriteStoriesLists').append(html);
                    } else {
                        RECOMMEND_USER_STORY_COUNT += result.length;
                        $('.publishedStoriesLists').append(html);
                    }
                } else {
                    if (IS_RECOMMEND_FAV_STORY_TABLE) {
                        RECOMMEND_FAV_STORY_LOADALL = true;
                    } else {
                        RECOMMEND_USER_STORY_LOADALL = true;
                    }
                }
            }
            $('.storySourceLoading').hide();
        });
    };

    var closeRecommendStorysPage = function () {
        $('body').css('overflow-y', 'auto');
        $('.recommendStory').fadeOut(100);
    };
    var initRecommendStorys = function () {
        $(".storyLists").scroll(function () {
            var nScrollHight = $(this)[0].scrollHeight;
            var nScrollTop = $(this)[0].scrollTop;
            if (nScrollTop + $(this).height() >= nScrollHight)
                getRecommendStorys();
        });
        $('#shareStoryBtn').click(function () {
            $('body').css('overflow-y', 'hidden');
            $('.recommendStory').fadeIn(100);
            getRecommendStorys();
        });
        $('.recommendStory .leftButton').click(function () {
            closeRecommendStorysPage();
        });
        $('.storySource input[type="radio"]').click(function (e) {
            debugPrint(e.currentTarget.id);
            $('.storyLists').toggle();
            if (e.currentTarget.id === 'publishedStories') {
                IS_RECOMMEND_FAV_STORY_TABLE = false;
                if (RECOMMEND_USER_STORY_COUNT === 0) {
                    getRecommendStorys();
                }
            } else {
                IS_RECOMMEND_FAV_STORY_TABLE = true;
                if (RECOMMEND_FAV_STORY_COUNT === 0) {
                    getRecommendStorys();
                }
            }
        });

        // 选择故事分享
        $('.recommendStory').on('click', '.storyLists li', function (e) {
            debugPrint(e.currentTarget.id);
            pushPostToReaderOrHotPostGroups([e.currentTarget.id]);
            toastr.info('推荐成功！');
            closeRecommendStorysPage();
        });

        // 导入分享
        $('.recommendStory #importBtn').click(function (e) {
            var originUrl, url, urlReg;
            originUrl = $('.recommendStory #importUrl').val();
            debugPrint('originUrl==' + originUrl);
            if (originUrl === '') {
                return toastr.info('请输入或粘贴一个链接~');
            }
            urlReg = new RegExp("(http[s]{0,1}|ftp)://[a-zA-Z0-9\\.\\-]+\\.([a-zA-Z]{2,4})(:\\d+)?(/[a-zA-Z0-9\\.\\-~!@#$%^&*+?:_/=<>]*)?", "gi");
            if (!originUrl.match(urlReg)) {
                return toastr.info('链接格式错误~');
            }
            url = 'http://' + window.location.host + '/import-server/' + window._loginUserId + '/' + encodeURIComponent(originUrl);
            debugPrint('url==' + url);
            $('.importing-mask,.importing').show();
            $.get(url, function (result, status) {
                debugPrint(JSON.stringify(result));
                debugPrint(status);
                var data, postId;
                if (result && status === 'success') {
                    data = result.split("\r\n");
                    data = JSON.parse(data[data.length - 1]);
                    postId = data.json.split("/");
                    postId = postId[postId.length - 1];
                    debugPrint("data is ==", data);
                    debugPrint("postId is ==", postId);
                    $('.importing-mask,.importing').hide();
                    if (data.status === "succ") {
                        pushPostToReaderOrHotPostGroups([postId]);
                        toastr.info('推荐成功！');
                        return closeRecommendStorysPage();
                    }
                }
                return toastr.info('导入失败，请重试！');
            });
        });
    }

//==== 分享到故事贴读友圈 END ====
    document.addEventListener('users', userHandle, false);
    var DDPConnectedHandle = function (e) {

        debugPrint('postid is ' + postid);

        autoLogin(function (type, message) {
            debugPrint('login response:' + JSON.stringify(message));
            if (type === 'result' && message) {
                window._loginUserId = message.id;
                window._loginUserToken = message.token;
                window._loginUsertokenExpires = message.tokenExpires;
                debugPrint('user id:' + _loginUserId);
                window.localStorage.setItem('static_login_userId', message.id);
            }
            //Get the most important data ASAP.
            getPostCommentData();

            initPullToRefreshOnNewFriends();
            initImageSwipeView();

            var userNewBellCountId = Subscribe("userNewBellCount", [window._loginUserId], userNewBellCountHandle);
            if (typeof window.alreadyInit !== 'undefined') {
                debugPrint('skip duplicated initialize');
                return;
            }
            window.alreadyInit = true;

            setTimeout(function () {
                update_read_status();
                initRecommendStorys();
            }, 1000);

            setTimeout(function () {
                grabNewFriendsFromServer();
            }, 3000);
            setTimeout(function () {
                initDiscover();
            }, 4000);

            if (typeof subReadyHandle !== 'undefined') {
                document.removeEventListener('subReady', subReadyHandle);
            }
            subReadyHandle = function (e1) {
                var message = e1.detail;
                if (message.subs.includes(userNewBellCountId)) {
                    debugPrint("userNewBellCount ready");
                }
            };
            document.addEventListener('subReady', subReadyHandle, false);
        });
    };

    window._bell = {
        contentList: function (feedId) {
            debugPrint('contentList:', feedId);
            window.CallMethod('readFeedsStatus', [feedId]);
            window.CallMethod('updataFeedsWithMe', [window._loginUserId]);
        }
    };

// ---- Profile START ----
    var preProfileInfo = function (name, userId) {
        $('.' + name + ' .userProfileTop').html('<img class="icon" src="/userPicture.png" width="70" height="70">\
                    <span class="userName theprofileName"></span>\
                    <span class="location"></span>\
                    <span class="desc"></span>');
        $("." + name + " .recentViewPosts").html('');
        $("." + name + " .favoritePosts").html('');
        $('body').css('overflow-y', 'hidden');
        $('.' + name + ' .wait-loading').show();
        localStorage.setItem('favouritepostsCounts', 10);
        window.CallMethod('profileData', [userId], function (type, result) {
            debugPrint('profileData is ==:' + JSON.stringify(result));
            // 写入user数据
            $("." + name + " .head div:eq(1)").html(result.userProfile.name);
            $("." + name + " .theprofileName").html(result.userProfile.name);
            $("." + name + " .userProfileTop .icon").attr('src', result.userProfile.icon);
            $("." + name + " .userProfileTop .location").html(result.userProfile.location);
            $("." + name + " .userProfileTop .desc").html(result.userProfile.desc);
            // 写入最近浏览的故事
            var recentReviewPost = '';
            var favouriteposts = '';
            result.recentViewPosts.forEach(function (item) {
                recentReviewPost += '<a href="http://' + window.location.host + '/t/' + item._id + '" style="color: #5A5A5A;"><li id="' + item.postId + '">' +
                    '<div class="postMainImage no-swipe" style="background-image:url(' + item.mainImage + ')"></div>' +
                    '<h6 class="title" style="text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">' +
                    item.title + '</h6></li></a>';
            });

            // 写入喜欢的故事

            result.favouritePosts.forEach(function (item) {
                favouriteposts += '<a href="http://' + window.location.host + '/t/' + item._id + '" style="color: #5A5A5A;"><div id="' + item._id + '" style="border-radius: 5px; background-color: #f7f7f7;">' +
                    '<div class="img_placeholder" style="' +
                    'margin: 0 0.125em 1em;-moz-page-break-inside: avoid;-webkit-column-break-inside: avoid;break-inside: avoid;background: white;border-radius:4px;">' +
                    '<img class="mainImage" src="' + item.mainImage + '" style="width: 100%;border-radius: 4px 4px 0 0;"/>' +
                    '<p class="title" style="font-size: 16px;font-weight: bold;white-space: pre-line;word-wrap: break-word;margin: 10px;">' + item.title + '</p>' +
                    '<p class="addontitle" style="font-size:11px;margin: 10px;">' + item.addontitle + '</p>' +
                    '</div></div></a>';
            });
            $("." + name + " .recentViewPosts").html(recentReviewPost);
            $("." + name + " .favoritePosts").html(favouriteposts);
            $('.' + name + ' .wait-loading').hide();
            $("." + name + " .userProfileBox .loadMore").html("加载更多");

        });
    };
// 加载更多喜欢的故事
    var loadMoreFavouriteposts = function (name, userId) {
        $("." + name + " .userProfileBox .loadMore").on('click', function () {
            var $self = $(this);
            var favouritepostsCounts;
            favouritepostsCounts = parseInt(localStorage.getItem('favouritepostsCounts'));
            $self.html('<img src="/loading-2.gif" style="width: 28px; height:28px;"/> 加载中...');
            // getMoreFavouritePosts params[userId,skip,limit]
            window.CallMethod('getMoreFavouritePosts', [userId, favouritepostsCounts, 10], function (type, result) {
                debugPrint('profileData is ==:' + JSON.stringify(result));
                var favouriteposts = '';
                favouritepostsCounts += 10;
                localStorage.setItem('favouritepostsCounts', favouritepostsCounts);
                if (result.length === 0) {
                    $self.html('没有更多数据了');
                    $self.off("click");
                } else {
                    for (var i = 0; i < result.length; i++) {
                        favouriteposts += '<a href="http://' + window.location.host + '/t/' + result[i]._id + '" style="color: #5A5A5A;"><div id="' + result[i]._id + '" style="border-radius: 5px; background-color: #f7f7f7;">' +
                            '<div class="img_placeholder" style="' +
                            'margin: 0 0.125em 1em;-moz-page-break-inside: avoid;-webkit-column-break-inside: avoid;break-inside: avoid;background: white;border-radius:4px;">' +
                            '<img class="mainImage" src="' + result[i].mainImage + '" style="width: 100%;border-radius: 4px 4px 0 0;"/>' +
                            '<p class="title" style="font-size: 16px;font-weight: bold;white-space: pre-line;word-wrap: break-word;margin: 10px;">' + result[i].title + '</p>' +
                            '<p class="addontitle" style="font-size:11px;margin: 10px;">' + result[i].addontitle + '</p>' +
                            '</div></div></a>';
                    }
                    $("." + name + " .favoritePosts").append(favouriteposts);
                    $self.html('加载更多');
                }
            });
        });
    };
    var newFriendProfile = {
        ids: [],
        profile: {},
        browses: {},
        links: {},
        init: function () {
            newFriendProfile.ids = [];
            newFriendProfile.profile = {};
            newFriendProfile.browses = {};
            newFriendProfile.links = {};
            $('.newFriends').each(function () {
                var id = $(this).attr('id');
                if (newFriendProfile.ids.indexOf(id) === -1) {
                    newFriendProfile.ids.push(id);
                    newFriendProfile.profile[id] = {
                        icon: $(this).find('img.icon').attr('src'),
                        fullname: $(this).find('.userName').html(),
                        sex: '/male.png',
                        location: '',
                        desc: ''
                    };
                }
                debugPrint('profile:', newFriendProfile.profile);
            });
        },
        prev: function (id) {
            var index = newFriendProfile.ids.indexOf(id);
            if (index === -1)
                return null;
            return index - 1 >= 0 ? newFriendProfile.ids[index - 1] : null;
        },
        next: function (id) {
            var index = newFriendProfile.ids.indexOf(id);
            if (index === -1)
                return null;
            return index + 1 < newFriendProfile.ids.length ? newFriendProfile.ids[index + 1] : null;
        },
        render: function (name, id) {
            var $page = $('.' + name);
            var $profile = $page.find('.userProfileTop');

            $profile.find('.icon').attr('src', newFriendProfile.profile[id].icon);
            $profile.find('.userName').html(newFriendProfile.profile[id].fullname);
            $page.find('.head div:eq(1)').html(newFriendProfile.profile[id].fullname);
            preProfileInfo(name, id);
            loadMoreFavouriteposts(name, id);
        }
    };
    window.showProfilePage = function (userId, isOwner) {
        localStorage.setItem('documentCurrTop', document.body.scrollTop);
        document.body.scrollTop = 0;
        // preProfileInfo(userId);
        // $(".userProfileBox").show();
        // loadMoreFavouriteposts();
        $('.userProfileBox').show();

        if (isOwner) {
            var swipe = new window.Swipe(['userProfilePage1', 'userProfilePage2', 'userProfilePage3'], true, $('.swipe-tmp'));
            swipe.leftRight(null, null);
            swipe.setInitialPage('userProfilePage2');
            preProfileInfo('userProfilePage2', userId);
            loadMoreFavouriteposts('userProfilePage2', userId);
            return;
        }

        newFriendProfile.init();
        var swipe = new window.Swipe(['userProfilePage1', 'userProfilePage2', 'userProfilePage3'], true, $('.swipe-tmp'));
        swipe.onPageChanged(function (obj, name) {
            debugPrint('swipe:', obj);
            debugPrint('page changed:', name);

            var id = $('.' + name).attr('data-id');
            newFriendProfile.render(name, id);

            switch (name) {
                case 'userProfilePage1':
                    swipe.leftRight(newFriendProfile.prev(id) ? 'userProfilePage3' : null, newFriendProfile.next(id) ? 'userProfilePage2' : null);
                    $('.userProfilePage1').attr('data-id', id);
                    $('.userProfilePage3').attr('data-id', newFriendProfile.prev(id) || '');
                    $('.userProfilePage2').attr('data-id', newFriendProfile.next(id) || '');
                    break;
                case 'userProfilePage2':
                    swipe.leftRight(newFriendProfile.prev(id) ? 'userProfilePage1' : null, newFriendProfile.next(id) ? 'userProfilePage3' : null);
                    $('.userProfilePage2').attr('data-id', id);
                    $('.userProfilePage1').attr('data-id', newFriendProfile.prev(id) || '');
                    $('.userProfilePage3').attr('data-id', newFriendProfile.next(id) || '');
                    break;
                case 'userProfilePage3':
                    swipe.leftRight(newFriendProfile.prev(id) ? 'userProfilePage1' : null, newFriendProfile.next(id) ? 'userProfilePage2' : null);
                    $('.userProfilePage3').attr('data-id', id);
                    $('.userProfilePage1').attr('data-id', newFriendProfile.prev(id) || '');
                    $('.userProfilePage2').attr('data-id', newFriendProfile.next(id) || '');
                    break;
            }
        });
        $('.userProfilePage2').attr('data-id', userId);
        swipe.setInitialPage('userProfilePage2');
    }
    $(".showPosts .user").click(function () {
        var profileUserId = $(".showPosts .user").attr("id");
        localStorage.setItem('profileUserId', profileUserId);
        localStorage.setItem('userProfile_BoxFromPostsPage', true);
        showProfilePage(profileUserId, true);
    });

    $(".userProfileBox .leftButton").click(function () {
        document.body.scrollTop = 0;
        if (localStorage.getItem('userProfile_BoxFromPostsPage') === 'true') {
            $('body').css('overflow-y', 'auto');
        }
        localStorage.setItem('userProfile_BoxFromPostsPage', false);
        $(".userProfileBox").hide();
    });
// ---- Profile END ----

    $(document).ready(function () {
        document.addEventListener('ddpConnected', DDPConnectedHandle, false);

        if (isWeiXinFunc()) {
            if (typeof wx === 'undefined') {
                loadScript('http://res.wx.qq.com/open/js/jweixin-1.0.0.js', function () {
                    wechat_sign();
                });
            } else {
                wechat_sign();
            }
        }
    })
})();

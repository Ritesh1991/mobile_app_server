(function(global) {
    if (!global.gushitie) global.gushitie = {};

    var gushitie = global.gushitie;
    gushitie.showpost = {};


    var SUGGEST_POSTS_SKIP = 0;
    var SUGGEST_POSTS_LIMIT = 10;
    var SUGGEST_POSTS_LOADING = false;

    var getBaseWidth = function() {
      return ($('.showPosts').width() - 30) / 6;
    };

    var getDocHeight = function() {
      var D;
      D = document;
      return Math.max(Math.max(D.body.scrollHeight, D.documentElement.scrollHeight), Math.max(D.body.offsetHeight, D.documentElement.offsetHeight), Math.max(D.body.clientHeight, D.documentElement.clientHeight));
    };

    var getBaseHeight = function() {
      return ($('.showPosts').width() - 30) / 6;
    };


    var getLayoutTop = function(helper, col, sizeX) {
      var max;
      max = 0;
      for (i = col; i <= col+sizeX -1; i++) {
        max = Math.max(max, helper[(i - 1)]);
      }
      return max;
    };

    var updateLayoutData = function(helper, col, sizeX, bottom) {
      for (i = col; i <= col+sizeX -1; i++) {
        helper[(i - 1)] = bottom;
      }
    };

    var fetchPubInfo = function($elem) {
        return {
            "index": Number($elem.attr('index')),
            "type": $elem.attr('type'),
            "data_col": Number($elem.attr('col')),
            "data_sizex": Number($elem.attr('sizex')),
            "data_sizey": Number($elem.attr('sizey'))
        };
    };

    var calcLayoutForEachPubElement = function() {
        var layoutHelper = [0, 0, 0, 0, 0, 0];
        var imageMarginPixel = 5;

        $("#test .element").each(function() {
            var elem = this, $elem= $(this), parentNode = this.parentNode;
            var pubInfo = fetchPubInfo($elem);

            if (pubInfo.index === 0) {
                updateLayoutData(layoutHelper, 1, 6, parentNode.offsetTop);
            }

            elem.style.top = getLayoutTop(layoutHelper, pubInfo.data_col, pubInfo.data_sizex) + imageMarginPixel + 'px';

            var left = parentNode.offsetLeft + (pubInfo.data_col - 1) * getBaseWidth();
            var width = pubInfo.data_sizex * getBaseWidth();

            if (pubInfo.data_col !== 1) {
                left = left + imageMarginPixel;
                width = width - imageMarginPixel;
            }

            elem.style.left = left + 'px';
            elem.style.width = width + 'px';

            if (pubInfo.type === 'image' || pubInfo.type === 'video') {
                elem.style.height = pubInfo.data_sizey * getBaseHeight() + 'px';
            }

            var elemBottom = elem.offsetTop + elem.offsetHeight;
            updateLayoutData(layoutHelper, pubInfo.data_col, pubInfo.data_sizex, elemBottom);
            parentNode.style.height = getLayoutTop(layoutHelper, 1, 6) - parentNode.offsetTop + 'px';            
        });
    };

    var initLazyload = function() {
        $(".padding-overlay").siblings("img.lazy").each(function() {
            var $lazyItem = $(this);
            $lazyItem.lazyload({
                effect: "fadeIn",
                effectspeed: 600,
                threshold: 800,
                placeholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
                load: function() {
                    $(this).parent().actImageFitCover('style');
                }
            });
            padding.setRandomlyBackgroundColor($lazyItem);
        });
    };

    var fetchSuggestPosts = function(skip, limit) {
        if(SUGGEST_POSTS_LOADING) return;
        SUGGEST_POSTS_LOADING = true;
        console.log('>>> Begin to fetch suggest posts <<<');
        var url = '/static/data/suggestposts/123/' + skip + '/' + limit;
        SUGGEST_POSTS_SKIP += SUGGEST_POSTS_LIMIT;
        $.getJSON(url, function(data) {
            var posts = data.data;
            var counter = posts.length;
            var html = '';
            posts.forEach(function(post) {
                html += '<div class="newLayout_element" data-postid="' + post.postId + '">'
                          + '<div class="img_placeholder">'
                          + '<img class="mainImage" src="' + post.mainImage+ '" />'
                          + '</div>'
                          + '<div class="pin_content">'
                          + '<p class="title">' + post.title + '</p>'
                          + '<p class="addontitle">' + post.addontitle + '</p>'
                          + '<h1 class="username">' + post.ownerName + '<span>发布</span><button class="suggestAlreadyRead"><i class="fa fa-times"></i></button></h1>'
                          + '</div>'
                          + '</div>';
            });

            var $container = $(".moments .newLayout_container");

            if($container.length > 0) {
                $container.append(html);
            }
            else {
                html = '<div class="newLayout_container">' + html + '</div>';
                $(".div_discover .moments").append(html);
                $container = $(".moments .newLayout_container");
            }


            $(".moments .newLayout_element").not('.loaded').each(function() {
                var elem = this, $elem = $(this);
                $elem.click(function() {
                    var postid = $(this).data('postid');
                    window.open('/static/' + postid, '_blank');
                });
                $elem.detach();

                var imgLoad = imagesLoaded(elem);

                imgLoad.on('done', function() {
                    console.log('>>> img load done!!!');
                    elem.style.display = 'block';
                    //$elem.css('opacity', 0);
                    $elem.addClass('loaded');

                    $container.append($elem);

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
                    }
                });

                imgLoad.on('fail', function() {
                    console.error('>>> img load failed!!!');
                });
            });
        });
    };

    gushitie.showpost.init = function () {
        $("#wrapper .mainImage").css("height", ($(window).height() * 0.55) + "px");
        $('.textDiv1Link').linkify();

        calcLayoutForEachPubElement();

        initLazyload();

        // register window scroll callback
        function toggleHeaderNav(show) {
            if(show) {
                if (!$('.showPosts .head').is(':visible')) {
                    $('.showPosts .head').fadeIn(300);
                }
            }
            else {
                if ($('.showPosts .head').is(':visible')) {
                    $('.showPosts .head').fadeOut(300);
                }
            }
        }

        function toggleFooterNav(show) {
            if(show) {
                if (!$('.socialContent .chatFooter').is(':visible')) {
                    $('.socialContent .chatFooter').fadeIn(300);
                }
            }
            else {
                if ($('.socialContent .chatFooter').is(':visible')) {
                    $('.socialContent .chatFooter').fadeOut(300);
                }           
            }
        }

        function scrollEventCallback() {
            var st = $(window).scrollTop();

            if (st <= 40) {
                toggleHeaderNav(true);
                toggleFooterNav(true);
                window.lastScroll = st;
                return;
            }

            // reach bottom
            if ((st + $(window).height()) === getDocHeight()) {
                //fetchSuggestPosts(SUGGEST_POSTS_SKIP, SUGGEST_POSTS_LIMIT);
            }            
            //if ((st + $(window).height()) === getDocHeight()) {
            if ((getDocHeight() - (st + $(window).height())) < 150) {
                toggleHeaderNav(true);
                toggleFooterNav(true);
                window.lastScroll = st;
                return;
            }


            // scroll up
            if (window.lastScroll - st > 5) {
                toggleHeaderNav(true);
                toggleFooterNav(true);
            }

            // scroll down
            if (window.lastScroll - st < -5) {
                toggleHeaderNav(false);
                toggleFooterNav(false);
            }

            if (Math.abs(window.lastScroll - st) < 5) {
                return;
            }

            window.lastScroll = st;
        }
        $(window).scroll(scrollEventCallback);


        // register for audio/video play
        $(".postAudioItem.element .play_area").click(function() {
            var _self = this, $_self = $(this), $audio= $_self.find('audio');
            if ($_self.hasClass('music_playing')) {
                $_self.removeClass('music_playing');
                $audio.trigger('pause');
            }
            else {
                $_self.addClass('music_playing');
                $audio.trigger('play');
            }
        });
        
        $(".postVideoItem.element .play_area").click(function() {
            var _self = this, $_self = $(this), $video = $_self.find("video");

            if ($video.get(0)) {
                $video.siblings('.video_thumb').fadeOut(100);
                $video.get(0).paused ? $video.get(0).play() : $video.get(0).pause();
            }
        });
        /*
        $(".chatBtn").click(function() {
            var chat_server_url = 'testchat.tiegushi.com';
            var postId = window.location.pathname.split('/static/')[1];
            var url = 'http://'+chat_server_url+'/channel/' + postId;

            var userId = localStorage.getItem("Meteor.userId");
            if (userId) url += '/userid/' + userId;
            window.open(url,'_blank')
        });
        */
        //fetchSuggestPosts(SUGGEST_POSTS_SKIP, SUGGEST_POSTS_LIMIT);
    };
})(window);
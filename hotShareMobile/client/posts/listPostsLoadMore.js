/**
 * Created by simba on 6/6/17.
 */

if(Meteor.isClient){
    initLoadMoreForListPosts = function(){
        var sl = new Scrollload({
            // container 和 content 两个配置的默认取的scrollload-container和scrollload-content类的dom。只要你按照以上的dom结构写，这两个配置是可以省略的
            container: document.querySelector('.home #wrapper'),
            content: document.querySelector('.home #list'),
            loadMore: function(sl) {
                console.log('Call toLoadFollowPost in Scrolll');
                toLoadFollowPost(function(err,result){
                    if(err){
                        // 加载出错，需要执行该方法。这样底部DOM会出现出现异常的样式。
                        sl.throwException()
                    } else if(result && result.length === 0){
                        // 没有数据的时候需要调用noMoreData
                        sl.noMoreData()
                    } else {
                        sl.unLock()
                    }
                })
            },
            // 你也可以关闭下拉刷新
            enablePullRefresh: false,
            /*pullRefresh: function (sl) {
                toLoadLatestFollowPost(function(result){
                    sl.refreshComplete()
                })
            }*/
        })
        return sl;
    }
}
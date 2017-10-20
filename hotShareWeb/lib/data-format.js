if (!Date.prototype.format){
  //将Date型format成("yyyy年MM月dd日hh小时mm分ss秒");
  Date.prototype.format = function(format) {
    /*
      * eg:format="YYYY-MM-dd hh:mm:ss";
      使用方法:
      var testDate = new Date();
      var testStr = testDate.format("yyyy年MM月dd日hh小时mm分ss秒");
      alert(testStr);
      */
    var week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var o = {
        "M+": this.getMonth() + 1,  //month
        "d+": this.getDate(),     //day
        "h+": this.getHours(),    //hour
        "m+": this.getMinutes(),  //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
        "S": this.getMilliseconds(), //millisecond
        "e+": week[this.getDay()]
    };

    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }

    for (var k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        }
    }
    return format;
  };
}
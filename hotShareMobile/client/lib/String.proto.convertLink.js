String.prototype.convertLink = function(target){
  var reg = /(http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-)+)/g;
  var str = this;
  if(target){
    str = str.replace(reg,"<a href='$1$2' target='"+target+"'>$1$2</a>").replace(/\n/g,"<br/>");
  } else {
    str = str.replace(reg,"<a href='$1$2'>$1$2</a>").replace(/\n/g,"<br/>");
  }
  return str;
}
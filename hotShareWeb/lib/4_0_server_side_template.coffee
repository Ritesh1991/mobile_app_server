
if Meteor.isServer
  Meteor.startup ()->
    postFontStyleDefault='font-size:large;';
    postFontStyleNormal='font-size:large;';
    postFontStyleQuota='font-size:15px;background:#F5F5F5;padding-left:3%;padding-right:3%;color:grey;';

    calcTextItemStyle = (layoutObj)->
      fontStyle = postFontStyleDefault
      alignStyle = 'text-align:left;'
      if layoutObj
        if layoutObj.font
          if layoutObj.font is 'normal'
            fontStyle=postFontStyleNormal
          else if layoutObj.font is 'quota'
            fontStyle=postFontStyleQuota
        if layoutObj.align
          if layoutObj.align is 'right'
            alignStyle = "text-align:right;"
          else if layoutObj.align is 'center'
            alignStyle = "text-align:center;"
        if layoutObj.weight
          alignStyle = "font-weight:"+layoutObj.weight+";"
      fontStyle+alignStyle
    storeStyleInItem = (node,type,value)->
      $(node).attr('hotshare-'+type,value)
    getStyleInItem = (node,type,value)->
      $(node).attr('hotshare-'+type)


    GetTime0 = (dateM)->
      MinMilli = 1000 * 60;         #初始化变量。
      HrMilli = MinMilli * 60;
      DyMilli = HrMilli * 24;
      #计算出相差天数
      days=Math.floor(dateM/(DyMilli));

      #计算出小时数
      leave1=dateM%(DyMilli); #计算天数后剩余的毫秒数
      hours=Math.floor(leave1/(HrMilli));
      #计算相差分钟数
      leave2=leave1%(HrMilli);        #计算小时数后剩余的毫秒数
      minutes=Math.floor(leave2/(MinMilli));
      #计算相差秒数
      leave3=leave2%(MinMilli);      #计算分钟数后剩余的毫秒数
      seconds=Math.round(leave3/1000);

      prefix = ""
      if dateM > DyMilli
        prefix = days+"天 前"
      else if dateM > HrMilli
        prefix = hours+"小时 前"
      else if dateM > MinMilli
        prefix = minutes+"分钟 前"
      else if dateM <= MinMilli
        if seconds <= 0
          prefix = "刚刚"
        else
          prefix = seconds+"秒 前"

      return prefix

    SSR.compileTemplate('postItem', Assets.getText('static/postItem.html'))
    Template.postItem.helpers
      hasVideoInfo: (videoInfo)->
        if videoInfo
          return true
        else
          false
      myselfClickedUp:->
        false
      myselfClickedDown:->
        return false
      calcStyle: ()->
  # For backforward compatible. Only older version set style directly
        if this.style and this.style isnt ''
          ''
        else
          calcTextItemStyle(this.layout)
      isTextLength:(text)->
        if(text.trim().length>20)
          return true
        else if  text.split(/\r\n|\r|\n/).length > 1
          return true
        else
          return false
      pcIndex:->
        pcindex = 0
        index = parseInt(this.index)
        if index is pcindex
          'dCurrent'
        else
          ''
      scIndex:->
        scindex = 0
        index = parseInt(this.index)
        if index is scindex
          'sCurrent'
        else
          ''
      plike:->
        if this.likeSum is undefined
          0
        else
          this.likeSum
      pdislike:->
        if this.dislikeSum is undefined
          0
        else
          this.dislikeSum
      pcomments:->
        if this.pcomments is undefined
          0
        else
          this.pcomments.length
      getStyle:->
        self=this
        pclength=0
        if self.pcomments
          pclength=self.pcomments.length
        userId=""
        scolor="#F30B44"
        if userId and userId isnt ""
          if self.likeUserId and self.likeUserId[userId] is true
            scolor="#304EF5"
          if scolor is "#F30B44" and self.dislikeUserId and self.dislikeUserId[userId] is true
            scolor="#304EF5"
          if scolor is "#F30B44" and pclength>0
            for icomment in self.pcomments
              if icomment["userId"] is userId
                scolor="#304EF5"
                break
        if scolor is "#304EF5"
          if Session.get("toasted") is false
            Session.set "toasted",true
            Session.set("needToast",true)
        dislikeSum = 0
        if self.dislikeSum
          dislikeSum=self.dislikeSum
        likeSum=0
        if self.likeSum
          likeSum=self.likeSum
        if dislikeSum + likeSum + pclength is 0
          self.style
        else
          if self.style is undefined or self.style.length is 0
            "color: "+scolor+";"
          else
            self.style.replace("grey",scolor).replace("rgb(128, 128, 128)",scolor).replace("rgb(0, 0, 0)",scolor).replace("#F30B44",scolor)

    SSR.compileTemplate('post', Assets.getText('static/post.html'))
    Template.post.helpers
      withSectionMenu: withSectionMenu
      getDDPUrl: ()->
        ddp_alter_url
      time_diff: (created)->
        GetTime0(new Date() - created)
      getPub:->
        self = this
        self.pub = self.pub || []
        if withSponserLinkAds
          position = 1+(self.pub.length / 2)
          self.pub.splice(position,0,{adv:true,type:'insertedLink',data_col:1,data_sizex:6,urlinfo:'http://cdn.tiegushi.com/posts/qwWdWJPMAbyeo8tiJ'})
          _.map self.pub, (doc, index, cursor)->
            if position < index
              _.extend(doc, {index: index-1})
            else
              _.extend(doc, {index: index})
        else
          _.map self.pub, (doc, index, cursor)->
            _.extend(doc, {index: index})

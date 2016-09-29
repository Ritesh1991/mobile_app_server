if Meteor.isServer
  Meteor.startup ()->
    seedrandom = Meteor.npmRequire('seedrandom')
    rng = seedrandom(new Date())
    name_numbers = RefNames.find({}).count()
    @getRandomAnonymousName = ()->
      try
        skipNumber = parseInt(rng()*name_numbers)
        anonymousName = RefNames.findOne({},{fields: {text:1},skip:skipNumber}).text;
        if anonymousName and anonymousName isnt ''
          return anonymousName
      catch
        return null
    Accounts.onCreateUser (options, user)->
      randomI = parseInt(Math.random()*33+1)
      if options.profile
        user.profile = options.profile
        if user.profile.anonymous is true
          user.profile.icon = 'http://data.tiegushi.com/anonymousIcon/anonymous_' + randomI + '.png'
          newName = getRandomAnonymousName()
          if newName and newName isnt ''
            user.profile.fullname = newName
        if user.profile.name
          user.profile.fullname = user.profile.name
      Meteor.defer ()->
        mqttUserCreateHook(user._id,user.profile.fullname,user.username)

      return user
    # 禁止相关设备创建用户
    Accounts.validateNewUser (user)->
      if user.token
        if LockedUsers.find({token: user.token}).count() > 0
          throw new Meteor.Error(403, "设备被禁用")
      # 禁止匿名登录(only mobile) 允许匿名登录看贴，　但是禁止发帖
      ###console.log('create='+JSON.stringify(user.profile))
      if user and user.profile and user.profile.anonymous is true
        if user.profile.browser is true
          return true
        else
          throw new Meteor.Error(403, "不能匿名登录")
      else###
      return true

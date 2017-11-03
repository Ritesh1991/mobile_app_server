LABLE_DADASET_Handle = {
  insert: function(doc) {
  	console.log('LableDadaSet insert with :' + JSON.stringify(doc));
    if (!doc || !doc.group_id || !doc.id || !doc.url || !doc.name) {
      return;
    }
    var group_id = doc.group_id;
    var id = doc.id;
    var url = doc.url;
    var name = doc.name;
    var dataset = LableDadaSet.findOne({group_id:group_id,url:url}); 
    if (!dataset) {
    	var datasetObj = {
    		group_id:group_id,
    		id:id,
    		url:url,
    		name:name,
    		uuid:doc.uuid,
        sqlid:doc.sqlid,
        style: doc.style,
    		createAt:new Date(),
    	};
    	if (doc.user_id) {
	      	var user = Meteor.users.findOne({_id:doc.user_id});
	      	if (user) {
	      		var operator = {
	      			user_id:user._id,
	      			user_name:user.profile && user.profile.fullname ? user.profile.fullname : user.username,
	      			ts:new Date(),
	      			label_name:name, //当前操作的人标记的名字
	      			action:doc.action
	      		};
	      		datasetObj.operator = [operator];
	      	}
	    }
      console.log('LableDadaSet is:', JSON.stringify(datasetObj));
    	LableDadaSet.insert(datasetObj);
    }
    else{
    	LABLE_DADASET_Handle.update(doc);
    }
  },
  update:function(doc){
  	console.log('LableDadaSet update with :' + JSON.stringify(doc));
    if (!doc || !doc.group_id || !doc.id || !doc.url) {
      return;
    }
    var group_id = doc.group_id;
    var id = doc.id;
    var url = doc.url;
    var dataset = LableDadaSet.findOne({group_id:group_id,url:url});
    if (!dataset) {
      return;
    }
    var updateObj = {id:id};
    if (doc.name) {
    	updateObj.name = doc.name;
    }
    if (doc.user_id) {
	  	var user = Meteor.users.findOne({_id:doc.user_id});
	  	if (user) {
	  		var operator = {
	  			user_id:user._id,
	  			user_name:user.profile && user.profile.fullname ? user.profile.fullname : user.username,
	  			ts:new Date(),
	  			label_name:doc.name,
	  			action:doc.action
	  		};
	  		LableDadaSet.update({_id:dataset._id},{$set:updateObj,$push:{operator:operator}});
	  	}
    }
    else{
        LableDadaSet.update({_id:dataset._id},{$set:updateObj});
    }
    console.log('wait update dataset: '+JSON.stringify(dataset));
    //标错后重标会存在id变化的情况
    if (dataset.id != id) {
      //更新旧的id存在的person表
      doc.id = dataset.id;
      LABLE_DADASET_Handle.updatePerson(doc);
    }
    // 同一张未识别的图片，两个人标记时选择了不同的人
    if (dataset.name != doc.name) {
    	doc.id = dataset.id;
    	doc.name = dataset.name;
    	LABLE_DADASET_Handle.updatePersonWithName(doc);
    }
  },
  remove:function(doc){
  	console.log('LableDadaSet remove with :' + JSON.stringify(doc));
    if (!doc || !doc.group_id || !doc.id || !doc.url) {
      return;
    }
    LableDadaSet.remove({group_id:doc.group_id,url:doc.url});
    LABLE_DADASET_Handle.updatePerson(doc);
  },
  updatePersonWithName:function(doc){
    console.log('try updatePersonWithName:'+JSON.stringify(doc));
  	if (!doc || !doc.group_id || !doc.id || !doc.url || !doc.name) {
      return;
    }
    var group_id = doc.group_id;
    //如果此图片存在于person表中，需要替换
    var person = Person.findOne({group_id:group_id ,'name': doc.name}, {sort: {createAt: 1}});
    if (!person) {
      return;
    }
    var url = doc.url;

    var index = _.pluck(person.faces, 'url').indexOf(url);
    if (person.url == url || person.faceId == doc.id) {}
    if(index != -1 || person.url == url || person.faceId == doc.id){
    	if (index != -1  && person.faces[index].id === doc.id) {
    		person.faces.splice(_.pluck(person.faces, 'id').indexOf(doc.id), 1);
    		if (person.faces.length == 0) {
          // 这里同时移除相应的personNames 记录
          var personName = PersonNames.findOne({group_id: group_id,id:doc.id, name:person.name});
          if(personName){
            PersonNames.remove({_id: personName._id});
          }
          WorkAIUserRelations.remove({'ai_persons.id': person._id});
          WorkStatus.remove({'person_id.id': person._id});
  				return Person.remove({_id:person._id});
  			}
    	}
    	else if (index != -1) {
    	    var newdataset = LableDadaSet.findOne({id:person.faces[index].id},{sort: {createAt: -1}});
	        if (newdataset) {
	          person.faces[index].url = newdataset.url;
	        }
    	 }
    	if (person.faces && person.faces.length > 0){
    		person.faceId = person.faces[0].id;
	        person.url = person.faces[0].url;
    	}
    	Person.update({_id:person._id},{$set:{faceId:person.faceId,url:person.url,faces:person.faces}});
     }
  },
  updatePerson:function(doc){
    console.log('try updatePerson:'+JSON.stringify(doc));
    if (!doc || !doc.group_id || !doc.id || !doc.url) {
      return;
    }

    var group_id = doc.group_id;
    var id = doc.id;
    var url = doc.url;

    //如果此图片存在于person表中，需要替换
    var person = Person.findOne({group_id:group_id ,'faces.id': id}, {sort: {createAt: 1}});
    if (!person) {
      return;
    }
    var facesurl = person.faces[_.pluck(person.faces, 'id').indexOf(id)].url;
    if (person.url == url || facesurl == url) {
      // if(_.pluck(person.faces, 'id').indexOf(id) === -1){
      //   person.faces.push({id: id, url: url});
      // }
      // else{
      //   person.faces[_.pluck(person.faces, 'id').indexOf(id)].url = url;
      // }
      var newdataset = LableDadaSet.findOne({id:id},{sort: {createAt: -1}});
      if (newdataset) {
        if (person.url == url) {
          person.url = newdataset.url;
        }
        if (facesurl == url) {
          person.faces[_.pluck(person.faces, 'id').indexOf(id)].url = newdataset.url;
        }
        person.updateAt = new Date();
        Person.update({_id: person._id}, {$set: {url: person.url, updateAt: person.updateAt, faces: person.faces}});
      }
      else{
        //数据集中没有此id更多的图片了
        person.faces.splice(_.pluck(person.faces, 'id').indexOf(id), 1);
        if (person.faceId == id) {
          if (person.faces.length == 0) {
            // 这里同时移除相应的personNames 记录
            var personName = PersonNames.findOne({group_id: group_id,id:id, name:person.name});
            if(personName){
              PersonNames.remove({_id: personName._id});
            }
            WorkAIUserRelations.remove({'ai_persons.id': person._id});
            WorkStatus.remove({'person_id.id': person._id});
            return Person.remove({_id:person._id});
          }
          else{
            person.faceId = person.faces[0].id;
            person.url = person.faces[0].url;
          }
        }
        Person.update({_id:person._id},{$set:{faceId:person.faceId,url:person.url,faces:person.faces}});
      }
    }
  },
  /*initLableDataSet:function(){
    Person.find({},{sort: {updateAt:1}}).forEach(function(fields){
      if (fields.faces && fields.faces.length > 0) {
        for (var i = 0; i < fields.faces.length; i++) {
          LABLE_DADASET_Handle.insert({group_id:fields.group_id,name:fields.name,id:fields.faces[i].id,url:fields.faces[i].url,action:'Person表数据移植',user_id:'4jQXwnAuLnHcYJxwJ'});
        }
      }
    });
  },*/
};

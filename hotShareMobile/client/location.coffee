updateFromThirdPartWebsite = ()->
  $.getJSON "http://ip2l.tiegushi.com/ip/",(json , textStatus, jqXHR )->
    if (textStatus is 'success') and json
      address = ''
      if json.location and json.location isnt ''
        address += json.location
      if address isnt ''
        Meteor.users.update Meteor.userId(),{$set:{'profile.location':address}}
        console.log 'Set address to ' + address
window.updateMyOwnLocationAddress = ()->
  console.log('Update location now')
  url = "http://restapi.amap.com/v3/ip?output=json&key=b5204bfc0ffbe36db8f0c9254ef65e25"
  $.getJSON url, (json, textStatus, jqxhr)->
    console.log 'status is ' + textStatus
    address = ''
    if textStatus is 'success'
      console.log 'Remote IP Info is ' + JSON.stringify(json)
      if (not $.isArray(json.province)) and json.province and json.province isnt ''
        address += '中国,' + json.province
      if (not $.isArray(json.city)) and json.city and json.city isnt '' and json.city isnt json.province
        address += ',' + json.city
      console.log 'Address is ' + address
      if address isnt ''
        Meteor.users.update Meteor.userId(),{$set:{'profile.location':address}}
      else
        updateFromThirdPartWebsite()
    else
      updateFromThirdPartWebsite()

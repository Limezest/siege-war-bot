function testSendTextMessage() {
  var userId = 'REDACTED';
  sendTextMessage(userId, 'test');
}
function sendTextMessage(senderId, text) {
  switch (senderId.toLowerCase()) {
    case 'discord':
      return replyToDiscord(senderId, text);
    default:
      replyToMessenger(senderId, text);
  };
}


function replyToDiscord(senderID, text) {
  return text;
}
function replyToMessenger(senderId, text) {
  var url = 'https://graph.facebook.com/v2.6/me/messages?access_token=' + FACEBOOK_ACCESS_TOKEN;

  var message = {
    text: String(text)
  };
  var payload = {
    recipient: {
      id: senderId
    },
    message: message
  };

  var headers = {
    'Content-Type': 'application/json'
  };
  var params = {
    method: 'POST',
    headers: headers,
    payload: JSON.stringify(payload)
  };
  
  var http = UrlFetchApp.fetch(url, params);
  console.log(JSON.stringify(http.getContentText()));
}


function testParseMessage() {
  Logger.log(parseMessage("10000 +12 aze 12 10000 +12"));  //  false
  Logger.log(parseMessage("10000 +12 10000 +12 10000 +12"));  //  true
}
function parseMessage(message) {
  try {
    var splitted = message.split(' ');
    var length = (splitted.length == 6);
    
    //  Size of message must be 6
    if (length) {
      //  Even values must start with a +
      var oddValues = splitted.map(function(value, index) {
        if (index%2 !== 0) {
          return (value[0] == '+');
        }
      });
      var plusSigns = oddValues.some(function(value) {
        return (value === false);
      });
    };
     
    return (length && !plusSigns);
  } catch(e) {
    console.error(JSON.stringify(e));
    console.error('Couldn\'t parse message "'+message+'"');
    return false;
  }
}
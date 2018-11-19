/**
 *  Handle Facebook verification
 */
function doGet(e) {
  //  var parameters = e.parameters;
  console.log(JSON.stringify(e));
  
  var hubVerifyToken = e.parameter["hub.verify_token"];
  var hubChallenge = e.parameter["hub.challenge"];
  var hubMode = e.parameter["hub.mode"];
  console.log(hubVerifyToken);
  console.log(hubChallenge);
  console.log(hubMode);
  
  var verifyTokenMatches = (hubVerifyToken === token);
  
  if (hubMode && verifyTokenMatches) {
    return ContentService.createTextOutput(hubChallenge);
  } else {
    return ContentService.createTextOutput(JSON.stringify({status: 'error'})).setMimeType(ContentService.MimeType.JSON)
  }
}


/**
 *  Handle user request
 */
function doPost(e) {
  console.log("--- BEGIN NEW REQUEST ---");
  try {
    var postContent = e.postData.contents;
    var content = JSON.parse(postContent);
    console.log(content);
    var messaging = content.entry[0].messaging[0];
    
    var senderId = messaging.sender.id;
    
    //  If message has an attachment, try computing image
    if (messaging.message.attachments) {
      //  Get image URL
      var imgUrl = messaging.message.attachments[0].payload.url;
      console.log('received image "'+imgUrl+'" from user '+senderId+'.');

      try {
        var results = computeImage(imgUrl);
        console.log(JSON.stringify(results));
      } catch (e) {
        sendTextMessage(senderId, e.message);
        console.log("--- END REQUEST ---");
        return;
      }
    } else {  //  it's a text message
      var messageText = messaging.message.text;
      console.log('received text "'+messageText+'" from user '+senderId+'.');

      //  Try parsing, format must be /(point +rate){3}/
      if (parseMessage(messageText)) {
        var results = computeMessage(messageText);
      } else {
        var errorMessage = "Format text : (points +rate) x 3\nEx: 12000 +10 10000 +14 7000 +9";
        sendTextMessage(senderId, errorMessage);
        console.log("--- END REQUEST ---");
        return;
      }
    }

    sendTextMessage(senderId, formatAnswer(results));
  } catch(e) {
    console.error(JSON.stringify(e));
    sendTextMessage(senderId, "Déso j'ai buggé :))");
  }
  
  console.log("--- END REQUEST ---");
}


//
function clearLogs() {
  console.log('');
  console.log('');
  console.log('');
  console.log('');
}
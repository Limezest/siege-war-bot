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

function testDoPost() {
var e = { parameter: {},
  contextPath: '',
  contentLength: 323,
  queryString: '',
  parameters: {},
  postData: 
   { type: 'application/json',
     length: 323,
     contents: '"{\\"entry\\":[{\\"messaging\\":[{\\"sender\\":{\\"id\\":\\"DISCORD\\"},\\"message\\":{\\"attachments\\":[{\\"payload\\":{\\"url\\":\\"https://scontent-cdg2-1.xx.fbcdn.net/v/t1.15752-0/p480x480/54279487_375318096392806_7613155880955019264_n.jpg?_nc_cat=111&_nc_ht=scontent-cdg2-1.xx&oh=c4854d8535d65224f01abe96651eb25d&oe=5D5BC7A5\\"}}]}}]}]}"',
     name: 'postData' } };
  var postContent = e.postData.contents;
  var content = JSON.parse(JSON.parse(postContent));
  Logger.log(content.entry[0]);
  //Logger.log(doPost(e));
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
        console.log("--- END REQUEST ---");
        return;
      }
    }
    
    return ContentService.createTextOutput(sendTextMessage(senderId, formatAnswer(results)));
  } catch(e) {
    console.error(JSON.stringify(e));
    return ContentService.createTextOutput(sendTextMessage(senderId, "Déso j'ai buggé :))"));
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
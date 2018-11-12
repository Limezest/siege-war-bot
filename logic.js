function testComputeMessage(message) {
  computeMessage('10000 +14 10000 +9 9000 +12');
}
function computeMessage(message) {
  var splitted = message.split(' ');
  var blue = formatGuild('bleue', splitted[0], splitted[1].split('+')[1]);
  var red = formatGuild('rouge', splitted[2], splitted[3].split('+')[1]);
  var yellow = formatGuild('jaune', splitted[4], splitted[5].split('+')[1]);

  var guilds = [blue, red, yellow];
  guilds.forEach(function(guild) {
    guild.winsIn = winsIn(guild.points, guild.rate);
  }, this);

  console.log(JSON.stringify(guilds));
  return guilds;
}


function testComputeImage() {
  var imgUrl = 'https://scontent.xx.fbcdn.net/v/t1.15752-9/46197012_342667866297603_1541296877285146624_n.jpg?_nc_cat=105&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=67cd255d47a7baf20ad559cf40e4cfab&oe=5C73409B';
  Logger.log(computeImage(imgUrl));
}
function computeImage(imgUrl) {
  try {
    var imgData = downloadImg(imgUrl);
    if (!imgData) throw new Error();
  } catch(e) {
    console.error('error downloading image');
    throw new Error('Impossible de télécharger l\'image');
  }
  
  try {
    var vision = visionAPI(imgData);
    console.log('vision');
    console.log(vision);
    if (vision.responses[0].error) { throw new Error(vision.responses[0].error.message); }

    try {
      var annotations = vision.responses[0].textAnnotations;
      console.log('annotations');
      console.log(annotations)
      var scores = annotations.slice(1,4).map(function(annotation) {
        return { points: annotation.description };
      });
      if (scores.length !== 3) { throw new Error('Je ne trouve pas les scores'); }
      
      var fullText = vision.responses[0].fullTextAnnotation.text;
      console.log('----------');
      console.log('fullText');
      console.log(fullText);
      console.log('----------');
      var rates = [];
      var regex = /\+(\d{1,2})/;
      fullText.split('\n').forEach(function(value) {
        var match = regex.exec(value);
        if (match) {
          rates.push(match[1]);
        }
      });
      if (rates.length !== 3) { throw new Error('Je ne trouve pas les taux.'); }
    } catch(e) {
      console.error(e.message);
      throw new Error('Je ne trouve pas les infos.');
    }

    scores[0].team = 'bleue';
    scores[0].rate = rates[0];
    scores[1].team = 'rouge';
    scores[1].rate = rates[1];
    scores[2].team = 'jaune';
    scores[2].rate = rates[2];

    scores.forEach(function(guild) {
      guild.winsIn = winsIn(guild.points, guild.rate);
    }, this);

    return scores;
  } catch(e) {
    Logger.log(JSON.stringify(e));
    throw new Error(e.message);
  }
}


function testDownloadImg() {
  Logger.log(downloadImg('https://scontent.xx.fbcdn.net/v/t1.15752-9/46197012_342667866297603_1541296877285146624_n.jpg?_nc_cat=105&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=67cd255d47a7baf20ad559cf40e4cfab&oe=5C73409B'));
}
function downloadImg(imgUrl) {
  var http = UrlFetchApp.fetch(imgUrl);
  var imgData = Utilities.base64Encode(http.getBlob().getBytes());
  
  return imgData;
}


function testVisionAPI() {
  var imgUrl = 'https://scontent.xx.fbcdn.net/v/t1.15752-9/46197012_342667866297603_1541296877285146624_n.jpg?_nc_cat=105&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=67cd255d47a7baf20ad559cf40e4cfab&oe=5C73409B';
  var imgData = downloadImg(imgUrl);
  var vision = visionAPI(imgData);
  console.log(JSON.stringify(vision));
}
function visionAPI(imgData) {
  var visionAPIURL = 'https://vision.googleapis.com/v1/images:annotate';
  var headers = {
    'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
    'Content-Type': 'application/json'
  };

  var payload = {"requests":[{"image":{"content":imgData},"features":[{"type":"TEXT_DETECTION"}]}]};
  var params = {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(payload)
  };

  var http = UrlFetchApp.fetch(visionAPIURL, params);
  var data = http.getContentText();
  return JSON.parse(data);
}


function formatGuild(team, points, rate) {
  return {
    team: team,
    points: points,
    rate: rate
  };
}


function testWinsIn(points, rate) {
  Logger.log(winsIn(10000, 10));
}
function winsIn(points, rate) {
  return +~~((SIEGE_MAX_POINTS - +points) / +rate);
}


function testFormatAnswer() {
  var guilds = [
    {"team":"bleue","points":"10000","rate":"14","winsIn":714},
    {"team":"rouge","points":"10000","rate":"9","winsIn":1111},
    {"team":"jaune","points":"9000","rate":"12","winsIn":916}
  ];
  Logger.log(formatAnswer(guilds));
}
function formatAnswer(guilds) {
  guilds.sort(function(a, b) {
    return (a.winsIn - b.winsIn);
  });
  var winner = guilds[0];
  var secondPlace = guilds[1];
  var loser = guilds[2];
  
  var sentence = "";
  if (winner.team == 'bleue') {
    sentence = "Nous gagnerons"
  } else {
    sentence = "La guilde " + winner.team + " gagnera";
  }
  
  var headers = "/!\\ Si rien ne change :\n";
  var winnerText = sentence + " dans " + winner.winsIn + " minutes.\n"
  
  var secondPlaceText = "La seconde place est pour ";
  if (secondPlace.team == 'bleue') {
    secondPlaceText += "nous."
  } else {
    secondPlaceText += "la guilde " + secondPlace.team +".";
  }
  
  var finalAnswer = headers  + winnerText + secondPlaceText;
  console.log(finalAnswer)
  return String(finalAnswer);
}

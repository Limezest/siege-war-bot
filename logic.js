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
      var rawScores = getRawScoresFromAnnotations(annotations);

      var scores = annotations.filter(function(annotation) {
        return (rawScores.indexOf(annotation.description) != -1);
      });
      console.log('scores');
      console.log(JSON.stringify(scores));

      scores.sort(function(a, b) {
        if (!a) return false;
        return (a.boundingPoly.vertices[0].x - b.boundingPoly.vertices[0].x);
      });
      console.log('new scores, sorted');
      console.log(JSON.stringify(scores));
      
      scores = scores.map(function(annotation) {
        return { points: annotation.description };
      });
      if (scores.length !== 3) { throw new Error('Je ne trouve pas les scores'); }
      
      var fullText = vision.responses[0].fullTextAnnotation.text;
      console.log('----------');
      console.log('fullText');
      console.log(fullText);
      console.log('----------');
      var rates = getRates(fullText);
      if (rates.length !== 3) { throw new Error('Je ne trouve pas les taux.'); }
    } catch(e) {
      console.error(e.message);
      throw new Error('Je n\'arrive pas à trouver toutes les infos...');
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
    console.log(JSON.stringify(scores));
    if (scores.some(function(score) { return (score.winsIn == 0); })) { throw new Error('Probablement une erreur...'); }
    
    return scores;
  } catch(e) {
    Logger.log(JSON.stringify(e));
    throw new Error(e.message);
  }
}


/***********/
function testVisionAPI() {
  var imgUrl = 'https://scontent.xx.fbcdn.net/v/t1.15752-9/46197012_342667866297603_1541296877285146624_n.jpg?_nc_cat=105&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=67cd255d47a7baf20ad559cf40e4cfab&oe=5C73409B';
  var imgData = downloadImg(imgUrl);
  var vision = visionAPI(imgData);
  Logger.log(JSON.stringify(vision));
}
function visionAPI(imgData) {
  var visionAPIURL = 'https://vision.googleapis.com/v1/images:annotate';
  var headers = {
    'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
    'Content-Type': 'application/json'
  };

  var payload = {"requests":[{"image":{"content":imgData},"features":[{"type":"DOCUMENT_TEXT_DETECTION"}]}]};
  var params = {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(payload)
  };

  var http = UrlFetchApp.fetch(visionAPIURL, params);
  var data = http.getContentText();
  return JSON.parse(data);
}


function testScores() {
  var annotations = [{"description":"123","boundingPoly":{"vertices":[{"x":50,"y":7},{"x":85,"y":9},{"x":85,"y":18},{"x":50,"y":16}]}},{"description":"456","boundingPoly":{"vertices":[{"x":20,"y":7},{"x":85,"y":9},{"x":85,"y":18},{"x":50,"y":16}]}},{"description":"789","boundingPoly":{"vertices":[{"x":10,"y":7},{"x":85,"y":9},{"x":85,"y":18},{"x":50,"y":16}]}}];

  var rawScores = getRawScoresFromAnnotations(annotations);
  var scores = annotations.filter(function(annotation) {
    return (rawScores.indexOf(annotation.description) != -1);
  });
  
  return scores.sort(function(a, b) {
    Logger.log(a);
    Logger.log(b);
    if (!a) return false;
    return (a.boundingPoly.vertices[0].x - b.boundingPoly.vertices[0].x);
  });
}


function testGetRawScoresFromAnnotations() {
  var annotations = [{"description":"123","boundingPoly":{"vertices":[{"x":50,"y":7},{"x":85,"y":9},{"x":85,"y":18},{"x":50,"y":16}]}},{"description":"456","boundingPoly":{"vertices":[{"x":20,"y":7},{"x":85,"y":9},{"x":85,"y":18},{"x":50,"y":16}]}},{"description":"789","boundingPoly":{"vertices":[{"x":10,"y":7},{"x":85,"y":9},{"x":85,"y":18},{"x":50,"y":16}]}}];
  Logger.log(getRawScoresFromAnnotations(annotations));
}
function getRawScoresFromAnnotations(annotations) {
  var scores = [], i = 0;
  
  var regex = /^(\d{3,5})$/;
  while (scores.length < 3 && i < annotations.length) {
    var match = regex.exec(annotations[i].description);
    if (match) {
      if (annotations[i].boundingPoly.vertices[0].y < 50) {
        scores.push(match[1]);
      } else {
        console.log('found ' + annotations[i].description + ' at '+annotations[i].boundingPoly.vertices[0].y)
      }
    }
    i++;
  }

  return scores
}


function testGetRates() {
  var imgUrl = 'https://scontent.xx.fbcdn.net/v/t1.15752-9/46197012_342667866297603_1541296877285146624_n.jpg?_nc_cat=105&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=67cd255d47a7baf20ad559cf40e4cfab&oe=5C73409B';
  var imgData = downloadImg(imgUrl);

  var i =0;
  do {
    var vision = visionAPI(imgData);
    var fullText = vision.responses[0].fullTextAnnotation.text;
    Logger.log(fullText.split('\n').join());

    var rates = getRates(fullText);
    Logger.log(rates)

    i++;
  } while (rates.length !== 3 && i < 3);

  Logger.log((rates.length == 3)?'Yeah':'Nope');
  Logger.log(rates);
}
function getRates(fullText) {
  var rates = [];
  var regex = /\+(\d{1,2})\/min/;
  fullText.split('\n').forEach(function(value) {
    var match = regex.exec(value);
    if (match) {
      rates.push(match[1]);
    }
  });
  
  return rates;
}


function testDownloadImg() {
  console.log(downloadImg('https://scontent.xx.fbcdn.net/v/t1.15752-9/46197012_342667866297603_1541296877285146624_n.jpg?_nc_cat=105&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=67cd255d47a7baf20ad559cf40e4cfab&oe=5C73409B'));
}
function downloadImg(imgUrl) {
  var http = UrlFetchApp.fetch(imgUrl);
  var imgData = Utilities.base64Encode(http.getBlob().getBytes());
  
  return imgData;
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
  
  var headers = "Si ces informations sont bonnes :\n";
  guilds.forEach(function(guild) {
    headers += "- "+guild.team+" : "+ guild.points +" points, +"+ guild.rate +"/min\n";
  });
  headers += '\n';

  var sentence = "";
  if (winner.team == 'bleue') {
    sentence = "Nous gagnerons"
  } else {
    sentence = "La guilde " + winner.team + " ("+winner.points+" points, +"+ winner.rate +"/min) gagnera";
  }
  
  var winnerText = sentence + " dans " + formatWinsIn(winner.winsIn) + ".\n"

  var secondPlaceText = "La seconde place est pour ";
  if (secondPlace.team == 'bleue') {
    secondPlaceText += "nous."
  } else {
    secondPlaceText += "la guilde " + secondPlace.team +" ("+secondPlace.points+" points, +"+secondPlace.rate+"/min).";
  }
  
  var finalAnswer = headers  + winnerText + secondPlaceText;
  console.log(finalAnswer)
  return String(finalAnswer);
}

function testFormatWinsIn() {
  var winsIn = 239;
  Logger.log(formatWinsIn(winsIn));
}
function formatWinsIn(winsIn) {
  var hours = ~~(winsIn/60);
  var minutes = winsIn - (hours * 60);
  Logger.log(hours + ' heures');
  Logger.log(minutes + ' min');
  
  return hours+' heures et '+minutes;
}
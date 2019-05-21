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
  var imgUrl = 'https://cdn.discordapp.com/attachments/573051902497914880/574925751044931595/Screenshot_20190506-134822.jpg'
  Logger.log(computeImage(imgUrl));
}
function computeImage(imgUrl) {
  try {
    var imgData = downloadImg(imgUrl);
    if (!imgData) throw new Error();
  } catch(e) {
    console.error('error downloading image');
    throw new Error('Couldn\'t fetch the image');
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

      if (scores.length > 3) {
        scores = scores.filter(unique);
      }

      scores.sort(sortLeftToRight);
      console.log('new scores, sorted');
      console.log(JSON.stringify(scores));

      scores = scores.map(function(annotation) {
        return { points: annotation.description };
      });
      if (scores.length !== 3) { throw new Error('I couldn\'t find scores :('); }
  
      var fullText = vision.responses[0].fullTextAnnotation.text;
      
      //  only returns an array of numbers extracted based on regex (like +XX/min)
      var rawRates = getRawRates(fullText);
      //  if (rates.length !== 3) { throw new Error('I couldn\'t find rates, please make sure they\'re visible'); }
      
      //  Extract from annotations the corresponding full objects (containing vertices)
      var fullRateAnnotations = annotations.filter(function(annotation) {
        return (rawRates.indexOf(annotation.description) != -1);
      });
      
      var rates = getRates(fullRateAnnotations).map(function(id) {
        //  For top 3 closest points, retrieve annotation objects
        return fullRateAnnotations[id];
      });
      
      rates.sort(sortLeftToRight).map(function(point) {
        return point.description;
      });
      
      console.log('rates');
      console.log(rates);
    } catch(e) {
      console.error(e.message);
      throw new Error('I couldn\'t find anything :(\nPlease make sure you clicked on the score banner at the top of the screen to reveal rates.');
    }

    scores[0].team = 'blue';
    scores[0].rate = rates[0].description;
    scores[1].team = 'red';
    scores[1].rate = rates[1].description;
    scores[2].team = 'yellow';
    scores[2].rate = rates[2].description;

    scores.forEach(function(guild) {
      guild.winsIn = winsIn(guild.points, guild.rate);
    }, this);
    console.log(JSON.stringify(scores));
    if (scores.some(function(score) { return (score.winsIn == 0); })) { throw new Error('I must have made a mistake...'); }
    
    return scores;
  } catch(e) {
    console.error(JSON.stringify(e));
    throw new Error(e.message);
  }
}

function sortLeftToRight(a, b) {
  if (!a) return false;
  return (a.boundingPoly.vertices[0].x - b.boundingPoly.vertices[0].x);
}

function byDistance(a, b) {
  return b.distance < a.distance;
}
function bySum(a, b) {
  return b.sum < a.sum;
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
  Logger.log('IN RAW SCOOOOORES');
  Logger.log(scores);
  return scores
}


function testGetRawRates() {
  var imgUrl = 'https://cdn.discordapp.com/attachments/573051902497914880/574925751044931595/Screenshot_20190506-134822.jpg';
  var imgData = downloadImg(imgUrl);

  var i =0;
  do {
    var vision = visionAPI(imgData);
    var fullText = vision.responses[0].fullTextAnnotation.text;
    Logger.log(fullText.split('\n').join());

    var rates = getRawRates(fullText);
    Logger.log(rates)

    i++;
  } while (rates.length !== 3 && i < 3);

  Logger.log(rates.length == 3);
  Logger.log(rates);
}
function getRawRates(fullText) {
  var rates = [];
  var regex = /(\d{1,2})\/min/;
  fullText.split('\n').forEach(function(value) {
    var match = regex.exec(value);
    if (match) {
      rates.push(match[1]);
    }
  });
  
  return rates;
}


function testGetRates() {
  var rawRates = [{"description":"12","boundingPoly":{"vertices":[{"x":112,"y":144},{"x":139,"y":144},{"x":139,"y":180},{"x":112,"y":180}]}},{"description":"11","boundingPoly":{"vertices":[{"x":882,"y":142},{"x":912,"y":142},{"x":911,"y":182},{"x":881,"y":182}]}},{"description":"23","boundingPoly":{"vertices":[{"x":1646,"y":142},{"x":1675,"y":142},{"x":1675,"y":182},{"x":1646,"y":182}]}},{"description":"11","boundingPoly":{"vertices":[{"x":1278,"y":227},{"x":1314,"y":226},{"x":1315,"y":266},{"x":1279,"y":267}]}},{"description":"12","boundingPoly":{"vertices":[{"x":1376,"y":808},{"x":1399,"y":808},{"x":1399,"y":829},{"x":1376,"y":829}]}}];
  Logger.log(getRates(rawRates));
}
function getRates(rawRates) {
  //  Compute middle height for an annotation
  var store = rawRates.map(function(rate, index) {
    middle = __meanHeight(rate.boundingPoly.vertices);
  
    return {
      id: index,
      value: rate.description,
      middle: middle
    };
  });
  
  
  //  Compute distance for pairs of annotations
  //+ Keep 2 closest points
  var closestNeighbors = store.map(function(currentPoint) {
    var diff = store.map(function(otherPoint) {
      return {
        pair: [currentPoint.id, otherPoint.id],
        distance: Math.abs(otherPoint.middle - currentPoint.middle)
      }
    });
    return diff.sort(byDistance).slice(0,2);
  });
  
  
  //  Sum distances for 2 closest points
  //+ Keep top 3 closest annotations
  var sum = closestNeighbors.map(function(pair) {
    pair.sum = pair.reduce(function(a, b) {
      return a.distance + b.distance;
    });
    return pair;
  });
  var top3 = sum.sort(bySum).slice(0,3);
  
  // Create set from top 3 (unique ids) 
  var points = [];
  top3.forEach(function(neighbors) {
    neighbors.slice(0,2).forEach(function(neighbor) {
      neighbor.pair.forEach(function(point) {
        if (points.indexOf(point) == -1) {
          points.push(point);
        }
      });
    });
  });
  
  return points;
}


function testMeanHeight() {
  var vertices = [{"x": 112,"y": 144},{"x": 139,"y": 144},{"x": 139,"y": 180},{"x": 112,"y": 180}];
  Logger.log(__meanHeight(vertices));
}
function __meanHeight(vertices) {
  var sum = 0;
  vertices.forEach(function(point) {
    sum += point.y;
  });

  return sum / vertices.length;
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
  
  var headers = "_Beep boop_ 🤖\nDouble-check these facts first:\n";
  guilds.forEach(function(guild) {
    headers += "- "+guild.team+" guild : "+ guild.points +" points, +"+ guild.rate +"/min\n";
  });
  headers += '\nif (true) then:\n';

  var sentence = "🥇 ";
  if (winner.team == 'blue') {
    sentence += "We will win";
  } else {
    sentence += proper(winner.team) + " guild ("+winner.points+" points, +"+ winner.rate +"/min) will win";
  }
  
  var winnerText = sentence + " in " + formatWinsIn(winner.winsIn) + ".\n"

  var secondPlaceText = "🥈 Second place is for ";
  if (secondPlace.team == 'blue') {
    secondPlaceText += "us. "
  } else {
    secondPlaceText += secondPlace.team +" guild ("+secondPlace.points+" points, +"+secondPlace.rate+"/min).";
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
  Logger.log(hours + ' hours');
  Logger.log(minutes + ' min');
  
  return hours+' hours and '+minutes+' minutes';
}

function proper(str) {
  return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
}
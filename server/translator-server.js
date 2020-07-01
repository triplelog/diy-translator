
const https = require('https');
var fs = require("fs");

var qs = require('querystring');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
var nunjucks = require('nunjucks');
var crypto = require("crypto");
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/gifsaw.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/gifsaw.com/fullchain.pem')
};
const { PerformanceObserver, performance } = require('perf_hooks');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/triplelog', {useNewUrlParser: true});
/*
const User = require('./models/user');
const UserData = require('./models/userdata');
*/
var express = require('express');


//var fromLogin = require('./login-server.js');


var app = express();

//var app = fromLogin.loginApp;
//var tempKeys = fromLogin.tempKeys;


console.log(performance.now());
var rawSentences = fs.readFileSync('../sentences/english-french.json', 'utf8');
var sentences = JSON.parse(rawSentences);
var eng_keys = Object.keys(sentences['etof']);
console.log(performance.now());

var rawRules = fs.readFileSync('../rules/words.json', 'utf8');
var rules = JSON.parse(rawRules);

app.use('/',express.static('static'));

app.get('/', 
	
	function(req, res) {
		var english1;
		var french1;
		var guess1;
		var gtime = 0;
		for (var k=0;k<1000;k++){
			var key = eng_keys[k];
			var fkey = sentences['etof'][key]['links'][0];
			english1 = sentences['etof'][key]['text'];
			french1 = sentences['ftoe'][fkey]['text'];
			var stime = performance.now();
			guess1 = frenchGuess(english1);
			gtime += performance.now() - stime;
			if (sentenceError(guess1,[french1])< .95){
				break;
			}
		}
		console.log(gtime, k);
		
		
		res.write(nunjucks.render('templates/index.html',{
			english1: english1,
			french1: french1,
			guess1: guess1,
		}));
		res.end();
	}
);






const server1 = https.createServer(options, app);

server1.listen(12312);

const server = https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8080);

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
var rooms = {};
wss.on('connection', function connection(ws) {
  	var username = parseInt(crypto.randomBytes(50).toString('hex'),16).toString(36).substr(2, 12);
  	ws.on('message', function incoming(message) {
		if (typeof message !== 'string'){
			console.log("af",performance.now());
		
			return;
		}
	
		var dm = JSON.parse(message);
		if (dm.type && dm.type == 'key'){
			if (dm.message && tempKeys[dm.message]){
				if (tempKeys[dm.message].username && tempKeys[dm.message].username != ''){
					username = tempKeys[dm.message].username;
				}
				if (tempKeys[dm.message].puzzleid){
					puzzleid = tempKeys[dm.message].puzzleid;
					matches = false;

					
					
					
				}
			}
			return;
		}
  	});
});


function frenchGuess(input){
	var s = input.split(' ');
	var foundWord = false;
	var output = '';
	for (var i=0;i<s.length;i++){
		var word = s[i].replace('.','');
		if (rules[word]){
			output += rules[word][0]['text'];
			foundWord = true;
		}
		else {
			output += '?';
		}
		if (i<s.length-1){output += ' ';}
	}

	return output;

}

function sentenceError(guess,references) {
	var minwer = 10;
	var guessArr = guess.replace('.','').toLowerCase().split(' ');
	for (var i=0;i<references.length;i++){
		var ref = references[i].replace('.','').toLowerCase().split(' ');
		var wer = lev(guessArr,ref)/ref.length;
		if (wer < minwer){minwer = wer;}
	}
	return minwer;
}

function lev(a, b){
  if(a.length == 0) return b.length; 
  if(b.length == 0) return a.length; 

  var matrix = [];

  // increment along the first column of each row
  var i;
  for(i = 0; i <= b.length; i++){
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for(j = 0; j <= a.length; j++){
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for(i = 1; i <= b.length; i++){
    for(j = 1; j <= a.length; j++){
      if(b[i-1] == a[j-1]){
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                Math.min(matrix[i][j-1] + 1, // insertion
                                         matrix[i-1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
};

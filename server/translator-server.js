
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
var rawPhrases = fs.readFileSync('../rules/phrases.json', 'utf8');
var savedName = 'wordsSaved';
var da = new Date();
savedName += da.getMonth();
savedName += '-';
savedName += da.getDate();
savedName += '-';
savedName += da.getYear();
fs.writeFile('../rules/'+savedName+'.json', rawRules, function(err, fileData) {
});
fs.writeFile('../rules/'+savedName.replace('words','phrases')+'.json', rawPhrases, function(err, fileData) {
});
var rules = {"words":JSON.parse(rawRules),"phrases":JSON.parse(rawPhrases)};
var rulesUsed = [];
app.use('/',express.static('static'));

app.get('/', 
	
	function(req, res) {
		var english1;
		var french1;
		var guess1;
		var gtime = 0;
		var klist = [];
		var avgerr = 0;
		for (var k=0;k<10000;k++){
			var key = eng_keys[k];
			var fkey = sentences['etof'][key]['links'][0];
			english1 = sentences['etof'][key]['text'];
			french1 = sentences['ftoe'][fkey]['text'];
			var stime = performance.now();
			guess1 = frenchGuess(english1);
			gtime += performance.now() - stime;
			var sErr = sentenceError(guess1,[french1]);
			if (sErr< .96 && sErr > .05){
				klist.push(k);
			}
			avgerr += sErr;
		}
		console.log(gtime, k, avgerr);
		var k = klist[Math.floor(Math.random()*klist.length)];
		var key = eng_keys[k];
		var fkey = sentences['etof'][key]['links'][0];
		english1 = sentences['etof'][key]['text'];
		french1 = sentences['ftoe'][fkey]['text'];
		var stime = performance.now();
		guess1 = frenchGuess(english1);
		acc1 = sentenceError(guess1,[french1]);
		
		
		
		res.write(nunjucks.render('templates/index.html',{
			english1: english1,
			french1: french1,
			guess1: guess1,
			acc1: acc1,
			rules: rulesUsed,
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
		
		if (dm.type && dm.type == 'word'){
			if (rules.words[dm.word]){
				rules.words[dm.word].push(dm.info);
			}
			else {
				rules.words[dm.word] = [dm.info];
			}
			//console.log(rules.words);
			fs.writeFile('../rules/words.json', JSON.stringify(rules.words), function(err, fileData) {
			});
			var guess = frenchGuess(dm.english1);
			var acc = sentenceError(guess,[dm.french1]);
			var jsonmessage = {"type":"guess","guess":guess,"acc":acc};
			ws.send(JSON.stringify(jsonmessage));
			return;
		}
		if (dm.type && dm.type == 'phrase'){
			var firstWord = dm.phrase.toLowerCase().split(' ')[0];
			dm.info['phrase'] = dm.phrase.toLowerCase();
			if (rules.phrases[firstWord]){
				rules.phrases[firstWord].push(dm.info);
			}
			else {
				rules.phrases[firstWord] = [dm.info];
			}
			//console.log(rules.words);
			fs.writeFile('../rules/phrases.json', JSON.stringify(rules.phrases), function(err, fileData) {
			});
			var guess = frenchGuess(dm.english1);
			var acc = sentenceError(guess,[dm.french1]);
			var jsonmessage = {"type":"guess","guess":guess,"acc":acc};
			ws.send(JSON.stringify(jsonmessage));
			return;
		}
  	});
});


function frenchGuess(input){
	var s = input.replace(/\./g,'').replace(/\?/g,'').toLowerCase().split(' ');
	var output = [];
	rulesUsed = [];
	for (var i=0;i<s.length;i++){
		var word = s[i];
		if (rules.words[word]){
			output.push(rules.words[word][0]['text']);
			var rw = {};
			rw[word]= rules.words[word];
			rulesUsed.push(JSON.stringify(rw));
		}
		else {
			output.push('_');
		}
	}
	for (var i=0;i<s.length - 1;i++){
		var word = s[i];
		if (rules.phrases[word]){
			console.log(rules.phrases[word]);
			var foundMatch = false;
			for (var ii=0;ii<rules.phrases[word].length;ii++){
				var phraseParts = rules.phrases[word][ii].phrase.split(' ');
				var x = "_";
				for (var iii=0;iii<phraseParts.length;iii++){
					if (phraseParts[iii]!=s[iii+i] && phraseParts[iii] != "{x}"){
						break;
					}
					if (phraseParts[iii] == "{x}"){
						x = s[iii+i];
					}
					if (iii == phraseParts.length-1){
						foundMatch = true;
					}
				}
				if (foundMatch){
					for (var iii=0;iii<phraseParts.length;iii++){
						output[i+iii] = '_';
					}
					
					if (rules.words[x]){
						output[i] = rules.phrases[word][ii].text.replace("{x}",rules.words[x]);
					}
					else {
						output[i] = rules.phrases[word][ii].text.replace("{x}","_");
					}
					var rw = {};
					rw[word]= rules.words[word];
					rulesUsed.push(JSON.stringify(rw));
					break;
				}
			}
			
		}
		
	}
	

	return output.join(' ');

}

function sentenceError(guess,references) {
	var minwer = 10;
	var guessArr = guess.replace(/\./g,'').replace(/\?/g,'').toLowerCase().split(' ');
	for (var i=0;i<references.length;i++){
		var ref = references[i].replace(/\./g,'').replace(/\?/g,'').toLowerCase().split(' ');
		var wer = lev(guessArr,ref)/Math.max(guessArr.length,ref.length);
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

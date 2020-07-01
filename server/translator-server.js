
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


var fromLogin = require('./login-server.js');
var app = fromLogin.loginApp;
var tempKeys = fromLogin.tempKeys;


console.log(performance.now());
var rawSentences = fs.readFileSync('../sentences/english-french.json', 'utf8');
var sentences = JSON.parse(rawSentences);
var eng_keys = Object.keys(sentences['etof']);
console.log(performance.now());

app.use('/',express.static('static'));

app.get('/', 
	
	function(req, res) {
		var fkey = sentences['etof'][eng_keys[0]]['links'][0];
		var english1 = sentences['etof'][eng_keys[0]]['text'];
		var french1 = sentences['ftoe'][fkey]['text'];
		res.write(nunjucks.render('templates/index.html',{
			english1: english1,
			french1: french1,
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



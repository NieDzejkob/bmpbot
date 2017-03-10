var RtmClient = require('@slack/client').RtmClient;
var WebClient = require('@slack/client').WebClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var request = require('request');
var fs = require('fs');
var exec = require('child_process').exec;

var token = process.env.SLACK_BOT_TOKEN || '';
if(token == ''){
	console.log('./run you idiot');
	process.exit();
}

var channel = "#bot-testing";

var rtm = new RtmClient(token);
var web = new WebClient(token);

var data = {};

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function(e){
	console.log(`Logged in as ${e.self.name} of team ${e.team.name}`);
	data = e;
});

rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function(){
	console.log('Connection opened');
});

rtm.on(RTM_EVENTS.MESSAGE, function(e){
	if(e.subtype == 'file_share' && e.file.mimetype == 'image/bmp'){
		console.log('Its a BMP!');
		fileName = '/tmp/bmpbot' + e.file.timestamp + '.bmp';
		request.get({
			url: e.file.url_private,
			headers: {
				'Authorization': 'Bearer ' + token
			}
		}).on('complete', function(){
			console.log('Downloaded');
			exec('convert ' + fileName + ' ' + fileName + '.png', function(err, stdout, stderr){
				fs.unlink(fileName);

				if(err){
					console.log('Error?');
					rtm.sendMessage("Error:\n" + stdout + stderr, e.channel);
				}else{
					web.files.upload(e.file.name, {
						file: fs.createReadStream(fileName + '.png'),
						channels: e.channel
					}, function(err, res){
						if(err){
							console.log('Error: ', res);
						}else{
							console.log('OK');
						}
					});
					fs.unlink(fileName + '.png');
				}
			});
		}).pipe(fs.createWriteStream(fileName));
	}
});

rtm.start();

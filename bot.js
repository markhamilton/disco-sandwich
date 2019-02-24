'use strict';

const Discord 			= require("discord.io");
const logger 			= require('winston');
const auth 				= require('./auth.json');
const fs 				= require('fs');
const uniqueFilename    = require("unique-filename");

const sqlite3 			= require('sqlite3').verbose();
var db 	= new sqlite3.Database("./data.db");

logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {colorize:true});
logger.level = 'debug';

// structure
var meta = require("./data/meta.json"); 

// components
var breads = require("./data/breads.json");
var toppings = require("./data/toppings.json");
var cheeses = require("./data/cheeses.json");
var meats = require("./data/meats.json");


var bot = new Discord.Client({
	token:auth.token,
	autorun: true
});

function sendAsyncMessage(channelID, message_content, embed_content) {
	bot.sendMessage({
		to: channelID,
		message: message_content,
		embed: embed_content
	});
}

var current_paginate = {
	channelID : 0,
	pages : [],
	timestamp : 0,
	cur_page : 0
};
function autoPaginate(channelID, pages) {
	current_paginate = {
		channelID : channelID,
		pages : pages,
		timestamp : +new Date(),
		cur_page : 0
	}

	// post the first message
	bot.sendMessage({
		to: paginatedata['channelID'],
		embed: embedcontent
	});
}

function deleteWord(userID, channelID, word) {
	word.replace(/\s+/g, " ").trim();

	if(!word) {
		sendAsyncMessage(channelID,"Use `!deleteword [word]`");
		return;
	}

	db.get("select * from words WHERE word=? COLLATE NOCASE", [word], (err, row) => {

		if( typeof row === 'undefined' ) {
			sendAsyncMessage(channelID, "I cannot find that word.");
		} else {
			if(row.owner == userID) {
				var stmt = db.prepare("DELETE FROM words WHERE word=? COLLATE NOCASE");
				stmt.run(word);
				console.log("Deleted word:" + word);
				sendAsyncMessage(channelID, "Deleted!");
			} else {
				console.log("Perm error:<" + userID + "> doesn't own:" + word);
				sendAsyncMessage(channelID, "Sorry, you can only delete words you've added.");
			}
		}
	});
}

function randomWord(userID, channelID) {
	db.get("select * from words order by RANDOM() limit 1", [], (err, row) => {
		sendAsyncMessage(channelID, row.word);
		console.log("Random word: " + row.word);
	});
}

function addWord(userID, channelID, word) {
	word = word.replace(/\s+/g, " ").trim();

	if(!word) {
		sendAsyncMessage(channelID,"Use `!addword [word]`");
		return;
	}

	db.get("SELECT * FROM words WHERE word=? COLLATE NOCASE", [word], (err, row) => {
		if( typeof row === 'undefined' ) {
			var stmt = db.prepare("INSERT INTO words VALUES (?,?,?)");
			stmt.run(word,userID,+new Date());
			console.log("Added word to database:" + word);
			sendAsyncMessage(channelID,"Added!");
		} else {
			console.log("Word already exists:"+word);
			sendAsyncMessage(channelID,"Word already exists");
		}
	});
}

function listWords(userID, channelID) {
	words = "";
	
	db.all("SELECT * FROM words ORDER BY timestamp DESC LIMIT 10 OFFSET 0", [], (err, rows) => {
		if(rows && rows.length > 0) {

			rows.forEach((row) => {
				console.log(row.word);
				words += row.word + "\n";
			});

			embedcontent = {
				color: 44678,
				title: "The Word List",
				fields: [{
					name: "Latest Ten",
					value: words
				}],
				timestamp: new Date(),
				footer: {
					text: "🥪"
				}
			};

			sendAsyncMessage(channelID, null, embedcontent);
		} else {
			sendAsyncMessage(channelID, "The word list is empty. Use `!addword [word]` to fill it up!");
		}
	});
}

function myWords(userID, channelID, userName) {
	words = "";

	db.all("SELECT * FROM words WHERE owner=? ORDER BY timestamp DESC LIMIT 10 OFFSET 0", [userID], (err, rows) => {
		if(rows && rows.length > 0) {

			rows.forEach((row) => {
				console.log(row.word);
				words += row.word + "\n";
			});

			embedcontent = {
				color: 44678,
				title: userName + "'s Word List",
				fields: [{
					name: "Latest Ten",
					value: words
				}],
				timestamp: new Date(),
				footer: {
					text: "🥪"
				}
			};

			sendAsyncMessage(channelID, null, embedcontent);
		} else {
			sendAsyncMessage(channelID, "Your word list is empty. Use `!addword [word]` to fill it up!");
		}
	});
}

function invokeSandwicher(userID, channelID, user) {
	const simfile = uniqueFilename('./output', 'simulation') + ".gif";
	console.log(simfile, "simulating sandwich for " + user);

	const holdplease = [
		"Please hang tight while I whip you up a mean sandwich!",
		"I'm on it!",
		"Just sit back and relax, I'm on it!"
	];
	
	sendAsyncMessage(channelID, holdplease[Math.floor(Math.random() * holdplease.length)]);

	var simulate = require("./sandwicher.js");
	simulate(user, bot).then((data_buf) => {
		console.log("simulation complete. uploading");

		fs.writeFile(simfile, data_buf, function (err) {
			bot.uploadFile({
				to:channelID,
				file:simfile
			});
		});

	});
	
}

function makeSandwich(userID, channelID) {
	var keys = Object.keys(meta);
	var s_meta = meta[keys[Math.floor(keys.length * Math.random())]];

	var random_thing = function( thing ) { return thing[Math.floor(Math.random() * thing.length)]; }

	var s_bread = random_thing( breads );
	var s_topping = random_thing( toppings );
	var s_cheese = random_thing( cheeses );
	var s_meat = random_thing( meats );

	var sandwich = '';

	for(var ii = 0; ii < s_meta.length; ii++) {
		if (ii != 0) sandwich += "\n";
		switch(s_meta[ii]) {
			case 'bread': sandwich += s_bread; break;
			case 'topping': sandwich += s_topping; break;
			case 'cheese': sandwich += s_cheese; break;
			case 'meat': sandwich += s_meat; break;
			case 'rbread': sandwich += random_thing( breads ); break;
			case 'rtopping': sandwich += random_thing( toppings ); break;
			case 'rcheese': sandwich += random_thing( cheeses ); break;
			case 'rmeat': sandwich += random_thing( meats ); break;
		}
	}
	console.log("made sandwich: " + sandwich.split("\n").join(", "));
	
	sendAsyncMessage(channelID, sandwich);
}

function giveHelp(userID, channelID) {

	var embedcontent = {
		color: 8388736,
		title: "Sandwich Bot Help",
		description: "Hello, I am Sandwich Bot, the friendly chef!\n"+
			"You can summon me with `!sandwich`, but here are the rest of my features:",
		fields:
			[
				{
					name: "Sandwich Stuff",
					value: "I structure my sandwiches with bread, toppings, cheeses and meats.\n" +
						"`!sandwich` — To generate some great sandwich ideas.\n" +
						"`!sandwich simulate` — I will make you an awesome sandwich from scratch!"
				},
				{
					name: "Word Lists",
					value: "Keep track of good sounding words.\n" +
						"`!listwords` — List last 10 added words.\n" +
						"`!mywords` — Show a list of your last 10 words.\n" +
						"`!addword [word]` — Add a new word to the list. It must be unique!\n" +
						"`!deleteword [word]` — Delete a word from the list. You can only delete a word you've added.\n" + 
						"`!randomword` — Randomly select a word from the list."
				}
			],
		timestamp: new Date(),
		footer: {
			text: "🥪"
		}
	};

	sendAsyncMessage(channelID, null, embedcontent);
}

bot.on('ready', function(evt) {
	logger.info('Connected');
	logger.info('Logged in as: ');
	logger.info(bot.username + '- (' + bot.id + ')');

	bot.setPresence({
		game:{
			name:"!sandwich help"
		}
	});
});

bot.on('message', function(user, userID, channelID, message, evt) {
	if(message.substring(0,1) == '!') {
		var args=message.substring(1).split(' ');
		var cmd = args[0];

		args = args.splice(1);
		switch(cmd) {
		case "s":
		case "sandwich":
			switch(args[0]) {
				case "help":
					giveHelp(userID, channelID);
					break;
				case "simulate":
				case "2d":
					invokeSandwicher(userID, channelID, user);
					break;
				default:
					makeSandwich(userID, channelID);
					break;
			}
			break;
		case "s2d":
			invokeSandwicher(userID, channelID, user);
			break;
		case "aw":
		case "addword":
			addWord(userID, channelID, args.join(" "));
			break;
		case "dw":
		case "deleteword":
			deleteWord(userID, channelID, args.join(" "))
			break;
		case "rw":
		case "randomword":
			randomWord(userID, channelID);
			break;
		case "lw":
		case "listwords":
			listWords(userID, channelID);
			break;
		case "mw":
		case "mywords":
			myWords(userID, channelID, user);
			break;
		}
	}
});


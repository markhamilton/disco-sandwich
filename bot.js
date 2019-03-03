'use strict';

const Discord = require("discord.js");
const logger = require('winston');
const auth = require('./auth.json');
const fs = require('fs');

const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database("./data.db");

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

const client = new Discord.Client();

// TODO: Implement pagination later
// var current_paginate = {
// 	channelID : 0,
// 	pages : [],
// 	timestamp : 0,
// 	cur_page : 0
// };
// function autoPaginate(channelID, pages) {
// 	current_paginate = {
// 		channelID : channelID,
// 		pages : pages,
// 		timestamp : +new Date(),
// 		cur_page : 0
// 	}

// 	// post the first message
// 	client.sendMessage({
// 		to: paginatedata['channelID'],
// 		embed: embedcontent
// 	});
// }

function deleteWord(message, word) {
	word.replace(/\s+/g, " ").trim();

	if(!word) {
		message.channel.send("Use `!deleteword [word]`");
		return;
	}

	db.get("select * from words WHERE word=? COLLATE NOCASE", [word], (err, row) => {

		if( typeof row === 'undefined' ) {
			message.channel.send("I cannot find that word.");
		} else {
			if(row.owner == message.author.id) {
				var stmt = db.prepare("DELETE FROM words WHERE word=? COLLATE NOCASE");
				stmt.run(word);
				console.log("Deleted word:" + word);
				message.channel.send("Deleted!");
			} else {
				console.log("Perm error:<" + message.author.id + "> doesn't own:" + word);
				message.channel.send("Sorry, you can only delete words you've added.");
			}
		}
	});
}

function randomWord(message) {
	db.get("select * from words order by RANDOM() limit 1", [], (err, row) => {
		message.channel.send(row.word);
		console.log("Random word: " + row.word);
	});
}

function addWord(message, word) {
	word = word.replace(/\s+/g, " ").trim();

	if(!word) {
		message.channel.send("Use `!addword [word]`");
		return;
	}

	db.get("SELECT * FROM words WHERE word=? COLLATE NOCASE", [word], (err, row) => {
		if( typeof row === 'undefined' ) {
			var stmt = db.prepare("INSERT INTO words VALUES (?,?,?)");
			stmt.run(word,message.author.id,+new Date());
			console.log("Added word to database:" + word);
			message.channel.send("Added!");
		} else {
			console.log("Word already exists:"+word);
			message.channel.send("Word already exists");
		}
	});
}

function listWords(message) {
	var words = "";
	
	db.all("SELECT * FROM words ORDER BY timestamp DESC LIMIT 10 OFFSET 0", [], (err, rows) => {
		if(rows && rows.length > 0) {

			rows.forEach((row) => {
				console.log(row.word);
				words += row.word + "\n";
			});

			const embed = new Discord.RichEmbed()
				.setTitle("The Word List")
				.setColor(0x00AE86)
				.addField("Latest Ten", words)
				.setFooter("🥪")
				.setTimestamp();

			message.channel.send({embed});
		} else {
			message.channel.send("The word list is empty. Use `!addword [word]` to fill it up!");
		}
	});
}

function myWords(message) {
	var words = "";

	db.all("SELECT * FROM words WHERE owner=? ORDER BY timestamp DESC LIMIT 10 OFFSET 0", [message.author.id], (err, rows) => {
		if(rows && rows.length > 0) {

			rows.forEach((row) => {
				console.log(row.word);
				words += row.word + "\n";
			});

			const embed = new Discord.RichEmbed()
				.setTitle(message.author.username + "'s Word List")
				.setColor(0x00AE86)
				.addField("Latest Ten", words)
				.setFooter("🥪")
				.setTimestamp();

				message.channel.send({embed});
		} else {
			message.channel.send("Your word list is empty. Use `!addword [word]` to fill it up!");
		}
	});
}

function invokeSandwicher(message) {
	console.log("simulating sandwich for " + message.author.username);

	const holdplease = [
		"Please hang tight while I whip you up a mean sandwich!",
		"I'm on it!",
		"Just sit back and relax, I'm on it!"
	];
	
	// FIXME: discord.io doesn't send the API requests through until this whole thing finishes
	// even though it's using promises. I don't understand promises enough atm.

	message.channel.send(holdplease[Math.floor(Math.random() * holdplease.length)]).then((msg) => {
		var simulate = require("./sandwicher.js");
		simulate(message.author.username).then((data_buf) => {
			console.log("simulation complete. uploading");
			msg.delete();

			message.channel.send(`Here is your sandwich, ${message.author}`, {files: [ { attachment:data_buf, name:"simulation.gif" } ], }).then((message) => {
				const bread_emoji = client.emojis.find(emoji => emoji.name === "bread");
				message.react("🍞");
			});
		});
	});

}

function makeSandwich(message) {
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
	
	message.channel.send(sandwich);
}

function giveHelp(message) {

	const embed = new Discord.RichEmbed()
		.setTitle("Sandwich Bot Help")
		.setColor(0x800080)
		.setDescription("Hello, I am Sandwich Bot, the friendly chef!\n" + 
			"You can summon me with `!sandwich`, but here are the rest of my features:")
		.addField("Sandwich Stuff",
			"I structure my sandwiches with bread, toppings, cheeses and meats.\n" +
			"`!sandwich` — To generate some great sandwich ideas.\n" +
			"`!sandwich simulate` — I will make you an awesome sandwich from scratch!")
		.addField("Word Lists",
			"Keep track of good sounding words.\n" +
			"`!listwords` — List last 10 added words.\n" +
			"`!mywords` — Show a list of your last 10 words.\n" +
			"`!addword [word]` — Add a new word to the list. It must be unique!\n" +
			"`!deleteword [word]` — Delete a word from the list. You can only delete a word you've added.\n" + 
			"`!randomword` — Randomly select a word from the list.")
		.setFooter("🥪")
		.setTimestamp();

	message.channel.send({embed});
}

client.on('ready', function(evt) {
	logger.info('Connected');
	logger.info('Logged in as: ');
	logger.info(client.username + '- (' + client.user.id + ')');

	client.user.setActivity('!sandwich help', {type:"LISTENING"});
});

client.on('message', (message) => {
	if(!message.content.startsWith('!')) return;

	var args = message.content.substring(1).split(' ');
	var cmd = args[0];

	args = args.splice(1);
	switch(cmd) {
	case "s":
	case "sandwich":
		switch(args[0]) {
			case "help":
				giveHelp(message);
				break;
			case "simulate":
			case "2d":
				invokeSandwicher(message);
				break;
			default:
				makeSandwich(message);
				break;
		}
		break;
	case "s2d":
		invokeSandwicher(message);
		break;
	case "aw":
	case "addword":
		addWord(message, args.join(" "));
		break;
	case "dw":
	case "deleteword":
		deleteWord(message, args.join(" "))
		break;
	case "rw":
	case "randomword":
		randomWord(message);
		break;
	case "lw":
	case "listwords":
		listWords(message);
		break;
	case "mw":
	case "mywords":
		myWords(message);
		break;
	}
});

client.login(auth.token);

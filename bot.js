'use strict';

const Discord = require("discord.js");
const logger = require('winston');
const auth = require('./auth.json');
const fs = require('fs');

var workerpool = require('workerpool');
var pool = workerpool.pool('./sandwicher.js');

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

function nutAdd(message) {
	var stmt = db.prepare("INSERT INTO nutted VALUES (?,?)");
	stmt.run(message.author.id,+new Date());
	message.channel.send("Nice work. Type `!nut stats` for more info.");
}

function nutStats(message) {
	db.all("SELECT * FROM nutted WHERE user=?", [message.author.id], (err, rows) => {
		if(rows && rows.length > 0) {

			var total_count = 0, day_count = 0, month_count = 0, year_count = 0;

			var now = new Date();
			var since_day = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
			var since_month = new Date(now.getFullYear(), now.getMonth(), 0);
			var since_year = new Date(now.getFullYear(), 0, 0);

			rows.forEach((row) => {
				total_count++;

				var row_date = new Date(row.timestamp);
				if(row_date > since_year) year_count++;
				if(row_date > since_month) month_count++;
				if(row_date > since_day) day_count++;
			});

			const embed = new Discord.RichEmbed()
				.setTitle("Nut Count")
				.setDescription(`You have nut **${total_count}** times total.`)
				.setColor(0xFFFFFF)
				.addField("Detailed Stats",
							`Today: **${day_count}**\n`+
							`Current month: **${month_count}**\n`+
							`Current year: **${year_count}**`)
				.setFooter("💦")
				.setTimestamp();

			message.channel.send({embed});
		} else {
			message.channel.send("You have never nutted. Use `!nutted` track your score.");
		}
	});
}

function nutHelp(message) {
	message.channel.send("Type `!nutted` to add a new nut or `!nutstats` to see how many nuts you have.");
}

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
	const holdplease = [
		"Please hang tight while I whip you up a mean sandwich!",
		"I'm on it!",
		"Just sit back and relax, I'm on it!",
		"SANDWICH IN PROGRESS..."
	];
	
	// send invocation message
	message.channel.send(holdplease[Math.floor(Math.random() * holdplease.length)]).then( (msg) => {
		// simulate
		pool.exec('simulate', [message.author.username]).then( (data_buf) => {
			console.log("simulation complete. uploading");
			msg.delete();

			// XXX: Not sure why I have to rewrap the file data in a new buffer
			message.channel.send(`Here is your sandwich, ${message.author}`, {files: [ { attachment: Buffer.from(data_buf), name:"simulation.gif" } ], }).then((message) => {
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
	case "nut":
		switch(args[0]) {
			case "add":
				nutAdd(message);
				break;
			case "stats":
				nutStats(message);
				break;
			case "help":
			default:
				nutHelp(message);
				break;
		}
		break;
	case "nutted":
		nutAdd(message);
		break;
	case "ns":
	case "nutstats":
		nutStats(message);
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

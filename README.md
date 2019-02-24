# SANDWICH BOT

This is a bot that makes sandwiches exports gifs of physics simulations of sandwich parts.


## installation

You need to register the bot as an app in the discord API.

Here's the link to invite this bot to your discord:
https://discordapp.com/oauth2/authorize?client_id=xxxxxxxxxxx&scope=bot&permissions=318528

Just replace the `client_id`.

Remember to save an auth.json file with your credentials in it like this:

```javascript

{
	"token": "token data goes here"
}

```


## usage

`!sandwich help` for commands.

Edit the json files under `data/` to change the structure of the sandwich or add more ingredients.

The sandwich simulations get dumped in the `output/` folder but it should clean up after the file is uploaded.


## requirements

 - node
 - discord.io
 - node-canvas
 - node-box2d
 - gifencoder
 - winston
 - sqlite3
 - unique-filename



## contributing

If you submit pull requests for nitpicky things I will reject them and send you a middle finger emoji via email.

More features and docs coming soon.
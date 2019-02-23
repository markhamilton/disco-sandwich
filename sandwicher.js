"use strict";
function Sandwicher() {

	const fs 				= require('fs');
	const b2d 				= require('box2d');
	const GIFEncoder 		= require('gifencoder');
	const { createCanvas, loadImage, Image } 	= require('canvas');

	var sandwicher_meta = require('./data/sandwicher.json');
	const meta = sandwicher_meta['meta'];
	const breads = sandwicher_meta['breads'];
	const toppings = sandwicher_meta['toppings'];
	const meats = sandwicher_meta['meats'];

	class topping {
		constructor() { }
		render(ctx, debug=false) { return false; }
	}

	class toppingRectangle extends topping {
		constructor(world, width, height, color, image) {
			super();

			this.width = width;
			this.height = height;
			this.color = color;
			this.image = image;

			// Dynamic Body & initial factors
			var bodyDef = new b2d.b2BodyDef();
			bodyDef.position.Set(Math.random() * 5.0 - 3.5, Math.random() * 5.0 - 3.5);
			this.body = world.CreateBody(bodyDef);

			var shapeDef = new b2d.b2PolygonDef();
			shapeDef.SetAsBox(this.width/2, this.height/2); // halve it because it doubles the size
			shapeDef.density  = 1.0;
			shapeDef.friction = 0.3;
			this.body.CreateShape(shapeDef);
			this.body.SetMassFromShapes();
			
			this.body.SetLinearVelocity(new b2d.b2Vec2(Math.random() * 20.0 - 10, Math.random() * 20 - 10));
			this.body.SetAngularVelocity((Math.random() * 80.0 - 40.0) * Math.PI / 180.0);
		}

		render(ctx, debug=false) {
			// todo: debug wireframe
			var position = this.body.GetPosition();
			var angle = this.body.GetAngle();
			ctx.resetTransform();

			ctx.translate(position.x * 20.0, position.y * 20.0);
			ctx.translate(200,200);
			ctx.rotate(angle);
			ctx.fillStyle = this.color;

			ctx.fillRect(this.width * -10.0, this.height * -10.0,
						 this.width *  20.0, this.height *  20.0);

			ctx.resetTransform();
		};

	}

	class toppingCircle extends topping {
		constructor(world, radius, color, image_url) {
			super();

			this.radius = radius;
			this.color = color;
			this.image_url = image_url;
			this.image = null;

			this.__inited = false;

			// Dynamic Body & initial factors
			var bodyDef = new b2d.b2BodyDef();;
			bodyDef.position.Set(Math.random() * 5.0 - 3.5, Math.random() * 5.0 - 3.5);
			this.body = world.CreateBody(bodyDef);
			var shapeDef = new b2d.b2CircleDef();

			shapeDef.radius = this.radius;
			shapeDef.density  = 1.0;
			shapeDef.friction = 0.3;

			this.body.CreateShape(shapeDef);
			this.body.SetMassFromShapes();
			
			this.body.SetLinearVelocity(new b2d.b2Vec2(Math.random() * 20.0 - 10, Math.random() * 20 - 10));
			this.body.SetAngularVelocity((Math.random() * 80.0 - 40.0) * Math.PI / 180.0);
		}

		__initData() {
			if(this.__inited) return;

			if(typeof this.image_url !== 'undefined') {
				var img_data = fs.readFileSync(this.image_url);
				var img_b64 = new Buffer(img_data, 'binary').toString('base64');

				this.image = new Image();
				this.image.src = "data:image/png;base64," + img_b64
			}

			this.__inited = true;
		}

		render(ctx, debug=false) {
			this.__initData();

			// todo: debug wireframe

			var position = this.body.GetPosition();
			var angle = this.body.GetAngle();
			ctx.resetTransform();

			ctx.translate(position.x * 20.0, position.y * 20.0);
			ctx.translate(200,200);
			ctx.rotate(angle);
			ctx.fillStyle = this.color;

			if (this.image == null) {
				ctx.beginPath();
				ctx.arc(0, 0, this.radius * 20.0, 0, Math.PI * 2, true);
				ctx.fillStyle = this.color;
				ctx.fill();
			} else {
				ctx.drawImage(this.image, -(this.radius*20), -(this.radius*20));
			}

			ctx.resetTransform();
		};
	}

	class toppingMatch extends topping {

	}

	/*
	** private helper functions
	*/
	
	// draws a rounded rectangle
	function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
		if (typeof stroke == 'undefined') {
			stroke = true;
		}
		if (typeof radius === 'undefined') {
			radius = 5;
		}
		if (typeof radius === 'number') {
			radius = {tl: radius, tr: radius, br: radius, bl: radius};
		} else {
			var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
			for (var side in defaultRadius) {
				radius[side] = radius[side] || defaultRadius[side];
			}
		}
		ctx.beginPath();
		ctx.moveTo(x + radius.tl, y);
		ctx.lineTo(x + width - radius.tr, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		ctx.lineTo(x + width, y + height - radius.br);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		ctx.lineTo(x + radius.bl, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
		ctx.lineTo(x, y + radius.tl);
		ctx.quadraticCurveTo(x, y, x + radius.tl, y);
		ctx.closePath();
		if (fill) {
			ctx.fill();
		}
		if (stroke) {
			ctx.stroke();
		}
	
	}

	// this measures and splits text automatically
	// for multi-line output
	function getLines(ctx, text, maxWidth) {
		var words = text.split(" ");
		var lines = [];
		var currentLine = words[0];

		for (var i = 1; i < words.length; i++) {
			var word = words[i];
			var width = ctx.measureText(currentLine + " " + word).width;
			if (width < maxWidth) {
				currentLine += " " + word;
			} else {
				lines.push(currentLine);
				currentLine = word;
			}
		}
		lines.push(currentLine);
		return lines;
	}

	function createThing(world, width, height, color) {
		// Dynamic Body
		var bodyDef = new b2d.b2BodyDef();
		bodyDef.position.Set(Math.random() * 5.0 - 3.5, Math.random() * 5.0 - 3.5);

		var body = world.CreateBody(bodyDef);
		var shapeDef = new b2d.b2PolygonDef();
		shapeDef.SetAsBox(width / 2.0, height / 2.0); // halve it because it doubles the size
		shapeDef.density = 1.0;
		shapeDef.friction = 0.3;
		body.CreateShape(shapeDef);
		body.SetMassFromShapes();
		
		body.SetLinearVelocity(new b2d.b2Vec2(Math.random() * 20.0 - 10, Math.random() * 20 - 10));
		body.SetAngularVelocity((Math.random() * 80.0 - 40.0) * Math.PI / 180.0);

		return {
			body: body,
			width: width,
			height: height,
			color: color
		};
	}

	function generateWorld() {
		// Define world
		var worldAABB = new b2d.b2AABB();
		worldAABB.lowerBound.Set(-40.0, -40.0);
		worldAABB.upperBound.Set( 40.0,  40.0);
		
		var gravity = new b2d.b2Vec2(0.0, 9.8); var doSleep = true;
		var world = new b2d.b2World(worldAABB, gravity, doSleep);

		// floor
		var groundBodyDef = new b2d.b2BodyDef();
		groundBodyDef.position.Set(0.0, 11.0);
		var groundBody = world.CreateBody(groundBodyDef);

		var groundShapeDef = new b2d.b2PolygonDef();
		groundShapeDef.SetAsBox(11.0, 1);
		groundBody.CreateShape(groundShapeDef);

		// ceiling
		var ceilingBodyDef = new b2d.b2BodyDef();
		ceilingBodyDef.position.Set(0.0, -11.0);
		var ceilingBody = world.CreateBody(ceilingBodyDef);

		var ceilingShapeDef = new b2d.b2PolygonDef();
		ceilingShapeDef.SetAsBox(11.0, 1);
		ceilingBody.CreateShape(ceilingShapeDef);

		// left wall
		var lwallBodyDef = new b2d.b2BodyDef();
		lwallBodyDef.position.Set(-11.0, 0.0);
		var lwallBody = world.CreateBody(lwallBodyDef);

		var lwallShapeDef = new b2d.b2PolygonDef();
		lwallShapeDef.SetAsBox(1, 11.0);
		lwallBody.CreateShape(lwallShapeDef);

		// right wall
		var rwallBodyDef = new b2d.b2BodyDef();
		rwallBodyDef.position.Set(11.0, 0.0);
		var rwallBody = world.CreateBody(rwallBodyDef);

		var rwallShapeDef = new b2d.b2PolygonDef();
		rwallShapeDef.SetAsBox(1, 11.0);
		rwallBody.CreateShape(rwallShapeDef);

		return world;
	}

	function generateSandwich(world) {
		var keys = Object.keys(meta);
		var s_meta = meta[keys[Math.floor(keys.length * Math.random())]];
	
		var random_thing = function( thing ) { return thing[Math.floor(Math.random() * thing.length)]; }
	
		var s_bread = random_thing( breads );
		var s_topping = random_thing( toppings );
		var s_meat = random_thing( meats );

		return [
			new toppingCircle(world, 2.0, '#ff0000', './assets/doom sigil.png'), // demonic circle
			new toppingRectangle(world, 3.0, 1.0, '#E9A046'), // bun
			new toppingRectangle(world, 3.0, 1.0, '#E9A046'), // bun
			new toppingRectangle(world, 2.8, 0.4, '#FAC832'), // cheese
			new toppingRectangle(world, 2.8, 0.8, '#684023'), // meat
			new toppingRectangle(world, 2.8, 0.4, '#90B04C'), // lettuce
			new toppingRectangle(world, 1.5, 0.5, '#EC391B'), // tomato
			new toppingRectangle(world, 1.5, 0.5, '#EC391B'), // tomato
		];
	}

	/*
	** Sandwicher main functions
	*/

	// use a unique filename because this will step on itself otherwise
	this.simulate = function(filename, user) {
		const canvas = createCanvas(400,400);
		const encoder = new GIFEncoder(400, 400);
	
		var world = generateWorld();	
		var burgerstuff = generateSandwich(world);
		
		// set up gfx
		encoder.createReadStream().pipe(fs.createWriteStream(filename));
	
		encoder.start();
		encoder.setRepeat(0);
		encoder.setDelay(1.0/60*1000);
		encoder.setQuality(10);
	
		const ctx=canvas.getContext('2d');
	
		// Run Simulation!
		var timeStep = 1.0 / 30.0;
		var iterations = 100;

		ctx.imageSmoothingEnabled = false;
		ctx.conf="30px Verdana";
		
		for (var i=0; i < 120; i++) {

			ctx.resetTransform();
			// clear fb
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, 400, 400);

			// watermark
			ctx.fillStyle = '#d0d0d0';
			var watermark = "Sandwich made special for " + user;
			var lines = getLines(ctx, watermark, 180 );
			ctx.textAlign = "center";
			ctx.fillStyle = '#303030';

			
			ctx.fillText(lines.join("\n"), 100, 15);
			// var ingredients_list = "\nBun\nLettuce\nTomato\nTomato\nBun";
			// ctx.textAlign = "left";
			// ctx.fillText(ingredients_list, 10, 20);
			// ctx.fillText(i+": <"+Math.round(position.x)+", "+Math.round(position.y)+"> @"+Math.round(angle*180/Math.PI), 0, 20);

			world.Step(timeStep, iterations);

			for(var bi = 0; bi < burgerstuff.length; bi++ ) {
				burgerstuff[bi].render(ctx);
			}

			encoder.addFrame(ctx);
		}

		encoder.finish();
	}
  
}

module.exports = Sandwicher;

if(!module.parent) {
	var s = new Sandwicher();
	s.simulate("test.gif", "UNKNOWN");
}

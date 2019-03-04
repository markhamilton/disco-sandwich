"use strict";

const fs = require('fs');
const b2d = require('box2d');
const Canvas = require('canvas');
global.Image = Canvas.Image;

const bodyTypes = {
    RECT: 'rect',
    CIRCLE: 'circle',
    // to be implemented
    ROPE: 'rope',
    MESH: 'mesh'
};


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
        // TODO: debug wireframe
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
    }

}

class toppingCircle extends topping {
    constructor(world, radius, color, image_url, framespeed = 1) {
        super();

        this.radius = radius;
        this.color = color;
        this.image_url = image_url;
        this.frames = [];
        this.frameindex = 0;
        this.framespeed = framespeed;

        this.subframeindex = 0;

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

        this.__initData();
    }

    __initData() {
        if(typeof this.image_url !== 'undefined') {
            if(!Array.isArray(this.image_url)) this.image_url = [this.image_url];

            this.image_url.forEach((element) => {
                var img_data = fs.readFileSync(element);
                var img_b64 = new Buffer(img_data, 'binary').toString('base64');
    
                var frame = new Image();
                frame.src = "data:image/png;base64," + img_b64;
                this.frames.push(frame);
            });
        }
    }

    render(ctx, debug=false) {

        // TODO: debug wireframe

        var position = this.body.GetPosition();
        var angle = this.body.GetAngle();
        ctx.resetTransform();

        ctx.translate(position.x * 20.0, position.y * 20.0);
        ctx.translate(200,200);
        ctx.rotate(angle);
        ctx.fillStyle = this.color;

        if (this.frames.length == 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 20.0, 0, Math.PI * 2, true);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            ctx.drawImage(this.frames[this.frameindex], -(this.radius*20), -(this.radius*20));

            this.subframeindex++;
            if(this.subframeindex == this.framespeed) {
                this.frameindex = (this.frameindex + 1) % this.frames.length;
                this.subframeindex = 0;
            }
        }

        ctx.resetTransform();
    }
}

class toppingMatch extends topping {
    constructor() {
        super();

        this.width = 0.5;
        this.height = 2.8;
        this.color = '';
        this.color_head = '';

        this.emitter = new Emitter();
        
    }

    render(ctx, debug=false) {
        // TODO: debug wireframe
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
    }
}

module.exports = {
    toppingCircle,
    toppingMatch,
    toppingRectangle
};

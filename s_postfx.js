class PostFX {

    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        
        this.__effects = [];
    }
    
    addEffect(effect) {
        this.__effects.push(effect);
    }
    
    render(ctx) {
        this.__effects.forEach( (effect) => {
            effect.render(ctx, this.x, this.y, this.w, this.h);
        });
    }
}

class Effect {
    constructor(type) {
        this.type = type;
    }
    
    render(ctx, x, y, w, h) {
        switch(this.type) {
            case "hellfire":
                // B hell T
                break;
            case "trippy":
                break;
            case "chromatic":
                break;
            case "blood":
                break;
            case "glitch":
                break;
            case "cursed":
                break;
            case "shimmer":
                break;
            case "scanlines":
                break;
        }
    }
}

class Particle {
    constructor() {
        this.__framecount = 0;

        // a lot of this is inherited from the emitter
        this.position = { x: 0, y: 0 };
        this.gravity = { x: 0, y: 0 };
        this.particleSize = 0.1;
        this.particleColor = '#FFFFFF';
        this.particleLife = 15;
    }
}

class Emitter {
    constructor() {
        this.__framecount = 0;

        this.position = { x: 0, y: 0 };     // emitter position in the world
        this.gravity = { x: 0, y: 0 };      // force exerted on the particles each frame
        this.particleSize = 0.1;            // size of emitted particles
        this.particleColor = '#FFFFFF';     // color of emitted particles. use multiple emitters to mix it up
        this.particleLife = 15;             // emitted particle lifespan

        this.emissionRate = 30;             // rate of emission per 100 frames (probab not deterministic)
        this.emissionRadius = 20;           // radius in which particles spawn
        this.emitterLife = 30;              // emitter lifespan
    }
}

class ParticleSystem {
    constructor(width, height) {
        this.__particles = [];
        this.__emitters = [];

        this.width = width;
        this.height = height;

    }

    addEmitter(emitter) { return this.__emitters.push(emitter) - 1; }
    addParticle(particle) { return this.__particles.push(particle) - 1; }
    deleteEmitter(id) { this.__emitters.splice(id, 1); }
    deleteParticle(id) { this.__particles.splice(id,i); }

    update(framedelta) {
        for(var f_i = 0; f_i < framedelta; ++f_i) {

            // parts
            for(var p_i = this.__particles.length-1; p_i >= 0; --p_i) {
                this.__particles[p_i].__framecount++;
                if(this.__particles[p_i].__framecount > this.__particles[p_i].particleLife)
                    deleteParticle(p_i);

                this.__particles[p_i].position.x += this.__particles[p_i].gravity.x;
                this.__particles[p_i].position.y += this.__particles[p_i].gravity.y;
                // TODO: Brownian motion
                // TODO: particles deflect each other on distance <= 0
            }

            // emits
            for(var e_i = this.__emitters.length - 1; e_i >= 0; --e_i) {
                this.__emitters[e_i].__framecount++;
                if(this.__emitters[e_i].__framecount > this.__emitters[e_i].emitterLife)
                    deleteEmitter(e_i);
            }
        }
    }

    render(ctx, scale) {

    }
}

module.exports = {
    Particle,
    Emitter,
    ParticleSystem
};

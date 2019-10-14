// More is coming to this component down the road. Eventually.

// This component is based on Prince Stolas
// https://github.com/WIZARDISHUNGRY/magical-effect-tweeter

const fs = require('fs');

const magick_effects = require('./data/magick/effects.json');
const random_thing = function (thing) { return thing[Math.floor(Math.random() * thing.length)]; }

// soundex in JS credit: https://gist.github.com/shawndumas/1262659
var soundex = function (s) {
    var a = s.toLowerCase().split(''),
        f = a.shift(),
        r = '',
        codes = {
            a: '', e: '', i: '', o: '', u: '',
            b: 1, f: 1, p: 1, v: 1,
            c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2,
            d: 3, t: 3,
            l: 4,
            m: 5, n: 5,
            r: 6
        };

    r = f +
        a
        .map(function (v, i, a) { return codes[v] })
        .filter(function (v, i, a) {
            return ((i === 0) ? v !== codes[f] : v !== a[i - 1]);
        })
        .join('');

    return (r + '000').slice(0, 4).toUpperCase();
};

async function readLines(file) {
    var remaining = '';
    var lines = Array();
    var data = String(await fs.promises.readFile(file));

    data = data.split("\n");

    data.forEach(element => {
        if(element.trim()) lines.push(element.trim());
    });

    return lines;
}


async function initMagick() {
    var whitelist = await readLines('data/magick/whitelist.txt');
    var blacklist = await readLines('data/magick/blacklist.txt');
    console.log(whitelist);
    console.log(blacklist);

}

// initMagick();
module.exports = {
    magickEffect: function() {
        var combiner = random_thing(magick_effects['combiners']);
        var effect = "";
        var term_index = 1;

        combiner[0].forEach((el) => {
            effect += random_thing(magick_effects[el]).replace( " ", combiner[1][0] );
            effect += combiner[1][term_index];
            term_index++;
        });
        effect += combiner[1][combiner[1].length-1];
        
        effect = effect.replace('..', '.');

        console.log("Generating magick effect:", effect);

        return effect;
    }
};

import { GameAudio } from "../gameTypes/Audio";
import * as Tone from 'tone';
import { AudioEffect } from "../gameTypes/AudioEffects";

const IMAGES = {};
const SONGS = {};

export const addImage = (url, prefix = import.meta.env.VITE_DOMAIN, callback = () => {}) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
	    img.src = `${prefix}${url}`;
        img.setAttribute('crossOrigin', '');
        img.onload = () => {
            callback();
            resolve(img);
        };
        img.onerror = (e) => {
            console.error(e);
            reject(img);
        }

        IMAGES[url] = {};

        IMAGES[url].image = img;
    });
}

export const getImage = (url) => {
    if (!IMAGES[url]) {
        return null;
    }
    return IMAGES[url].image;
}

// Editor Audio
export const addAudio = (def, prefix = import.meta.env.VITE_DOMAIN, callback = () => {}) => {
    return new Promise((resolve, reject) => {
        const aud = new Audio();
        aud.src = `${prefix}${def.url}`;
        aud.setAttribute('crossOrigin', '');
        aud.oncanplaythrough = () => {
            callback();
            resolve(aud);
        }
        aud.onerror = (e) => {
            console.error(e);
            reject(aud);
        }
    });
}

// Game Audio
export const addSong = (song) => {
    return new Promise(async (resolve, reject) => {
        const player = new Tone.Player(`${import.meta.env.VITE_DOMAIN}${song.audio.url}`);
        player.loop = true;
        player.playbackRate = song.audio.speed;

        if (song.audio.trimRegion != null) {
            player.seek(song.audio.trimRegion.start);

            if (song.audio.loop) {
                player.loopStart = song.audio.loopPoint;
                player.loopEnd = song.audio.trimRegion.end;
            }
        } else {
            if (song.audio.loop) {
                player.loopStart = song.audio.loopPoint;
                player.loopEnd = player.sampleTime;
            }
        }

        SONGS[song.id] = {
            player: player,
            song: song
        };

        let previousNode = player.output;

        await song.audio.effects.forEach(async effect => {
            const eff = new AudioEffect();
            eff.params = { ...effect.params };
            eff.setType(effect.type);

            if (effect.type === 'reverb') {
                await eff.nodes[0].ready;
            }

            eff.nodes.forEach(node => {
                Tone.connect(previousNode, node);
                previousNode = node;
            });
        });

        Tone.connect(previousNode, Tone.getDestination());
        resolve(player);
    });
}

export const getSong = (id) => {
    if (!SONGS[id]) {
        return null;
    }
    return SONGS[id];
}
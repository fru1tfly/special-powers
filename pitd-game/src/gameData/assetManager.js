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
export const addSong = async (song) => {
    const url = `${import.meta.env.VITE_DOMAIN}${song.audio.url}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    SONGS[song.id] = {
        arrayBuffer: await res.arrayBuffer(),
        song
    };
}

export const initializeAudio = async () => {
    for (const s of Object.values(SONGS)) {
        const song = s.song;

        if (!s.arrayBuffer) continue;

        const audioBuffer = await Tone.getContext().decodeAudioData(s.arrayBuffer);
        const player = new Tone.Player({
            url: new Tone.ToneAudioBuffer(audioBuffer),
            volume: Tone.gainToDb(song.audio.level / 100),
        });
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
                player.loopEnd = player.buffer.duration;
            }
        }

        SONGS[song.id] = {
            player: player,
            song: song
        };

        let previousNode = player.output;

        if (song.audio.effects) {
            for (const effect of song.audio.effects) {
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
            }
        }

        Tone.connect(previousNode, Tone.getDestination());

        s.player = player;
    }
} 

export const getSong = (id) => {
    if (!SONGS[id]) {
        return null;
    }
    return SONGS[id];
}
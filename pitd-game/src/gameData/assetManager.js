import { GameAudio } from "../gameTypes/Audio";
import { AudioEffect } from "../gameTypes/AudioEffects";

const IMAGES = {};
const SONGS = {};

const soundBuffers = {}; // raw Sound Data (kept separate to prevent duplicates)
const SOUNDS = {}; // references to soundBuffers with unique parameters

let toneReference = null;

export const Tone = () => {
    if (toneReference) {
        return toneReference;
    }
    console.error('Trying to use Tone before it\'s initialized');
    return null;
}

export const addImage = (url, prefix = import.meta.env.VITE_DOMAIN, callback = () => {}) => {
    if (IMAGES[url]) {
        return IMAGES[url].promise.then((img) => {
            callback();
            return img;
        });
    }

    const img = new Image();
    img.setAttribute('crossOrigin', '');

    const promise = new Promise((resolve, reject) => {
        img.onload = () => {
            resolve(img);
        };
        img.onerror = (e) => {
            console.error(e);
            delete IMAGES[url];
            reject(img);
        };
    });

    IMAGES[url] = { image: img, promise };
    img.src = `${prefix}${url}`;

    return promise.then((loadedImg) => {
        callback();
        return loadedImg;
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
export const addSong = async (song, callback) => {
    if (SONGS[song.id]) {
        callback();
        return;
    }

    const url = `${import.meta.env.VITE_DOMAIN}${song.audio.url}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    SONGS[song.id] = {
        arrayBuffer: await res.arrayBuffer(),
        song
    };

    callback();
}

export const addSound = async (sound, callback) => {

    const url = `${import.meta.env.VITE_DOMAIN}${sound.audio.url}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }

    if (!soundBuffers[sound.audio.url]) {
        soundBuffers[sound.audio.url] = await res.arrayBuffer();
    }

    SOUNDS[sound.id] = {
        ...sound
    };

    callback();
}

export const getSound = (id) => {
    if (!SOUNDS[id]) {
        return null;
    }
    return SOUNDS[id];
}

export const initializeAudio = async () => {
    toneReference = await import('tone');

    for (const s of Object.values(SONGS)) {
        const song = s.song;

        if (!s.arrayBuffer) continue;

        const buffer = await decodeToneBuffer(toneReference, s.arrayBuffer);
        const effects = await initializeEffects(song.audio.effects);

        SONGS[song.id] = {
            definition: song,
            effects: effects,
            buffer: buffer
        };
    }

    for (const sbUrl of Object.keys(soundBuffers)) {
        const sb = soundBuffers[sbUrl];
        const buffer = await decodeToneBuffer(toneReference, sb);

        soundBuffers[sbUrl] = buffer;
    }

    for (const sound of Object.values(SOUNDS)) {

        const buffer = soundBuffers[sound.audio.url];
        const effects = await initializeEffects(sound.audio.effects);

        SOUNDS[sound.id] = {
            definition: sound,
            effects: effects,
            buffer: buffer
        }
    }
}

const decodeToneBuffer = async (tone, arrayBuffer) => {
    const audioBuffer = await tone.getContext().decodeAudioData(arrayBuffer);
    return new tone.ToneAudioBuffer(audioBuffer);
}

const initializeEffects = async (fxs) => {
    const effects = [];

    for (const effect of fxs) {
        const eff = new AudioEffect();
        eff.params = { ...effect.params };
        eff.condition = effect.condition;
        eff.rooms = effect.rooms;
        eff.setType(effect.type, false);

        if (effect.type === 'reverb') {
            await eff.nodes[0].ready;
        }

        effects.push(eff);
    }

    return effects;
}

export const getSong = (id) => {
    if (!SONGS[id]) {
        return null;
    }
    return SONGS[id];
}
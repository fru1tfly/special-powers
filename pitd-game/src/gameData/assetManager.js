import { GameAudio } from "../gameTypes/Audio";
import { AudioEffect } from "../gameTypes/AudioEffects";

const IMAGES = {};
const SONGS = {};

let toneReference = null;

export const Tone = () => {
    if (toneReference) {
        return toneReference;
    }
    console.error('Trying to use Tone before it\'s initialized');
    return null;
}

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
    toneReference = await import('tone');

    for (const s of Object.values(SONGS)) {
        const song = s.song;

        if (!s.arrayBuffer) continue;

        let songLevel = parseInt(song.audio.level);
        if (isNaN(songLevel)) {
            songLevel = 100;
        }

        const audioBuffer = await toneReference.getContext().decodeAudioData(s.arrayBuffer);
        const player = new toneReference.Player({
            url: new toneReference.ToneAudioBuffer(audioBuffer),
            volume: toneReference.gainToDb(songLevel / 100),
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

        player.fadeIn = song.fadeInTime;
        player.fadeOut = song.fadeOutTime;

        const effects = [];

        for (const effect of song.audio.effects) {
            const eff = new AudioEffect();
            eff.params = { ...effect.params };
            eff.condition = effect.condition;
            eff.rooms = effect.rooms;
            eff.setType(effect.type);

            if (effect.type === 'reverb') {
                await eff.nodes[0].ready;
            }

            effects.push(eff);
        }

        const definition = {
            player: player,
            song: song,
            effects: effects
        };

        SONGS[song.id] = definition;
    }
} 

export const buildEffectChain = async (songId, currentRoom) => {
    const songDefinition = getSong(songId);

    // Clear previous chain
    songDefinition.player.output.disconnect();
    songDefinition.effects.forEach(e => e.nodes.forEach(n => n.disconnect()));

    let previousNode = songDefinition.player.output;

    console.log(songDefinition.effects);

    for (const eff of songDefinition.effects) {
        if (eff.condition === 'off' || eff.condition === 'room' && !eff.rooms.includes(currentRoom)) continue;

        if (eff.condition)
        eff.nodes.forEach(node => {
            toneReference.connect(previousNode, node);
            previousNode = node;
        });
    }

    toneReference.connect(previousNode, toneReference.getDestination());
}

export const getSong = (id) => {
    if (!SONGS[id]) {
        return null;
    }
    return SONGS[id];
}
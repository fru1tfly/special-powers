import { useState, useEffect, useRef } from "react";
import { getSound, Tone } from "../gameData/assetManager";

export default function GameAudioManager() {
    const [currentSong, setCurrentSong] = useState(null);

    return <></>;
}

import { getSong } from "../gameData/assetManager";


let soundsInPlay = {};
let prioritySounds = []; // sounds with behavior = "replace"
let reductionSources = [];
let currentRoom = null;

const emitterTimers = {};
const isEmitter = (audio) => audio?.emitter && (audio.emitterRegions?.length ?? 0) > 0;

export async function setRoomSongs(roomId, songs) {

    currentRoom = roomId;

    const inRoom = song => song.rooms.includes(roomId);
    const inPlay = soundId => Object.keys(soundsInPlay).includes(soundId);

    if (!songs) return;

    const oldSongs = [];
    const newSongs = [];

    for (const song of songs) {
        if (inPlay(song.id) && !inRoom(song)) {
            oldSongs.push(song);
            stopSong(song.id);
        }
    }

    const roomSongs = songs.filter(inRoom);

    for (const song of roomSongs) {
        const songData = getSong(song.id);

        if (!inPlay(song.id)) {
            playSong(songData);
            newSongs.push(song);
        }
    }

    for (const sound of Object.values(soundsInPlay)) {
        buildEffectChain(sound.definition.id, roomId, sound.definition.rooms ? true : false);
    }

    recalculateReduction(newSongs, oldSongs);
}

export function playSound(sound) {
    const player = buildAudioPlayer(sound.definition, sound.buffer);
    const newSound = playFromDefinition(sound.definition, player);

    recalculateReduction([sound.definition], []);

    player.onstop = (source) => {
        recalculateReduction([], [sound.definition]);

        if (sound.definition.behavior === 'replace') {
            handleRemoveReplaceSound(sound);
        }
        delete soundsInPlay[sound.definition.id];

    };

    buildEffectChain(sound.definition.id, currentRoom, false);
}

export function stopSound(id) {
    soundsInPlay[id].player.stop();
}

export function isPlaying(soundId) {
    return Object.keys(soundsInPlay).includes(soundId) && soundsInPlay[soundId].playing;
}

function playFromDefinition(definition, player) {
    const audio = definition.audio;
    const isEmit = isEmitter(audio);

    const offset = audio.trimRegion ? audio.trimRegion.start : 0;
    
    let duration = undefined;
    if (audio.trimRegion && !audio.loop) {
        duration = audio.trimRegion
            ? audio.trimRegion.end - audio.trimRegion.start
            : player.buffer.duration;
    } 

    // If the sound is triggered to start while other sounds with Replace behavior are playing,
    // start the song with its volume turned all the way down
    const isReplaced = definition.behavior !== 'replace' && prioritySounds.length > 0;
    if (isReplaced) {
        player.volume.value = -Infinity;
    }

    if (isEmit) {
        startEmitter(definition, player);
    } else {
        player.start(
            Tone().now(),
            offset,
            duration
        );
    }

    const newSoundObject = {
        definition: definition,
        player: player,
        playing: !isReplaced,
        isEmitter: isEmit,
        isReplace: definition.behavior === 'replace'
    };

    if (!soundsInPlay[definition.id]) {
        soundsInPlay[definition.id] = newSoundObject;
    }

    if (definition.behavior === 'replace') {
        const replaceableSongIds = Object.keys(soundsInPlay).filter(k => !soundsInPlay[k].isReplace);

        for (const id of replaceableSongIds) {
            const sound = soundsInPlay[id];

            if (sound.playing) {
                sound.playing = false;
                sound.player.volume.rampTo(-Infinity, definition.fadeInTime);
            }
        }

        prioritySounds.push(definition);
    }

    return newSoundObject;
}

function playSong(song) {
    const player = buildAudioPlayer(song.definition, song.buffer);
    const newSound = playFromDefinition(song.definition, player);

    player.onstop = (source) => {
        recalculateReduction([], [song.definition]);

        if (song.definition.behavior === 'replace') {
            handleRemoveReplaceSound(song);
        }
        delete soundsInPlay[song.id];
    };
}

function stopSong(songId) {
    if (soundsInPlay[songId].isEmitter) {
        stopEmitter(songId);
    } else {
        soundsInPlay[songId].player.stop();
    }

    if (soundsInPlay[songId].definition.behavior === 'replace') {
        handleRemoveReplaceSound(soundsInPlay[songId]);
    }

    delete soundsInPlay[songId];
}

function handleRemoveReplaceSound(s) {
    prioritySounds = prioritySounds.filter(p => p.id !== s.definition.id);

    if (prioritySounds.length === 0) {
        const replaceableSongIds = Object.keys(soundsInPlay).filter(k => !soundsInPlay[k].isReplace);

        for (const id of replaceableSongIds) {
            const sound = soundsInPlay[id];

            if (!sound.playing) {
                sound.playing = true;
                sound.player.volume.rampTo(sound.destinationLevel ?? 0, s.definition.fadeOutTime);
            }
        }
    }
}

function startEmitter(definition, player) {
    if (emitterTimers[definition.id] !== null) {
        stopEmitter(definition.id);
    }

    const playRandomRegion = () => {
        const audio = definition.audio;

        const skipChance = parseFloat(audio.emitterSkipChance) || 0;
        if (Math.random() * 100 < skipChance) return;

        const regions = audio.emitterRegions;
        const region = regions[Math.floor(Math.random() * regions.length)];

        player.start(
            Tone().now(),
            region.start,
            region.end - region.start
        );
    };

    playRandomRegion();

    const intervalSeconds = parseFloat(definition.audio.emitterInterval);
    if (isNaN(intervalSeconds) || intervalSeconds <= 0) return;

    emitterTimers[definition.id] = setInterval(playRandomRegion, intervalSeconds * 1000);
}

function stopEmitter(songId) {
    clearInterval(emitterTimers[songId]);
    delete emitterTimers[songId];
}

const buildAudioPlayer = (sound, buffer) => {
    const toneRef = Tone();
    let soundLevel = parseInt(sound.audio.level);
    if (isNaN(soundLevel)) {
        soundLevel = 100;
    }

    const player = new toneRef.Player({
        url: buffer,
        volume: toneRef.gainToDb(soundLevel / 100),
    });

    player.fadeIn = sound.fadeInTime;
    player.fadeOut = sound.fadeOutTime;

    player.loop = sound.audio.loop;
    player.playbackRate = sound.audio.speed;

    if (sound.audio.emitter) {
        player.loop = false;
        player.fadeIn = 0.01;
        player.fadeOut = 0.01;
    } else if (sound.audio.trimRegion != null) {
        player.seek(sound.audio.trimRegion.start);
    }

    if (sound.audio.loop) {
        player.loopStart = sound.audio.loopPoint;
        player.loopEnd = sound.audio.trimRegion != null ? sound.audio.trimRegion.end : buffer.duration;
    }

    return player;
}

export const buildEffectChain = (soundId, currentRoom, isSong) => {

    const player = soundsInPlay[soundId].player;
    const soundData = isSong ? getSong(soundId) : getSound(soundId);

    // Clear previous chain
    player.output.disconnect();
    soundData.effects.forEach(e => e.nodes.forEach(n => n.disconnect()));

    let previousNode = player.output;

    for (const eff of soundData.effects) {
        if (eff.condition === 'off' || (eff.condition === 'room' && !eff.rooms.includes(currentRoom))) continue;

        eff.nodes.forEach(node => {
            Tone().connect(previousNode, node);
            previousNode = node;
        });
    }

    Tone().connect(previousNode, Tone().getDestination());
}

function recalculateReduction(newSounds = [], oldSounds = []) {
    let maxFadeTime = 0;

    for (const old of oldSounds) {
        if (old.fadeOutTime > maxFadeTime) {
            maxFadeTime = old.fadeOutTime;
        }

        reductionSources = reductionSources.filter(r => r.id !== old.id);
    }

    for (const newSound of newSounds) {
        if (newSound.reduction > 0) {
            reductionSources.push({
                id: newSound.id,
                amount: newSound.reduction / 100,
                fadeInTime: newSound.fadeInTime,
                fadeOutTime: newSound.fadeOutTime
            });
        }

        if (newSound.fadeInTime > maxFadeTime) {
            maxFadeTime = newSound.fadeInTime;
        }
    }

    for (const sound of Object.values(soundsInPlay)) {
        if (!sound.playing || sound.isReplace) continue;

        const totalReduction = reductionSources.reduce((acc, current) => {
            if (current.id !== sound.definition.id) {
                return acc + current.amount;
            }

            return acc;
        }, 0);

        const baseLevel = sound.definition.audio.level / 100;
        const destinationLevel = Tone().gainToDb(baseLevel * (1 - totalReduction));

        sound.player.volume.rampTo(destinationLevel, maxFadeTime);
        sound['destinationLevel'] = destinationLevel;
    }
}
import { useState, useEffect, useRef } from "react";
import { buildEffectChain, Tone } from "../gameData/assetManager";

export default function GameAudioManager() {
    const [currentSong, setCurrentSong] = useState(null);

    return <></>;
}

import { getSong } from "../gameData/assetManager";


let songStack = [];

export async function addRoomSongs(roomId, songs) {

    const inRoom = song => song.rooms.includes(roomId);
    const inStack = song => songStack.some(s => s.id === song.id);

    for (const song of songs) {
        if (inStack(song) && !inRoom(song)) {
            stopSong(song);
            songStack = songStack.filter(s => s.id !== song.id);
        }
    }

    const roomSongs = songs
        .filter(inRoom)
        .sort((a, b) => (a.behavior === 'replace') - (b.behavior === 'replace'));

    for (const song of roomSongs) {
        const player = getSong(song.id)?.player;
        if (!player) {
            console.error('Song not loaded', song.id);
            continue;
        }

        const alreadyInStack = inStack(song);
        if (alreadyInStack && player.state === 'started') continue;

        await playSong(song, songs);

        if (!alreadyInStack) {
            songStack.unshift(song);
        }
    }

    // Update all currently playing songs so room-specific effects are added or removed
    for (const song of songStack) {
        buildEffectChain(song.id, roomId);
    }

}

async function playSong(song, allSongs) {
    const songDefinition = getSong(song.id);
    if (!songDefinition?.player) {
        console.error('Song not loaded', song.id);
        return;
    }
    const audio = songDefinition.song.audio;

    const offset = audio.trimRegion
            ? audio.trimRegion.start
            : 0;
    
    let duration = undefined;
    if (audio.trimRegion && !audio.loop) {
        duration = audio.trimRegion
            ? audio.trimRegion.end - audio.trimRegion.start
            : songDefinition.player.buffer.duration;
    } 

    if (songDefinition.song.behavior === 'replace') {
        allSongs
            .filter(s => s.id !== song.id)
            .map(s => getSong(s.id))
            .filter(s => s?.player?.state === 'started')
            .forEach(s => {
                s.player.fadeOut = songDefinition.song.fadeTime;
                s.player.stop();
            }
        );
    }

    songDefinition.player.start(
        Tone().now(),
        offset,
        duration
    );
}

function stopSong(song) {
    const songDefinition = getSong(song.id);
    songDefinition?.player?.stop();
}
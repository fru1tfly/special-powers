import { useState, useEffect, useRef } from "react";
export default function GameAudioManager() {
    const [currentSong, setCurrentSong] = useState(null);

    const playerRef = useRef(new Tone.Player());

    useEffect(() => {

    }, []);

    return <></>;
}

import * as Tone from 'tone';
import { getSong } from "../gameData/assetManager";


let songStack = [];

export async function addRoomSongs(roomId, songs) {
    // look for given room in all songs' room lists
    // if song is not in the stack, add at the top
    await songs.forEach(async song => {
        const songInRoom = song.rooms.filter(r => r === roomId).length === 1;
        const songInStack = songStack.filter(s => s.id === song.id).length === 1;

        console.log(songInRoom, songInStack);

        if (songInRoom && !songInStack) {
            await playSong(song);
            songStack.unshift(song);
        }

        if (songInStack && !songInRoom) {
            stopSong(song);
            songStack = songStack.filter(s => s.id !== song.id);
        }
    })
}

async function playSong(song) {
    const songDefinition = getSong(song.id);
    const audio = songDefinition.song.audio;

    const offset = audio.trimRegion
            ? audio.trimRegion.start
            : 0;
    
    let duration = undefined;
    if (audio.trimRegion && !audio.loop) {
        duration = audio.trimRegion
            ? audio.trimRegion.end - audio.trimRegion.start
            : songDefinition.player.sampleTime;
    } 

    songDefinition.player.start(
        Tone.getContext().transport.seconds,
        offset,
        duration
    );
}

function stopSong(song) {
    const songDefinition = getSong(song.id);
    songDefinition.player.stop();
}
import { useGetGameData } from "../hooks/GameDataHelper";
import { useState, useEffect } from "react";
import { getRoomAssetCount, loadRoomAssets } from "../gameData/gameDataHelper";
import { addAudio, addSong, initializeAudio } from "../gameData/assetManager";
import * as Tone from 'tone';

export default function Preloader({ playBtn, setState, children }) {
    const getGameData = useGetGameData();

    const [playing, setPlaying] = useState(false);
    const [gameData, setGameData] = useState(null);
    const [assetCount, setAssetCount] = useState(0);
    const [assetLoaded, setAssetLoaded] = useState(0);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const gameMode = playBtn;

        const loadAssets = async (data) => {
            const count = data.rooms.reduce(
                (total, room) => total + getRoomAssetCount(room),
                0
            ) + (data.songs?.length ?? 0);

            setAssetCount(count);
            setAssetLoaded(0);

            const incrementLoadedCount = () => {
                if (!cancelled) {
                    setAssetLoaded(prev => prev + 1);
                }
            }

            const songPromises = (data.songs ?? []).map(song =>
                (gameMode ? addSong(song) : addAudio(song.audio))
                    .then(incrementLoadedCount)
                    .catch(e => console.error('Failed to load song', song.id, e))
            );

            await Promise.all([
                ...songPromises,
                ...data.rooms.flatMap(room => loadRoomAssets(room, incrementLoadedCount))
            ]);
        }

        const init = async () => {
            const gData = (await getGameData()).data;
            setGameData(gData);
            // setState may keep a locally saved state instead of the server data;
            // preload assets for whichever state will actually be rendered.
            const activeData = setState(gData) ?? gData;


            if (!gData.version && !gData.rooms) {
                console.error('UNABLE TO LOAD GAME FILE');
                return;
            }

            await loadAssets(activeData);

            if (!cancelled) {
                setLoaded(true);
            }
        }

        init();

        return () => {
            cancelled = true;
        }

    }, []);

    const playGame = async () => {
        await Tone.start();
        await initializeAudio();
        setPlaying(true);
    }

    const progress = assetCount > 0
        ? (assetLoaded / assetCount) * 100
        : 0;
        
    return (
        <>
            {!loaded && 
                <div className="preloader-container">
                    <div className="preloader-bar" style={{width: `${progress}%`}}></div>
                </div>
            }
            {loaded && !playing && playBtn &&
                <button onClick={playGame} className="play-btn">Play</button>
            }
            {loaded && (playing || !playBtn) && children}
        </>
    );
}
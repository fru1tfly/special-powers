import { useGetGameData } from "../hooks/GameDataHelper";
import { useState, useEffect } from "react";
import { getRoomAssetCount, loadRoomAssets } from "../gameData/gameDataHelper";
import { addAudio, addSong } from "../gameData/assetManager";

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
            ) + data.songs.length;

            setAssetCount(count);
            setAssetLoaded(0);

            const incrementLoadedCount = () => {
                if (!cancelled) {
                    setAssetLoaded(prev => prev + 1);
                }
            }

            data.songs.forEach(async (song) => {
                console.log(song, 'GETTIN ADDED');
                if (gameMode) {
                    await addSong(song);
                } else {
                    await addAudio(song.audio);
                }
            });

            await Promise.all(data.rooms.flatMap(room => loadRoomAssets(room, incrementLoadedCount)));
        }

        const init = async () => {
            const gData = (await getGameData()).data;
            setGameData(gData);
            setState(gData);


            if (!gData.version && !gData.rooms) {
                console.error('UNABLE TO LOAD GAME FILE');
                return;
            }

            await loadAssets(gData);

            if (!cancelled) {
                setLoaded(true);
            }
        }

        init();

        return () => {
            cancelled = true;
        }

    }, []);

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
                <button onClick={() => setPlaying(true)} className="play-btn">Play</button>
            }
            {loaded && (playing || !playBtn) && children}
        </>
    );
}
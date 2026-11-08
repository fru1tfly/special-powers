import { useGetGameData } from "../hooks/GameDataHelper";
import { useState, useEffect } from "react";
import { getRoomAssetCount, loadRoomAssets } from "../gameData/gameDataHelper";
import { addAudio, addSong, initializeAudio, Tone} from "../gameData/assetManager";
import { fonts } from "../gameData/fonts";

let toneLoaded = false;

export default function Preloader({ playBtn, setState, children }) {
    const getGameData = useGetGameData();

    const [playing, setPlaying] = useState(false);
    const [gameData, setGameData] = useState(null);
    const [assetCount, setAssetCount] = useState(0);
    const [assetLoaded, setAssetLoaded] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [finalLoad, setFinalLoad] = useState(false);

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

            const songPromises = (data.songs ?? []).filter(song => song.audio && song.audio.url).map(song =>
                (gameMode ? addSong(song) : addAudio(song.audio))
                    .then(incrementLoadedCount)
                    .catch(e => console.error('Failed to load song', song.id, e))
            );

            const fontPromises = fonts.map(fontData => {
                const font = new FontFace(fontData.name, fontData.url, fontData.options);
                document.fonts.add(font);
                return font.load();
            });

            await Promise.all([
                ...songPromises,
                ...fontPromises,
                ...data.rooms.flatMap(room => loadRoomAssets(room, incrementLoadedCount))
            ]);
        }

        const init = async () => {
            const gData = (await getGameData()).data;
            setGameData(gData);
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
        setFinalLoad(true);
        await initializeAudio();
        setPlaying(true);
    }

    const progress = assetCount > 0
        ? (assetLoaded / assetCount) * 100
        : 0;

    const checkToneLoad = async () => {
        if (!toneLoaded) {
            await initializeAudio();
            toneLoaded = true;
        }
    }

    useEffect(() => {
        if (!playBtn) {
            window.addEventListener('click', checkToneLoad);
        }

        return () => {
            window.removeEventListener('click', checkToneLoad);
        }
    })
        
    return (
        <>
            {!loaded && 
                <div className="preloader-container">
                    <div className="preloader-bar" style={{width: `${progress}%`}}></div>
                </div>
            }
            {loaded && !playing && playBtn &&
                <>
                    {!finalLoad &&
                        <button onClick={playGame} className="play-btn">Play</button>
                    }
                    {finalLoad &&
                        <p className="loading-text">loading...</p>
                    }
                </>
            }
            {loaded && (playing || !playBtn) && children}
        </>
    );
}
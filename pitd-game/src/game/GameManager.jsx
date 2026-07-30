import { useEffect, useState } from "react";
import GameCanvas from "./GameCanvas";
import { GameContext, SetGameContext } from "./GameContext";
import GameInputHandler from "./GameInputHandler";
import { loadRoomAssets } from "../gameData/gameDataHelper";
import { useGetGameData } from "../hooks/GameDataHelper";

export default function GameManager() {
    const [loaded, setLoaded] = useState(false);
    const [gameState, setGameState] = useState({});
    const getGameData = useGetGameData();

    useEffect(() => {
        const init = async () => {
            const gameData = (await getGameData()).data;
            await Promise.all(gameData.rooms.flatMap(room => loadRoomAssets(room)));

            setGameState({
                ...gameData,
                room: gameData.rooms[0].id,
                inventory: []
            });
            
            setLoaded(true);
        }

        init();

        return () => {
        }

    }, []);

    const saveGameState = () => {
        const { rooms, version, room } = gameState;
        localStorage.setItem('gameState', JSON.stringify({
            rooms: rooms,
            version: version,
            room: room
        }));
    }

    return (
        <>
            {loaded && (
                <GameContext.Provider value={gameState}>
                    <SetGameContext.Provider value={setGameState}>
                        <GameCanvas />
                        <GameInputHandler />
                    </SetGameContext.Provider>
                </GameContext.Provider>
            )}
        </>
    );
}
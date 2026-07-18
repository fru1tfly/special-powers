import { useEffect, useState } from "react";
import { gameData } from "../gameData/gameData";
import GameCanvas from "./GameCanvas";
import { GameContext, SetGameContext } from "./GameContext";
import GameInputHandler from "./GameInputHandler";
import { loadRoomAssets } from "../gameData/gameDataHelper";

export default function GameManager() {
    const [loaded, setLoaded] = useState(false);
    const [gameState, setGameState] = useState({
        room: gameData[0].id,
        inventory: [],
        alerts: []
    });

    useEffect(() => {
        const init = async () => {
            await Promise.all(gameData.flatMap(room => loadRoomAssets(room)));
            setLoaded(true);
        }

        init();

        return () => {
        }

    }, []);

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
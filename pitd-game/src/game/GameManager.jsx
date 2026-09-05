import { useEffect, useState } from "react";
import GameCanvas from "./GameCanvas";
import { GameContext, SetGameContext } from "./GameContext";
import GameInputHandler from "./GameInputHandler";
import { loadRoomAssets } from "../gameData/gameDataHelper";
import { useGetGameData } from "../hooks/GameDataHelper";
import Preloader from "../common/Preloader";

export default function GameManager() {
    const [gameState, setGameState] = useState(
        () => JSON.parse(localStorage.getItem('gameState')) 
    );

    const updateGameState = (newState) => {
        setGameState(newState)
        localStorage.setItem('gameState', JSON.stringify(newState))
    }

    const setState = (gameData) => {
        if (!gameState || gameData.version > gameState.version) {
            setGameState({
                ...gameData,
                room: gameData.rooms[0].id,
                inventory: []
            })
        }
    }

    return (
        <GameContext.Provider value={gameState}>
            <SetGameContext.Provider value={updateGameState}>
                <Preloader playBtn={true} setState={setState}>
                    <GameCanvas />
                </Preloader>
                <GameInputHandler />

            </SetGameContext.Provider>
        </GameContext.Provider>
    );
}
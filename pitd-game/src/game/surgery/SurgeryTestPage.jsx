import { useEffect, useState} from "react";
import { loadRoomAssets, loadFeatures } from "../../gameData/gameDataHelper";
import GameCanvas from "../GameCanvas";
import GameInputHandler from "../GameInputHandler";
import { GameContext } from "../GameContext";
import { Surgery } from "../../gameTypes/Surgery";

export default function SurgeryTestPage() {
    const [loaded, setLoaded] = useState(false);

    const surgeryRoomBaseState = {
        rooms: [
            {
                id: '123',
                interactables: [],
                features: [
                    new Surgery()
                ]
            }
        ],
        room: '123'
    };

    const [gameState, setGameState] = useState({});

    useEffect(() => {
        const init = async () => {
            await Promise.all(surgeryRoomBaseState.rooms.flatMap(room => loadRoomAssets(room)));
            surgeryRoomBaseState.rooms.flatMap(room => loadFeatures(room));
            setGameState({
                ...surgeryRoomBaseState
            });
            
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
                    <GameCanvas />
                    <GameInputHandler />
                </GameContext.Provider>
            )}
        </>
    );
}
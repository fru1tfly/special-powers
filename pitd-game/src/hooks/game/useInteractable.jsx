import { useContext } from "react";
import { GameContext, SetGameContext } from "../../game/GameContext";
import { gameData, updateGameData } from "../../gameData/gameData";

export function useInteractable() {
    const gameState = useContext(GameContext);
    const setGameState = useContext(SetGameContext);

    const interact = (interactable) => {
        switch (interactable.objectType) {
            case 'Door': {
                if (!interactable.isLocked || gameState.inventory.includes(interactable.key)) {
                    setGameState({
                        ...gameState,
                        room: interactable.destination
                    });
                    return true;
                } else {
                    console.log("it's locked");
                    return false;
                }
            }
            case 'Art': {
                setGameState({
                    ...gameState,
                    openArt: interactable.assets[0]
                });
                return true;
            }
            case 'Key': {
                updateGameData(gameData.map(room => ({
                    ...room,
                    interactables: room.interactables.filter(int => int.id !== interactable.id)
                })));

                setGameState({
                    ...gameState,
                    inventory: [...gameState.inventory, interactable.id]
                });
                return true;
            }
        }
    }

    return { interact };
}
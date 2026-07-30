import { useContext } from "react";
import { GameContext, SetGameContext } from "../../game/GameContext";

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
                setGameState({
                    ...gameState,
                    rooms: gameState.rooms.map(room => ({
                        ...room,
                        interactables: room.interactables.filter(int => int.id !== interactable.id)
                    })),
                    inventory: [...gameState.inventory, interactable.id]
                });
                return true;
            }
        }
    }

    return { interact };
}
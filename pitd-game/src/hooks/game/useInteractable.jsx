import { useContext } from "react";
import { GameContext, SetGameContext } from "../../game/GameContext";
import { isPlaying, playSound, stopSound } from "../../game/GameAudioManager";
import { getSound } from "../../gameData/assetManager";

export function useInteractable() {
    const gameState = useContext(GameContext);
    const setGameState = useContext(SetGameContext);

    const interact = (interactable) => {
        switch (interactable.objectType) {
            case 'Door': {
                if (!interactable.isLocked || gameState.inventory.includes(interactable.key)) {

                    if (!interactable.transitionType) {
                        setGameState({
                            ...gameState,
                            room: interactable.destination
                        })
                    } else {

                        setGameState({
                            ...gameState,
                            transitionDest: interactable.destination,
                            transitionAnim: interactable.assets.length > 0 ? interactable.transitionFrames : null,
                            transitionFade: interactable.transitionFade ?? null
                        });
                    }

                    const openSound = getSound(interactable.openSound?.id);
                    if (openSound) {
                        playSound(openSound);
                    }
                    
                    return true;
                } else {

                    const lockedSound = getSound(interactable.lockedSound?.id);
                    if (lockedSound) {
                        playSound(lockedSound);
                    }

                    return false;
                }
            }
            case 'Art': {
                setGameState({
                    ...gameState,
                    openArt: interactable.assets[0]
                });

                const viewSound = getSound(interactable.viewSound?.id);
                if (viewSound) {
                    playSound(viewSound);
                }

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

                const pickupSound = getSound(interactable.pickupSound?.id);
                if (pickupSound) {
                    playSound(pickupSound);
                }

                return true;
            }
            case 'MovePoint': {
                if (!interactable.transitionType) {
                    setGameState({
                        ...gameState,
                        room: interactable.destination
                    })
                } else {

                    setGameState({
                        ...gameState,
                        transitionDest: interactable.destination,
                        transitionAnim: interactable.assets.length > 0 ? interactable.transitionFrames : null,
                        transitionFade: interactable.transitionFade ?? null
                    });
                }

                const moveSound = getSound(interactable.moveSound?.id);
                if (moveSound) {
                    playSound(moveSound);
                }
            
                return true;
            }

            case 'AudioPlayer': {
                const playing = isPlaying(interactable.audio?.id) ?? false;

                if (interactable.audio && !playing) {
                    const playerAudio = getSound(interactable.audio.id);
                    if (playerAudio) {
                        playSound(playerAudio);
                    }
                } else if (interactable.audio && playing) {
                    stopSound(interactable.audio.id);
                }
            }
        }
    }

    return { interact };
}
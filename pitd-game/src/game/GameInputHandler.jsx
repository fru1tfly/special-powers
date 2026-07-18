import { useContext, useEffect, useState } from "react";
import { cursors } from "../gameData/cursors";
import { GameContext, SetGameContext } from "./GameContext";
import { getRoom, inImageBounds, pointInShape, screenToWorld, showOnScreen } from "../gameData/gameDataHelper";
import { useInteractable } from "../hooks/game/useInteractable";
import { getImage } from "../gameData/images";

export default function GameInputHandler() {
    const [cursorState, setCursorState] = useState('main');
    const gameState = useContext(GameContext);
    const setGameState = useContext(SetGameContext);
    const { interact } = useInteractable();

    const updateCursor = (newState) => {
        setCursorState(newState);
        document.body.style.cursor = cursors[newState];
    };

    

    useEffect(() => {
        const interactables = getRoom(gameState.room).interactables;

        const handleMouseMove = (event) => {
            const mousePoint = screenToWorld(event.clientX, event.clientY);

            if (!gameState.openArt) {
                let interacting = false;
                for (const int of interactables) {
                    if (int.points.length > 1) {
                        const inShape = pointInShape(mousePoint, int.points);
                        if (inShape) {
                            interacting = true;

                            if (int.objectType === 'Door') {
                                updateCursor('door');
                            } else if (int.objectType === 'Art') {
                                updateCursor('look');
                            }
                        }
                    } else if (showOnScreen(int)) {
                        const inBounds = inImageBounds(mousePoint, getImage(int.assets[0]), int.points[0]);
                        if (inBounds) {
                            interacting = true;

                            if (int.objectType === 'Key') {
                                updateCursor('hovering');
                            }
                        }
                    }
                }

                if (!interacting) {
                    updateCursor('main');
                }
            }
        };

        const handleMouseDown = (event) => {
            const mousePoint = screenToWorld(event.clientX, event.clientY);

            if (!gameState.openArt) {
                for (const int of interactables) {
                    let action = false; 
                    if (int.points.length > 1) {
                        if (pointInShape(mousePoint, int.points)) {
                            action = true;
                        }
                    } else if (showOnScreen(int)) {
                        if (inImageBounds(mousePoint, getImage(int.assets[0]), int.points[0])) {
                           action = true;
                        }
                    }

                    if (action) {
                        const success = interact(int);
                        if (success) {
                            updateCursor('main');
                        }
                    }
                }
            } else {
                setGameState({
                    ...gameState,
                    openArt: null
                });
            }
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
        }
    }, [gameState]);
    return <></>;
}
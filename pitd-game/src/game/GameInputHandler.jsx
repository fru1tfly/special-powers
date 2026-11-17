import { useContext, useEffect, useState } from "react";
import { cursors } from "../gameData/cursors";
import { GameContext, SetGameContext } from "./GameContext";
import { getRoom, hasFeature, inImageBounds, pointInShape, screenToWorld, showOnScreen } from "../gameData/gameDataHelper";
import { useInteractable } from "../hooks/game/useInteractable";
import { getImage } from "../gameData/assetManager";

export default function GameInputHandler() {
    const [cursorState, setCursorState] = useState('main');
    const [mouseState, setMouseState] = useState('idle');

    const gameState = useContext(GameContext);
    const setGameState = useContext(SetGameContext);
    const { interact } = useInteractable();

    const updateCursor = (newState) => {
        setCursorState(newState);
        document.body.style.cursor = cursors[newState];
    };

    useEffect(() => {
        if (!gameState) return;
        
        const interactables = getRoom(gameState.rooms, gameState.room).interactables;

        if (hasFeature(gameState)) {
            const feature = getRoom(gameState.rooms, gameState.room).features[0];
            document.body.style.cursor = cursors[feature.cursorState];
        }

        const handleMouseMove = (event) => {
            if (gameState.transitionAnim || gameState.transitionFade) return;

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
                            } else if (int.objectType === 'MovePoint') {
                                updateCursor(int.icon);
                            } else if (int.objectType === 'AudioPlayer') {
                                updateCursor('speaker');
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

                if (hasFeature(gameState)) {
                    const feature = getRoom(gameState.rooms, gameState.room).features[0];
                    feature.handleMouseMove(mousePoint.x, mousePoint.y, mouseState);
                    updateCursor(feature.cursorState);
                }
            }
        };

        const handleMouseDown = (event) => {
            if (gameState.transitionAnim) return;
            
            const mousePoint = screenToWorld(event.clientX, event.clientY);

            setMouseState('pressed');

            if (hasFeature(gameState)) {
                const feature = getRoom(gameState.rooms, gameState.room).features[0];
                feature.handleMouseDown(mousePoint.x, mousePoint.y);
            }

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

        const handleMouseUp = (event) => {
            setMouseState('idle');
        }

        const handleTouchStart = (event) => {
            setGameState({
                ...gameState,
                touchMode: true
            })
        }

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchstart', handleTouchStart);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchstart', handleTouchStart);
        }
    }, [gameState, mouseState]);
    return <></>;
}
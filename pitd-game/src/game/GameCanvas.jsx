import { setDimensions } from "../stores/dimensions";
import { useRef, useEffect, useContext } from "react";
import { GameContext, SetGameContext } from "./GameContext";
import { gameData } from "../gameData/gameData";
import { getImage } from "../gameData/assetManager";
import { AccentScreen } from "../gameTypes/AccentScreen";
import { getCenter, showOnScreen } from "../gameData/gameDataHelper";
import { Animation, Fade } from "../gameTypes/LevelObjects";
import { hasArea } from "../gameData/Interactables";
import { cursorImages } from "../gameData/cursors";
import { addRoomSongs } from "./GameAudioManager";
import * as UI from "./uiHelper";

let canvas;
export let ctx;

let openArt = null;
let interactables = [];
let roomName = '';
let features = [];
let transitionAnim;
let transitionFade;
let backgroundAnims = [];
let touchMode = false;

let gameStarted = false;

export const imgDimensions = { 
    width: screen.width * window.devicePixelRatio, 
    height: screen.height * window.devicePixelRatio, 
    xOffset: 0, 
    yOffset: 0 
};

export const gameArea = { size: 0, xOffset: 0, yOffset: 0 };

const sizeImage = () => {
    const narrowScreen = canvas.width / window.devicePixelRatio < 500;
    const border = UI.PAGE_PADDING * window.devicePixelRatio * (narrowScreen ? 0.5 : 1);

    const size = Math.max(0, Math.min(canvas.width, canvas.height) - border * 2);
    gameArea.size = size;
    gameArea.xOffset = (canvas.width - size) / 2;
    gameArea.yOffset = (canvas.height - size) / 2;

    imgDimensions.width = size;
    imgDimensions.height = size / UI.ROOM_ASPECT_RATIO;
    imgDimensions.xOffset = gameArea.xOffset;
    imgDimensions.yOffset = gameArea.yOffset + (size - imgDimensions.height) / 2;
}

let prevTime = 0;
const renderLoop = (time) => {
    const dt = time - prevTime;
    prevTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#021314';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    const narrowScreen = canvas.width / window.devicePixelRatio < 500;

    ctx.fillStyle = UI.BORDER_COLOR;
    const borderThickness = UI.BORDER_THICKNESS * window.devicePixelRatio * (narrowScreen ? 0.5 : 1);
    ctx.fillRect(
        imgDimensions.xOffset - canvas.width / 2 - borderThickness,
        imgDimensions.yOffset - canvas.height / 2 - borderThickness,
        imgDimensions.width + borderThickness * 2,
        imgDimensions.height + borderThickness * 2
    )

    ctx.fillStyle = 'black';

    ctx.fillRect(
        imgDimensions.xOffset - canvas.width / 2,
        imgDimensions.yOffset - canvas.height / 2,
        imgDimensions.width,
        imgDimensions.height
    )

    if (!transitionAnim) {
        for (const bgAnim of backgroundAnims) {
            const img = bgAnim.getCurrentImage();

            const aspectRatio = img.width / img.height;

            if (aspectRatio < UI.ROOM_ASPECT_RATIO) {
                const additionalXOffset = (imgDimensions.width - (imgDimensions.height * aspectRatio)) / 2;

                ctx.drawImage(
                    img,
                    imgDimensions.xOffset - canvas.width / 2 + additionalXOffset,
                    imgDimensions.yOffset - canvas.height / 2,
                    imgDimensions.height * aspectRatio,
                    imgDimensions.height
                );
            } else {
                const additionalYOffset = (imgDimensions.height - (imgDimensions.width / aspectRatio)) / 2;

                ctx.drawImage(
                    img,
                    imgDimensions.xOffset - canvas.width / 2,
                    imgDimensions.yOffset - canvas.height / 2  + additionalYOffset,
                    imgDimensions.width,
                    imgDimensions.width / aspectRatio
                );
            }

            bgAnim.update(dt);
        }
    }

    if (transitionAnim) {
        const img = transitionAnim.getCurrentImage();

        ctx.drawImage(
            img,
            imgDimensions.xOffset - canvas.width / 2,
            imgDimensions.yOffset - canvas.height / 2,
            imgDimensions.width,
            imgDimensions.height
        );

        transitionAnim.update(dt);
    }

    ctx.save();
    ctx.scale(imgDimensions.height, imgDimensions.height);

    for (const i of interactables) {
        if (showOnScreen(i) && !transitionAnim) {
            let intImage;

            if (i.frames) {
                intImage = i.frames.getCurrentImage();
                i.frames.update(dt);
            } else {
                intImage = getImage(i.assets[0]);
            }

            const scaleFactor = imgDimensions.height / window.devicePixelRatio;
            const imgWidth = intImage.width / scaleFactor
            const imgHeight = intImage.height / scaleFactor;

            ctx.drawImage(
                intImage,
                i.points[0].x - imgWidth / 2,
                i.points[0].y - imgHeight / 2,
                imgWidth,
                imgHeight
            );
        }

        if (touchMode && ((i.objectType === 'MovePoint' && i.touchVisible) || i.objectType === 'Door') && !transitionAnim) {
            const icon = i.icon ? getImage(cursorImages[i.icon]) : getImage('door.png');
            const iconWidth = icon.width / imgDimensions.height * 1.5;
            const iconHeight = icon.height / imgDimensions.height * 1.5;
            const { x, y } = getCenter(i.points);

            ctx.globalAlpha = 0.75;
            ctx.save();
            ctx.drawImage(
                icon,
                x - iconWidth / 2,
                y - iconHeight / 2,
                iconWidth,
                iconHeight
            );
            ctx.restore();
            ctx.globalAlpha = 1;
        }
    }

    for (const f of features) {
        f.update(dt);
        f.draw(ctx);
    }

    ctx.restore();

    if (openArt) {
        openArt.draw();
        openArt.update(dt);

        if (openArt.shouldRemove) {
            openArt = null;
        }
    }

    if (transitionFade) {
        ctx.globalAlpha = transitionFade.getOpacity();

        ctx.fillStyle = transitionFade.color;
        ctx.fillRect(
            imgDimensions.xOffset - canvas.width / 2,
            imgDimensions.yOffset - canvas.height / 2,
            imgDimensions.width,
            imgDimensions.height
        );

        ctx.globalAlpha = 1;
        transitionFade.update(dt);
    }

    const fontSize = gameArea.size * UI.FONT_SIZE;

    ctx.fillStyle = UI.TEXT_COLOR;
    ctx.font = `${fontSize / 2}pt DithBirk-Italic`;
    ctx.textAlign = 'center';
    ctx.fillText(roomName, 0, -gameArea.size / 2 + fontSize / 2);

    ctx.strokeStyle = UI.BORDER_COLOR;
    ctx.lineWidth = UI.BORDER_THICKNESS * window.devicePixelRatio * 0.6;


    if (!narrowScreen) {
        const slotSize = Math.max(UI.INVENTORY_SLOT_SIZE * gameArea.size, 30 * window.devicePixelRatio);
        const slotCount = 6;
        for (let i = 0; i < slotCount; i++) {
            ctx.strokeRect(
                slotSize * -slotCount / 2 + i * slotSize,
                gameArea.size * 0.5 - slotSize, 
                slotSize, 
                slotSize
            );
        }
    }


    ctx.restore();

    requestAnimationFrame(renderLoop);
}

export default function GameCanvas() {
    const gameCanvas = useRef(null);
    const gameState = useContext(GameContext);
    const setGameState = useContext(SetGameContext);

    useEffect(() => {

        canvas = gameCanvas.current;
        ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const resizeWindow = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;

            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            setDimensions(canvas.width, canvas.height);

            sizeImage();

        }
        resizeWindow();
       
        let gameLoop = requestAnimationFrame(renderLoop);
        window.addEventListener('resize', resizeWindow);


        return () => {
            cancelAnimationFrame(gameLoop);
            window.removeEventListener('resize', resizeWindow);
        }
    }, []);

    useEffect(() => {
        const room = gameState.rooms.find(r => r.id === gameState.room);
        const backgrounds = room.interactables.filter(i => i.objectType === 'Background');

        roomName = room.name;

        if (!gameStarted) {
            addRoomSongs(gameState.room, gameState.songs);
            gameStarted = true;
        }

        backgroundAnims = [];
        for (const bg of backgrounds) {
            backgroundAnims.push(initializeAnimation(bg.frames));
        }
        
        if (gameState.openArt && !openArt) {
            openArt = new AccentScreen(gameState.openArt);
            openArt.start();
        }

        if (!gameState.openArt && openArt) {
            openArt.leave();
        }

        if (room.interactables) {
            interactables = room.interactables;

            for (const i of interactables) {
                if (i.frames) {
                    i.frames = initializeAnimation(i.frames);
                }
            }
        }

        if (room.features) {
            features = [...room.features];
        }

        touchMode = gameState.touchMode;
        
        let listeners = [];

        if (gameState.transitionAnim) {
            transitionAnim = initializeAnimation(gameState.transitionAnim);

            listeners.push(transitionAnim.on('end', () => {
                setGameState({
                    ...gameState,
                    room: gameState.transitionDest,
                    transitionAnim: null,
                    transitionDest: null
                });
                transitionAnim = null;
            }));
        }

        if (gameState.transitionFade) {
            if (!transitionFade) {
                transitionFade = initializeFade(gameState.transitionFade);
            }

            listeners.push(transitionFade.on('end', () => {
                setGameState({
                    ...gameState,
                    transitionFade: null,
                });
                transitionFade = null;
            }));

            listeners.push(transitionFade.on('roomchange', () => {
                setGameState({
                    ...gameState,
                    room: gameState.transitionDest,
                    transitionDest: null
                });
            }));
        }

        return () => {
            listeners.forEach(l => l());
        };
        
    }, [gameState]);

    return (
        <canvas ref={gameCanvas}></canvas>
    )
}

function initializeAnimation(anim) {
    const newAnim = new Animation();
    newAnim.frames = [...anim.frames];
    newAnim.frameRate = anim.frameRate;
    newAnim.loopMode = anim.loopMode;
    newAnim.timesToPlay = anim.timesToPlay;

    return newAnim;
}

function initializeFade(fade) {
    const newFade = new Fade();
    newFade.steps = fade.steps;
    newFade.color = fade.color;
    newFade.stall = fade.stall;
    newFade.fps = fade.fps;

    return newFade;
}
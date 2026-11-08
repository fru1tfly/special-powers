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

let canvas;
export let ctx;

let roomBackground;
let openArt = null;
let interactables = [];
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

const sizeImage = () => {
    const imgAspectRatio = roomBackground.width / roomBackground.height;
    const canvasAspectRatio = canvas.width / canvas.height;


    if (imgAspectRatio === canvasAspectRatio) {
        imgDimensions.width = canvas.width;
        imgDimensions.height = canvas.height;
        imgDimensions.xOffset = 0;
        imgDimensions.yOffset = 0;
    } else if (imgAspectRatio < canvasAspectRatio) {
        const yScale = canvas.height / roomBackground.height;
        imgDimensions.width = roomBackground.width * yScale;
        imgDimensions.height = canvas.height;
        imgDimensions.xOffset = (canvas.width - imgDimensions.width) / (2);
        imgDimensions.yOffset = 0;
    } else if (imgAspectRatio > canvasAspectRatio) {
        const xScale = canvas.width / roomBackground.width;
        imgDimensions.width = canvas.width;
        imgDimensions.height = roomBackground.height * xScale;
        imgDimensions.xOffset = 0;
        imgDimensions.yOffset = (canvas.height - imgDimensions.height) / (2);
    }
}

let prevTime = 0;
const renderLoop = (time) => {
    const dt = time - prevTime;
    prevTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);

    if (!transitionAnim) {
        for (const bgAnim of backgroundAnims) {
            const img = bgAnim.getCurrentImage();

            ctx.drawImage(
                img,
                imgDimensions.xOffset - canvas.width / 2,
                imgDimensions.yOffset - canvas.height / 2,
                imgDimensions.width,
                imgDimensions.height
            );

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

            if (roomBackground) {
                sizeImage();
            }

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

        if (!gameStarted) {
            addRoomSongs(gameState.room, gameState.songs);
            gameStarted = true;
        }

        if (backgrounds.length > 0) {
            roomBackground = getImage(backgrounds[0].assets[0]);
            sizeImage();
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
import { setDimensions } from "../stores/dimensions";
import { useRef, useEffect, useContext } from "react";
import { GameContext, SetGameContext } from "./GameContext";
import { gameData } from "../gameData/gameData";
import { getImage } from "../gameData/images";
import { AccentScreen } from "../gameTypes/AccentScreen";
import { getCenter, showOnScreen } from "../gameData/gameDataHelper";
import { Animation } from "../gameTypes/LevelObjects";
import { hasArea } from "../gameData/Interactables";
import { cursorImages } from "../gameData/cursors";

let canvas;
export let ctx;

let roomBackground;
let openArt = null;
let interactables = [];
let features = [];
let transitionAnim;
let backgroundAnim;
let touchMode = false;

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

    if (backgroundAnim && !transitionAnim) {
        const img = backgroundAnim.getCurrentImage();

        ctx.drawImage(
            img,
            imgDimensions.xOffset - canvas.width / 2,
            imgDimensions.yOffset - canvas.height / 2,
            imgDimensions.width,
            imgDimensions.height
        );

        backgroundAnim.update(dt);
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
        if (showOnScreen(i)) {
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

        if (i.objectType === 'MovePoint' && touchMode && i.touchVisible) {
            const icon = getImage(cursorImages[i.icon]);
            const iconWidth = icon.width / imgDimensions.height * 1.5;
            const iconHeight = icon.height / imgDimensions.height * 1.5;
            const { x, y } = getCenter(i.points);

            ctx.globalAlpha = 0.75;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(i.angle * Math.PI / 180);
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
        console.log(gameState);
        const room = gameState.rooms.find(r => r.id === gameState.room);
        const background = room.interactables.find(i => i.objectType === 'Background');

        if (background) {
            backgroundAnim = initializeAnimation(background.frames);
            roomBackground = getImage(background.frames.frames[0]);
            sizeImage();
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
        
        let unsubscribe = () => {};

        if (gameState.transitionAnim) {
            transitionAnim = initializeAnimation(gameState.transitionAnim);

            unsubscribe = transitionAnim.on('end', () => {
                setGameState({
                    ...gameState,
                    transitionAnim: null
                });
                transitionAnim = null;
            })
        }

        return unsubscribe;
        
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
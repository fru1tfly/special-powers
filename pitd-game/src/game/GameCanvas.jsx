import { setDimensions } from "../stores/dimensions";
import { useRef, useEffect, useContext } from "react";
import { GameContext, SetGameContext } from "./GameContext";
import { gameData } from "../gameData/gameData";
import { getImage } from "../gameData/images";
import { AccentScreen } from "../gameTypes/AccentScreen";
import { showOnScreen } from "../gameData/gameDataHelper";

let canvas;
export let ctx;

let roomBackground;
let openArt = null;
let interactables = [];

const imgDimensions = { width: 0, height: 0, xOffset: 0, yOffset: 0 };

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

    if (roomBackground) {
        ctx.drawImage(
            roomBackground,
            imgDimensions.xOffset - canvas.width / 2,
            imgDimensions.yOffset - canvas.height / 2,
            imgDimensions.width,
            imgDimensions.height
        );
    }

    for (const i of interactables) {
        if (showOnScreen(i)) {
            const intImage = getImage(i.assets[0]);
            ctx.drawImage(
                intImage,
                i.points[0].x - intImage.width / 2,
                i.points[0].y - intImage.height / 2,
                intImage.width,
                intImage.height
            );
        }
    }

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

    useEffect(() => {

        canvas = gameCanvas.current;
        ctx = canvas.getContext('2d');

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
        const room = gameData.find(r => r.id === gameState.room);
        roomBackground = getImage(room.imgUrl);
        sizeImage();

        if (gameState.openArt && !openArt) {
            openArt = new AccentScreen(gameState.openArt);
            openArt.start();
        }

        if (!gameState.openArt && openArt) {
            openArt.leave();
        }

        interactables = room.interactables;
    }, [gameState]);

    return (
        <canvas ref={gameCanvas}></canvas>
    )
}
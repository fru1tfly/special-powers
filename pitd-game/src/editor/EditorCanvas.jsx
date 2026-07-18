import { useContext, useEffect, useRef, useState } from "react";
import { EditorContext, SetEditorContext } from "./EditorContext";
import { cameraOffset, movingObject, zoomValue } from "./EditorInputHandler";
import { setDimensions } from "../stores/dimensions";
import { tempNodes } from "../stores/tempData";
import { getImage } from "../gameData/images";

let canvas;
export let ctx;
let roomBackground;
let shapes = [];
let currentRoom;

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
        imgDimensions.xOffset = (canvas.width - imgDimensions.width) / 2;
        imgDimensions.yOffset = 0;
    } else if (imgAspectRatio > canvasAspectRatio) {
        const xScale = canvas.width / roomBackground.width;
        imgDimensions.width = canvas.width;
        imgDimensions.height = roomBackground.height * xScale;
        imgDimensions.xOffset = 0;
        imgDimensions.yOffset = (canvas.height - imgDimensions.height) / 2;
    }
}

let prevTime = 0;
const renderLoop = async (time) => {
    const dt = time - prevTime;
    prevTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoomValue, zoomValue);
    ctx.translate(cameraOffset.x, cameraOffset.y);

    if (roomBackground) {
        ctx.drawImage(
            roomBackground,
            imgDimensions.xOffset - canvas.width / 2,
            imgDimensions.yOffset - canvas.height / 2,
            imgDimensions.width,
            imgDimensions.height
        );
    }

    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 5 / zoomValue;
    ctx.beginPath();

    for (let shape of shapes) {
        await drawShape(shape);
    }

    if (tempNodes.length > 0) {
        ctx.moveTo(tempNodes[0].x, tempNodes[0].y);
        for (let node of tempNodes) {
            ctx.lineTo(node.x, node.y);
        }
        ctx.stroke();
    }

    ctx.restore();

    requestAnimationFrame(renderLoop);
}

export default function EditorCanvas() {
    const editorCanvas = useRef(null);
    const editorState = useContext(EditorContext);

    useEffect(() => {

        canvas = editorCanvas.current;
        ctx = canvas.getContext('2d');

        const resizeWindow = () => {
            const width = Math.min(screen.width, window.innerWidth);
            const height = Math.min(screen.height, window.innerHeight);

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
        const imgSrc = editorState.rooms.find(r => 
            r.id === editorState.selectedRoom
        )?.imgUrl;

        if (currentRoom !== editorState.selectedRoom) {
            currentRoom = editorState.selectedRoom;
        }

        if (imgSrc) {
            roomBackground = new Image();
            roomBackground.src = `${import.meta.env.VITE_DOMAIN}${imgSrc}`;
            roomBackground.onload = () => {
                sizeImage();
            }
        } else {
            roomBackground = null;
        }

        shapes = [];

        editorState.rooms.forEach(r => {
            if (r.id !== editorState.selectedRoom) return;
            r.interactables.forEach(i => {
                if (i.points.length > 0) {
                    shapes.push(i);
                    console.log(shapes);
                }
                
            })
        })
    }, [editorState]);

    return (
        <canvas ref={editorCanvas}></canvas>
    )
}

async function drawShape(shape) {
    if (shape.points.length > 1) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';

        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let point of shape.points) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.fill();
    } else {
        const img = await getImage(shape.assets[0]);

        if (shape.id !== movingObject.id) {
            ctx.drawImage(
                img,
                shape.points[0].x - img.width / 2, 
                shape.points[0].y - img.height / 2
            )
        } else {
            ctx.drawImage(
                img,
                movingObject.newPosition.x - img.width / 2,
                movingObject.newPosition.y - img.height / 2
            )
        }
    }
}
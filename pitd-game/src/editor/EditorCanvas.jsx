import { useContext, useEffect, useRef, useState } from "react";
import { EditorContext, SetEditorContext } from "./EditorContext";
import { cameraOffset, movingObject, zoomValue } from "./EditorInputHandler";
import { setDimensions } from "../stores/dimensions";
import { tempNodes } from "../stores/tempData";
import { getImage } from "../gameData/assetManager";

let canvas;
export let ctx;
let roomBackgrounds = [];
let shapes = [];
let currentRoom;

export const imgDimensions = { width: 0, height: 0, xOffset: 0, yOffset: 0 };

const sizeImage = () => {
    const roomBackground = roomBackgrounds[0];
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

        for (const roomBackground of roomBackgrounds) {
            ctx.drawImage(
                roomBackground,
                imgDimensions.xOffset - canvas.width / 2,
                imgDimensions.yOffset - canvas.height / 2,
                imgDimensions.width,
                imgDimensions.height
            );
        }

        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 5 / zoomValue / canvas.height;
        ctx.beginPath();

        ctx.save();
            ctx.scale(imgDimensions.height, imgDimensions.height);

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

            if (roomBackgrounds.length > 0) {
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

        if (currentRoom !== editorState.selectedRoom) {
            currentRoom = editorState.selectedRoom;
        }

        const roomData = editorState.rooms.find(r => r.id === currentRoom);

        if (roomData) {
            const backgrounds = roomData.interactables.filter(i => i.objectType === 'Background');

            roomBackgrounds = [];
            for (const bg of backgrounds) {
                const img = bg.assets.length > 0 ? getImage(bg.assets[0]) : null;
                if (img) {
                    roomBackgrounds.push(img);
                }
            }

            if (roomBackgrounds.length > 0) {
                sizeImage();
            }

            shapes = [];
            roomData.interactables.forEach(i => {
                if (i.points.length > 0) {
                    shapes.push(i);
                }
            });
        }
    }, [editorState]);

    return (
        <canvas ref={editorCanvas}></canvas>
    )
}

function drawShape(shape) {
    if (shape.points.length > 1) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';

        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let point of shape.points) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.fill();
    } else {
        const scaleFactor = imgDimensions.height / window.devicePixelRatio;
        const img = getImage(shape.assets[0]);
        if (!img) return;

        const imgWidth = img.width / scaleFactor
        const imgHeight = img.height / scaleFactor;

        if (shape.id !== movingObject.id) {
            ctx.drawImage(
                img,
                shape.points[0].x - imgWidth / 2,
                shape.points[0].y - imgHeight / 2,
                imgWidth,
                imgHeight
            )
        } else {
            ctx.drawImage(
                img,
                movingObject.newPosition.x - imgWidth / 2,
                movingObject.newPosition.y - imgHeight / 2,
                imgWidth,
                imgHeight
            )
        }
    }
}

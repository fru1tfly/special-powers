import { useEffect } from "react";
import { cursors } from "../gameData/cursors";
import { getImage } from "../gameData/images";
import { screenToWorld } from "../gameData/gameDataHelper";
import { Vector2 } from "../gameTypes/Vector";
import { canvasWidth, canvasHeight } from "../stores/dimensions";
import { tempNodes, resetTempNodes } from "../stores/tempData";

export let cameraOffset = { x: 0, y: 0 };
export let zoomValue = 1;
export let mousePosition = { x: 0, y: 0 };

export let movingObject = {};
export const shapeModeListeners = new Set();
export const moveModeListeners = new Set();
export const editorEventListeners = new Map();

export function getShapeMode() {
    return inputQueue.includes('placing');
}

export function getMoveMode() {
    return inputQueue.includes('moving');
}

export function startShapeMode() {
    inputQueue.unshift('placing');
    shapeModeUpdated = false;
    updateInputState();
    propagate();
}

export function startMoveMode(id, origin, assetUrl) {
    movingObject = {};
    movingObject.origin = { ...origin };
    movingObject.assetUrl = assetUrl;
    movingObject.id = id;
    movingObject.newPosition = { ...origin };

    inputQueue.unshift('moving');
    moveModeUpdated = false;
    updateInputState();
    movePropagate();
}

export function on(eventName, listener) {
    if (!editorEventListeners.has(eventName)) {
        editorEventListeners.set(eventName, new Set());
    }

    editorEventListeners.get(eventName).add(listener);

    return () => {
        editorEventListeners.get(eventName)?.delete(listener);
    }
}

export function shapeModeSubscribe(listener) {
    shapeModeListeners.add(listener);
    return () => shapeModeListeners.delete(listener);
}

export function moveModeSubscribe(listener) {
    moveModeListeners.add(listener);
    return () => shapeModeListeners.delete(listener);
}

let inputState = 'main';
let inputQueue = ['main'];

let shapeModeUpdated = false;
let moveModeUpdated = false;

let dragOrigin = { x: 0, y: 0 };
let cameraOrigin = { x: 0, y: 0 };

function stopShapeMode() {
    removeInputState('placing');
    shapeModeUpdated = false;
    propagate();
}

function stopMoveMode() {
    removeInputState('moving');
    removeInputState('moveMode');
    removeInputState('hovering');
    movingObject = {};
    moveModeUpdated = false;
    movePropagate();
}

function updateInputState() {
    inputState = inputQueue[0];
    document.body.style.cursor = cursors[inputQueue[0]];
}

function propagate() {
    if (!shapeModeUpdated) {
        shapeModeUpdated = true;
        shapeModeListeners.forEach(listener => listener());
    }
}

function movePropagate() {
    if (!moveModeUpdated) {
        moveModeUpdated = true;
        moveModeListeners.forEach(listener => listener());
    }
}

function addShape(shape) {
    editorEventListeners.get('shapeAdd').forEach(l => l(shape));
}

function moveItem(shape) {
    editorEventListeners.get('moveItem').forEach(l => l(shape));
}

function stateInQueue(state) {
    return inputQueue.includes(state);
}

function removeInputState(state) {
    inputQueue = inputQueue.filter(i => i !== state);
    updateInputState();
}

function addState(state) {
    inputQueue.unshift(state);
    updateInputState();
}

const handleMouseDown = (event) => {
    if (inputState === 'dragMode') {
        addState('dragging');

        dragOrigin.x = event.pageX - canvasWidth / 2;
        dragOrigin.y = event.pageY - canvasHeight / 2;

        cameraOrigin = { ...cameraOffset };
    }

    const clickPoint = screenToWorld(event.pageX, event.pageY);
    const worldPoint = clickPoint.minus(new Vector2(cameraOffset.x, cameraOffset.y).times(zoomValue)).times(1 / zoomValue);

    if (inputState === 'placing') {
        tempNodes.push(worldPoint);
    }

    if (inputState === 'hovering') {
        addState('moveMode');
        movingObject.offset = { x: worldPoint.x - movingObject.newPosition.x, y: worldPoint.y - movingObject.newPosition.y }
    }
};

const handleMouseMove = async (event) => {
    if (inputState === 'dragging') {
        const movement = {
            x: event.pageX - canvasWidth / 2 - dragOrigin.x,
            y: event.pageY - canvasHeight / 2 - dragOrigin.y
        };

        cameraOffset = {
            x: cameraOrigin.x + (movement.x / zoomValue),
            y: cameraOrigin.y + (movement.y / zoomValue)
        };
    }

    mousePosition.x = event.clientX;
    mousePosition.y = event.clientY;

    if (stateInQueue('moving')) {
        const clickPoint = screenToWorld(mousePosition.x, mousePosition.y);
        const worldPoint = clickPoint.minus(new Vector2(cameraOffset.x, cameraOffset.y).times(zoomValue)).times(1 / zoomValue);
        if (inputState !== 'moveMode') {
            const movingImage = await getImage(movingObject.assetUrl);
            if (
                Math.abs(worldPoint.x - movingObject.newPosition.x) < (movingImage.width / 2) &&
                Math.abs(worldPoint.y - movingObject.newPosition.y) < (movingImage.height / 2)
            ) {
                addState('hovering');
            } else {
                removeInputState('hovering');
            }
        } else {
            movingObject.newPosition.x = worldPoint.x - movingObject.offset.x;
            movingObject.newPosition.y = worldPoint.y - movingObject.offset.y;
        }
    }
}

const handleMouseUp = () => {
    if (inputState === 'dragging') {
        removeInputState('dragging');
    }

    if (inputState === 'moveMode') {
        removeInputState('moveMode');
    }
}

const handleKeyDown = (event) => {
    switch (event.key) {
        case ' ':
            if (!stateInQueue('dragMode'))
                addState('dragMode');
            break;

        case 'Enter': {
            if (getShapeMode()) {
                stopShapeMode();
                addShape(tempNodes);
                resetTempNodes();
            }

            if (getMoveMode()) {
                moveItem(movingObject.newPosition);
                stopMoveMode();
            }

            break;
        }

        case 'Escape': {
            if (getShapeMode()) {
                stopShapeMode();
                resetTempNodes();
            }

            if (getMoveMode()) {
                moveItem(movingObject.origin);
                stopMoveMode();
            }
        }

    }
}

const handleKeyUp = (event) => {
    switch (event.key) {
        case ' ':
            removeInputState('dragMode');
            break;
    }
}

const handleWheel = (event) => {
    let newZoomValue = zoomValue - event.deltaY / 2e2;
    if (newZoomValue < 1) {
        newZoomValue = 1;
    } else if (newZoomValue > 10) {
        newZoomValue = 10;
    }
    zoomValue = newZoomValue;
}

export function EditorInputHandler() {
    useEffect(() => {
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('wheel', handleWheel);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('wheel', handleWheel);
        }
    }, []);

    return <></>;
}

document.body.style.cursor = cursors.main;
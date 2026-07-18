import { gameData } from "./gameData";
import { Vector2 } from "../gameTypes/Vector";
import { canvasWidth, canvasHeight } from "../stores/dimensions";
import { addImage } from "./images";

export function getRoom(roomId) {
    return gameData.find(r => r.id === roomId);
}

export function loadRoomAssets(room) {
    const assetPromises = [];

    assetPromises.push(addImage(room.imgUrl));

    for (const i of room.interactables) {
        for (const asset of i.assets) {
            assetPromises.push(addImage(asset));
        }
    }

    return assetPromises;
}

export function screenToWorld(x, y) {
    const screen = new Vector2(x, y).times(window.devicePixelRatio);
    const relativeToCenter = screen.minus(new Vector2(canvasWidth / 2, canvasHeight / 2));

    return relativeToCenter;
}

export function pointInShape(point, shape) {
    let inShape = false;

    let nextPoint;
    for (let i = 0; i < shape.length; i++) {
        nextPoint = i + 1;
        if (nextPoint === shape.length) nextPoint = 0;

        let vertexA = shape[i];
        let vertexB = shape[nextPoint];

        if (
            (
                (vertexA.y >= point.y && vertexB.y < point.y) ||
                (vertexA.y < point.y && vertexB.y >= point.y)
            ) && (
                point.x < (vertexB.x - vertexA.x) * (point.y - vertexA.y) / (vertexB.y - vertexA.y) + vertexA.x
            )
        ) {
            inShape = !inShape;
        }
    }

    return inShape;
}

export function inImageBounds(point, image, origin) {
    return (
        Math.abs(point.x - origin.x) <= image.width / 2 &&
        Math.abs(point.y - origin.y) <= image.height / 2
    );
}

export function showOnScreen(interactable) {
    return interactable.objectType === 'Key';
}
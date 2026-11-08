import { gameData } from "./gameData";
import { Vector2 } from "../gameTypes/Vector";
import { canvasWidth, canvasHeight } from "../stores/dimensions";
import { addImage } from "./assetManager";
import { imgDimensions } from "../game/GameCanvas";
import { hasPosition } from "./Interactables";
import { useUpdateInteractable } from "../hooks/editor/InteractableHelper";

export function getRoom(rooms, roomId) {
    return rooms.find(r => r.id === roomId);
}

export function hasFeature(state) {
    const currentRoom = getRoom(state.rooms, state.room);
    return currentRoom.features && currentRoom.features.length > 0;
}

export function loadRoomAssets(room, callback) {
    const assetPromises = [];

    for (const i of room.interactables) {
        for (const asset of i.assets) {
            assetPromises.push(addImage(asset, import.meta.env.VITE_DOMAIN, callback));
        }
    }

    if (room.features) {
        for (const f of room.features) {
            for (const asset of Object.values(f.assets)) {
                assetPromises.push(addImage(asset, import.meta.env.VITE_DOMAIN, callback));
            }
        }
    }

    return assetPromises;
}

export function getRoomAssetCount(room) {
    let count = 0;
    for (const i of room.interactables) {
        count += i.assets.length;
    }

    if (room.features) {
        for (const f of room.features) {
            count += Object.keys(f.assets).length;
        }
    }

    return count;
}

export function loadFeatures(room) {
    room.features[0].init();
}

export function screenToWorld(x, y) {
    const screen = new Vector2(x, y).times(window.devicePixelRatio);
    const relativeToCenter = screen.minus(new Vector2(canvasWidth / 2, canvasHeight / 2));
    const worldScale = relativeToCenter.times(1 / imgDimensions.height);

    return worldScale;
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
    if (!image) return false;
    const scaleFactor = imgDimensions.height / window.devicePixelRatio;
    const imgWidth = image.width / scaleFactor;
    const imgHeight = image.height / scaleFactor;
    return (
        Math.abs(point.x - origin.x) <= imgWidth / 2 &&
        Math.abs(point.y - origin.y) <= imgHeight / 2
    );
}

export function showOnScreen(interactable) {
    return hasPosition(interactable.objectType);
}

export function getCenter(points) {
    let minX;
    let minY;
    let maxX;
    let maxY;

    for (const p of points) {
        if (!minX || p.x < minX) minX = p.x;
        if (!minY || p.y < minY) minY = p.y;

        if (!maxX || p.x > maxX) maxX = p.x;
        if (!maxY || p.y > maxY) maxY = p.y;
    }

    return { 
        x: (maxX + minX) / 2,
        y: (maxY + minY) / 2
    }
}

export function cleanRoomData(rooms) {
    return rooms.map(r => {
        if (r.background) {
            delete r.background;
        }
        
        return {
            ...r,
            interactables: r.interactables.map(i => {
                if (i.transitionType) {
                    return {
                        ...cleanTransitionData(i, i.transitionType)
                    };
                }
                return i;
            })
        }
    });
}

export function cleanTransitionData(interactable, currentType) {
    if (currentType !== 'sprites' && interactable.transitionFrames) {
        delete interactable.transitionFrames;
    }

    if (currentType !== 'fade' && interactable.transitionFade) {
        delete interactable.transitionFade;
    }

    return { ...interactable };
}
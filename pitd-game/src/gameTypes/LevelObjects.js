import { getImage } from "../gameData/images"

export class LevelObject {
    name
    id

    constructor() {
        this.id = crypto.randomUUID()
    }
}

export class Room extends LevelObject {
    interactables = []
    background = new Animation()

    constructor() {
        super()
        this.name = 'New Room'
    }
}

export class Interactable extends LevelObject {
    points = [];
    objectType;
    definition;
    assets = [];
    auxAssets = [];

    constructor(definition) {
        super();
        this.name = 'New Game Object';
        this.definition = definition;
    }
}

export class Feature extends LevelObject {
    init() {
    }

    handleMouseMove(x, y, mouse) {
    }

    handleMouseDown(x, y) {
    }
}

const LOOP_MODES = [
    'once',
    'loop',
    'perma-once'
];

export class Animation {
    frames = [];
    triggers = [];
    frameRate = 10;
    loopMode;
    playDirection = 1;
    timesToPlay = 1;

    currentFrame = 0;
    frameTime = 0;

    listeners = {
        end: new Set()
    }

    on(event, callback) {
        this.listeners[event]?.add(callback);

        return () => {
            this.listeners[event]?.delete(callback);
        };
    }

    emit(event) {
        this.listeners[event]?.forEach(callback => callback());
    }

    update(dt) {
        const frameLength = 1000 / this.frameRate;
        this.frameTime += dt;
        if (this.frameTime > frameLength) {
            this.frameTime -= frameLength;

            this.currentFrame += 1 * this.playDirection;
            if (this.currentFrame === this.frames.length) {
                if (this.loopMode === 'loop') {
                    this.currentFrame = 0;
                } else if (this.loopMode === 'boom') {
                    this.playDirection *= -1;
                    this.currentFrame += 2 * this.playDirection;
                } else if (this.loopMode === 'x') {
                    this.timesToPlay--;
                    if (this.timesToPlay === 0) {
                        this.currentFrame = this.frames.length - 1;
                        this.emit('end');
                    } else {
                        this.currentFrame = 0;
                    }
                } else {
                    this.currentFrame = this.frames.length - 1;
                    this.emit('end');
                }
            }

            if (this.currentFrame < 0) {
                this.currentFrame = 1;
                this.playDirection = 1;
            }
        }
    }

    getCurrentImage() {
        return getImage(this.frames[this.currentFrame]);
    }
}
import { getImage } from "../gameData/assetManager"

export class LevelObject {
    name
    id

    constructor() {
        this.id = crypto.randomUUID()
    }
}

export class Room extends LevelObject {
    interactables = []

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

class Listenable {
    listeners = {}

    on(event, callback) {
        this.listeners[event]?.add(callback);

        return () => {
            this.listeners[event]?.delete(callback);
        };
    }

    emit(event) {
        this.listeners[event]?.forEach(callback => callback());
    }
}

export class Animation extends Listenable {
    listeners = {
        end: new Set()
    };

    frames = [];
    triggers = [];
    frameRate = 10;
    loopMode;
    playDirection = 1;
    timesToPlay = 1;

    currentFrame = 0;
    frameTime = 0;

    update(dt) {
        const frameLength = 1000 / this.frameRate;
        this.frameTime += dt;
        if (this.frameTime > frameLength) {
            this.frameTime -= frameLength;
            
            // If dt is very large, cap it to only play one frmae
            if (this.frameTime > frameLength) {
                this.frameTime = this.frameTime % frameLength;
            }

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

    getDefinition() {
        return {
            frames: this.frames,
            triggers: this.triggers,
            frameRate: this.frameRate,
            loopMode: this.loopMode,
            timesToPlay: this.timesToPlay
        };
    }
}

export class Fade extends Listenable {
    listeners = {
        end: new Set(),
        roomchange: new Set()
    };

    steps;
    fps;
    stall;
    color;

    done = false;

    frameTime = 0;
    currentStep = 0;
    currentStall = 0;
    stepDirection = 1;

    update(dt) {
        if (this.done) return;

        const frameLength = 1000 / this.fps;
        this.frameTime += dt;
        if (this.frameTime > frameLength) {
            this.frameTime -= frameLength;
            
            // If dt is very large, cap it to only play one frmae
            if (this.frameTime > frameLength) {
                this.frameTime = this.frameTime % frameLength;
            }

            if (this.currentStep < this.steps && this.stepDirection === 1) {
                this.currentStep++;
                if (this.currentStep == this.steps) {
                    this.emit('roomchange');
                }
            } else if (
                this.currentStep == this.steps && 
                this.currentStall < this.stall && 
                this.stepDirection === 1
            ) {
                this.currentStall++;
                if (this.currentStall == this.stall) {
                    this.stepDirection = -1;
                }
            } else if (this.currentStep > 0 && this.stepDirection === -1) {
                this.currentStep--;

                if (this.currentStep === 0) {
                    this.stepDirection = 1;
                    this.done = true;
                    this.emit('end');

                }
            }
        }
    }

    initialize() {
        this.currentStall = 0;
        this.currentStep = 0;
        this.stepDirection = 1;
    }

    getOpacity() {
        return this.currentStep / this.steps;
    }

    getDefinition() {
        return {
            steps: this.steps,
            fps: this.fps,
            stall: this.stall,
            color: this.color
        }
    }
}

export class Song extends LevelObject {
    audio;
    rooms = [];
    behavior;
    reduction;
    fadeTime = 0;

    constructor() {
        super();
        this.name = 'New Song';
    }

    getDefinition() {
        return {
            audio: this.audio,
            rooms: this.rooms,
            behavior: this.behavior,
            reduction: this.reduction,
            fadeTime: this.fadeTime
        }
    }
}
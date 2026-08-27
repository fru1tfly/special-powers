import { Feature } from './LevelObjects';
import { getImage } from "../gameData/images"
import { canvasHeight, canvasWidth } from "../stores/dimensions"

class Dirt {
    x;
    y;
    radius;
    r;
    g;
    b;

    constructor(x, y, radius, r, g, b) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

const SPECK_RADIUS = 0.005;
const COLOR_VARIANCE = 25;
const SCRUB_RADIUS = 0.03;
const DIRT_BASE_COLOR = [145, 89, 45];

const STITCH_SIZE = 0.05;

class Speck {
    x;
    y;
    ind;
    color;

    constructor(x, y, color, ind) {
        this.x = x;
        this.y = y;
        this.ind = ind;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - SPECK_RADIUS, this.y - SPECK_RADIUS, SPECK_RADIUS * 2, SPECK_RADIUS * 2);
    }
}

class Stitch {
    x;
    y;
    tied = true;

    tiedImg;
    untiedImg;

    constructor(x, y, tiedImg, untiedImg) {
        this.x = x;
        this.y = y;

        this.tiedImg = tiedImg;
        this.untiedImg = untiedImg;
    }

    draw(ctx) {
        const img = this.tied ? getImage(this.tiedImg) : getImage(this.untiedImg);
        ctx.drawImage(
            img,
            this.x - STITCH_SIZE / 2,
            this.y - STITCH_SIZE / 2,
            STITCH_SIZE,
            STITCH_SIZE
        );
    }
}

export class Surgery extends Feature {
    cursorState = 'rag';
    surgeryStep = 'clean';

    assets = {
        base: `/sprites/surgery.png`,
        dirtMap: `/sprites/surgerydirtmap.png`,
        stitchMap: `/sprites/surgerystitchmap.png`,
        stitchTied: `/sprites/stitch-tied.png`,
        stitchUntied: `/sprites/stitch-untied.png`
    };

    dirt = [
        new Dirt(0, 0, 0.153, 145, 89, 45)
    ];

    specks = [];
    stitches = [];


    constructor() {
        super();
    }

    init() {
        this.buildDirt();
        this.buildStitches();
    }

    handleMouseMove(x, y, mouse) {
        if (this.surgeryStep === 'clean' && mouse === 'pressed') {
            this.eraseSpecks(x, y);
        }
    }

    handleMouseDown(x, y) {
        if (this.surgeryStep === 'clean') {
            this.eraseSpecks(x, y);
        } else if (this.surgeryStep === 'unstitch') {
            for (const s of this.stitches) {
                if (dist(s.x, x, s.y, y) < STITCH_SIZE / 2 && s.tied) {
                    s.tied = false;
                }
            }
        }
    }

    eraseSpecks(x, y) {
        let specksToRemove = [];
        for (const s of this.specks) {
            if (dist(s.x, x, s.y, y) < SCRUB_RADIUS) {
                specksToRemove.push(s.ind);
            }
        }

        this.specks = this.specks.filter(s => !specksToRemove.includes(s.ind));
    }

    buildDirt() {
        const dirtMapImage = getImage(this.assets.dirtMap);
        const dirtMapCanvas = document.createElement('canvas');
        const aspectRatio = dirtMapImage.width / dirtMapImage.height;

        const dctx = dirtMapCanvas.getContext('2d', { willReadFrequently: true });

        dirtMapCanvas.width = aspectRatio * dirtMapImage.height;
        dirtMapCanvas.height = dirtMapImage.height;

        dctx.drawImage(
            dirtMapImage, 
            0, 
            0, 
            dirtMapImage.width, 
            dirtMapImage.height
        );

        let speckCounter = 0;

        for (let i = 0; i < dirtMapCanvas.width; i++) {
            for (let j = 0; j < dirtMapCanvas.height; j++) {
                const p = dctx.getImageData(i, j, 1, 1).data;
                const pixelAlpha = p[3];

                if (pixelAlpha > 0) {
                    const newColor = `rgb(${
                        DIRT_BASE_COLOR[0] + Math.random() * COLOR_VARIANCE - COLOR_VARIANCE / 2
                    }, ${
                        DIRT_BASE_COLOR[1] + Math.random() * COLOR_VARIANCE - COLOR_VARIANCE / 2
                    }, ${
                        DIRT_BASE_COLOR[2] + Math.random() * COLOR_VARIANCE - COLOR_VARIANCE / 2
                    })`;

                    this.specks.push(new Speck(
                        (-0.4 * aspectRatio + (i / dirtMapCanvas.height) * 0.8), 
                        -0.3 + ((j / dirtMapCanvas.height) * 0.8), 
                        newColor, 
                        speckCounter
                    ));
                    speckCounter++;
                }
            }
        }

    }

    buildStitches() {
        const stitchMapImage = getImage(this.assets.stitchMap);
        const stitchMapCanvas = document.createElement('canvas');
        const aspectRatio = stitchMapImage.width / stitchMapImage.height;

        const sctx = stitchMapCanvas.getContext('2d', { willReadFrequently: true });

        stitchMapCanvas.width = stitchMapImage.width;
        stitchMapCanvas.height = stitchMapImage.height;

        sctx.drawImage(
            stitchMapImage, 
            0, 
            0, 
            stitchMapImage.width, 
            stitchMapImage.height
        );

        for (let i = 0; i < stitchMapImage.width; i++) {
            for (let j = 0; j < stitchMapImage.height; j++) {
                const p = sctx.getImageData(i, j, 1, 1).data;
                const pixelAlpha = p[3];

                if (pixelAlpha > 0) {
                    this.stitches.push(new Stitch(
                        (-0.4 * aspectRatio + (i / stitchMapCanvas.height) * 0.8), 
                        -0.3 + ((j / stitchMapCanvas.height) * 0.8),
                        this.assets.stitchTied,
                        this.assets.stitchUntied
                    ));
                    console.log(this.stitches);
                }
            }
        }
    }

    update(dt) {
        if (this.surgeryStep === 'clean' && this.specks.length === 0) {
            this.surgeryStep = 'unstitch';
            this.cursorState = 'scissors';
        }

        if (this.surgeryStep === 'unstitch') {
            const stillStitched = this.stitches.filter(s => s.tied);
            if (stillStitched.length === 0) {
                this.surgeryStep = 'open';
                this.cursorState = 'hands';
            }
        }
    }

    draw(ctx) {
        const baseImage = getImage(this.assets.base);
        const baseImageAspectRatio = baseImage.width / baseImage.height;

        ctx.drawImage(
            baseImage,
            -0.4 * baseImageAspectRatio,
            -0.3,
            0.8 * baseImageAspectRatio,
            0.8
        );

        for (const stitch of this.stitches) {
            stitch.draw(ctx);
        }

        for (const speck of this.specks) {
            speck.draw(ctx);
        }

        ctx.font = '0.03px serif';
        ctx.fillStyle = 'white';

        let instructionText = '';

        if (this.surgeryStep === 'clean') {
            instructionText = 'CLEAN THE LAMB';
        }
       
        if (this.surgeryStep === 'unstitch') {
            instructionText = 'UNSTITCH THE WOUND';
        }

        if (this.surgeryStep === 'open') {
            instructionText = 'OPEN THE LAMB';
        }

        const textSize = ctx.measureText(instructionText);
        ctx.fillText(instructionText, -textSize.width / 2, -0.4)
    }
}

function dist(x1, x2, y1, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
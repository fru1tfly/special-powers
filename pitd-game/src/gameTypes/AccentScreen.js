import { getImage } from "../gameData/assetManager";
import { canvasHeight } from "../stores/dimensions";
import { ctx } from "../game/GameCanvas";

const ANIM_TIME = 0.5;

export class AccentScreen {
    yOffset = 1;
    enterTimer = 0;
    exitTimer = 0;
    accentImg;

    leaving = false;
    shouldRemove = false;

    imgDimensions = {};

    constructor(url) {
        this.accentImg = getImage(url);

        const imageAspectRatio = this.accentImg.width / this.accentImg.height;
        this.imgDimensions.y = canvasHeight * 0.75;
        this.imgDimensions.x = imageAspectRatio * this.imgDimensions.y;

    }

    draw() {
        ctx.save();

        ctx.translate(0, -(1 - (this.yOffset)) * canvasHeight);

        ctx.drawImage(
            this.accentImg,
            -this.imgDimensions.x / 2,
            -this.imgDimensions.y / 2,
            this.imgDimensions.x,
            this.imgDimensions.y
        );

        ctx.restore();
    }

    update(dt) {
        if (this.enterTimer > 0) {
            this.enterTimer -= dt / 1000;

            const progress = 1 - this.enterTimer / ANIM_TIME;
            this.yOffset = 1 - Math.pow(1 - progress, 3);
        }

        if (this.exitTimer > 0) {
            this.exitTimer -= dt / 1000;

            const progress = 1 - this.exitTimer / ANIM_TIME;
            this.yOffset = 1 - Math.pow(progress, 3);

            if (this.exitTimer <= 0) {
                this.shouldRemove = true;
            }
        }
    }

    start() {
        this.yOffset = 0;
        this.enterTimer = ANIM_TIME;
    }

    leave() {
        if (!this.leaving) {
            this.exitTimer = ANIM_TIME;
            this.leaving = true;
        }
    }
}
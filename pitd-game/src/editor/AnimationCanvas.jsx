import { useEffect, useRef } from "react";

let canvas;
let ctx;

let animation;
let isPlaying;

let prevTime = 0;
const renderLoop = (time) => {
    const dt = time - prevTime;
    prevTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    if (animation && isPlaying) {
        animation.update(dt);
    }

    const img = animation.frames.length > 0 ? animation.getCurrentImage() : null;
    if (img && img.complete && img.naturalWidth > 0) {
        let imgWidth = img.width;
        let imgHeight = img.height;

        const aspectRatio = img.width / img.height;
        if (img.width > canvas.width) {
            imgWidth = canvas.width;
            imgHeight = canvas.width / aspectRatio;
        }

        ctx.drawImage(
            img,
            -imgWidth / 2,
            -imgHeight / 2,
            imgWidth,
            imgHeight
        );
    }
    ctx.restore();

    requestAnimationFrame(renderLoop);
}

export default function AnimationCanvas({ anim, playing }) {
    const animCanvas = useRef(null);
    const canvasContainer = useRef(null);

    useEffect(() => {
        canvas = animCanvas.current;
        const container = canvasContainer.current;
        ctx = canvas.getContext('2d');

        let gameLoop = requestAnimationFrame(renderLoop);

        const resizeWindow = () => {
            const { width, height } = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio;

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);

            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        }

        const observer = new ResizeObserver(resizeWindow);
        observer.observe(container);

        resizeWindow();


        return () => {
            cancelAnimationFrame(gameLoop);
            observer.disconnect();
        }

    }, []);

    useEffect(() => {
        animation = anim;
        isPlaying = playing;
    }, [anim, playing]);

    return (
        <div ref={canvasContainer} className="canvas-container">
            <canvas ref={animCanvas} className="anim-canvas"></canvas>
        </div>
    )
}
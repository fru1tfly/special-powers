import { useEffect, useRef } from "react";

let fadeObject;
let fadeDiv;
let isPlaying;

let prevTime = 0;
const fadeRenderLoop = (time) => {
    const dt = time - prevTime;
    prevTime = time;

    if (isPlaying) {
        fadeObject.update(dt);
        if (fadeDiv) {
            fadeDiv.style.opacity = fadeObject.getOpacity();
            fadeDiv.style.backgroundColor = fadeObject.color;
        }
    }

    requestAnimationFrame(fadeRenderLoop);
}

export default function FadeBlock({ fade, playing }) {
    const fadeElement = useRef(null);

    useEffect(() => {
        let fadeLoop = requestAnimationFrame(fadeRenderLoop);

        return () => {
            cancelAnimationFrame(fadeLoop);
        }
    }, []);

    useEffect(() => {
        fadeObject = fade;
        fadeDiv = fadeElement.current;
        isPlaying = playing;
    }, [fade, playing, fadeElement]);

    return (
        <>
            {playing && 
                <div 
                    ref={fadeElement}
                    className="fadePreview"
                ></div>
            }
        </>
    )
}
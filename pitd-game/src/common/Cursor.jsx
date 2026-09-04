import { useRef } from "react";
import { cursorImages } from "../gameData/cursors"

export function Cursor({ state, angle, x, y }) {
    const cursorImg = cursorImages[state];
    const cursorRef = useRef(null);
    return (
        <div className="cursor" ref={cursorRef} style={{
            transform: `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`
        }}>
            <img src={`${import.meta.env.BASE_URL}${cursorImg}`} />
        </div>
    )
}
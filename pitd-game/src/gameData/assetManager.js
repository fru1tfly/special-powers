import { GameAudio } from "../gameTypes/Audio";

const IMAGES = {};
const AUDIO = {};

export const addImage = (url, prefix = import.meta.env.VITE_DOMAIN, callback = () => {}) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
	    img.src = `${prefix}${url}`;
        img.setAttribute('crossOrigin', '');
        img.onload = () => {
            callback();
            resolve(img);
        };
        img.onerror = (e) => {
            console.error(e);
            reject(img);
        }

        IMAGES[url] = {};

        IMAGES[url].image = img;
    });
}

export const getImage = (url) => {
    if (!IMAGES[url]) {
        return null;
    }
    return IMAGES[url].image;
}

export const addAudio = (def, prefix = import.meta.env.VITE_DOMAIN, callback = () => {}) => {
    return new Promise((resolve, reject) => {
        const aud = new Audio();
        aud.src = `${prefix}${def.url}`;
        aud.setAttribute('crossOrigin', '');
        aud.oncanplaythrough = () => {
            callback();
            resolve(aud);
        }
        aud.onerror = (e) => {
            console.error(e);
            reject(aud);
        }

        AUDIO[def.url] = {
            audio: aud,
            url: def.url
        }
    });
}
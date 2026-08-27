const IMAGES = {};

export const addImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
	    img.src = `${import.meta.env.VITE_DOMAIN}${url}`;
        img.setAttribute('crossOrigin', '');
        img.onload = () => {
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

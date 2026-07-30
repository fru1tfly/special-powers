const IMAGES = {};

export const addImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
	    console.log(url);
 	console.log('trying to load image');
	    img.src = `${import.meta.env.VITE_DOMAIN}${url}`;
        img.onload = () => {
            resolve(img);
        };
        img.onerror = reject;

	    console.log('after error');

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

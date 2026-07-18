import multer from 'multer';
import path from "path";
import fs from 'fs';

const storage = multer.diskStorage({

    destination: (req, file, callback) => {
        const fileDestination = decodeURIComponent(req.params.fileDestination);

        // Make sure folder exists
        const uploadPath = path.join(process.env.PUBLIC_FOLDER, fileDestination);
        fs.mkdirSync(uploadPath, { recursive: true });

        callback(null, uploadPath);
    },
    filename: (req, file, callback) => {
        // replace filename with current date to prevent duplicates
        callback(null, Date.now() + path.extname(file.originalname));
    },

});

export const upload = multer({ storage });
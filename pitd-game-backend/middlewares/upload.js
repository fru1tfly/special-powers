import multer from 'multer';
import path from "path";
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({

    destination: (req, file, callback) => {
        const fileDestination = decodeURIComponent(req.body.destination);

        // Make sure folder exists
        const uploadPath = path.join(process.env.PUBLIC_FOLDER, fileDestination);
        fs.mkdirSync(uploadPath, { recursive: true });

        callback(null, uploadPath);
    },
    filename: (req, file, callback) => {
        // replace filename with current date to prevent duplicates
        callback(null, uuidv4() + path.extname(file.originalname));
    },

});

export const upload = multer({ storage });

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
        if (req.body.keepName === 'true') {

            const originalName = path.basename(file.originalname);
            const ext = path.extname(originalName);
            const base = path.basename(originalName, ext);
            const uploadPath = path.join(
                process.env.PUBLIC_FOLDER,
                decodeURIComponent(req.body.destination)
            );

            let fileName = originalName;
            let suffix = 1;
            while (fs.existsSync(path.join(uploadPath, fileName))) {
                fileName = `${base}-${suffix}${ext}`;
                suffix++;
            }

            callback(null, fileName);
            return;
        }

        // replace filename with a UUID to prevent duplicates
        callback(null, uuidv4() + path.extname(file.originalname));
    },

});

export const upload = multer({ storage });

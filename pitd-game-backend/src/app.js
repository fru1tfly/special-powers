import express from 'express';
import { Router } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import http from 'http';
import cors from 'cors';
import fs from 'fs/promises';
import { upload } from '../middlewares/upload.js';
import dotenv from 'dotenv';

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

const app = express();
const server = http.createServer(app);
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '1gb' }));

const fileRouter = Router();
fileRouter.post(
    '/upload',
    upload.single('file'),
    (req, res) => {
        const destination = decodeURIComponent(req.body.destination);
        const newFileUrl = path.join(destination, req.file?.filename);
        res.status(200).json({ file: newFileUrl });
    }
);

const gameDataString = await fs.readFile(process.env.GAME_DATA_FILE, 'utf8');
let gameData = JSON.parse(gameDataString);

fileRouter.get(
    '/assets',
    async (req, res) => {
        const entries = await fs.readdir(process.env.PUBLIC_FOLDER, { 
            recursive: true,
            withFileTypes: true
        });

        const entriesWithStats = await Promise.all(
            entries.map(async (dirent) => {
                const fullPath = path.join(dirent.parentPath, dirent.name);
                const stats = await fs.stat(fullPath);
                
                return { 
                    dirent, 
                    birthtime: stats.birthtimeMs 
                };
            })
        );

        res.status(200).json(entriesWithStats
            .sort((a, b) => b.birthtime - a.birthtime)
            .map(item => item.dirent));
    }
)

fileRouter.post(
    '/delete',
    async (req, res) => {
        const urls = Array.isArray(req.body.urls) ? req.body.urls : [];
        const publicRoot = path.resolve(process.env.PUBLIC_FOLDER);

        const results = await Promise.all(
            urls.map(async (url) => {
                const fullPath = path.resolve(publicRoot, `.${decodeURIComponent(url)}`);

                if (!fullPath.startsWith(publicRoot + path.sep)) {
                    return { url, deleted: false, error: 'Invalid path' };
                }

                try {
                    await fs.unlink(fullPath);
                    return { url, deleted: true };
                } catch (err) {
                    return { url, deleted: false, error: err.code || err.message };
                }
            })
        );

        res.status(200).json({ results });
    }
);

fileRouter.post(
    '/update/game',
    async (req, res) => {
        let newGameData = { ...req.body };
        if (gameData['version']) {
            newGameData.version = gameData['version'] + 1;
        } else {
            newGameData.version = 1;
        }

        await fs.writeFile(
            process.env.GAME_DATA_FILE,
            JSON.stringify(newGameData)
        );
        gameData = { ...newGameData };
        res.sendStatus(200);
    }
)

fileRouter.get(
    '/game',
    (req, res) => {
        res.json(gameData);
    }
)

app.use(`/api/file`, fileRouter);
app.use(express.static(process.env.PUBLIC_FOLDER));
app.use(express.static(path.join(__dirname, process.env.BUILD_PATH)));


app.get(/(.*)/, (req, res) => {
	res.sendFile(path.join(__dirname, `${process.env.BUILD_PATH}/index.html`));
});

server.listen(6002);

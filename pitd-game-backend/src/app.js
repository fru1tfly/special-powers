import express from 'express';
import { Router } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import http from 'http';
import cors from 'cors';
import fs from 'fs';
import { upload } from '../middlewares/upload.js';
import dotenv from 'dotenv';

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

let gameData;

const app = express();
const server = http.createServer(app);
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

fs.readFile(
    process.env.GAME_DATA_FILE, 
    (err, data) => {
        if (err) throw err;
        gameData = JSON.parse(data);
    }
);

fileRouter.post(
    '/update/game',
    (req, res) => {
        let newGameData = { ...req.body };
        if (gameData['version']) {
            newGameData.version = gameData['version'] + 1;
        } else {
            newGameData.version = 1;
        }

        fs.writeFile(
            process.env.GAME_DATA_FILE, 
            JSON.stringify(newGameData), 
            (err) => {
                if (err) throw err;
                gameData = { ...newGameData };
                res.send(200);
            }
        )
    }
)

fileRouter.get(
    '/game',
    (req, res) => {
        res.send(gameData);
    }
)

app.use(`/api/file`, fileRouter);
app.use(express.static(process.env.PUBLIC_FOLDER));
app.use(express.static(path.join(__dirname, process.env.BUILD_PATH)));


app.get(/(.*)/, (req, res) => {
	res.sendFile(path.join(__dirname, `${process.env.BUILD_PATH}/index.html`));
});

server.listen(6002);

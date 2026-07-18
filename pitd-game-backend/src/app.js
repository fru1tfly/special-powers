import express from 'express';
import { Router } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import http from 'http';
import cors from 'cors';
import fs from 'fs';
import { upload } from '../middlewares/upload.js';
import dotenv from 'dotenv';

dotenv.config();
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

const app = express();
const server = http.createServer(app);
app.use(cors());

const fileRouter = Router();
fileRouter.post(
    '/upload/:fileDestination',
    upload.single('file'),
    (req, res) => {
        const destination = decodeURIComponent(req.params.fileDestination);
        const newFileUrl = path.join(destination, req.file?.filename);

        res.status(200).json({ file: newFileUrl });
    }
);

app.use('/api/file', fileRouter);
app.use(express.static(process.env.PUBLIC_FOLDER));

server.listen(5000);
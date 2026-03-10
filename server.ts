import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import mammoth from 'mammoth';
import { GoogleGenAI } from '@google/genai';

// Setup DB
const db = new Database('files.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    filename TEXT,
    mimetype TEXT,
    filepath TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage: storage })

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO files (id, filename, mimetype, filepath) VALUES (?, ?, ?, ?)');
    stmt.run(id, req.file.originalname, req.file.mimetype, req.file.filename);

    const origin = req.body.origin || process.env.APP_URL || 'http://localhost:3000';
    const viewerUrl = `${origin}/viewer/${id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(viewerUrl, {
      color: {
        dark: '#009A44', // Agroliva Dark Green
        light: '#FFFFFF'
      },
      margin: 2,
      width: 300
    });

    res.json({ id, viewerUrl, qrCodeDataUrl });
  });

  app.get('/api/files/:id', (req, res) => {
    const stmt = db.prepare('SELECT id, filename, mimetype, createdAt FROM files WHERE id = ?');
    const file = stmt.get(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(file);
  });

  app.get('/api/files/:id/content', async (req, res) => {
    const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
    const file = stmt.get(req.params.id) as any;
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadDir, file.filepath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File content not found' });
    }

    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.mimetype === 'application/msword') {
       try {
         const result = await mammoth.extractRawText({ path: filePath });
         const text = result.value;
         
         if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
         }

         const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
         const response = await ai.models.generateContent({
           model: 'gemini-3.1-flash-preview',
           contents: `Convert the following text from a Word document into a beautifully formatted, responsive HTML snippet. Do not include <html>, <head>, or <body> tags. Use Tailwind CSS classes for styling. Make it look like a premium document. Text:\n\n${text}`
         });
         
         let html = response.text || '';
         html = html.replace(/^```html\n/, '').replace(/\n```$/, '');
         
         res.setHeader('Content-Type', 'text/html');
         return res.send(html);
       } catch (error) {
         console.error('Error converting Word document:', error);
         return res.status(500).json({ error: 'Failed to convert document' });
       }
    }

    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', 'inline; filename="' + file.filename + '"');
    res.sendFile(filePath);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.use('/uploads', express.static(uploadDir));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

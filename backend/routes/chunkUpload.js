const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { protect } = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'chunks');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Receive a chunk
router.post('/upload-chunk', protect, async (req, res) => {
  try {
    const chunkNumber = parseInt(req.headers['x-chunk-number']);
    const totalChunks = parseInt(req.headers['x-total-chunks']);
    const fileId = req.headers['x-file-id'];
    const fileName = req.headers['x-file-name'];
    if (!fileId || !fileName) return res.status(400).json({ error: 'Missing fileId or fileName' });

    const chunkPath = path.join(UPLOAD_DIR, `${fileId}.${chunkNumber}`);
    const writeStream = fs.createWriteStream(chunkPath);
    req.pipe(writeStream);
    writeStream.on('close', () => {
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assemble chunks and upload to Cloudinary
const cloudinary = require('../config/cloudinary');
router.post('/assemble-chunks', protect, async (req, res) => {
  try {
    const { fileId, fileName, totalChunks } = req.body;
    if (!fileId || !fileName || !totalChunks) return res.status(400).json({ error: 'Missing data' });
    const finalPath = path.join(__dirname, '..', 'uploads', fileName);
    const writeStream = fs.createWriteStream(finalPath);
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(UPLOAD_DIR, `${fileId}.${i}`);
      if (!fs.existsSync(chunkPath)) return res.status(400).json({ error: `Missing chunk ${i}` });
      const data = fs.readFileSync(chunkPath);
      writeStream.write(data);
      fs.unlinkSync(chunkPath);
    }
    writeStream.end();
    writeStream.on('close', async () => {
      try {
        // Upload to Cloudinary as video
        const cloudRes = await cloudinary.uploader.upload(finalPath, {
          resource_type: 'video',
          folder: 'mern-chat-app',
          public_id: fileName.split('.')[0],
        });
        // Remove local file after upload
        fs.unlinkSync(finalPath);
        res.json({ success: true, fileUrl: cloudRes.secure_url });
      } catch (cloudErr) {
        res.status(500).json({ error: 'Cloudinary upload failed', details: cloudErr.message });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

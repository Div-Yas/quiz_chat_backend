// scripts/seedDefaultPDFs.js
require('dotenv').config();
const mongoose = require('mongoose');
const Pdf = require('../models/Pdf');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const UPLOAD_DIR = path.resolve(__dirname, '../uploads/default');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const DEFAULT_PDFS = [
  {
    filename: 'ncert_physics_class11_part1.pdf',
    originalName: 'NCERT Physics Class XI - Part 1',
    pages: 248,
    isDefault: true,
    downloadUrl: 'https://ncert.nic.in/textbook/pdf/keph101.pdf'
  },
  {
    filename: 'ncert_physics_class11_part2.pdf',
    originalName: 'NCERT Physics Class XI - Part 2',
    pages: 234,
    isDefault: true,
    downloadUrl: 'https://ncert.nic.in/textbook/pdf/keph102.pdf'
  },
  {
    filename: 'ncert_physics_exemplar_class11.pdf',
    originalName: 'NCERT Physics Exemplar Problems Class XI',
    pages: 180,
    isDefault: true,
    downloadUrl: 'https://ncert.nic.in/pdf/publication/exemplarproblem/classXI/physics/keep304.pdf'
  }
];

// 🔁 Robust PDF downloader with retry
function downloadPDF(url, filePath, retries = 3) {
  return new Promise((resolve, reject) => {
    const tryDownload = (attempt) => {
      console.log(`  → Download attempt ${attempt}/${retries}: ${url}`);

      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 30000
      }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        const contentType = res.headers['content-type'] || '';
        if (!contentType.includes('application/pdf')) {
          return reject(new Error(`Invalid content type: ${contentType}`));
        }

        const writer = fs.createWriteStream(filePath);
        res.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      req.on('error', (err) => {
        if (attempt < retries) {
          setTimeout(() => tryDownload(attempt + 1), 2000 * attempt);
        } else {
          reject(err);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (attempt < retries) {
          setTimeout(() => tryDownload(attempt + 1), 2000 * attempt);
        } else {
          reject(new Error('Request timeout'));
        }
      });
    };

    tryDownload(1);
  });
}

async function seedPDFs() {
  try {
    const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/beyondchart';
    await mongoose.connect(MONGO);
    console.log('✅ Connected to MongoDB');

    for (const pdf of DEFAULT_PDFS) {
      const exists = await Pdf.findOne({ filename: pdf.filename });
      if (exists) {
        console.log(`⏭️  Already seeded: ${pdf.originalName}`);
        continue;
      }

      console.log(`\n📥 Seeding: ${pdf.originalName}`);
      
      // 1. Download PDF
      const localPath = path.join(UPLOAD_DIR, pdf.filename);
      const posixPath = localPath.replace(/\\/g, '/');
      await downloadPDF(pdf.downloadUrl, localPath);
      console.log(`💾 Saved to: ${localPath}`);

      // 2. Save to DB
      const created = await Pdf.create({ ...pdf, path: "/uploads/default/" + pdf.filename });
      
      // 3. Trigger embedding
      const embedderUrl = process.env.EMBEDDER_URL || 'http://localhost:5000';
      const axios = require('axios');
     try {
  await axios.post(
    `${embedderUrl}/chunk_and_embed`,
    { 
      file_path: posixPath,   // ✅ Forward slashes for Python
      doc_id: created._id.toString() 
    },
    { timeout: 20000 }
    );
    console.log(`🧠 Embedded: ${pdf.originalName}`);
  } catch (err) {
    console.warn(`⚠️ Embedding failed for ${pdf.originalName}:`, err.message);
  }
    }

    console.log('\n🎉 All default PDFs seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  }
}

seedPDFs();
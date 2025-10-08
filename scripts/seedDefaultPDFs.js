require('dotenv').config();
const mongoose = require('mongoose');
const Pdf = require('../models/Pdf');
const axios = require('axios');

const DEFAULT_PDFS = [
  {
    filename: 'ncert_physics_class11_part1.pdf',
    originalName: 'NCERT Physics Class XI - Part 1',
    path: '/default-pdfs/ncert_physics_class11_part1.pdf',
    pages: 248,
    isDefault: true,
    downloadUrl: 'https://ncert.nic.in/textbook/pdf/keph101.pdf'
  },
  {
    filename: 'ncert_physics_class11_part2.pdf',
    originalName: 'NCERT Physics Class XI - Part 2',
    path: '/default-pdfs/ncert_physics_class11_part2.pdf',
    pages: 234,
    isDefault: true,
    downloadUrl: 'https://ncert.nic.in/textbook/pdf/keph102.pdf'
  },
  {
    filename: 'ncert_physics_exemplar_class11.pdf',
    originalName: 'NCERT Physics Exemplar Class XI',
    path: '/default-pdfs/ncert_physics_exemplar_class11.pdf',
    pages: 180,
    isDefault: true,
    downloadUrl: 'https://ncert.nic.in/pdf/publication/exemplarproblem/classXI/physics/keeph1.pdf'
  }
];

async function seedPDFs() {
  try {
    const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/beyondchart';
    await mongoose.connect(MONGO);
    console.log('MongoDB connected');

    // Check if default PDFs already exist
    const existingCount = await Pdf.countDocuments({ isDefault: true });
    if (existingCount >= 3) {
      console.log('Default PDFs already seeded');
      process.exit(0);
    }

    // Insert default PDFs
    for (const pdf of DEFAULT_PDFS) {
      const exists = await Pdf.findOne({ filename: pdf.filename });
      if (!exists) {
        const created = await Pdf.create(pdf);
        console.log(`Seeded: ${pdf.originalName}`);

        // Trigger embedding if embedder is available
        try {
          const embedderUrl = process.env.EMBEDDER_URL || 'http://localhost:5000';
          await axios.post(
            `${embedderUrl}/chunk_and_embed`,
            {
              file_path: pdf.path,
              doc_id: created._id.toString(),
              is_default: true
            },
            { timeout: 5000 }
          );
          console.log(`Triggered embedding for: ${pdf.originalName}`);
        } catch (err) {
          console.warn(`Embedding trigger failed for ${pdf.originalName}:`, err.message);
        }
      }
    }

    console.log('✅ Default PDFs seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedPDFs();

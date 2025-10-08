const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pdfSchema = new Schema({
  filename: String,
  originalName: String,
  path: String,
  uploader: { type: Schema.Types.ObjectId, ref: 'User' },
  pages: Number,
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pdf', pdfSchema);
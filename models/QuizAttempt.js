const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const s = new Schema({
  user:{type: Schema.Types.ObjectId, ref:'User'},
  pdf:{type: Schema.Types.ObjectId, ref:'Pdf'},
  answers:Object,
  score:Number,
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizAttempt', s);

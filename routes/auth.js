const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req,res) => {
  console.log("register request", req.body);
  
  const { name, email, password } = req.body;
  if(!name || !email || !password) return res.status(400).json({ message:'missing fields' });
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message:'email exists' });
    const hash = await bcrypt.hash(password, 10);
    const u = await User.create({ name, email, password: hash });
    const token = jwt.sign({ id: u._id }, process.env.JWT_SECRET || 'secret');
    return res.json({ user: { id: u._id, name: u.name, email: u.email }, token });
  } catch(e) {
    console.error(e); return res.status(500).json({ message:'server error' });
  }
});

router.post('/login', async (req,res) => {
  const { email, password } = req.body;
  try {
    const u = await User.findOne({ email });
    if(!u) return res.status(400).json({ message:'invalid credentials' });
    const ok = await bcrypt.compare(password, u.password);
    if(!ok) return res.status(400).json({ message:'invalid credentials' });
    const token = jwt.sign({ id: u._id }, process.env.JWT_SECRET || 'secret');
    return res.json({ user: { id: u._id, name: u.name, email: u.email }, token });
  } catch(e) { console.error(e); return res.status(500).json({ message:'server error' }); }
});

module.exports = router;

const path = require('path');
const express = require('express');
const app = express();

// React build papkasiga yo'l
app.use(express.static(path.join(__dirname, 'build')));

// Heroku portiga o'zgarish
const PORT = process.env.PORT || 5000;

// Bosh sahifaga yo'naltirish
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Serverni ishga tushirish
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const authRoutes = require('./routes/auth');
const multer = require('multer');
const upload = multer();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// test DB connection
app.get('/', async (req, res) => {
  try {
    res.send(`Hello from Dockerized Express! DB Time`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// Routes are defining here.
app.use('/auth', upload.none(), authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const session = require('express-session');
const config = require('config');
require('dotenv').config();

const app = express();

const corsOptions = {
  origin: 'http://localhost:4200',  
  credentials: true,  
};

app.use(cors(corsOptions)); 

app.use(bodyParser.json());

app.use(session({
  secret: 'yourSuperSecureRandomKeyHere',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

connectDB();

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

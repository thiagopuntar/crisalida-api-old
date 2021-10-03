require('dotenv').config();
const mongoose = require('mongoose');
const { MONGODB_CONN_STRING } = process.env;

mongoose.connect(MONGODB_CONN_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {
  if (err) return console.error(err);
  console.log("MongoDB connected...");
});


require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database and start listening
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` Factory Shift Management Server Running `);
    console.log(` Port: ${PORT}                            `);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'} `);
    console.log(`=========================================`);
  });
});

module.exports = app;

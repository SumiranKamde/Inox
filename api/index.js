const app = require('../backend/src/app');
const connectDB = require('../backend/src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error('Vercel Serverless Function Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection error: ' + err.message
    });
  }
};

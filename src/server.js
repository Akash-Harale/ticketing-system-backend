import dotenv from 'dotenv';
dotenv.config();


import app from './app.js';
import { connectDB } from './config/db.js';



const multer = require('multer');
const morgan = require('morgan');

const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');


// Static Image Routes
// Define static path in .env file  22/Oct/2025
//const mediaCornerPath = process.env.MEDIA_CORNER_PATH || path.join(process.cwd(), 'uploads', 'media_corner');
const mediaCornerPath      = path.resolve(process.env.MEDIA_CORNER_PATH);

console.log('Media_Corner > Static Path from .env param: ', mediaCornerPath);

// Routes
const toolsMediaCornerRoutes = require('./routes/toolsMediaCornerRoutes');

const PORT = process.env.PORT || 5000;

const app = express();


// Core Middleware
app.use(express.json()); // For JSON payloads
app.use(express.urlencoded({ extended: true })); // For form submissions

app.use(requestId); // Inject requestId early

// Log Incoming Requests (optional)
app.use((req, res, next) => {
  logger.info(`[${req.requestId}] Incoming ${req.method} ${req.originalUrl}`);
  next();
});

app.use(mediaCornerPath, (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Static hit: ${req.originalUrl} from ${req.ip}`);
  next();
});

// Serve static files from /uploads/media_corner
app.use('/media', express.static(mediaCornerPath));


//  Mount API Routes
app.use('/api/mediacorner', toolsMediaCornerRoutes);

// Health Check
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Server is alive' });
});

// 404 Handler (optional)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Alert! Route not found' });
});


// Multer & File Upload Error Handling with requestId
app.use((err, req, res, next) => {
  const requestId = req.requestId || 'N/A';

  if (err instanceof multer.MulterError) {
    // Multer-specific errors (e.g., file too large)
    logger.warn(`[${requestId}] Multer error: ${err.message}`);
    return res.status(400).json({
      error: 'Multer error',
      details: err.message,
      requestId
    });
  }

  if (err.message === 'Only image files (JPEG/JPG/PNG/GIF) are allowed!') {
    // Custom file type error from your fileFilter
    logger.warn(`[${requestId}] Invalid file type: ${err.message}`);
    return res.status(400).json({
      error: 'Invalid file type',
      details: err.message,
      requestId
    });
  }

  if (err) {
    // Generic errors during upload
    logger.error(`[${requestId}] Upload error: ${err.message}`);
    return res.status(500).json({
      error: 'Server error',
      details: err.message,
      requestId
    });
  }

  next(); // Pass to next middleware if no error
});

//  Global Error Handler
app.use(errorHandler); // Handles all uncaught errors centrally


// Connect DB and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch(err => {
    logger.error('Server startup aborted due to DB error');
    process.exit(1); // fail fast
  });

  
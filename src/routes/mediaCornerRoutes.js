// toolsMediaCornerRoutes.js

/*
import express from 'express';
import path from 'path';

// Import your multer config as an ES module
import { createUploader } from '../config/multerv2.js';
import { 
  createMediaCorner, 
  deleteMediaCornerImage, getMediaCorner, getMediaCornerById, getMediaCornerImage, 
  updateMediaCorner } from '../controllers/toolsMediaCornerController.js';

// Import controller functions

const router = express.Router();

// Multer configuration for dynamic folder 'media_corner'
const uploadMedia = createUploader('media_corner');

// Route: Create Media Corner
router.post(
  '/',
  uploadMedia.single('media_file'),
  async (req, res) => {
    try {
      req.body.media_file = req.file ? path.join('', req.file.filename) : null;
      await createMediaCorner(req, res);
    } catch (error) {
      res.status(400).json({
        error: 'Media Corner file upload failed',
        details: error.message
      });
    }
  }
);

// Other routes...
router.get('/', getMediaCorner);
router.get('/:id', getMediaCornerById);


//router.delete('/:id', deleteMediaCornerImage);
router.delete('/:id', (req, res) => {
  console.log('DELETE route hit with id:', req.params.id);
  res.json({ ok: true });
});

router.put('/:id', uploadMedia.single('media_file'), async (req, res) => {
  try {
    req.body.media_file = req.file ? path.join('', req.file.filename) : null;
    await updateMediaCorner(req, res);
  } catch (error) {
    res.status(400).json({
      error: 'Media Corner file upload failed',
      details: error.message
    });
  }
});

router.get('/asset/', getMediaCornerImage);


export const toolsMediaCornerRoutes = router;
*/



// src/routes/mediaCornerRoutes.js
/*
MediaCorner Routes

POST /        : mediaCornerSchema (body)
PUT /:id      : idSchema (params) + mediaCornerSchema (body)
GET /         : querySchema (query)
GET /asset    : assetQuerySchema (query)
GET /:id      : idSchema (params)
DELETE /:id   : idSchema (params)
*/

import express from "express";
import validateRequest from "../middleware/validateRequest.js";
import {
  mediaCornerSchema,
  idSchema,
  querySchema,
  assetQuerySchema,
} from "../validators/mediaCornerValidator.js";
import {
  createMediaCorner,
  getMediaCorner,
  getMediaCornerById,
  getMediaCornerImage,
  updateMediaCorner,
  deleteMediaCornerImage,
} from "../controllers/mediaCornerController.js";
import { createUploader } from "../config/multerv2.js";

const router = express.Router();

// Use factory uploader for media_corner folder
const upload = createUploader("media_corner");

// Middleware to inject filename into body before validation
const injectFileName = (req, res, next) => {
  if (req.file) {
    req.body.media_file = req.file.filename;
  }
  next();
};

// Create Media Corner
router.post(
  "/",
  upload.single("media_file"),
  injectFileName,
  validateRequest({ body: mediaCornerSchema }),
  createMediaCorner
);

// Update Media Corner
router.put(
  "/:id",
  upload.single("media_file"),
  injectFileName,
  validateRequest({ params: idSchema, body: mediaCornerSchema }),
  updateMediaCorner
);

// Get Media Corner by type
router.get("/", validateRequest({ query: querySchema }), getMediaCorner);

// Stream image/video
router.get("/asset", validateRequest({ query: assetQuerySchema }), getMediaCornerImage);

// Get Media Corner by ID
router.get("/:id", validateRequest({ params: idSchema }), getMediaCornerById);

// Delete Media Corner
router.delete("/:id", validateRequest({ params: idSchema }), deleteMediaCornerImage);

//export default router;
export const mediaCornerRoutes = router;

// Date: 10 Oct 2025: 12:30 O'Clock
// Onbord Telagana Express - Secunderbd to New Delhi

// Controller to handle logic for image/video - upload/fetch/delete tasks
// Coverage: Press Meets, Past Events, Upcoming Events
// Logic: Generic code to handle any image/video, identified by media_type

const fs = require('fs').promises;
const path = require('path');

const logger = require('../utils/logger');

const mediaCorner = require('../models/krModel');

exports.createMediaCorner = async (req, res, next) => {
  const requestId = req.requestId || 'N/A';

  try {
    console.log('createMediaCorner:-> Request Body:', req.body);
    console.log('createMediaCorner:-> Request File:', req.file);

    const { 
      media_header,
      media_narration,
      media_url,
      media_type,
      media_file
    } = req.body;

    if (!media_header || !media_narration || !media_type) {
      return res.status(400).json({ message: 'Missing params, check and try again' });
    }

    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const mediacorner = await mediaCorner.create({
      media_header,
      media_narration,
      media_url,
      media_type,
      media_file
    });

    await mediacorner.save();

    logger.info(`[${requestId}] Media Corner data created`);
    res.status(201).json({ message: 'Media Corner data created' });
  } catch (err) {
    logger.error(`[${requestId}] Media Corner Data creation error: ${err.message}`);

    //  Clean up uploaded file if DB save fails
    if (req.body.media_file) {
      const filePath = path.join(__dirname, '..', 'uploads', 'media_corner', req.body.media_file);
      try {
        await fs.unlink(filePath);
        logger.warn(`[${requestId}] Rolled back uploaded file: ${req.body.media_file}`);
      } catch (unlinkErr) {
        logger.warn(`[${requestId}] Failed to delete uploaded file: ${unlinkErr.message}`);
      }
    }

    res.status(500).json({ error: 'Media Corner creation failed', details: err.message });
  }
};


exports.getMediaCorner = async (req, res, next) => {
  const { media_type } = req.query;
  const requestId = req.requestId || 'N/A';
  const hostUrl = `${process.env.HOST_URL}:${process.env.PORT}`;

  logger.info(`[${requestId}] getMediaCorner invoked, media_type: ${media_type}`);
  logger.debug(`[${requestId}] Host URL resolved as: ${hostUrl}`);

  if (!media_type) {
    logger.warn(`[${requestId}] Missing required query parameters`);
    return res.status(400).json({ error: 'Missing required parameters: media_type' });
  }

  try {
    const records = await mediaCorner.find({ media_type });

    if (!records || records.length === 0) {
      logger.warn(`[${requestId}] No Media Corner data found `);
      return res.status(404).json({ error: 'Media Corner data not found' });
    }

    logger.info(`[${requestId}] ${records.length} Media Corner records fetched`);

    // Implemented on 12/09/2025
  const updatedRecords = records.map((record) => {
      const obj = record.toObject();
      const { media_file } = obj;

      if (media_file && media_file !== 'null') {
        obj.media_file_url = `${hostUrl}/media/${media_file}`;
        logger.debug(`[${requestId}] Attachment URL constructed for record ${record._id}: ${obj.media_file_url}`);
      } else {
        obj.media_file_url = 'null';
        logger.warn(`[${requestId}] Attachment is not found for record ID: ${record._id}`);
      }

      return obj;
    });


    logger.info(`[${requestId}] Media Corner response prepared`);
    return res.status(200).json(updatedRecords);
  } catch (error) {
    logger.error(`[${requestId}] Error fetching Media Corner data: ${error.message}`, { stack: error.stack });
    return next(error);
  }
};


// Get by Object Id
exports.getMediaCornerById = async (req, res, next) => {
  const { id } = req.params;   //  Use params for ID
  const requestId = req.requestId || 'N/A';
  const hostUrl = `${process.env.HOST_URL}:${process.env.PORT}`;

  logger.info(`[${requestId}] getMediaCornerById invoked, id: ${id}`);
  logger.debug(`[${requestId}] Host URL resolved as: ${hostUrl}`);

  if (!id) {
    logger.warn(`[${requestId}] Missing required parameter: id`);
    return res.status(400).json({ error: 'Missing required parameter: id' });
  }

  try {
    const record = await mediaCorner.findById(id);

    if (!record) {
      logger.warn(`[${requestId}] Media Corner data not found for id: ${id}`);
      return res.status(404).json({ error: 'Media Corner data not found' });
    }

    logger.info(`[${requestId}] Media Corner record fetched for id: ${id}`);

    const obj = record.toObject();
    const { media_file } = obj;

    if (media_file && media_file !== 'null') {
      obj.media_file_url = `${hostUrl}/media/${media_file}`;
      logger.debug(`[${requestId}] Attachment URL constructed for record ${record._id}: ${obj.media_file_url}`);
    } else {
      obj.media_file_url = 'null';
      logger.warn(`[${requestId}] Attachment not found for record ID: ${record._id}`);
    }

    logger.info(`[${requestId}] Media Corner response prepared`);
    return res.status(200).json(obj);
  } catch (error) {
    logger.error(`[${requestId}] Error fetching Media Corner data: ${error.message}`, { stack: error.stack });
    return next(error);
  }
};

// 21/11/2025 
/*
fs.createReadStream: streams file in chunks, avoids loading entire file into memory.
Error handling: listen for stream.on('error') to catch read errors.
Response piping: stream.pipe(res) sends data directly to client.
Scalable: works well for large video/audio files, supports partial delivery.
*/
exports.getMediaCornerImage = (req, res, next) => {
  const filename = req.query.media_file;
  console.log('getMediaCornerImage......', filename);

  const currentWorkingDir = process.cwd();
  const filePath = path.join(currentWorkingDir, 'uploads', 'media_corner', filename);

  console.log('getMediaCornerAsset API:-> Final FilePath: ', filePath);

  // Check if file exists first
  fs.access(filePath, fs.constants.F_OK, err => {
    if (err) {
      console.error('Media file not found:', filePath);
      return res.status(404).json({ message: 'Media file not found or access denied' });
    }

    console.log('Media file found:', filePath);

    // Stream the file
    const stream = fs.createReadStream(filePath);

    stream.on('error', err => {
      console.error('Error streaming media file:', err.message);
      if (!res.headersSent) {
        return res.status(500).json({ message: 'Error streaming media file' });
      }
      return next(err);
    });

    // Pipe stream to response
    stream.pipe(res);
  });
};


// Update media corner: Content and/or asset (image/video)
exports.updateMediaCorner = async (req, res) => {
  try {
    const { id } = req.params;  //  Use params for ID
    const { media_file, ...updatePayload } = req.body;

    console.log('updateMediaCorner: Request Body:', req.body);

    if (!id) {
      return res.status(400).json({ error: 'Media Id is required' });
    }

    if (!req.body.media_file) {
      return res.status(400).json({ error: 'Check: Media File not attached' });
    }

    // Check if record exists
    const existingData = await mediaCorner.findById(id);
    if (!existingData) {
      return res.status(404).json({ error: 'Media Data not found for given Media Id', id });
    }

    // Restrict user role
    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    // Handle media_file logic
    if (!req.file) {
      // No new file uploaded, keep existing
      updatePayload.media_file = existingData.media_file;
      console.log('No new file uploaded, existing media file remains untouched:', updatePayload.media_file);
    } else {
      //  Use the generated filename from upload middleware (e.g., Multer)
      const newFileName = req.file.filename;
      const newFilePath = path.resolve(__dirname, '../uploads/media_corner', newFileName);

      try {
        await fs.access(newFilePath); // Check if new file exists
      } catch {
        return res.status(400).json({ error: 'Uploaded file does not exist on server', file: newFileName });
      }

      // Delete old file if different
      if (existingData.media_file && existingData.media_file !== newFileName) {
        const oldFilePath = path.resolve(__dirname, '../uploads/media_corner', existingData.media_file);
        try {
          await fs.unlink(oldFilePath);
          console.log('Old media file deleted:', existingData.media_file);
        } catch (err) {
          console.warn('Failed to delete old file:', err.message);
        }
      }

      updatePayload.media_file = newFileName;
    }

    // Update document
    const updatedMedia = await mediaCorner.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updatedMedia) {
      return res.status(404).json({ error: 'Media Data not found for given Media Id', id });
    }

    res.status(200).json({
      message: 'Media File updated successfully',
      Media_File: updatedMedia.media_file
    });
  } catch (error) {
    res.status(400).json({
      error: 'Media File update failed',
      details: error.message
    });
  }
};


// Delete image
// Helper to delete file from disk
const deleteFile = async (relativePath) => {
  const fullPath = path.join(__dirname, '..', 'uploads', 'media_corner', relativePath);
  try {
    await fs.unlink(fullPath);
    logger.info(`Deleted file: ${relativePath}`);
  } catch (err) {
    logger.warn(`Failed to delete file ${relativePath}: ${err.message}`);
  }
};

// Delete image
exports.deleteMediaCornerImage = async (req, res, next) => {
  console.log('deleteMediaCornerImage: req.query:', req.query);
  const { id } = req.query;
  const requestId = req.requestId || 'N/A';
  const userId = req.headers['x-user-id'] || 'anonymous';

  try {
    // Get document and delete in one step
    const profile = await mediaCorner.findByIdAndDelete(id);

    if (!profile) {
      logger.warn(`[${requestId}] Media Corner data not found to delete`);
      return res.status(404).json({ error: 'Media Corner data not found' });
    }

    // Delete associated file if present
    if (profile.media_file) {
      await deleteFile(profile.media_file);
      console.log({ action: 'Deleted', filename: profile.media_file, field: 'media_file', requestId, userId });
    } else {
      console.log('deleteMediaCorner: No Media File found to delete.');
    }

    logger.info(`[${requestId}] Media Corner data deleted`);
    res.status(200).json({ message: 'Media Corner data deleted' });
  } catch (err) {
    logger.error(`[${requestId}] Media Corner image delete error: ${err.message}`);
    next(err);
  }
};

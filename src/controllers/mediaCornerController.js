// Date: 10 Oct 2025: 12:30 O'Clock
// Onbord Telagana Express - Secunderabad to New Delhi

// Controller to handle logic for image/video - upload/fetch/delete tasks
// Coverage: Press Meets, Past Events, Upcoming Events
// Logic: Generic code to handle any image/video, identified by media_type

// ./controllers/toolsMediaCornerController.js
/*

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { KnowledgeRepo } from '../models/krModel.js';

// Create Media Corner
export const createMediaCorner = async (req, res, next) => {
  const requestId = req.requestId || 'N/A';

  try {
    console.log('createMediaCorner:-> Request Body:', req.body);
    console.log('createMediaCorner:-> Request File:', req.file);

    const { media_header, media_narration, media_url, media_type, media_file } = req.body;

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

    // Clean up uploaded file if DB save fails
    if (req.body.media_file) {
      const filePath = path.join(process.cwd(), 'uploads', 'media_corner', req.body.media_file);
      try {
        await fs.promises.unlink(filePath);
        logger.warn(`[${requestId}] Rolled back uploaded file: ${req.body.media_file}`);
      } catch (unlinkErr) {
        logger.warn(`[${requestId}] Failed to delete uploaded file: ${unlinkErr.message}`);
      }
    }

    res.status(500).json({ error: 'Media Corner creation failed', details: err.message });
  }
};

// Get Media Corner by type
export const getMediaCorner = async (req, res, next) => {
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
      logger.warn(`[${requestId}] No Media Corner data found`);
      return res.status(404).json({ error: 'Media Corner data not found' });
    }

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

// Get by ID
export const getMediaCornerById = async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.requestId || 'N/A';
  const hostUrl = `${process.env.HOST_URL}:${process.env.PORT}`;

  logger.info(`[${requestId}] getMediaCornerById invoked, id: ${id}`);

  if (!id) {
    return res.status(400).json({ error: 'Missing required parameter: id' });
  }

  try {
    const record = await mediaCorner.findById(id);

    if (!record) {
      return res.status(404).json({ error: 'Media Corner data not found' });
    }

    const obj = record.toObject();
    const { media_file } = obj;

    obj.media_file_url = media_file && media_file !== 'null'
      ? `${hostUrl}/media/${media_file}`
      : 'null';

    return res.status(200).json(obj);
  } catch (error) {
    logger.error(`[${requestId}] Error fetching Media Corner data: ${error.message}`, { stack: error.stack });
    return next(error);
  }
};

// Stream image/video
export const getMediaCornerImage = (req, res, next) => {
  const filename = req.query.media_file;
  const filePath = path.join(process.cwd(), 'uploads', 'media_corner', filename);

  fs.promises.access(filePath, fs.constants.F_OK)
    .then(() => {
      const stream = fs.createReadStream(filePath);
      stream.on('error', err => {
        if (!res.headersSent) {
          return res.status(500).json({ message: 'Error streaming media file' });
        }
        return next(err);
      });
      stream.pipe(res);
    })
    .catch(() => res.status(404).json({ message: 'Media file not found or access denied' }));
};

// Update Media Corner
export const updateMediaCorner = async (req, res) => {
  try {
    const { id } = req.params;
    const { media_file, ...updatePayload } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Media Id is required' });
    }

    const existingData = await mediaCorner.findById(id);
    if (!existingData) {
      return res.status(404).json({ error: 'Media Data not found for given Media Id', id });
    }

    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    if (req.file) {
      const newFileName = req.file.filename;
      updatePayload.media_file = newFileName;

      if (existingData.media_file && existingData.media_file !== newFileName) {
        const oldFilePath = path.resolve(process.cwd(), 'uploads', 'media_corner', existingData.media_file);
        try {
          await fs.promises.unlink(oldFilePath);
        } catch (err) {
          logger.warn(`Failed to delete old file: ${err.message}`);
        }
      }
    } else {
      updatePayload.media_file = existingData.media_file;
    }

    const updatedMedia = await mediaCorner.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true });

    if (!updatedMedia) {
      return res.status(404).json({ error: 'Media Data not found for given Media Id', id });
    }

    res.status(200).json({ message: 'Media File updated successfully', Media_File: updatedMedia.media_file });
  } catch (error) {
    res.status(400).json({ error: 'Media File update failed', details: error.message });
  }
};

// Delete helper
const deleteFile = async (relativePath) => {
  const fullPath = path.join(process.cwd(), 'uploads', 'media_corner', relativePath);
  try {
    await fs.promises.unlink(fullPath);
    logger.info(`Deleted file: ${relativePath}`);
  } catch (err) {
    logger.warn(`Failed to delete file ${relativePath}: ${err.message}`);
  }
};

// Delete Media Corner
export const deleteMediaCornerImage = async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.requestId || 'N/A';

  try {
    const profile = await mediaCorner.findByIdAndDelete(id);

    if (!profile) {
      return res.status(404).json({ error: 'Media Corner data not found' });
    }

    if (profile.media_file) {
      await deleteFile(profile.media_file);
    }

    res.status(200).json({ message: 'Media Corner data deleted' });
  } catch (err) {
    logger.error(`[${requestId}] Media Corner image delete error: ${err.message}`);
    next(err);
  }
};

*/


// src/controllers/mediaCornerController.js
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";
import { MediaCorner } from "../models/mediaCornerModel.js";
import { User } from "../models/userModel.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Helper: delete file safely
const deleteFile = async (relativePath, requestId = "N/A") => {
  const fullPath = path.join(process.cwd(), "uploads", "media_corner", relativePath);
  try {
    await fs.promises.unlink(fullPath);
    logger.info(`[${requestId}] Deleted file: ${relativePath}`);
  } catch (err) {
    logger.warn(`[${requestId}] Failed to delete file ${relativePath}: ${err.message}`);
  }
};

// Create Media Corner
export const createMediaCorner = async (req, res, next) => {
  const requestId = req.requestId || "N/A";
  try {
    const isSuperadmin = req.user?.role_id?.name?.toLowerCase() === "superadmin";
    const isAdmin = req.user?.role_id?.name?.toLowerCase()?.endsWith("_admin") || req.user?.role_id?.name?.toLowerCase()?.includes("admin");
    if (!isSuperadmin && !isAdmin) {
      throw new AppError(403, "Action forbidden: Only admin or superadmin can perform this action");
    }

    const mediacorner = await MediaCorner.create(req.body);
    logger.info(`[${requestId}] Media Corner created: ${mediacorner._id}`);
    return sendResponse(res, 201, true, "Media Corner created successfully", mediacorner, null, req);
  } catch (err) {
    if (req.body.media_file) await deleteFile(req.body.media_file, requestId);
    next(err);
  }
};

// Get All Media Corner by type
export const getMediaCorner = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.media_type) filter.media_type = req.query.media_type;

    if (req.query.media_type === "notification") {
      let user = null;
      let token = null;
      if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          user = await User.findById(decoded.id).populate("role_id").populate("member_id");
        } catch (err) {
          console.warn("Optional token verification failed in getMediaCorner:", err.message);
        }
      }

      const isSuperadmin = user?.role_id?.name?.toLowerCase() === "superadmin";
      const isAdmin = user?.role_id?.name?.toLowerCase()?.endsWith("_admin") || user?.role_id?.name?.toLowerCase()?.includes("admin");

      if (!isSuperadmin && !isAdmin) {
        const memberId = user?.member_id?._id || user?.member_id;
        filter.$or = [
          { notification_type: "broadcast" },
          { notification_type: "one-to-one", recipient_id: user?._id },
        ];
        if (memberId) {
          filter.$or.push({ notification_type: "one-to-one", recipient_id: memberId });
        }
      }
    }

    const records = await MediaCorner.find(filter);
    if (!records.length) {
      if (req.query.media_type === "notification") {
        return sendResponse(res, 200, true, "No notifications found", [], null, req);
      }
      throw new AppError(404, "No Media Corner data found");
    }

    const hostUrl = `${process.env.HOST_URL}:${process.env.PORT}`;
    const updatedRecords = records.map((record) => {
      const obj = record.toObject();
      obj.media_file_url = obj.media_file ? `${hostUrl}/media/${obj.media_file}` : null;
      return obj;
    });

    return sendResponse(res, 200, true, "Media Corner retrieved successfully", updatedRecords, null, req);
  } catch (err) {
    next(err);
  }
};

// Get by ID
export const getMediaCornerById = async (req, res, next) => {
  try {
    const record = await MediaCorner.findById(req.params.id);
    if (!record) throw new AppError(404, "Media Corner not found");

    const obj = record.toObject();
    obj.media_file_url = obj.media_file ? `${process.env.HOST_URL}:${process.env.PORT}/media/${obj.media_file}` : null;

    return sendResponse(res, 200, true, "Media Corner retrieved successfully", obj, null, req);
  } catch (err) {
    console.log('getMediaCornerById Error: ', err.stack);
    next(err);
  }
};

// Stream image/video
export const getMediaCornerImage = (req, res, next) => {
  const filename = req.query.media_file || req.query.media;
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

// Update Media Corner
export const updateMediaCorner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestId = req.requestId || "N/A";

    const isSuperadmin = req.user?.role_id?.name?.toLowerCase() === "superadmin";
    const isAdmin = req.user?.role_id?.name?.toLowerCase()?.endsWith("_admin") || req.user?.role_id?.name?.toLowerCase()?.includes("admin");
    if (!isSuperadmin && !isAdmin) {
      throw new AppError(403, "Action forbidden: Only admin or superadmin can perform this action");
    }

    const existingData = await MediaCorner.findById(id);
    if (!existingData) throw new AppError(404, "Media not found");

    const updatePayload = { ...req.body };
    if (req.file) {
      updatePayload.media_file = req.file.filename;
      if (existingData.media_file && existingData.media_file !== req.file.filename) {
        await deleteFile(existingData.media_file, requestId);
      }
    } else {
      updatePayload.media_file = existingData.media_file;
    }

    const updatedMedia = await MediaCorner.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedMedia) throw new AppError(404, "Media not found after update");

    return sendResponse(res, 200, true, "Media updated successfully", updatedMedia, null, req);
  } catch (err) {
    next(err);
  }
};


// Delete Media Corner
export const deleteMediaCornerImage = async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.requestId || "N/A";

  try {
    const isSuperadmin = req.user?.role_id?.name?.toLowerCase() === "superadmin";
    const isAdmin = req.user?.role_id?.name?.toLowerCase()?.endsWith("_admin") || req.user?.role_id?.name?.toLowerCase()?.includes("admin");
    if (!isSuperadmin && !isAdmin) {
      throw new AppError(403, "Action forbidden: Only admin or superadmin can perform this action");
    }

    const profile = await MediaCorner.findByIdAndDelete(id);
    if (!profile) throw new AppError(404, "Media Corner not found");

    if (profile.media_file) await deleteFile(profile.media_file, requestId);

    return sendResponse(res, 200, true, "Media Corner deleted successfully", null, null, req);
  } catch (err) {
    next(err);
  }
};

// Mark a notification as read
export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await MediaCorner.findById(id);
    if (!record) throw new AppError(404, "Notification not found");

    const isRecipient =
      record.recipient_id?.toString() === req.user?._id?.toString() ||
      record.recipient_id?.toString() === req.user?.member_id?.toString() ||
      record.recipient_id?.toString() === req.user?.member_id?._id?.toString();

    if (!isRecipient) {
      throw new AppError(403, "You are not authorized to mark this notification as read");
    }

    record.is_read = true;
    await record.save();

    return sendResponse(res, 200, true, "Notification marked as read successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};

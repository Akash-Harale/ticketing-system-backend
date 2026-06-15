// src/models/mediaCornerModel.js
import mongoose from "mongoose";

const mediaCornerSchema = new mongoose.Schema(
  {
    media_header: {
      type: String,
      required: [true, "Media header is required"],
      trim: true,
      minlength: [3, "Media header must be at least 3 characters"],
      maxlength: [100, "Media header cannot exceed 100 characters"],
    },
    media_narration: {
      type: String,
      required: [true, "Media narration is required"],
      trim: true,
      minlength: [10, "Media narration must be at least 10 characters"],
      maxlength: [1000, "Media narration cannot exceed 1000 characters"],
    },
    media_url: {
      type: String,
      match: [/^(https?:\/\/.+\..+)?$/, "Please provide a valid URL"],
      default: "",
    },
    media_type: {
      type: String,
      required: [true, "Media type is required"],
      enum: ["image", "video", "audio", "document", "faq", "template", "pdf"],
      index: true,
    },
    media_file: {
      type: String,
      trim: true,
      default: "",
    },
    media_timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for common queries
mediaCornerSchema.index({ media_type: 1, media_timestamp: -1 });

export const MediaCorner = mongoose.model("MediaCorner", mediaCornerSchema);

// src/config/mediaCornerTypes.js
//
// This is the SINGLE SOURCE OF TRUTH for Knowledge Base media types.
// Add a new entry here to make it available everywhere — model, validator, and frontend API.
//
// Fields per type:
//   value             — the enum value stored in MongoDB
//   label             — human-readable label shown in the UI dropdown
//   requires_attachment — whether uploading a file is mandatory for this type
//   allows_url        — whether a URL link field should be shown
//   accept            — file input accept attribute (MIME types / extensions); null = any
//   description       — short hint shown in the UI to guide the user

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MEDIA_CORNER_TYPES = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mediaCornerTypes.json'), 'utf-8')
);

// Derive the plain string array for use in model enums and Joi validators
export const MEDIA_CORNER_TYPE_VALUES = MEDIA_CORNER_TYPES.map((t) => t.value);

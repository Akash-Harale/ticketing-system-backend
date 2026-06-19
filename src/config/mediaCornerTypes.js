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

export const MEDIA_CORNER_TYPES = [
  {
    value: "faq",
    label: "FAQ",
    requires_attachment: false,
    allows_url: false,
    accept: null,
    description: "A question & answer entry for the Knowledge Base",
  },
  {
    value: "document",
    label: "Document",
    requires_attachment: false,
    allows_url: true,
    accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    description: "A Word document or written guide",
  },
  {
    value: "pdf",
    label: "PDF",
    requires_attachment: false,
    allows_url: true,
    accept: "application/pdf,.pdf",
    description: "A PDF report, circular, or reference document",
  },
  {
    value: "template",
    label: "Template",
    requires_attachment: false,
    allows_url: true,
    accept: ".doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf",
    description: "A reusable form or report template",
  },
  {
    value: "image",
    label: "Image",
    requires_attachment: false,
    allows_url: false,
    accept: "image/*",
    description: "A photo or graphic (JPG, PNG, etc.)",
  },
  {
    value: "video",
    label: "Video",
    requires_attachment: false,
    allows_url: true,
    accept: "video/*,.mp4,.mov",
    description: "A training or reference video",
  },
  {
    value: "audio",
    label: "Audio",
    requires_attachment: false,
    allows_url: false,
    accept: "audio/*,.mp3,.wav",
    description: "An audio recording or podcast",
  },
];

// Derive the plain string array for use in model enums and Joi validators
export const MEDIA_CORNER_TYPE_VALUES = MEDIA_CORNER_TYPES.map((t) => t.value);

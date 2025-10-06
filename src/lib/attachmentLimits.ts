export const MAX_ATTACHMENT_SIZE_MB = 15;
export const MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;

export const ACCEPTED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/jpg',
  'application/pdf',
]);

export const ACCEPTED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'pdf']);

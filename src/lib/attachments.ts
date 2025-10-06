import type { AiAttachment } from '../types';
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
} from './attachmentLimits';

const dataUrlCache = new Map<string, string>();

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const isBlobUrl = (url: string): boolean => url.startsWith('blob:');

export const isAcceptedFile = (file: File): boolean => {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return false;
  }

  if (ACCEPTED_MIME_TYPES.has(file.type)) {
    return true;
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ACCEPTED_EXTENSIONS.has(extension);
};

export const createAttachment = (file: File): AiAttachment => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mime = file.type || (extension ? `application/${extension}` : 'application/octet-stream');
  const url = URL.createObjectURL(file);
  const isImageMime = mime.startsWith('image/');
  const isImageExtension = ACCEPTED_EXTENSIONS.has(extension) && extension !== 'pdf';

  return {
    id: generateId(),
    url,
    name: file.name,
    mime,
    kind: isImageMime || isImageExtension ? 'image' : 'document',
    extension,
    size: file.size,
  };
};

export const revokeAttachmentUrl = (attachment: AiAttachment | string | null | undefined) => {
  if (!attachment) return;
  const url = typeof attachment === 'string' ? attachment : attachment.url;
  if (isBlobUrl(url)) {
    URL.revokeObjectURL(url);
  }
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read attachment'));
    reader.readAsDataURL(blob);
  });

export const attachmentToDataUrl = async (attachment: AiAttachment): Promise<string | undefined> => {
  if (attachment.dataUrl) {
    return attachment.dataUrl;
  }

  try {
    const response = await fetch(attachment.url);
    if (!response.ok) {
      throw new Error(`Failed to load attachment (${response.status})`);
    }
    const blob = await response.blob();
    return blobToDataUrl(blob);
  } catch (error) {
    console.warn('attachmentToDataUrl failed', error);
    return undefined;
  }
};

export const withAttachmentData = async (attachment: AiAttachment): Promise<AiAttachment> => {
  if (attachment.dataUrl) {
    return attachment;
  }

  const cached = dataUrlCache.get(attachment.id);
  if (cached) {
    return { ...attachment, dataUrl: cached };
  }

  const dataUrl = await attachmentToDataUrl(attachment);
  if (!dataUrl) {
    return attachment;
  }

  dataUrlCache.set(attachment.id, dataUrl);

  return {
    ...attachment,
    dataUrl,
  };
};

export const clearAttachmentCache = (ids?: string[]) => {
  if (!ids) {
    dataUrlCache.clear();
    return;
  }
  ids.forEach((id) => dataUrlCache.delete(id));
};

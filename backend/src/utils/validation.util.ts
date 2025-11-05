import sanitizeHtml from 'sanitize-html';
import { LIMITS, ALLOWED_IMAGE_TYPES } from '../config/constants';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows basic formatting tags only (bold, italic)
 */
export function sanitizeMessageContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: ['b', 'i', 'strong', 'em'],
    allowedAttributes: {},
    allowedSchemes: [],
    disallowedTagsMode: 'recursiveEscape',
  });
}

/**
 * Validate message content
 * @throws Error if validation fails
 */
export function validateMessageContent(content: string): void {
  if (!content || typeof content !== 'string') {
    throw new Error('Message content is required and must be a string');
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    throw new Error('Message content cannot be empty');
  }

  if (trimmed.length > LIMITS.MESSAGE_MAX_LENGTH) {
    throw new Error(
      `Message content exceeds maximum length of ${LIMITS.MESSAGE_MAX_LENGTH} characters`
    );
  }
}

/**
 * Validate image file
 * @throws Error if validation fails
 */
export function validateImageFile(
  file: Express.Multer.File | { mimetype: string; size: number }
): void {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype as any)) {
    throw new Error(
      `Invalid image type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    );
  }

  // Check file size
  if (file.size > LIMITS.IMAGE_MAX_SIZE) {
    const sizeMB = (LIMITS.IMAGE_MAX_SIZE / (1024 * 1024)).toFixed(0);
    throw new Error(`Image size exceeds maximum of ${sizeMB}MB`);
  }
}

/**
 * Validate attachments array
 * @throws Error if validation fails
 */
export function validateAttachments(files: Express.Multer.File[]): void {
  if (!files || files.length === 0) {
    return; // No files is valid
  }

  if (files.length > LIMITS.MAX_ATTACHMENTS_PER_MESSAGE) {
    throw new Error(
      `Maximum ${LIMITS.MAX_ATTACHMENTS_PER_MESSAGE} attachments allowed per message`
    );
  }

  // Validate each file
  for (const file of files) {
    validateImageFile(file);
  }
}

/**
 * Validate chat name for groups
 * @throws Error if validation fails
 */
export function validateChatName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new Error('Chat name is required');
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error('Chat name cannot be empty');
  }

  if (trimmed.length > LIMITS.GROUP_NAME_MAX_LENGTH) {
    throw new Error(
      `Chat name exceeds maximum length of ${LIMITS.GROUP_NAME_MAX_LENGTH} characters`
    );
  }
}

/**
 * Validate username
 * @throws Error if validation fails
 */
export function validateUsername(username: string): void {
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required');
  }

  if (username.length < LIMITS.USERNAME_MIN_LENGTH) {
    throw new Error(
      `Username must be at least ${LIMITS.USERNAME_MIN_LENGTH} characters`
    );
  }

  if (username.length > LIMITS.USERNAME_MAX_LENGTH) {
    throw new Error(
      `Username exceeds maximum length of ${LIMITS.USERNAME_MAX_LENGTH} characters`
    );
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error(
      'Username can only contain letters, numbers, and underscores'
    );
  }
}

/**
 * Validate display name
 * @throws Error if validation fails
 */
export function validateDisplayName(displayName: string): void {
  if (!displayName) {
    return; // Display name is optional
  }

  if (typeof displayName !== 'string') {
    throw new Error('Display name must be a string');
  }

  if (displayName.trim().length > LIMITS.DISPLAY_NAME_MAX_LENGTH) {
    throw new Error(
      `Display name exceeds maximum length of ${LIMITS.DISPLAY_NAME_MAX_LENGTH} characters`
    );
  }
}

/**
 * Validate password
 * @throws Error if validation fails
 */
export function validatePassword(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }

  if (password.length < LIMITS.PASSWORD_MIN_LENGTH) {
    throw new Error(
      `Password must be at least ${LIMITS.PASSWORD_MIN_LENGTH} characters`
    );
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
}

/**
 * Escape special characters for regex
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

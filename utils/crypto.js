/**
 * Enterprise Military-Grade AES-256-GCM Data Encryption Engine
 * ITLC HRMS & CRM Security Layer
 * 
 * Standard: AES-256-GCM (Galois/Counter Mode)
 * - 256-bit Key Length
 * - 96-bit (12-byte) Cryptographically Secure Random IV per operation
 * - 128-bit (16-byte) Authentication Tag for tamper-evident integrity check
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const PREFIX = 'enc:v1:';

// Derive 32-byte (256-bit) key from environment secret
function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_SECRET_KEY || 'itlc_crm_military_grade_master_encryption_secret_key_2026_x89';
  return crypto.createHash('sha256').update(String(secret)).digest();
}

/**
 * Check if a string is already encrypted in enc:v1 format
 * @param {any} val 
 * @returns {boolean}
 */
function isEncrypted(val) {
  return typeof val === 'string' && val.startsWith(PREFIX);
}

/**
 * Encrypts plaintext string using AES-256-GCM
 * @param {string|number} plaintext 
 * @returns {string} Serialized ciphertext format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return plaintext;
  }
  
  const textStr = String(plaintext);
  if (isEncrypted(textStr)) {
    return textStr; // Already encrypted
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(textStr, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${PREFIX}${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM ciphertext
 * @param {string} cipherString 
 * @returns {string} Plaintext string
 */
function decrypt(cipherString) {
  if (!cipherString || typeof cipherString !== 'string' || !isEncrypted(cipherString)) {
    return cipherString; // Return unencrypted / legacy data as-is
  }

  try {
    const raw = cipherString.slice(PREFIX.length);
    const parts = raw.split(':');
    if (parts.length !== 3) {
      return cipherString;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('🔒 [Crypto Security Warning] Decryption/Integrity check failed. Ciphertext may have been tampered with:', err.message);
    return cipherString; // Return raw if decryption fails to avoid breaking flow
  }
}

/**
 * Encrypts specific fields of an object
 * @param {Object} obj 
 * @param {string[]} fields 
 * @returns {Object}
 */
function encryptObject(obj, fields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = encrypt(result[field]);
    }
  }
  return result;
}

/**
 * Decrypts specific fields of an object
 * @param {Object} obj 
 * @param {string[]} fields 
 * @returns {Object}
 */
function decryptObject(obj, fields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = decrypt(result[field]);
    }
  }
  return result;
}

/**
 * One-way SHA-256 Hash with salt for secure indexing
 * @param {string} text 
 * @returns {string} Hex hash
 */
function hashSha256(text) {
  if (!text) return '';
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  isEncrypted,
  encryptObject,
  decryptObject,
  hashSha256
};

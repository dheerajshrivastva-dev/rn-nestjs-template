import {
  generateKeyPairSync,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createSign,
} from 'crypto';
import * as CryptoJS from 'crypto-js';

export class CryptoUtil {
  /**
   * Generate RSA-2048 key pair for device-server communication
   */
  static generateRSAKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Generate cryptographically secure random string
   * @param length Length of the string (default: 256)
   */
  static generateSecureCode(length: number = 256): string {
    return randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * Generate 6-digit OTP using cryptographically secure random
   * More secure than Math.random()
   */
  static generateOTP(): string {
    const buffer = randomBytes(3); // 3 bytes = 24 bits
    const num = buffer.readUIntBE(0, 3); // Read as unsigned int
    const otp = num % 1000000; // Modulo to get 6 digits
    return otp.toString().padStart(6, '0'); // Pad with leading zeros
  }

  /**
   * Encrypt string using AES-256
   * @param text Text to encrypt
   * @param secretKey Secret key for encryption
   */
  static encryptAES(text: string, secretKey: string): string {
    return CryptoJS.AES.encrypt(text, secretKey).toString();
  }

  /**
   * Decrypt AES-256 encrypted string
   * @param encryptedText Encrypted text
   * @param secretKey Secret key for decryption
   */
  static decryptAES(encryptedText: string, secretKey: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Hash password using bcrypt
   * Note: bcrypt is handled separately with the bcrypt package
   */

  /**
   * Sign payload with RSA private key
   * @param payload Payload to sign
   * @param privateKey RSA private key in PEM format
   */
  static signPayload(payload: string, privateKey: string): string {
    const sign = createSign('RSA-SHA256');
    sign.update(payload);
    sign.end();
    return sign.sign(privateKey, 'base64');
  }

  /**
   * Generate QR code data for Zero-Touch Provisioning
   */
  static generateQRCodeData(params: {
    uniqueCode: string;
    companyId: string;
    imei1: string;
    imei2?: string;
    serverUrl: string;
  }): string {
    return JSON.stringify({
      uniqueCode: params.uniqueCode,
      companyId: params.companyId,
      imei1: params.imei1,
      ...(params.imei2 && { imei2: params.imei2 }),
      serverUrl: params.serverUrl,
      version: '1.0',
    });
  }
}

import { Injectable } from '@nestjs/common';
import { createDecipheriv, createCipheriv, publicEncrypt, privateDecrypt, createVerify, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CryptoUtils {
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('CRYPTO_ENCRYPTION_KEY') || 'forge-default-encryption-key-32';
  }

  /**
   * Decrypt server private key stored in database
   * Format: "iv:encryptedKey"
   */
  decryptServerPrivateKey(encryptedPrivateKey: string): string {
    const [ivHex, encryptedKeyHex] = encryptedPrivateKey.split(':');

    if (!ivHex || !encryptedKeyHex) {
      throw new Error('Invalid encrypted private key format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(this.encryptionKey.substring(0, 32));

    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedKeyHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Encrypt server private key for database storage
   * Returns format: "iv:encryptedKey"
   */
  encryptServerPrivateKey(privateKey: string): string {
    const key = Buffer.from(this.encryptionKey.substring(0, 32));
    const iv = randomBytes(16);

    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Encrypt payload with RSA public key
   * Used to encrypt sensitive data for device
   */
  encryptWithPublicKey(publicKey: string, data: string | Buffer): string {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const encrypted = publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
  }

  /**
   * Decrypt payload with RSA private key
   * Used to decrypt device-encrypted data on server
   */
  decryptWithPrivateKey(privateKey: string, encryptedData: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf8');
  }

  /**
   * Verify RSA signature
   * Used in DeviceSignatureGuard
   */
  verifySignature(
    publicKey: string,
    data: string,
    signature: string,
  ): boolean {
    try {
      const verifier = createVerify('RSA-SHA256');
      verifier.update(data);
      return verifier.verify(publicKey, signature, 'base64');
    } catch (error) {
      return false;
    }
  }

  /**
   * Create signature payload for verification
   * Format: "METHOD:PATH:TIMESTAMP:BODY"
   */
  createSignaturePayload(
    method: string,
    path: string,
    timestamp: number,
    body: any,
  ): string {
    const bodyString = body ? JSON.stringify(body) : '';
    return `${method}:${path}:${timestamp}:${bodyString}`;
  }

  /**
   * Validate timestamp for replay attack prevention
   * Returns true if timestamp is within allowed window (default: 5 minutes)
   */
  validateTimestamp(timestamp: number, windowSeconds: number = 300): boolean {
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.abs(now - timestamp);
    return diff <= windowSeconds;
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';

/**
 * Encryption service for sensitive data (OAuth tokens, API keys, etc.)
 * Uses AES-256-CBC encryption
 */
@Injectable()
export class EncryptionService {
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

    if (!this.encryptionKey || this.encryptionKey.length < 32) {
      throw new Error(
        'ENCRYPTION_KEY must be set and at least 32 characters long',
      );
    }
  }

  /**
   * Encrypt a string value
   */
  encrypt(plainText: string): string {
    if (!plainText) {
      return plainText;
    }

    try {
      const encrypted = CryptoJS.AES.encrypt(
        plainText,
        this.encryptionKey,
      ).toString();
      return encrypted;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt an encrypted string
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) {
      return encryptedText;
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(
        encryptedText,
        this.encryptionKey,
      );
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash a value (one-way, for verification purposes)
   */
  hash(value: string): string {
    return CryptoJS.SHA256(value).toString();
  }

  /**
   * Compare a plain value with a hashed value
   */
  compareHash(plainValue: string, hashedValue: string): boolean {
    return this.hash(plainValue) === hashedValue;
  }
}

/**
 * Client-Side Encryption Service
 * Implements enterprise-level encryption for sensitive data transmission
 */

import { SecurityConfig, generateSecureRandom, logSecurityEvent } from '@/config/security';
import { Environment } from '@/utils/environment';

export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  timestamp: number;
}

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: CryptoKey | null = null;
  private keyPair: KeyPair | null = null;
  private keyRotationTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeEncryption();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Initialize encryption system
   */
  private async initializeEncryption(): Promise<void> {
    try {
      if (SecurityConfig.ENCRYPTION.ENCRYPT_LOCAL_STORAGE || SecurityConfig.ENCRYPTION.ENCRYPT_SESSION_STORAGE) {
        await this.generateEncryptionKey();
        await this.generateKeyPair();
        this.setupKeyRotation();
        
        logSecurityEvent('encryption_initialized', {
          algorithm: SecurityConfig.ENCRYPTION.ALGORITHM,
          keyRotationInterval: SecurityConfig.ENCRYPTION.KEY_ROTATION_INTERVAL,
        });
      }
    } catch (error) {
      logSecurityEvent('encryption_initialization_failed', { error });
      console.error('Failed to initialize encryption:', error);
    }
  }

  /**
   * Generate symmetric encryption key
   */
  private async generateEncryptionKey(): Promise<void> {
    this.encryptionKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      false, // Not extractable for security
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate RSA key pair for asymmetric encryption
   */
  private async generateKeyPair(): Promise<void> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      false,
      ['encrypt', 'decrypt']
    );

    this.keyPair = keyPair;
  }

  /**
   * Setup automatic key rotation
   */
  private setupKeyRotation(): void {
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
    }

    this.keyRotationTimer = setInterval(async () => {
      try {
        await this.rotateKeys();
        logSecurityEvent('keys_rotated', { timestamp: new Date().toISOString() });
      } catch (error) {
        logSecurityEvent('key_rotation_failed', { error });
      }
    }, SecurityConfig.ENCRYPTION.KEY_ROTATION_INTERVAL);
  }

  /**
   * Rotate encryption keys
   */
  private async rotateKeys(): Promise<void> {
    await this.generateEncryptionKey();
    await this.generateKeyPair();
  }

  /**
   * Encrypt data using AES-GCM
   */
  public async encryptData(data: string): Promise<EncryptedData> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.encryptionKey,
      dataBuffer
    );

    const encryptedArray = new Uint8Array(encryptedBuffer);
    const tag = encryptedArray.slice(-16); // Last 16 bytes are the authentication tag
    const ciphertext = encryptedArray.slice(0, -16);

    return {
      data: Array.from(ciphertext, byte => byte.toString(16).padStart(2, '0')).join(''),
      iv: Array.from(iv, byte => byte.toString(16).padStart(2, '0')).join(''),
      tag: Array.from(tag, byte => byte.toString(16).padStart(2, '0')).join(''),
      timestamp: Date.now(),
    };
  }

  /**
   * Decrypt data using AES-GCM
   */
  public async decryptData(encryptedData: EncryptedData): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const ciphertext = new Uint8Array(
      encryptedData.data.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );
    const iv = new Uint8Array(
      encryptedData.iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );
    const tag = new Uint8Array(
      encryptedData.tag.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );

    const encryptedBuffer = new Uint8Array([...ciphertext, ...tag]);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.encryptionKey,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Encrypt data for API transmission
   */
  public async encryptForTransmission(data: unknown): Promise<string> {
    if (!SecurityConfig.API_SECURITY.ENCRYPT_REQUESTS) {
      return JSON.stringify(data);
    }

    const jsonString = JSON.stringify(data);
    const encrypted = await this.encryptData(jsonString);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt data from API response
   */
  public async decryptFromTransmission(encryptedData: string): Promise<unknown> {
    if (!SecurityConfig.API_SECURITY.ENCRYPT_RESPONSES) {
      return JSON.parse(encryptedData);
    }

    const encrypted: EncryptedData = JSON.parse(encryptedData);
    const decrypted = await this.decryptData(encrypted);
    return JSON.parse(decrypted);
  }

  /**
   * Secure localStorage operations
   */
  public async setSecureItem(key: string, value: unknown): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (SecurityConfig.ENCRYPTION.ENCRYPT_LOCAL_STORAGE) {
      const encrypted = await this.encryptData(stringValue);
      localStorage.setItem(key, JSON.stringify(encrypted));
    } else {
      localStorage.setItem(key, stringValue);
    }
  }

  /**
   * Secure localStorage retrieval
   */
  public async getSecureItem(key: string): Promise<unknown> {
    const item = localStorage.getItem(key);
    if (!item) return null;

    if (SecurityConfig.ENCRYPTION.ENCRYPT_LOCAL_STORAGE) {
      try {
        const encrypted: EncryptedData = JSON.parse(item);
        const decrypted = await this.decryptData(encrypted);
        
        // Try to parse as JSON, fallback to string
        try {
          return JSON.parse(decrypted);
        } catch {
          return decrypted;
        }
      } catch (error) {
        logSecurityEvent('secure_storage_decryption_failed', { key, error });
        return null;
      }
    }

    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  }

  /**
   * Secure sessionStorage operations
   */
  public async setSecureSessionItem(key: string, value: unknown): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (SecurityConfig.ENCRYPTION.ENCRYPT_SESSION_STORAGE) {
      const encrypted = await this.encryptData(stringValue);
      sessionStorage.setItem(key, JSON.stringify(encrypted));
    } else {
      sessionStorage.setItem(key, stringValue);
    }
  }

  /**
   * Secure sessionStorage retrieval
   */
  public async getSecureSessionItem(key: string): Promise<unknown> {
    const item = sessionStorage.getItem(key);
    if (!item) return null;

    if (SecurityConfig.ENCRYPTION.ENCRYPT_SESSION_STORAGE) {
      try {
        const encrypted: EncryptedData = JSON.parse(item);
        const decrypted = await this.decryptData(encrypted);
        
        // Try to parse as JSON, fallback to string
        try {
          return JSON.parse(decrypted);
        } catch {
          return decrypted;
        }
      } catch (error) {
        logSecurityEvent('secure_session_storage_decryption_failed', { key, error });
        return null;
      }
    }

    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  }

  /**
   * Generate request signature for API calls
   */
  public async signRequest(method: string, url: string, body?: string): Promise<string> {
    if (!SecurityConfig.API_SECURITY.REQUEST_SIGNING) {
      return '';
    }

    const timestamp = Date.now().toString();
    const nonce = generateSecureRandom(16);
    const payload = `${method}${url}${body || ''}${timestamp}${nonce}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `${signature}.${timestamp}.${nonce}`;
  }

  /**
   * Cleanup encryption service
   */
  public cleanup(): void {
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
      this.keyRotationTimer = null;
    }
    
    this.encryptionKey = null;
    this.keyPair = null;
    
    logSecurityEvent('encryption_service_cleanup');
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();

// Initialize security on module load
if (Environment.isProduction()) {
  // Auto-initialize in production
  // encryptionService is initialized by getInstance() above, so no action needed here.
}

// End-to-End Encryption Library for Secure Communications
// Military-grade encryption using Web Crypto API

export interface EncryptionKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyPem: string;
  fingerprint: string;
}

export interface EncryptedMessage {
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
  signature: string;
}

export class SecureMessageEncryption {
  private static readonly ALGORITHM = 'RSA-OAEP';
  private static readonly AES_ALGORITHM = 'AES-GCM';
  private static readonly HASH = 'SHA-256';
  private static readonly KEY_SIZE = 2048;
  private static readonly AES_KEY_SIZE = 256;

  /**
   * Generate a new RSA key pair for end-to-end encryption
   */
  static async generateKeyPair(): Promise<EncryptionKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        modulusLength: this.KEY_SIZE,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: this.HASH,
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Export public key to PEM format
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyPem = this.bufferToPem(publicKeyBuffer, 'PUBLIC KEY');
    
    // Generate fingerprint
    const fingerprint = await this.generateFingerprint(publicKeyBuffer);

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      publicKeyPem,
      fingerprint
    };
  }

  /**
   * Import a public key from PEM format
   */
  static async importPublicKey(publicKeyPem: string): Promise<CryptoKey> {
    const publicKeyBuffer = this.pemToBuffer(publicKeyPem);
    return await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: this.ALGORITHM,
        hash: this.HASH,
      },
      false,
      ['encrypt']
    );
  }

  /**
   * Import a private key from stored format
   */
  static async importPrivateKey(privateKeyData: ArrayBuffer): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      'pkcs8',
      privateKeyData,
      {
        name: this.ALGORITHM,
        hash: this.HASH,
      },
      false,
      ['decrypt']
    );
  }

  /**
   * Encrypt a message using hybrid encryption (RSA + AES)
   */
  static async encryptMessage(
    message: string,
    recipientPublicKey: CryptoKey,
    senderPrivateKey: CryptoKey
  ): Promise<EncryptedMessage> {
    // Generate a random AES key for this message
    const aesKey = await crypto.subtle.generateKey(
      {
        name: this.AES_ALGORITHM,
        length: this.AES_KEY_SIZE,
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Encrypt the message with AES
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const messageBuffer = new TextEncoder().encode(message);
    
    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: this.AES_ALGORITHM,
        iv: iv,
      },
      aesKey,
      messageBuffer
    );

    // Export the AES key and encrypt it with recipient's public key
    const aesKeyBuffer = await crypto.subtle.exportKey('raw', aesKey);
    const encryptedKey = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
      },
      recipientPublicKey,
      aesKeyBuffer
    );

    // Sign the encrypted content with sender's private key
    const signature = await this.signMessage(encryptedContent, senderPrivateKey);

    return {
      encryptedContent: this.bufferToBase64(encryptedContent),
      encryptedKey: this.bufferToBase64(encryptedKey),
      iv: this.bufferToBase64(iv),
      signature: this.bufferToBase64(signature)
    };
  }

  /**
   * Decrypt a message using hybrid decryption
   */
  static async decryptMessage(
    encryptedMessage: EncryptedMessage,
    recipientPrivateKey: CryptoKey,
    senderPublicKey: CryptoKey
  ): Promise<string> {
    // Verify signature first
    const encryptedContentBuffer = this.base64ToBuffer(encryptedMessage.encryptedContent);
    const signatureBuffer = this.base64ToBuffer(encryptedMessage.signature);
    
    const isValidSignature = await this.verifySignature(
      encryptedContentBuffer,
      signatureBuffer,
      senderPublicKey
    );

    if (!isValidSignature) {
      throw new Error('Message signature verification failed');
    }

    // Decrypt the AES key with recipient's private key
    const encryptedKeyBuffer = this.base64ToBuffer(encryptedMessage.encryptedKey);
    const aesKeyBuffer = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
      },
      recipientPrivateKey,
      encryptedKeyBuffer
    );

    // Import the decrypted AES key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      aesKeyBuffer,
      {
        name: this.AES_ALGORITHM,
      },
      false,
      ['decrypt']
    );

    // Decrypt the message content
    const iv = this.base64ToBuffer(encryptedMessage.iv);
    const decryptedContent = await crypto.subtle.decrypt(
      {
        name: this.AES_ALGORITHM,
        iv: iv,
      },
      aesKey,
      encryptedContentBuffer
    );

    return new TextDecoder().decode(decryptedContent);
  }

  /**
   * Sign a message with private key
   */
  private static async signMessage(
    message: ArrayBuffer,
    privateKey: CryptoKey
  ): Promise<ArrayBuffer> {
    return await crypto.subtle.sign(
      {
        name: 'RSA-PSS',
        saltLength: 32,
      },
      privateKey,
      message
    );
  }

  /**
   * Verify message signature
   */
  private static async verifySignature(
    message: ArrayBuffer,
    signature: ArrayBuffer,
    publicKey: CryptoKey
  ): Promise<boolean> {
    try {
      return await crypto.subtle.verify(
        {
          name: 'RSA-PSS',
          saltLength: 32,
        },
        publicKey,
        signature,
        message
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate fingerprint for public key
   */
  private static async generateFingerprint(publicKeyBuffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private static bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer instanceof Uint8Array ? buffer.buffer : buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private static base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to PEM format
   */
  private static bufferToPem(buffer: ArrayBuffer, type: string): string {
    const base64 = this.bufferToBase64(buffer);
    const formatted = base64.match(/.{1,64}/g)?.join('\n') || '';
    return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`;
  }

  /**
   * Convert PEM to ArrayBuffer
   */
  private static pemToBuffer(pem: string): ArrayBuffer {
    const base64 = pem
      .replace(/-----BEGIN [^-]+-----/, '')
      .replace(/-----END [^-]+-----/, '')
      .replace(/\s/g, '');
    return this.base64ToBuffer(base64);
  }
}

/**
 * Content Analysis Engine for AI-powered moderation
 */
export class ContentAnalysisEngine {
  private static readonly FLAGGED_KEYWORDS = [
    // Bullying and harassment
    'stupid', 'idiot', 'loser', 'ugly', 'fat', 'weird', 'freak', 'hate you',
    'kill yourself', 'die', 'hurt yourself', 'nobody likes you', 'worthless',
    
    // Inappropriate content
    'sex', 'naked', 'porn', 'drugs', 'alcohol', 'smoking', 'drinking',
    
    // Violence and threats
    'kill', 'murder', 'hurt', 'beat up', 'fight', 'punch', 'hit', 'violence',
    'weapon', 'gun', 'knife', 'bomb', 'threat', 'dangerous',
    
    // Self-harm indicators
    'cut myself', 'suicide', 'self harm', 'end it all', 'want to die',
    'hurt myself', 'cutting', 'depression', 'hopeless', 'worthless'
  ];

  private static readonly POSITIVE_KEYWORDS = [
    'thank you', 'please', 'help', 'question', 'understand', 'learn',
    'explain', 'clarify', 'homework', 'assignment', 'project', 'study',
    'good', 'great', 'awesome', 'wonderful', 'amazing', 'excellent'
  ];

  /**
   * Analyze message content for safety and appropriateness
   */
  static analyzeContent(content: string): {
    safetyScore: number;
    sentimentScore: number;
    flaggedKeywords: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    suggestions: string[];
  } {
    const lowerContent = content.toLowerCase();
    const flaggedKeywords: string[] = [];
    let negativeScore = 0;
    let positiveScore = 0;

    // Check for flagged keywords
    this.FLAGGED_KEYWORDS.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        flaggedKeywords.push(keyword);
        negativeScore += this.getKeywordSeverity(keyword);
      }
    });

    // Check for positive keywords
    this.POSITIVE_KEYWORDS.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        positiveScore += 0.1;
      }
    });

    // Calculate safety score (0 = unsafe, 1 = safe)
    const safetyScore = Math.max(0, Math.min(1, 1 - (negativeScore / 2) + (positiveScore / 4)));
    
    // Calculate sentiment score (-1 = negative, 1 = positive)
    const sentimentScore = Math.max(-1, Math.min(1, positiveScore - negativeScore));

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (safetyScore >= 0.8) riskLevel = 'low';
    else if (safetyScore >= 0.6) riskLevel = 'medium';
    else if (safetyScore >= 0.3) riskLevel = 'high';
    else riskLevel = 'critical';

    // Generate suggestions for improvement
    const suggestions = this.generateSuggestions(flaggedKeywords, sentimentScore);

    return {
      safetyScore,
      sentimentScore,
      flaggedKeywords,
      riskLevel,
      suggestions
    };
  }

  /**
   * Get severity score for specific keywords
   */
  private static getKeywordSeverity(keyword: string): number {
    const criticalKeywords = ['kill yourself', 'die', 'suicide', 'self harm', 'hurt myself'];
    const highSeverityKeywords = ['hate you', 'stupid', 'ugly', 'worthless', 'kill', 'hurt'];
    
    if (criticalKeywords.includes(keyword)) return 1.0;
    if (highSeverityKeywords.includes(keyword)) return 0.7;
    return 0.4;
  }

  /**
   * Generate helpful suggestions for better communication
   */
  private static generateSuggestions(flaggedKeywords: string[], sentimentScore: number): string[] {
    const suggestions: string[] = [];

    if (flaggedKeywords.length > 0) {
      suggestions.push("Consider using more positive language");
      suggestions.push("Try expressing your feelings in a constructive way");
    }

    if (sentimentScore < -0.5) {
      suggestions.push("Take a moment to think about how your message might make others feel");
      suggestions.push("Consider asking for help or talking to a trusted adult");
    }

    if (flaggedKeywords.some(k => ['kill yourself', 'suicide', 'hurt myself'].includes(k))) {
      suggestions.push("If you're having thoughts of self-harm, please talk to a counselor or trusted adult immediately");
    }

    return suggestions;
  }

  /**
   * Generate positive conversation starters for students
   */
  static getConversationStarters(): string[] {
    return [
      "Can you please explain...",
      "I have a question about...",
      "Could you help me understand...",
      "I'm having trouble with...",
      "Thank you for your help with...",
      "I would like to know more about...",
      "Can we schedule time to discuss...",
      "I appreciate your feedback on...",
      "Could you clarify...",
      "I'm excited to learn about..."
    ];
  }
}

/**
 * Permission validation utilities
 */
export class PermissionValidator {
  /**
   * Check if user can send message to specific channel
   */
  static async canSendMessage(
    userId: string,
    channelId: string,
    userRole: string
  ): Promise<boolean> {
    // Students can only message during office hours
    if (userRole === 'student') {
      // This would typically call the database to check office hours
      // For now, we'll assume office hours are 9 AM to 5 PM weekdays
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      if (day === 0 || day === 6) return false; // No weekends
      if (hour < 9 || hour > 17) return false; // Outside office hours
    }

    return true;
  }

  /**
   * Validate channel access permissions
   */
  static validateChannelAccess(
    userRole: string,
    channelType: string,
    isParticipant: boolean
  ): boolean {
    if (!isParticipant) return false;

    switch (userRole) {
      case 'student':
        return channelType === 'direct'; // Students can only access direct teacher channels
      case 'teacher':
        return ['direct', 'class_announcement'].includes(channelType);
      case 'parent':
        return channelType === 'direct'; // Parents can only access direct teacher channels
      case 'admin':
        return true; // Admins can access all channels
      default:
        return false;
    }
  }

  /**
   * Check if user can create emergency incident
   */
  static canCreateEmergencyIncident(userRole: string): boolean {
    return ['student', 'teacher', 'parent', 'admin'].includes(userRole);
  }
}

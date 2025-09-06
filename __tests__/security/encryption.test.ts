import { describe, it, expect, beforeEach } from '@jest/globals';
import { SecureMessageEncryption, ContentAnalysisEngine, PermissionValidator } from '../../src/lib/encryption';

describe('SecureMessageEncryption', () => {
  let encryption: SecureMessageEncryption;

  beforeEach(() => {
    encryption = new SecureMessageEncryption();
  });

  describe('Key Generation', () => {
    it('should generate RSA key pair', async () => {
      const keyPair = await encryption.generateKeyPair();
      
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey.type).toBe('public');
      expect(keyPair.privateKey.type).toBe('private');
    });

    it('should generate unique key pairs', async () => {
      const keyPair1 = await encryption.generateKeyPair();
      const keyPair2 = await encryption.generateKeyPair();
      
      const publicKey1 = await encryption.exportKey(keyPair1.publicKey);
      const publicKey2 = await encryption.exportKey(keyPair2.publicKey);
      
      expect(publicKey1).not.toBe(publicKey2);
    });

    it('should generate key fingerprint', async () => {
      const keyPair = await encryption.generateKeyPair();
      const fingerprint = await encryption.getKeyFingerprint(keyPair.publicKey);
      
      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint.length).toBeGreaterThan(0);
    });
  });

  describe('Message Encryption/Decryption', () => {
    it('should encrypt and decrypt messages correctly', async () => {
      const senderKeyPair = await encryption.generateKeyPair();
      const recipientKeyPair = await encryption.generateKeyPair();
      const message = 'This is a test message for encryption';

      const encryptedData = await encryption.encryptMessage(
        message,
        recipientKeyPair.publicKey,
        senderKeyPair.privateKey
      );

      expect(encryptedData.encryptedContent).toBeDefined();
      expect(encryptedData.encryptedKey).toBeDefined();
      expect(encryptedData.iv).toBeDefined();
      expect(encryptedData.signature).toBeDefined();

      const decryptedMessage = await encryption.decryptMessage(
        encryptedData,
        recipientKeyPair.privateKey,
        senderKeyPair.publicKey
      );

      expect(decryptedMessage).toBe(message);
    });

    it('should fail decryption with wrong private key', async () => {
      const senderKeyPair = await encryption.generateKeyPair();
      const recipientKeyPair = await encryption.generateKeyPair();
      const wrongKeyPair = await encryption.generateKeyPair();
      const message = 'Test message';

      const encryptedData = await encryption.encryptMessage(
        message,
        recipientKeyPair.publicKey,
        senderKeyPair.privateKey
      );

      await expect(
        encryption.decryptMessage(
          encryptedData,
          wrongKeyPair.privateKey,
          senderKeyPair.publicKey
        )
      ).rejects.toThrow();
    });

    it('should fail verification with wrong public key', async () => {
      const senderKeyPair = await encryption.generateKeyPair();
      const recipientKeyPair = await encryption.generateKeyPair();
      const wrongKeyPair = await encryption.generateKeyPair();
      const message = 'Test message';

      const encryptedData = await encryption.encryptMessage(
        message,
        recipientKeyPair.publicKey,
        senderKeyPair.privateKey
      );

      await expect(
        encryption.decryptMessage(
          encryptedData,
          recipientKeyPair.privateKey,
          wrongKeyPair.publicKey
        )
      ).rejects.toThrow();
    });
  });

  describe('Key Import/Export', () => {
    it('should export and import keys correctly', async () => {
      const keyPair = await encryption.generateKeyPair();
      
      const exportedPublic = await encryption.exportKey(keyPair.publicKey);
      const exportedPrivate = await encryption.exportKey(keyPair.privateKey);
      
      expect(typeof exportedPublic).toBe('string');
      expect(typeof exportedPrivate).toBe('string');
      
      const importedPublic = await encryption.importKey(exportedPublic, 'public');
      const importedPrivate = await encryption.importKey(exportedPrivate, 'private');
      
      expect(importedPublic.type).toBe('public');
      expect(importedPrivate.type).toBe('private');
    });
  });
});

describe('ContentAnalysisEngine', () => {
  describe('Content Analysis', () => {
    it('should analyze safe content correctly', () => {
      const safeMessage = 'Hello teacher, can you help me with my homework?';
      const analysis = ContentAnalysisEngine.analyzeContent(safeMessage);
      
      expect(analysis.riskLevel).toBe('low');
      expect(analysis.sentiment).toBe('positive');
      expect(analysis.flaggedKeywords).toHaveLength(0);
      expect(analysis.confidenceScore).toBeGreaterThan(0.5);
    });

    it('should detect inappropriate content', () => {
      const inappropriateMessage = 'I hate this stupid class and the dumb teacher';
      const analysis = ContentAnalysisEngine.analyzeContent(inappropriateMessage);
      
      expect(['medium', 'high', 'critical']).toContain(analysis.riskLevel);
      expect(analysis.sentiment).toBe('negative');
      expect(analysis.flaggedKeywords.length).toBeGreaterThan(0);
    });

    it('should detect bullying language', () => {
      const bullyingMessage = 'You are so ugly and nobody likes you';
      const analysis = ContentAnalysisEngine.analyzeContent(bullyingMessage);
      
      expect(['high', 'critical']).toContain(analysis.riskLevel);
      expect(analysis.flaggedKeywords.length).toBeGreaterThan(0);
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });

    it('should detect emergency keywords', () => {
      const emergencyMessage = 'Help me, I feel unsafe and scared';
      const analysis = ContentAnalysisEngine.analyzeContent(emergencyMessage);
      
      expect(['high', 'critical']).toContain(analysis.riskLevel);
      expect(analysis.flaggedKeywords).toContain('unsafe');
    });

    it('should provide helpful suggestions', () => {
      const rudeMessage = 'This is stupid';
      const analysis = ContentAnalysisEngine.analyzeContent(rudeMessage);
      
      expect(analysis.suggestions.length).toBeGreaterThan(0);
      expect(analysis.suggestions[0]).toContain('respectful');
    });
  });

  describe('Sentiment Analysis', () => {
    it('should detect positive sentiment', () => {
      const positiveMessage = 'Thank you so much for your help! I really appreciate it.';
      const analysis = ContentAnalysisEngine.analyzeContent(positiveMessage);
      
      expect(analysis.sentiment).toBe('positive');
    });

    it('should detect negative sentiment', () => {
      const negativeMessage = 'I hate this assignment and I don\'t want to do it.';
      const analysis = ContentAnalysisEngine.analyzeContent(negativeMessage);
      
      expect(analysis.sentiment).toBe('negative');
    });

    it('should detect neutral sentiment', () => {
      const neutralMessage = 'What time is the test tomorrow?';
      const analysis = ContentAnalysisEngine.analyzeContent(neutralMessage);
      
      expect(analysis.sentiment).toBe('neutral');
    });
  });
});

describe('PermissionValidator', () => {
  const mockProfile = {
    id: 'user123',
    role: 'student' as const,
    school_id: 'school123',
    parent_id: 'parent123'
  };

  describe('Role Validation', () => {
    it('should validate student permissions correctly', () => {
      const canMessage = PermissionValidator.canUserMessage(
        mockProfile,
        { id: 'teacher123', role: 'teacher', school_id: 'school123' }
      );
      
      expect(canMessage).toBe(true);
    });

    it('should prevent cross-school messaging', () => {
      const canMessage = PermissionValidator.canUserMessage(
        mockProfile,
        { id: 'teacher123', role: 'teacher', school_id: 'different_school' }
      );
      
      expect(canMessage).toBe(false);
    });

    it('should prevent student-to-student direct messaging', () => {
      const canMessage = PermissionValidator.canUserMessage(
        mockProfile,
        { id: 'student456', role: 'student', school_id: 'school123' }
      );
      
      expect(canMessage).toBe(false);
    });
  });

  describe('Office Hours Validation', () => {
    it('should allow messaging during office hours', () => {
      // Mock current time to be during office hours (10 AM on Tuesday)
      const mockDate = new Date('2024-01-16T10:00:00Z'); // Tuesday
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const isAllowed = PermissionValidator.isWithinOfficeHours();
      expect(isAllowed).toBe(true);
      
      (global.Date as any).mockRestore();
    });

    it('should block messaging outside office hours', () => {
      // Mock current time to be outside office hours (8 PM on Tuesday)
      const mockDate = new Date('2024-01-16T20:00:00Z'); // Tuesday 8 PM
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const isAllowed = PermissionValidator.isWithinOfficeHours();
      expect(isAllowed).toBe(false);
      
      (global.Date as any).mockRestore();
    });

    it('should block messaging on weekends', () => {
      // Mock current time to be on Saturday
      const mockDate = new Date('2024-01-13T10:00:00Z'); // Saturday 10 AM
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const isAllowed = PermissionValidator.isWithinOfficeHours();
      expect(isAllowed).toBe(false);
      
      (global.Date as any).mockRestore();
    });
  });

  describe('Content Type Permissions', () => {
    it('should allow teachers to send announcements', () => {
      const teacherProfile = { ...mockProfile, role: 'teacher' as const };
      const canSend = PermissionValidator.canSendMessageType(teacherProfile, 'announcement');
      
      expect(canSend).toBe(true);
    });

    it('should prevent students from sending announcements', () => {
      const canSend = PermissionValidator.canSendMessageType(mockProfile, 'announcement');
      
      expect(canSend).toBe(false);
    });

    it('should allow emergency messages from all roles', () => {
      const canSend = PermissionValidator.canSendMessageType(mockProfile, 'emergency');
      
      expect(canSend).toBe(true);
    });
  });
});

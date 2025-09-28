import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as sendMessage } from '../../src/app/api/communications/send/route';
import { GET as getChannels, POST as createChannel } from '../../src/app/api/communications/channels/route';
import { POST as createEmergency } from '../../src/app/api/communications/emergency/route';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        is: jest.fn(() => ({
          eq: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          is: jest.fn()
        }))
      }))
    }))
  }))
};

jest.mock('../../src/lib/supabase/server', () => ({
  createClient: () => mockSupabase
}));

describe('Communications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Send Message API', () => {
    it('should send message successfully with valid data', async () => {
      // Mock authenticated user
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      // Mock user profile
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'user123', role: 'student', school_id: 'school123' }
            })
          }))
        }))
      });

      const request = new NextRequest('http://localhost/api/communications/send', {
        method: 'POST',
        body: JSON.stringify({
          channelId: 'channel123',
          content: 'Hello teacher!',
          messageType: 'text'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await sendMessage(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const request = new NextRequest('http://localhost/api/communications/send', {
        method: 'POST',
        body: JSON.stringify({
          channelId: 'channel123',
          content: 'Hello!',
          messageType: 'text'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await sendMessage(request);

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      const request = new NextRequest('http://localhost/api/communications/send', {
        method: 'POST',
        body: JSON.stringify({
          channelId: '',
          content: '',
          messageType: 'text'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await sendMessage(request);

      expect(response.status).toBe(400);
    });

    it('should flag inappropriate content', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'user123', role: 'student', school_id: 'school123' }
            })
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'msg123' }
            })
          }))
        }))
      });

      const request = new NextRequest('http://localhost/api/communications/send', {
        method: 'POST',
        body: JSON.stringify({
          channelId: 'channel123',
          content: 'I hate this stupid class',
          messageType: 'text'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await sendMessage(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.flagged).toBe(true);
    });
  });

  describe('Channels API', () => {
    it('should get user channels successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'channel123',
                    channel_type: 'direct',
                    created_at: '2024-01-01T00:00:00Z'
                  }
                ]
              })
            }))
          }))
        }))
      });

      const request = new NextRequest('http://localhost/api/communications/channels');
      const response = await getChannels(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.channels).toBeDefined();
      expect(Array.isArray(data.channels)).toBe(true);
    });

    it('should create new channel successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'user123', role: 'teacher', school_id: 'school123' }
            })
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'channel123', channel_type: 'direct' }
            })
          }))
        }))
      });

      const request = new NextRequest('http://localhost/api/communications/channels', {
        method: 'POST',
        body: JSON.stringify({
          channelType: 'direct',
          participantIds: ['user456'],
          isEncrypted: true
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createChannel(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.channel.id).toBe('channel123');
    });

    it('should validate channel type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      const request = new NextRequest('http://localhost/api/communications/channels', {
        method: 'POST',
        body: JSON.stringify({
          channelType: 'invalid_type',
          participantIds: ['user456']
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createChannel(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Emergency API', () => {
    it('should create emergency incident successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'user123', role: 'student', school_id: 'school123' }
            })
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'incident123' }
            })
          }))
        }))
      });

      const request = new NextRequest('http://localhost/api/communications/emergency', {
        method: 'POST',
        body: JSON.stringify({
          incidentType: 'safety_button',
          description: 'Student pressed safety button',
          teacherId: 'teacher123'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createEmergency(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.incidentId).toBe('incident123');
    });

    it('should validate required emergency fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      const request = new NextRequest('http://localhost/api/communications/emergency', {
        method: 'POST',
        body: JSON.stringify({
          incidentType: '',
          description: ''
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createEmergency(request);

      expect(response.status).toBe(400);
    });

    it('should set critical severity for safety button incidents', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      const mockInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'incident123', severity_level: 'critical' }
          })
        }))
      }));

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'user123', role: 'student', school_id: 'school123' }
            })
          }))
        })),
        insert: mockInsert
      });

      const request = new NextRequest('http://localhost/api/communications/emergency', {
        method: 'POST',
        body: JSON.stringify({
          incidentType: 'safety_button',
          description: 'Student feels unsafe'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      await createEmergency(request);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          severity_level: 'critical'
        })
      );
    });
  });
});

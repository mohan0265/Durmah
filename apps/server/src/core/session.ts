import crypto from 'crypto';
import { WidgetConfig } from '@durmah/schema';

interface Session {
  id: string;
  token: string;
  configId: string;
  userId?: string;
  orgId: string;
  sttSessionId?: string;
  audioSequence: number;
  messages: Array<{ role: string; content: string }>;
  listening: boolean;
  voiceEnabled: boolean;
  voiceId?: string;
  createdAt: Date;
  lastActivity: Date;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private tokenToSession: Map<string, string> = new Map();
  
  async createSession(params: {
    configId: string;
    userId?: string;
    orgId: string;
  }): Promise<Session> {
    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');
    
    const session: Session = {
      id: sessionId,
      token,
      configId: params.configId,
      userId: params.userId,
      orgId: params.orgId,
      audioSequence: 0,
      messages: [],
      listening: false,
      voiceEnabled: true,
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    this.sessions.set(sessionId, session);
    this.tokenToSession.set(token, sessionId);
    
    // Clean up old sessions
    this.cleanupOldSessions();
    
    return session;
  }
  
  validateToken(token: string): Session | null {
    const sessionId = this.tokenToSession.get(token);
    if (!sessionId) return null;
    
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    // Update last activity
    session.lastActivity = new Date();
    
    return session;
  }
  
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }
  
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.tokenToSession.delete(session.token);
      this.sessions.delete(sessionId);
    }
  }
  
  private cleanupOldSessions(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > maxAge) {
        this.endSession(sessionId);
      }
    }
  }
}

// Simple in-memory session store for guest users
// This avoids Redis/DB operations for guest sessions
import { EventEmitter } from "events";

class MemorySessionStore extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    // Clean up expired sessions every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get(sid, callback) {
    if (!this.sessions.has(sid)) {
      return callback(null, null);
    }

    const session = this.sessions.get(sid);
    if (session.expires < Date.now()) {
      this.sessions.delete(sid);
      return callback(null, null);
    }

    return callback(null, session.data);
  }

  set(sid, session, callback) {
    // Only store guest sessions in memory
    const isGuest =
      session &&
      session.passport &&
      session.passport.user &&
      session.passport.user.isGuest;

    if (isGuest) {
      const expires =
        session.cookie && session.cookie.expires
          ? new Date(session.cookie.expires).getTime()
          : Date.now() + 24 * 60 * 60 * 1000; // 24 hours default

      this.sessions.set(sid, {
        data: session,
        expires,
      });
    }

    if (callback) callback(null);
  }

  destroy(sid, callback) {
    this.sessions.delete(sid);
    if (callback) callback(null);
  }

  // Clean up expired sessions
  cleanup() {
    const now = Date.now();
    for (const [sid, session] of this.sessions.entries()) {
      if (session.expires < now) {
        this.sessions.delete(sid);
      }
    }
  }

  // Required for express-session
  all(callback) {
    const sessions = [];
    for (const [sid, session] of this.sessions.entries()) {
      if (session.expires >= Date.now()) {
        sessions.push({ sid, session: session.data });
      }
    }
    callback(null, sessions);
  }

  // Required for express-session
  touch(sid, session, callback) {
    if (this.sessions.has(sid)) {
      const storedSession = this.sessions.get(sid);
      const expires =
        session.cookie && session.cookie.expires
          ? new Date(session.cookie.expires).getTime()
          : Date.now() + 24 * 60 * 60 * 1000;

      storedSession.expires = expires;
      this.sessions.set(sid, storedSession);
    }
    if (callback) callback(null);
  }
}

export default MemorySessionStore;

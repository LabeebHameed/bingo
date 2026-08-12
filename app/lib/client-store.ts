export const SESSION_KEY = 'human_bingo_session';
export const OPERATOR_KEY = 'human_bingo_operator';

export interface BingoSession {
  eventCode: string;
  participantId: string;
  sessionToken: string;
  name: string;
  nickname: string;
  badge: string;
}

export interface OperatorSession {
  eventCode: string;
  operatorSecret: string;
  title: string;
}

function setCookie(name: string, value: string, days = 1) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function saveSession(session: BingoSession): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    // Also set a cookie so middleware can check auth
    setCookie('hb_session', session.participantId);
  }
}

export function loadSession(): BingoSession | null {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(SESSION_KEY);
    if (item) {
      try {
        return JSON.parse(item) as BingoSession;
      } catch (e) {
        console.error('Failed to parse session:', e);
      }
    }
  }
  return null;
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
    deleteCookie('hb_session');
  }
}

export function saveOperatorSession(session: OperatorSession): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(OPERATOR_KEY, JSON.stringify(session));
    setCookie('hb_operator', session.eventCode);
  }
}

export function loadOperatorSession(): OperatorSession | null {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(OPERATOR_KEY);
    if (item) {
      try {
        return JSON.parse(item) as OperatorSession;
      } catch (e) {
        console.error('Failed to parse operator session:', e);
      }
    }
  }
  return null;
}

export function clearOperatorSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(OPERATOR_KEY);
    deleteCookie('hb_operator');
  }
}

import type { SessionRecord } from '../types';

export function isSessionClosed(session: SessionRecord | null | undefined): boolean {
  if (!session) return false;
  return session.closed || Boolean(session.finalizedAt);
}


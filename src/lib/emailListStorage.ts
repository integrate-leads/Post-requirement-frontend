// Storage for email list contacts with dynamic CSV columns (per list, per user)

export interface ListContactsData {
  headers: string[];
  contacts: Record<string, string>[];
}

const STORAGE_KEY_PREFIX = 'emailListContacts';

function normalizeUserId(userId: string | undefined): string {
  return userId && userId.trim() ? userId : 'default';
}

export function getListContacts(userId: string | undefined, listId: string): ListContactsData | null {
  const uid = normalizeUserId(userId);
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}_${uid}_${listId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ListContactsData;
  } catch {
    return null;
  }
}

export function setListContacts(
  userId: string | undefined,
  listId: string,
  data: ListContactsData
): void {
  const uid = normalizeUserId(userId);
  localStorage.setItem(`${STORAGE_KEY_PREFIX}_${uid}_${listId}`, JSON.stringify(data));
}

export function getContactsWithFallback(
  userId: string | undefined,
  listId: string,
  legacyEmails?: string[]
): ListContactsData {
  const uid = normalizeUserId(userId);
  const stored = getListContacts(uid, listId);
  if (stored && stored.contacts.length >= 0) return stored;
  if (legacyEmails && legacyEmails.length > 0) {
    return {
      headers: ['Email'],
      contacts: legacyEmails.map((email) => ({ Email: email })),
    };
  }
  return { headers: [], contacts: [] };
}

// Import history entry for a list
export interface ImportHistoryEntry {
  id: string;
  date: string;
  status: 'completed' | 'failed' | 'partial';
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  errorCount: number;
  message?: string;
}

const HISTORY_KEY_PREFIX = 'emailListImportHistory';

export function getImportHistory(userId: string | undefined, listId: string): ImportHistoryEntry[] {
  const uid = normalizeUserId(userId);
  try {
    const raw = localStorage.getItem(`${HISTORY_KEY_PREFIX}_${uid}_${listId}`);
    if (!raw) return [];
    return JSON.parse(raw) as ImportHistoryEntry[];
  } catch {
    return [];
  }
}

export function addImportHistory(
  userId: string | undefined,
  listId: string,
  entry: Omit<ImportHistoryEntry, 'id' | 'date'>
): void {
  const uid = normalizeUserId(userId);
  const history = getImportHistory(uid, listId);
  const newEntry: ImportHistoryEntry = {
    ...entry,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };
  history.unshift(newEntry);
  if (history.length > 50) history.length = 50;
  localStorage.setItem(`${HISTORY_KEY_PREFIX}_${uid}_${listId}`, JSON.stringify(history));
}

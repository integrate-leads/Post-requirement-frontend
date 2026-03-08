// Storage for saved email templates (HTML output) per user

export interface SavedEmailTemplate {
  id: string;
  name: string;
  html: string;
  createdAt: number;
}

const STORAGE_KEY = 'emailBroadcastSavedTemplates';

function normalizeUserId(userId: string | undefined): string {
  return userId && userId.trim() ? userId : 'default';
}

export function getSavedTemplates(userId: string | undefined): SavedEmailTemplate[] {
  const uid = normalizeUserId(userId);
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${uid}`);
    if (!raw) return [];
    return JSON.parse(raw) as SavedEmailTemplate[];
  } catch {
    return [];
  }
}

export function saveTemplate(
  userId: string | undefined,
  name: string,
  html: string,
  existingId?: string
): SavedEmailTemplate {
  const uid = normalizeUserId(userId);
  const list = getSavedTemplates(uid);
  const now = Date.now();
  const id = existingId || `tpl_${now}_${Math.random().toString(36).slice(2, 9)}`;
  const entry: SavedEmailTemplate = {
    id,
    name: name.trim() || `Template ${list.length + 1}`,
    html,
    createdAt: existingId ? (list.find((t) => t.id === existingId)?.createdAt ?? now) : now,
  };
  const next = existingId
    ? list.map((t) => (t.id === existingId ? entry : t))
    : [...list, entry];
  localStorage.setItem(`${STORAGE_KEY}_${uid}`, JSON.stringify(next));
  return entry;
}

export function deleteSavedTemplate(userId: string | undefined, id: string): void {
  const uid = normalizeUserId(userId);
  const next = getSavedTemplates(uid).filter((t) => t.id !== id);
  localStorage.setItem(`${STORAGE_KEY}_${uid}`, JSON.stringify(next));
}

import { atom } from 'jotai';

export interface EmailBroadcastListEntry {
  id: string;
  listId?: number;
  label: string;
  metadata?: Record<string, unknown>;
}

/** Lists created in this session (Create new list). Merged with API lists for display. */
export const emailBroadcastCreatedListsAtom = atom<EmailBroadcastListEntry[]>([]);

/** Contacts per list (listId/tempId -> { headers, contacts }) for display in List Manager. Not localStorage. */
export const emailBroadcastContactsAtom = atom<Record<string, { headers: string[]; contacts: Record<string, string>[] }>>({});

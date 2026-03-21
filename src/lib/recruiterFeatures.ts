/**
 * Purchased subscription features for recruiters (IDs from product / admin Features).
 * API returns display names in `GET /admin/purchased/features` — we match by name (case-insensitive).
 */
export const RECRUITER_FEATURE_ID = {
  /** Email Broadcast — sidebar + all /recruiter/email-broadcast/* routes */
  EMAIL_BROADCAST: 2,
  /** Post Requirement — post-job, my-jobs, applications */
  POST_REQUIREMENT: 4,
} as const;

export function normalizeFeatureName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Matches API typo "Post Requirment" and correct spellings */
const POST_REQUIREMENT_ALIASES = [
  'post requirment',
  'post requirement',
  'post requirement pro',
];

const EMAIL_BROADCAST_ALIASES = [
  'email broadcasting pro',
  'email broadcast pro',
  'email broadcasting',
  'email broadcast',
];

function matchesAnyAlias(features: string[], aliases: string[]): boolean {
  const normalizedList = features.map(normalizeFeatureName);
  for (const alias of aliases) {
    const a = normalizeFeatureName(alias);
    for (const f of normalizedList) {
      if (f === a || f.includes(a) || a.includes(f)) {
        return true;
      }
    }
  }
  return false;
}

export function hasPostRequirementFeature(features: string[]): boolean {
  return matchesAnyAlias(features, POST_REQUIREMENT_ALIASES);
}

export function hasEmailBroadcastFeature(features: string[]): boolean {
  return matchesAnyAlias(features, EMAIL_BROADCAST_ALIASES);
}

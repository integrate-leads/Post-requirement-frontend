/**
 * Purchased subscription features for recruiters.
 * `GET /admin/purchased/features` returns `{ features: number[] }` — feature IDs only.
 * **4** = Post requirement · **2** = Email broadcast
 * Legacy responses (strings / `{ name }`) are still supported for name matching.
 */
export const RECRUITER_FEATURE_ID = {
  /** Email broadcast — sidebar + `/recruiter/email-broadcast/*` */
  EMAIL_BROADCAST: 2,
  /** Post requirement — post job, my jobs, applications */
  POST_REQUIREMENT: 4,
} as const;

function isNumericFeatureIdItem(item: unknown): boolean {
  if (typeof item === 'number' && Number.isFinite(item)) return true;
  if (typeof item === 'string' && /^\d+$/.test(item.trim())) return true;
  return false;
}

/** Coerce API `features` array entries that are plain numeric IDs */
export function extractPurchasedFeatureIds(raw: unknown[]): number[] {
  const s = new Set<number>();
  for (const item of raw) {
    if (typeof item === 'number' && Number.isFinite(item)) {
      s.add(Math.trunc(item));
    } else if (typeof item === 'string' && /^\d+$/.test(item.trim())) {
      s.add(Number(item.trim()));
    }
  }
  return [...s];
}

function coercePurchasedFeatureNames(raw: unknown[]): string[] {
  return raw
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && 'name' in item) {
        const n = (item as { name: unknown }).name;
        if (typeof n === 'string') return n.trim();
        if (n != null) return String(n).trim();
      }
      return '';
    })
    .filter((str) => str.length > 0);
}

/** Non-numeric items only — for legacy name-based responses */
export function extractLegacyPurchasedFeatureNames(raw: unknown[]): string[] {
  return coercePurchasedFeatureNames(raw.filter((item) => !isNumericFeatureIdItem(item)));
}

export function parsePurchasedFeaturesFromApi(raw: unknown): {
  featureIds: number[];
  legacyNames: string[];
} {
  if (!Array.isArray(raw)) return { featureIds: [], legacyNames: [] };
  return {
    featureIds: extractPurchasedFeatureIds(raw),
    legacyNames: extractLegacyPurchasedFeatureNames(raw),
  };
}

export function purchasedCapabilityFlags(
  featureIds: number[],
  legacyNames: string[]
): { hasPostRequirement: boolean; hasEmailBroadcast: boolean } {
  return {
    hasPostRequirement:
      featureIds.includes(RECRUITER_FEATURE_ID.POST_REQUIREMENT) ||
      hasPostRequirementFeature(legacyNames),
    hasEmailBroadcast:
      featureIds.includes(RECRUITER_FEATURE_ID.EMAIL_BROADCAST) ||
      hasEmailBroadcastFeature(legacyNames),
  };
}

export function normalizeFeatureName(s: unknown): string {
  if (s == null) return '';
  const str = typeof s === 'string' ? s : String(s);
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
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

function matchesAnyAlias(featureNames: string[], aliases: string[]): boolean {
  const normalizedList = featureNames.map(normalizeFeatureName);
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

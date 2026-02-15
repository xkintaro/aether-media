import type { ConversionSettings } from "@/types";

export function hasEffectiveOverride(
  overrideSettings: Partial<ConversionSettings> | undefined,
  globalSettings: ConversionSettings,
): boolean {
  if (!overrideSettings) return false;
  const overrideKeys = Object.keys(
    overrideSettings,
  ) as (keyof ConversionSettings)[];
  if (overrideKeys.length === 0) return false;
  for (const key of overrideKeys) {
    const overrideValue = overrideSettings[key];
    const globalValue = globalSettings[key];
    if (!isEqual(overrideValue, globalValue)) {
      return true;
    }
  }
  return false;
}

export function cleanOverrides(
  overrideSettings: Partial<ConversionSettings> | undefined,
  globalSettings: ConversionSettings,
): Partial<ConversionSettings> | undefined {
  if (!overrideSettings) return undefined;
  const overrideKeys = Object.keys(
    overrideSettings,
  ) as (keyof ConversionSettings)[];
  if (overrideKeys.length === 0) return undefined;
  const cleaned: Partial<ConversionSettings> = {};
  for (const key of overrideKeys) {
    const overrideValue = overrideSettings[key];
    const globalValue = globalSettings[key];
    if (!isEqual(overrideValue, globalValue)) {
      (cleaned as Record<string, unknown>)[key] = overrideValue;
    }
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!isEqual(aObj[key], bObj[key])) return false;
    }
    return true;
  }
  return false;
}

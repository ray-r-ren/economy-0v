/**
 * Format a number as compact USD currency (e.g., $1.2B/mo, $420M/mo)
 */
export function formatCompactUSD(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "No Data Yet";
  }

  const absValue = Math.abs(value);

  if (absValue >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B/mo`;
  } else if (absValue >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M/mo`;
  } else if (absValue >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K/mo`;
  } else {
    return `$${value.toFixed(0)}/mo`;
  }
}

/**
 * Format a number as monthly USD (e.g., $243/mo)
 */
export function formatMonthlyUSD(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "No Data Yet";
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M/mo`;
  } else if (value >= 1_000) {
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo`;
  } else {
    return `$${value.toFixed(0)}/mo`;
  }
}

/**
 * Format a percentage (e.g., 14.2%)
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "No Data Yet";
  }

  return `${value.toFixed(1)}%`;
}

/**
 * Format a multiplier (e.g., 3.4x)
 */
export function formatMultiplier(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "No Data Yet";
  }

  return `${value.toFixed(1)}x`;
}

/**
 * Format a date as readable string
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return "No Data Yet";
  }

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "No Data Yet";
  }
}

/**
 * Format top functions as tags
 */
export function formatTopFunctions(
  functions: string[] | null | undefined
): string[] {
  if (!functions || functions.length === 0) {
    return [];
  }

  // Return up to 3 functions
  return functions.slice(0, 3);
}

/**
 * Check if a value has data
 */
export function hasData(value: unknown): boolean {
  return value !== null && value !== undefined;
}

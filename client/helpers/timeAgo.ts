const preferredLanguage = navigator.languages[0];

function timeSince(
  date: Date
): [time: number, unit: Intl.RelativeTimeFormatUnit] {
  const seconds = Math.floor((Date.now() - +date) / 1000);
  const s = (n: number) => Math.floor(seconds / n);

  if (s(60 * 60 * 24 * 365) > 1) return [s(60 * 60 * 24 * 365), "years"];
  if (s(60 * 60 * 24 * 30) > 1) return [s(60 * 60 * 24 * 30), "months"];
  if (s(60 * 60 * 24) > 1) return [s(60 * 60 * 24), "days"];
  if (s(60 * 60) > 1) return [s(60 * 60), "hours"];
  if (s(60) > 1) return [s(60), "minutes"];
  return [s(1), "seconds"];
}

/**
 * Show the relative time if `Intl.RelativeTimeFormat` is supported
 * Oterwise fallback to the current date
 * TODO: make this reactive
 */
export function getRelativeDate(date: Date): string {
  if (
    typeof Intl === "undefined" ||
    typeof Intl.RelativeTimeFormat === "undefined"
  ) {
    return `on ${date.toLocaleDateString(preferredLanguage)}`;
  }
  const [number, units] = timeSince(date);
  if (!Number.isFinite(number)) return "-";
  return new Intl.RelativeTimeFormat(preferredLanguage).format(-number, units);
}

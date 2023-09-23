// simplest way without adding a date library...
export const getToday = () =>
  new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("/")
    .reverse()
    .join("-");

// the current time. Using locale DE because they use 24 hour time...
// this is a bit of a stupid hack to avoid another dependency
export const getNow = () =>
  new Intl.DateTimeFormat("de-DE", {
    timeZone: "Pacific/Auckland",
    timeStyle: "medium",
  }).format(new Date());

/**
 * GTFS allows hours >24, so we fix this
 */
export const normaliseGtfsTime = (hhmmss: string) => {
  const [hh, mm, ss] = hhmmss.split(":");
  const normalisedHour = `${+hh % 24}`.padStart(2, "0");
  return `${normalisedHour}:${mm}:${ss}`;
};

export const stripSeconds = (time: string) => time.replace(/:\d\d$/, "");

export const getInNMinutes = (minutes: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d;
};

// the current time. Using locale DE because they use 24 hour time...
// this is a bit of a stupid hack to avoid another dependency
export const getHHMM = (d = new Date()) =>
  new Intl.DateTimeFormat("de-DE", {
    timeZone: "Pacific/Auckland",
    timeStyle: "short",
  }).format(d);

/** true if the dates are the same, in the user's timezone */
export const isSameDay = (date1: Date, date2: Date) =>
  date1.toLocaleDateString() === date2.toLocaleDateString();

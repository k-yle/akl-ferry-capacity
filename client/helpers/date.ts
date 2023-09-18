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
    timeStyle: "medium",
  }).format(d);

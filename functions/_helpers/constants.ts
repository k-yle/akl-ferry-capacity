import type { FerryRoute, FerryTerminal } from "./types.def.js";

export const FERRY_TERMINALS = {
  21779: ["Hobsonville", -36.78759, 174.67225],
  41220: ["Beach Haven", -36.78993, 174.67868],
  61000: ["Waiheke", -36.78063, 174.99147],
  61089: ["Rangitoto Wharf", -36.80874, 174.86232],
  96001: ["Downtown", -36.84269, 174.76704],
  96401: ["Bayswater", -36.8222, 174.76633],
  96601: ["Birkenhead", -36.82281, 174.73393],
  96701: ["Devonport", -36.83317, 174.7954],
  96901: ["Gulf Harbour", -36.62435, 174.78779],
  97001: ["Half Moon Bay", -36.88085, 174.89592],
  97301: ["Te Onewa Northcote Point", -36.8269, 174.74634],
  97401: ["Pine Harbour", -36.88966, 174.98997],
  97501: ["Rakino", -36.72629, 174.95263],
  97701: ["Stanley Bay", -36.82801, 174.78129],
  98101: ["West Harbour", -36.81095, 174.64555],
  97503: ["Coromandel", -36.80984, 175.46803], // Hannaford's Wharf
  97504: ["Orapiu", -36.84494, 175.14926],
  97505: ["Rotoroa", -36.81789, 175.19406],
} satisfies Record<number, FerryTerminal>;

export const FERRY_ROUTES = {
  inner: {
    DEV: {
      name: "Devonport",
      shortName: "Devo",
      stationIds: [96001, 96701],
    },
    BAYS: {
      name: "Bayswater",
      shortName: "Bayswtr",
      stationIds: [96001, 96401],
    },
    BIRK: {
      name: "Birkenhead/Northcote",
      shortName: "Birk",
      stationIds: [96001, 96601, 97301, 96401],
    },
  },
  mid: {
    HOBS: {
      name: "Hobsonville/Beach Haven",
      shortName: "Hobs",
      stationIds: [96001, 21779, 41220],
    },
    HMB: {
      name: "Half Moon Bay",
      shortName: "HMB",
      stationIds: [96001, 97001],
    },
    WSTH: {
      name: "West Harbour",
      shortName: "West Hbr",
      stationIds: [96001, 98101],
    },
  },
  outer: {
    PINE: {
      name: "Pine Harbour",
      shortName: "PineH",
      stationIds: [96001, 97401],
    },
    GULF: {
      name: "Gulf Harbour",
      shortName: "Gulf Hbr",
      stationIds: [96001, 96901],
    },
    MTIA: {
      name: "Waiheke",
      shortName: "Waiheke",
      stationIds: [96001, 61000],
    },
  },
  tourist: {
    RANG: {
      name: "Rangitoto",
      shortName: "Rangi",
      stationIds: [96001, 61089],
    },
    RAK: {
      name: "Rakino Island",
      shortName: "Rakino",
      stationIds: [96001, 97501, 97701],
    },
    CORO: {
      name: "Coromandel/Rotoroa/Orapiu",
      shortName: "Coro",
      stationIds: [96001, 97505, 97504, 97503],
    },
  },
} satisfies Record<string, Record<string, FerryRoute>>;

export const API_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  Accept: "application/json",
  "Accept-Language": "en-NZ,en;q=0.9",
  Origin: "https://at.govt.nz",
  Referer: "https://at.govt.nz/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.48",
};

/* eslint-disable @typescript-eslint/consistent-type-imports */
declare module "*.txt" {
  const text: string;
  export default text;
}

declare module "*.geo.json" {
  export type HarbourZone = {
    name?: string;
    options?: {
      route: import("./types.def.js").Rsn;
      to: import("./types.def.js").StationId;
      angleRange?: { min: number; max: number };
    }[];
  };
  const geojson: import("geojson").FeatureCollection<
    import("geojson").Polygon,
    HarbourZone
  >;

  // @ts-expect-error -- TS doesn't like this, but it's how CF pages works.
  export = geojson;
}

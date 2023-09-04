declare module "*.txt" {
  const text: string;
  export default text;
}

declare module "*.geo.json" {
  export type HarbourZone = {
    name?: string;
    options?: {
      route: string;
      to: keyof typeof import("./constants.js").FERRY_TERMINALS;
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

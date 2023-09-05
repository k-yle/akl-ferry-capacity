import { useContext, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Map } from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
} from "react-leaflet";
import { Navbar } from "../../components/Navbar.tsx";
import { DataContext } from "../../context/DataContext.tsx";
import { svgBoat } from "../../components/svgBoat.tsx";

import "leaflet/dist/leaflet.css";
import { renderNameAndConfidence } from "./TerminalTab.tsx";

const CENTRE = [-36.83568, 174.77688] as [number, number];
const DEFAULT_ZOOM = 15;

export const MapPage: React.FC = () => {
  const { vessels, terminals } = useContext(DataContext);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const onMapReady = useCallback((map: Map) => {
    if (!map) return;
    map.on("zoom", () => setZoom(map.getZoom()));
  }, []);

  return (
    <>
      <Navbar title="Map" showBackButton />
      <MapContainer
        center={CENTRE}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ width: "100vw", height: "calc(100vh - 70px)" }}
        ref={onMapReady}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="LINZ Aerial Imagery">
            <TileLayer
              attribution='&copy; <a href="https://linz.govt.nz/linz-copyright">LINZ CC BY 4.0</a> &copy; <a href="https://linz.govt.nz/data/linz-data/linz-basemaps/data-attribution">Imagery Basemap contributors</a>'
              url="https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.jpg?api=d01egend5f8dv4zcbfj6z2t7rs3"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {vessels?.list.map((vessel) => (
          <Marker
            key={vessel.vessel.mmsi}
            position={[vessel.nmea2000.lat, vessel.nmea2000.lng]}
            icon={svgBoat({
              cog: vessel.nmea2000.cog || undefined,
              loa: vessel.vessel.loa,
              width: vessel.vessel.width,
              heading: vessel.nmea2000.heading || undefined,
              zoom,
            })}
          >
            <Popup>
              <strong>
                <Link to={`/vessels/${vessel.vessel.mmsi}`}>
                  {vessel.vessel.name}
                </Link>
              </strong>{" "}
              {vessel.trip ? (
                <>
                  {renderNameAndConfidence("", vessel.trip.confidence)}{" "}
                  operating the{" "}
                  {vessel.trip.stopTimes[0].time.replace(/:\d\d$/, "")}{" "}
                  <Link to={`/routes/${vessel.trip.rsn}`}>
                    {terminals?.[+vessel.trip.stopTimes[0].stop as never][0]} to{" "}
                    {
                      terminals?.[
                        +vessel.trip.stopTimes.at(-1)!.stop as never
                      ][0]
                    }
                  </Link>
                </>
              ) : (
                "(Out of Service)"
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
};

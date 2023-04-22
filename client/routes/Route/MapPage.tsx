import { useContext, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Map } from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Navbar } from "../../components/Navbar.tsx";
import { DataContext } from "../../context/DataContext.tsx";
import { svgBoat } from "../../components/svgBoat.tsx";

import "leaflet/dist/leaflet.css";

const CENTRE = [-36.83568, 174.77688] as [number, number];
const DEFAULT_ZOOM = 15;

export const MapPage: React.FC = () => {
  const { vessels } = useContext(DataContext);
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
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
                  operating{" "}
                  <Link to={`/routes/${vessel.trip.rsn}`}>
                    {vessel.trip.destination}
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

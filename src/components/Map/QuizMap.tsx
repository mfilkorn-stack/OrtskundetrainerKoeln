import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toLeafletPositions } from "../../utils/geo";
import type { Street, PointOfInterest } from "../../types/street";

// Fix default marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });
} catch (e) {
  console.warn("Leaflet icon init failed:", e);
}

const COLOGNE_CENTER: [number, number] = [50.9375, 6.9553];
const BOUNDS: L.LatLngBoundsExpression = [
  [50.915, 6.915],
  [50.955, 6.975],
];

function coloredMarkerSvg(color: string) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 2.4.7 4.6 1.9 6.5L12.5 41l10.6-22c1.2-1.9 1.9-4.1 1.9-6.5C25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/><circle cx="12.5" cy="12.5" r="5" fill="#fff"/></svg>`)}`;
}

let greenIcon: L.Icon;
let redIcon: L.Icon;
try {
  greenIcon = new L.Icon({
    iconUrl: coloredMarkerSvg("#2e7d32"),
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  redIcon = new L.Icon({
    iconUrl: coloredMarkerSvg("#C8102E"),
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
} catch (e) {
  console.warn("Leaflet custom icon init failed:", e);
  greenIcon = new L.Icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
  redIcon = new L.Icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
}

interface QuizMapProps {
  highlightStreet?: Street | null;
  highlightColor?: string;
  showCorrectStreet?: Street | null;
  userMarker?: [number, number] | null;
  onMapClick?: (latlng: [number, number]) => void;
  routeStart?: [number, number] | null;
  routeEnd?: [number, number] | null;
  routeStartLabel?: string;
  routeEndLabel?: string;
  routeLine?: [number, number][] | null;
  poi?: PointOfInterest | null;
  districts?: GeoJSON.FeatureCollection | null;
}

function MapClickHandler({ onClick }: { onClick: (latlng: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export function QuizMap({
  highlightStreet,
  highlightColor = "#C8102E",
  showCorrectStreet,
  userMarker,
  onMapClick,
  routeStart,
  routeEnd,
  routeStartLabel,
  routeEndLabel,
  routeLine,
  poi,
  districts,
}: QuizMapProps) {
  return (
    <div className="map-container">
      <MapContainer
        center={COLOGNE_CENTER}
        zoom={15}
        minZoom={13}
        maxZoom={18}
        maxBounds={BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {districts && (
          <GeoJSON
            data={districts}
            style={() => ({
              color: "#666",
              weight: 2,
              opacity: 0.4,
              fillOpacity: 0.05,
              dashArray: "5,5",
            })}
          />
        )}

        {highlightStreet && highlightStreet.geometry && (
          <Polyline
            positions={toLeafletPositions(highlightStreet.geometry)}
            pathOptions={{ color: highlightColor, weight: 6, opacity: 0.8 }}
          />
        )}

        {showCorrectStreet && showCorrectStreet.geometry && (
          <Polyline
            positions={toLeafletPositions(showCorrectStreet.geometry)}
            pathOptions={{ color: "#2e7d32", weight: 6, opacity: 0.8 }}
          />
        )}

        {userMarker && (
          <Marker position={userMarker}>
            <Popup>Dein Tipp</Popup>
          </Marker>
        )}

        {routeStart && (
          <Marker position={routeStart} icon={greenIcon}>
            <Popup>{routeStartLabel ?? "Start"}</Popup>
          </Marker>
        )}

        {routeEnd && (
          <Marker position={routeEnd} icon={redIcon}>
            <Popup>{routeEndLabel ?? "Ziel"}</Popup>
          </Marker>
        )}

        {routeLine && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: "#1565c0", weight: 5, opacity: 0.7, dashArray: "10,6" }}
          />
        )}

        {poi && (
          <Marker position={poi.coordinates}>
            <Popup>
              <strong>{poi.name}</strong>
              {poi.address && <br />}
              {poi.address}
            </Popup>
          </Marker>
        )}

        {onMapClick && <MapClickHandler onClick={onMapClick} />}
      </MapContainer>
    </div>
  );
}

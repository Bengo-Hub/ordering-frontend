"use client";

import type { LatLngTuple, LeafletEventHandlerFnMap } from "leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { cn } from "@/lib/utils";

import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: LatLngTuple = [-0.0607, 34.2855];

export type MapMarker = {
  position: LatLngTuple;
  label?: string;
};

export type LocationMapInnerProps = {
  value?: LatLngTuple;
  defaultCenter?: LatLngTuple;
  onChange?: (coords: LatLngTuple) => void;
  markers?: MapMarker[];
  polyline?: LatLngTuple[];
  interactive?: boolean;
  height?: number | string;
  className?: string;
  zoom?: number;
};

function SetViewOnChange({ center }: { center: LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

function DraggableMarker({
  position,
  onChange,
  interactive,
}: {
  position: LatLngTuple;
  onChange?: (coords: LatLngTuple) => void;
  interactive: boolean;
}) {
  const [markerPos, setMarkerPos] = useState<LatLngTuple>(position);

  useEffect(() => {
    setMarkerPos(position);
  }, [position]);

  useMapEvents({
    click(e) {
      if (!interactive || !onChange) return;
      const next: LatLngTuple = [e.latlng.lat, e.latlng.lng];
      setMarkerPos(next);
      onChange(next);
    },
  });

  const eventHandlers = useMemo<LeafletEventHandlerFnMap | undefined>(() => {
    if (!interactive || !onChange) return undefined;
    return {
      dragend(event) {
        const latlng = (event.target as L.Marker).getLatLng();
        const next: LatLngTuple = [latlng.lat, latlng.lng];
        setMarkerPos(next);
        onChange(next);
      },
    };
  }, [interactive, onChange]);

  const markerEventProps: { eventHandlers?: LeafletEventHandlerFnMap } = {};
  if (eventHandlers) {
    markerEventProps.eventHandlers = eventHandlers;
  }

  return (
    <Marker
      position={markerPos}
      icon={markerIcon}
      draggable={interactive && !!onChange}
      {...markerEventProps}
    />
  );
}

export function LocationMapInner({
  value,
  defaultCenter = DEFAULT_CENTER,
  onChange,
  markers = [],
  polyline,
  interactive = true,
  height = 280,
  className,
  zoom = 15,
}: LocationMapInnerProps) {
  const center = value ?? defaultCenter;
  const style = {
    height: typeof height === "number" ? `${height}px` : height,
    width: "100%",
    borderRadius: "1.5rem",
  } as const;

  return (
    <div className={cn("relative z-0 overflow-hidden", className)} style={style}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        style={{ height: "100%", width: "100%" }}
        dragging={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <SetViewOnChange center={center} />
        {polyline ? <Polyline positions={polyline} color="#f36a0c" weight={4} opacity={0.7} /> : null}
        {interactive && onChange ? <DraggableMarker position={center} onChange={onChange} interactive /> : null}
        {!interactive && value ? <Marker position={value} icon={markerIcon} /> : null}
        {markers.map((marker) => (
          <Marker key={`${marker.position[0]}-${marker.position[1]}-${marker.label ?? "marker"}`} position={marker.position} icon={markerIcon}>
            {marker.label ? <Popup>{marker.label}</Popup> : null}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

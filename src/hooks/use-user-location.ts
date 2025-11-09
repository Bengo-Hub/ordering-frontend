"use client";

import type { LatLngTuple } from "leaflet";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_COORDS: LatLngTuple = [-0.0607, 34.2855];

type Status = "idle" | "loading" | "resolved" | "error";

type Options = {
  watch?: boolean;
  fallback?: LatLngTuple;
};

export function useUserLocation(options: Options = {}) {
  const { watch = false, fallback = DEFAULT_COORDS } = options;
  const [coords, setCoords] = useState<LatLngTuple>(fallback);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setError("Geolocation is not supported in this browser.");
      setCoords(fallback);
      return;
    }

    setStatus("loading");
    const onSuccess = (position: GeolocationPosition) => {
      const next: LatLngTuple = [position.coords.latitude, position.coords.longitude];
      setCoords(next);
      setStatus("resolved");
      setError(null);
    };
    const onError = (err: GeolocationPositionError) => {
      setStatus("error");
      setError(err.message ?? "Unable to access your location.");
      setCoords(fallback);
    };

    if (watch) {
      const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 12_000,
      });
      return () => navigator.geolocation.clearWatch(watchId);
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 60_000,
      timeout: 12_000,
    });
  }, [fallback, watch]);

  useEffect(() => {
    if (!watch) return;
    const cleanup = requestLocation();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [requestLocation, watch]);

  return {
    coords,
    status,
    error,
    requestLocation,
    setCoords,
  };
}

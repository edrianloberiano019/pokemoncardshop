"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";

type DeliveryTrailMapProps = {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  fromLabel?: string;
  toLabel?: string;
  /** 0 = still at the seller, 1 = arrived at the buyer. Position is fixed, not animated. */
  progress: number;
};

function createDotIcon(Lmod: typeof import("leaflet"), color: string) {
  return Lmod.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function createTruckIcon(Lmod: typeof import("leaflet")) {
  return Lmod.divIcon({
    className: "",
    html: '<div style="background:#172554;border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px rgba(0,0,0,0.5)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="15" height="15"><path d="M3 6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v3h2.5a1 1 0 0 1 .8.4l2.5 3.33a1 1 0 0 1 .2.6V16a1 1 0 0 1-1 1h-1a2.5 2.5 0 1 1-5 0H10a2.5 2.5 0 1 1-5 0H4a1 1 0 0 1-1-1Zm14 8.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-9.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/></svg></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

async function fetchRoadRoute(
  Lmod: typeof import("leaflet"),
  from: L.LatLng,
  to: L.LatLng,
): Promise<L.LatLng[] | null> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const coords: [number, number][] | undefined =
      data?.routes?.[0]?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;

    return coords.map(([lng, lat]) => Lmod.latLng(lat, lng));
  } catch {
    return null;
  }
}

function pathLength(points: L.LatLng[]) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += points[i - 1].distanceTo(points[i]);
  }
  return total;
}

function pointAlongPath(
  points: L.LatLng[],
  totalLength: number,
  fraction: number,
  Lmod: typeof import("leaflet"),
) {
  if (points.length === 1) return points[0];

  const targetDist = totalLength * fraction;
  let accumulated = 0;

  for (let i = 1; i < points.length; i++) {
    const segLength = points[i - 1].distanceTo(points[i]);
    if (accumulated + segLength >= targetDist) {
      const segFraction = segLength === 0 ? 0 : (targetDist - accumulated) / segLength;
      return Lmod.latLng(
        points[i - 1].lat + (points[i].lat - points[i - 1].lat) * segFraction,
        points[i - 1].lng + (points[i].lng - points[i - 1].lng) * segFraction,
      );
    }
    accumulated += segLength;
  }

  return points[points.length - 1];
}

export default function DeliveryTrailMap({
  fromLat,
  fromLng,
  toLat,
  toLng,
  fromLabel = "Seller",
  toLabel = "You",
  progress,
}: DeliveryTrailMapProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    import("leaflet").then(async (leafletModule) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const Lmod = leafletModule.default;

      const from = Lmod.latLng(fromLat, fromLng);
      const to = Lmod.latLng(toLat, toLng);

      const map = Lmod.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      }).fitBounds(Lmod.latLngBounds([from, to]), { padding: [30, 30] });
      mapRef.current = map;

      cleanup = () => {
        map.remove();
        mapRef.current = null;
      };

      Lmod.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      Lmod.marker(from, { icon: createDotIcon(Lmod, "#172554") })
        .addTo(map)
        .bindTooltip(fromLabel, { direction: "top" });
      Lmod.marker(to, { icon: createDotIcon(Lmod, "#15803d") })
        .addTo(map)
        .bindTooltip(toLabel, { direction: "top" });

      if (cancelled) return;
      const routePoints = (await fetchRoadRoute(Lmod, from, to)) ?? [from, to];
      if (cancelled || !mapRef.current) return;

      Lmod.polyline(routePoints, {
        color: "#2563eb",
        weight: 3,
        opacity: 0.85,
      }).addTo(map);

      map.fitBounds(Lmod.latLngBounds(routePoints), { padding: [30, 30] });

      const totalLength = pathLength(routePoints);
      const position = pointAlongPath(
        routePoints,
        totalLength,
        clampedProgress,
        Lmod,
      );

      Lmod.marker(position, { icon: createTruckIcon(Lmod) })
        .addTo(map)
        .bindTooltip(`${Math.round(clampedProgress * 100)}% of the way`, {
          direction: "top",
        });
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLat, fromLng, toLat, toLng, clampedProgress]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-48 rounded-sm border border-blue-900 overflow-hidden"
    />
  );
}

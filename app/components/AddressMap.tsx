"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface ReverseGeocodedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

type AddressMapProps = {
  lat: number | null;
  lng: number | null;
  onChange: (
    lat: number,
    lng: number,
    address: ReverseGeocodedAddress,
  ) => void;
};

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;
const PIN_ZOOM = 16;

function createPinIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "",
    html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#172554" width="32" height="32"><path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.79 6.61 12.06 6.9 12.32a.75.75 0 0 0 1.2 0c.29-.26 6.9-6.53 6.9-12.32C19.5 5.36 16.14 2 12 2Zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z"/></svg>',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodedAddress> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
  );
  const data = await res.json();
  const addr = data?.address ?? {};

  return {
    street:
      [addr.house_number, addr.road].filter(Boolean).join(" ") ||
      addr.suburb ||
      "",
    city: addr.city || addr.town || addr.village || addr.municipality || "",
    state: addr.state || addr.region || "",
    zip: addr.postcode || "",
    country: addr.country || "",
  };
}

export default function AddressMap({ lat, lng, onChange }: AddressMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    import("leaflet").then((leafletModule) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const L = leafletModule.default;

      const hasInitial = lat != null && lng != null;
      const center: [number, number] = hasInitial
        ? [lat as number, lng as number]
        : DEFAULT_CENTER;

      const map = L.map(containerRef.current).setView(
        center,
        hasInitial ? PIN_ZOOM : DEFAULT_ZOOM,
      );
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const placeMarker = (position: L.LatLng) => {
        if (!markerRef.current) {
          markerRef.current = L.marker(position, {
            icon: createPinIcon(L),
            draggable: true,
          }).addTo(map);
          markerRef.current.on("dragend", async () => {
            const pos = markerRef.current!.getLatLng();
            const address = await reverseGeocode(pos.lat, pos.lng);
            onChange(pos.lat, pos.lng, address);
          });
        } else {
          markerRef.current.setLatLng(position);
        }
      };

      if (hasInitial) {
        placeMarker(L.latLng(lat as number, lng as number));
      }

      map.on("click", async (e: L.LeafletMouseEvent) => {
        placeMarker(e.latlng);
        map.setView(e.latlng, Math.max(map.getZoom(), PIN_ZOOM));
        const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        onChange(e.latlng.lat, e.latlng.lng, address);
      });

      if (!hasInitial && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], PIN_ZOOM);
          },
          () => {},
          { timeout: 5000 },
        );
      }

      cleanup = () => {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-64 rounded-sm border border-blue-900 overflow-hidden"
    />
  );
}

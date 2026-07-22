"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Incident, CameraFeed } from "@/lib/situationTypes";

// Tirat Carmel city center (city hall / כיכר העירייה area).
const CITY_CENTER: [number, number] = [32.7661, 34.9694];

// Matches the real municipal brand palette (see globals.css) rather than
// generic traffic-light colors, so the map reads as "this city's" system.
const SEVERITY_COLOR: Record<string, string> = {
  low: "#91b63e",
  medium: "#ffc220",
  high: "#f6a31c",
  critical: "#e2483d",
};

const CAMERA_COLOR = "#00a9cc";

interface Props {
  incidents: Incident[];
  cameras: CameraFeed[];
}

export function CityMap({ incidents, cameras }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const renderMarkers = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (L: any) => {
      if (!mapRef.current) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      for (const incident of incidents) {
        if (incident.lat == null || incident.lng == null) continue;
        const color = SEVERITY_COLOR[incident.severity] ?? SEVERITY_COLOR.medium;
        const marker = L.circleMarker([incident.lat, incident.lng], {
          radius: 11,
          color: "#ffffff",
          weight: 2,
          fillColor: color,
          fillOpacity: 0.95,
          className: incident.severity === "critical" ? "animate-pulse" : "",
        }).addTo(mapRef.current);

        marker.bindPopup(
          `<strong>${escapeHtml(incident.title)}</strong><br/>` +
            `${escapeHtml(incident.address ?? "")}<br/>` +
            `סטטוס: ${statusLabel(incident.status)}<br/>` +
            (incident.injured_count
              ? `נפגעים: ${incident.injured_count}<br/>`
              : "") +
            (incident.description ? escapeHtml(incident.description) : "")
        );
        markersRef.current.push(marker);
      }

      for (const camera of cameras) {
        if (camera.lat == null || camera.lng == null) continue;
        const marker = L.marker([camera.lat, camera.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="background:${CAMERA_COLOR};color:#fff;border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;">📷</div>`,
            iconSize: [26, 26],
          }),
        }).addTo(mapRef.current);
        marker.bindPopup(`<strong>${escapeHtml(camera.name)}</strong>`);
        markersRef.current.push(marker);
      }

      if (incidents.length === 0) {
        const cityMarker = L.marker(CITY_CENTER, {
          icon: L.divIcon({
            className: "",
            html: '<div style="background:#0068ac;color:#fff;border-radius:9999px;width:14px;height:14px;border:2px solid white;box-shadow:0 0 0 4px rgba(0,104,172,0.25);"></div>',
            iconSize: [14, 14],
          }),
        }).addTo(mapRef.current);
        cityMarker.bindPopup("<strong>מרכז העיר טירת כרמל</strong>");
        markersRef.current.push(cityMarker);
      }
    },
    [incidents, cameras]
  );

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(CITY_CENTER, 14);

      // Dark basemap (CARTO, built on OpenStreetMap data) so the real street
      // map sits naturally inside a dark command-screen instead of clashing
      // with a bright daylight map style.
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      mapRef.current = map;
      renderMarkers(L);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => renderMarkers(L));
  }, [renderMarkers]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full min-h-[420px] rounded-xl overflow-hidden border border-matzav-border"
    />
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "active":
      return "פעיל";
    case "monitoring":
      return "במעקב";
    case "resolved":
      return "טופל";
    default:
      return status;
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Incident, CameraFeed } from "@/lib/situationTypes";

// Tirat Carmel city center.
const CITY_CENTER: [number, number] = [32.7615, 34.9673];

const SEVERITY_COLOR: Record<string, string> = {
  low: "#3aa935",
  medium: "#f4b220",
  high: "#f47b20",
  critical: "#d92626",
};

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
            html: '<div style="background:#1b4d89;color:#fff;border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;">📷</div>',
            iconSize: [26, 26],
          }),
        }).addTo(mapRef.current);
        marker.bindPopup(`<strong>${escapeHtml(camera.name)}</strong>`);
        markersRef.current.push(marker);
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

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
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
      className="h-full w-full min-h-[420px] rounded-xl overflow-hidden border border-slate-700"
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

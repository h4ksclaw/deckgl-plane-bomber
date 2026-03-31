"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MapLibreGL from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ScatterplotLayer, ArcLayer, HeatmapLayer, TextLayer } from "deck.gl";
import { Deck } from "@deck.gl/core";
import type { Layer, PickingInfo } from "@deck.gl/core";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY!;

const AIRPORTS = [
  { name: "Toronto Pearson", code: "YYZ", coordinates: [-79.6306, 43.6777], traffic: 50 },
  { name: "Newark Liberty", code: "EWR", coordinates: [-74.1745, 40.6895], traffic: 45 },
  { name: "JFK Intl", code: "JFK", coordinates: [-73.7781, 40.6413], traffic: 55 },
  { name: "LAX Intl", code: "LAX", coordinates: [-118.4081, 33.9425], traffic: 60 },
  { name: "O'Hare Intl", code: "ORD", coordinates: [-87.9073, 41.9742], traffic: 48 },
  { name: "Hartsfield-Jackson", code: "ATL", coordinates: [-84.4281, 33.6407], traffic: 65 },
  { name: "Denver Intl", code: "DEN", coordinates: [-104.6737, 39.8561], traffic: 40 },
  { name: "San Francisco", code: "SFO", coordinates: [-122.379, 37.6193], traffic: 42 },
  { name: "Miami Intl", code: "MIA", coordinates: [-80.2906, 25.7959], traffic: 35 },
  { name: "Dallas/Fort Worth", code: "DFW", coordinates: [-97.038, 32.8998], traffic: 38 },
  { name: "Seattle-Tacoma", code: "SEA", coordinates: [-122.3088, 47.4502], traffic: 32 },
  { name: "Logan Intl", code: "BOS", coordinates: [-71.0224, 42.3601], traffic: 30 },
  { name: "McCarran Intl", code: "LAS", coordinates: [-115.1537, 36.084], traffic: 28 },
  { name: "Dulles Intl", code: "IAD", coordinates: [-77.4565, 38.9521], traffic: 33 },
  { name: "MSP Intl", code: "MSP", coordinates: [-93.222, 44.8848], traffic: 25 },
  { name: "Detroit Metro", code: "DTW", coordinates: [-83.3534, 42.2124], traffic: 22 },
  { name: "Philadelphia Intl", code: "PHL", coordinates: [-75.2411, 39.8719], traffic: 26 },
  { name: "Charlotte Douglas", code: "CLT", coordinates: [-80.9508, 35.2144], traffic: 29 },
  { name: "Phoenix Sky Harbor", code: "PHX", coordinates: [-112.0116, 33.4343], traffic: 27 },
  { name: "Houston Bush", code: "IAH", coordinates: [-95.3414, 29.9844], traffic: 31 },
];

const ROUTES = [
  { source: "JFK", target: "LAX" }, { source: "JFK", target: "SFO" }, { source: "JFK", target: "ORD" },
  { source: "ORD", target: "LAX" }, { source: "ORD", target: "SFO" }, { source: "ATL", target: "LAX" },
  { source: "ATL", target: "ORD" }, { source: "ATL", target: "MIA" }, { source: "DFW", target: "LAX" },
  { source: "DFW", target: "ORD" }, { source: "DEN", target: "SFO" }, { source: "DEN", target: "ORD" },
  { source: "SEA", target: "LAX" }, { source: "SEA", target: "ORD" }, { source: "BOS", target: "LAX" },
  { source: "BOS", target: "ORD" }, { source: "YYZ", target: "JFK" }, { source: "YYZ", target: "ORD" },
  { source: "YYZ", target: "LAX" }, { source: "EWR", target: "SFO" }, { source: "EWR", target: "LAX" },
  { source: "EWR", target: "ORD" }, { source: "IAD", target: "SFO" }, { source: "IAD", target: "LAX" },
  { source: "MIA", target: "LAX" }, { source: "PHX", target: "ORD" }, { source: "IAH", target: "LAX" },
  { source: "CLT", target: "LAX" }, { source: "MSP", target: "LAX" }, { source: "LAS", target: "ORD" },
];

const airportMap = Object.fromEntries(AIRPORTS.map((a) => [a.code, a]));

const INITIAL_VIEW = { longitude: -90, latitude: 40, zoom: 4, pitch: 45, bearing: -15 };

function getLayers(showHeatmap: boolean): Layer[] {
  return [
    new ArcLayer({
      id: "flight-arcs",
      data: ROUTES.map((r) => ({
        source: airportMap[r.source]?.coordinates || [0, 0],
        target: airportMap[r.target]?.coordinates || [0, 0],
        sourceName: r.source,
        targetName: r.target,
      })),
      getSourcePosition: (d: { source: number[] }) => d.source as [number, number],
      getTargetPosition: (d: { target: number[] }) => d.target as [number, number],
      getSourceColor: [0, 150, 255],
      getTargetColor: [255, 100, 0],
      getWidth: 1.5,
      pickable: true,
    }),
    ...(showHeatmap
      ? [
          new HeatmapLayer({
            id: "traffic-heatmap",
            data: AIRPORTS,
            getPosition: (d: { coordinates: number[] }) => d.coordinates as [number, number],
            getWeight: (d: { traffic: number }) => d.traffic,
            radiusPixels: 60,
            intensity: 1,
            threshold: 0.05,
            opacity: 0.7,
          }),
        ]
      : []),
    new ScatterplotLayer({
      id: "airports",
      data: AIRPORTS,
      getPosition: (d: { coordinates: number[] }) => d.coordinates as [number, number],
      getRadius: (d: { traffic: number }) => d.traffic * 200,
      getFillColor: (d: { traffic: number }) =>
        d.traffic > 50 ? [255, 100, 100, 200] : d.traffic > 35 ? [255, 200, 50, 200] : [50, 200, 255, 200],
      stroked: true,
      getLineWidth: 1,
      getLineColor: [255, 255, 255, 100],
      pickable: true,
    }),
    new TextLayer({
      id: "airport-labels",
      data: AIRPORTS.filter((a) => a.traffic >= 35),
      getPosition: (d: { coordinates: number[] }) => d.coordinates as [number, number],
      getText: (d: { code: string }) => d.code,
      getSize: 12,
      getColor: [255, 255, 255, 220],
      getPixelOffset: [0, -8],
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "bold",
    }),
  ];
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const deckCanvas = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<MapLibreGL.Map | null>(null);
  const deckRef = useRef<Deck | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new MapLibreGL.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/toner-v2/style.json?key=${MAPTILER_KEY}`,
      center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
      zoom: INITIAL_VIEW.zoom,
      pitch: INITIAL_VIEW.pitch,
      bearing: INITIAL_VIEW.bearing,
    });

    map.addControl(new MapLibreGL.NavigationControl(), "top-right");
    map.addControl(new MapLibreGL.ScaleControl(), "bottom-right");

    map.on("load", () => {
      // Add 3D terrain
      map.addSource("maptiler-dem", {
        type: "raster-dem",
        tiles: [`https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.webp?key=${MAPTILER_KEY}`],
        tileSize: 256,
        encoding: "terrarium",
      });
      map.setTerrain({ source: "maptiler-dem", exaggeration: 1.5 });

      // Add 3D buildings
      map.addSource("openmaptiles", {
        type: "vector",
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
      });
      map.addLayer({
        id: "3d-buildings",
        source: "openmaptiles",
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 10,
        paint: {
          "fill-extrusion-color": [
            "interpolate", ["linear"], ["get", "render_height"],
            0, "#4a5568", 50, "#718096", 200, "#a0aec0", 400, "#e2e8f0",
          ],
          "fill-extrusion-height": [
            "interpolate", ["linear"], ["zoom"],
            10, 0, 10.5, ["get", "render_height"],
          ],
          "fill-extrusion-base": [
            "case", [">=", ["get", "zoom"], 16], ["get", "render_min_height"], 0,
          ],
          "fill-extrusion-opacity": 0.7,
        },
      });
    });

    mapRef.current = map;

    // Initialize deck.gl overlaying the map
    const deck = new Deck({
      canvas: "deck-canvas",
      parent: mapContainer.current,
      initialViewState: INITIAL_VIEW,
      controller: false,
      layers: getLayers(false),
      onHover: (info: PickingInfo) => {
        if (info.object) {
          const d = info.object as { name?: string; code?: string; sourceName?: string; targetName?: string };
          const text = d.sourceName
            ? `${d.sourceName} → ${d.targetName}`
            : `${d.name} (${d.code})`;
          setHoverInfo({ x: info.x!, y: info.y!, text });
        } else {
          setHoverInfo(null);
        }
      },
    });
    deckRef.current = deck;

    // Sync deck view with map view
    const syncViews = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const pitch = map.getPitch();
      const bearing = map.getBearing();
      deck.setProps({
        viewState: {
          longitude: center.lng,
          latitude: center.lat,
          zoom,
          pitch,
          bearing,
        },
      });
    };

    map.on("move", syncViews);
    map.on("zoom", syncViews);
    map.on("rotate", syncViews);
    map.on("pitch", syncViews);

    return () => {
      map.remove();
      deck.finalize();
    };
  }, []);

  // Update layers when heatmap toggle changes
  useEffect(() => {
    if (deckRef.current) {
      deckRef.current.setProps({ layers: getLayers(showHeatmap) });
    }
  }, [showHeatmap]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%", position: "absolute" }}>
        <canvas
          id="deck-canvas"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Controls */}
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          background: "rgba(15,23,42,0.9)",
          backdropFilter: "blur(12px)",
          borderRadius: 12,
          padding: "16px 20px",
          border: "1px solid rgba(100,116,139,0.2)",
          maxWidth: 280,
        }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
            ✈️ Flight Network
          </h2>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}>
            US airport traffic &amp; routes — deck.gl + MapLibre + MapTiler 3D
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              style={{
                background: showHeatmap ? "rgba(59,130,246,0.8)" : "rgba(51,65,85,0.6)",
                color: "#e2e8f0",
                border: "1px solid rgba(100,116,139,0.3)",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              🌡️ Heatmap {showHeatmap ? "ON" : "OFF"}
            </button>
          </div>
        </div>
        <div style={{
          background: "rgba(15,23,42,0.8)",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 11,
          color: "#64748b",
          border: "1px solid rgba(100,116,139,0.15)",
        }}>
          <span style={{ color: "#4a90d9" }}>●</span> High &nbsp;
          <span style={{ color: "#f5c842" }}>●</span> Medium &nbsp;
          <span style={{ color: "#32c8ff" }}>●</span> Low
        </div>
      </div>

      {/* Tooltip */}
      {hoverInfo && (
        <div style={{
          position: "absolute",
          left: hoverInfo.x + 12,
          top: hoverInfo.y - 28,
          zIndex: 20,
          background: "rgba(15,23,42,0.95)",
          color: "#e2e8f0",
          borderRadius: 6,
          padding: "6px 10px",
          fontSize: 13,
          pointerEvents: "none",
          whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}>
          {hoverInfo.text}
        </div>
      )}
    </div>
  );
}

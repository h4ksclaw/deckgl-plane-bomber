"use client";

import { useEffect, useRef } from "react";

const KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY!;

export default function Home() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let map: any; // eslint-disable-line

    import("maplibre-gl").then((mod) => {
      import("maplibre-gl/dist/maplibre-gl.css");

      map = new mod.default.Map({
        container: ref.current!,
        style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${KEY}`,
        center: [-73.9857, 40.7484],
        zoom: 15,
        pitch: 60,
        bearing: -20,
        maxZoom: 22,
        minPitch: 20,
      });

      map.addControl(new mod.default.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new mod.default.ScaleControl(), "bottom-left");

      // Prevent infinite loops from missing sprite images
      map.on("styleimagemissing", (e: any) => {
        map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array([0, 0, 0, 0]) });
      });

      map.on("load", () => {
        map.addSource("dem", {
          type: "raster-dem",
          url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${KEY}`,
        });
        map.setTerrain({ source: "dem", exaggeration: 1.5 });

        map.addSource("buildings", {
          type: "vector",
          url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${KEY}`,
        });

        map.addLayer({
          id: "3d-buildings",
          type: "fill-extrusion",
          source: "buildings",
          "source-layer": "building",
          minzoom: 14,
          paint: {
            "fill-extrusion-color": "#ddd",
            "fill-extrusion-height": ["get", "render_height"],
            "fill-extrusion-base": ["get", "render_min_height"],
            "fill-extrusion-opacity": 0.8,
          },
        });
      });
    });

    return () => { map?.remove(); };
  }, []);

  return <div ref={ref} style={{ width: "100vw", height: "100vh" }} />;
}

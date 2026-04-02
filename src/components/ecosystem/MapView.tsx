import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Map, { Marker, Popup, NavigationControl, useMap } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { EcosystemProject } from "@/types/ecosystem";
import { getCategoryColor } from "@/data/ecosystemData";

interface MapViewProps {
  projects: EcosystemProject[];
  onSelectProject?: (project: EcosystemProject) => void;
}

// ── Country coordinate lookup ──
const COUNTRY_COORDS: Record<string, [number, number]> = {
  singapore: [1.35, 103.82], malaysia: [3.14, 101.69], indonesia: [-6.21, 106.85],
  thailand: [13.76, 100.5], vietnam: [21.03, 105.85], philippines: [14.6, 120.98],
  myanmar: [16.87, 96.2], cambodia: [11.56, 104.92],
  india: [20.59, 78.96], "sri lanka": [7.87, 80.77], pakistan: [30.38, 69.35],
  bangladesh: [23.68, 90.36], nepal: [28.39, 84.12],
  china: [35.86, 104.2], japan: [36.2, 138.25], "south korea": [35.91, 127.77],
  taiwan: [23.7, 120.96], "hong kong": [22.32, 114.17],
  uae: [23.42, 53.85], "united arab emirates": [23.42, 53.85], dubai: [25.2, 55.27],
  qatar: [25.35, 51.18], "saudi arabia": [23.89, 45.08], israel: [31.05, 34.85],
  turkey: [38.96, 35.24],
  uk: [55.38, -3.44], "united kingdom": [55.38, -3.44], england: [52.36, -1.17],
  germany: [51.17, 10.45], france: [46.23, 2.21], spain: [40.46, -3.75],
  portugal: [39.4, -8.22], italy: [41.87, 12.57], netherlands: [52.13, 5.29],
  switzerland: [46.82, 8.23], sweden: [60.13, 18.64], norway: [60.47, 8.47],
  denmark: [56.26, 9.5], finland: [61.92, 25.75], ireland: [53.14, -7.69],
  austria: [47.52, 14.55], poland: [51.92, 19.15], "czech republic": [49.82, 15.47],
  estonia: [58.6, 25.01], latvia: [56.88, 24.6], lithuania: [55.17, 23.88],
  romania: [45.94, 24.97], bulgaria: [42.73, 25.49], croatia: [45.1, 15.2],
  greece: [39.07, 21.82],
  us: [37.09, -95.71], usa: [37.09, -95.71], "united states": [37.09, -95.71],
  canada: [56.13, -106.35], mexico: [23.63, -102.55], brazil: [-14.24, -51.93],
  argentina: [-38.42, -63.62], colombia: [4.57, -74.3], chile: [-35.68, -71.54],
  peru: [-9.19, -75.02], "costa rica": [9.75, -83.75],
  nigeria: [9.08, 8.68], "south africa": [-30.56, 22.94], kenya: [-0.02, 37.91],
  egypt: [26.82, 30.8], morocco: [31.79, -7.09], ghana: [7.95, -1.02],
  ethiopia: [9.15, 40.49], tanzania: [-6.37, 34.89], rwanda: [-1.94, 29.87],
  australia: [-25.27, 133.78], "new zealand": [-40.9, 174.89],
};

function guessProjectLocation(project: EcosystemProject): [number, number] | null {
  const searchText = [
    project.description || "",
    project.name || "",
    ...(project.nsProfileUrls || []),
  ].join(" ").toLowerCase();
  for (const [country, coords] of Object.entries(COUNTRY_COORDS)) {
    if (searchText.includes(country)) return coords;
  }
  return null;
}

// CartoDB Dark Matter — proper dark basemap with filled continents
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function MapView({ projects, onSelectProject }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const [popupProject, setPopupProject] = useState<{
    project: EcosystemProject;
    lat: number;
    lon: number;
  } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoomedIntoNode, setZoomedIntoNode] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1.8);
  const [preloading, setPreloading] = useState(true);

  // NS HQ — Forest City Marina Hotel, Gelang Patah, Malaysia
  const NS_LAT = 1.3356;
  const NS_LON = 103.5943;

  // All projects are placed at their node's exact coordinates.
  // Spiral offset is in PIXELS (screen-space), not geographic.
  const projectPositions = useMemo(() => {
    return projects.map((project, i) => {
      let baseLat = NS_LAT;
      let baseLon = NS_LON;
      if (project.locations?.length) {
        const [lat, lon] = project.locations[0].split(",").map(Number);
        if (!isNaN(lat) && !isNaN(lon)) {
          baseLat = lat;
          baseLon = lon;
        }
      }
      // Pixel-based spiral offset so dots orbit the node at consistent screen distance
      const angle = (i / Math.max(projects.length, 1)) * Math.PI * 6;
      const radius = 20 + (i / Math.max(projects.length, 1)) * 50;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      return { project, lat: baseLat, lon: baseLon, offsetX, offsetY };
    });
  }, [projects]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 80,
          latitude: 20,
          zoom: 1.8,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE as any}
        attributionControl={false}
        maxZoom={zoomedIntoNode ? 16 : 4}
        minZoom={1}
        onZoom={(e) => setCurrentZoom(e.viewState.zoom)}
        onLoad={(e) => {
          const map = e.target;

          // Cliff shadow layers
          const layers = map.getStyle()?.layers || [];
          const landLayer = layers.find(
            (l: any) => l.type === "fill" && /land|earth/i.test(l.id)
          );
          if (landLayer) {
            const src = (landLayer as any)["source"];
            const srcLayer = (landLayer as any)["source-layer"];
            if (src) {
              const offsets: [number, number, string][] = [
                [5, 6, "rgba(0,0,0,0.6)"],
                [3.5, 4.2, "rgba(0,0,0,0.4)"],
                [2, 2.5, "rgba(0,0,0,0.25)"],
                [1, 1.2, "rgba(5,10,15,0.15)"],
              ];
              offsets.forEach(([tx, ty, color], i) => {
                map.addLayer(
                  {
                    id: `land-cliff-${i}`,
                    type: "fill",
                    source: src,
                    ...(srcLayer ? { "source-layer": srcLayer } : {}),
                    paint: {
                      "fill-color": color,
                      "fill-translate": [tx, ty],
                    },
                  } as any,
                  landLayer.id
                );
              });
            }
          }

          // Preload tiles around NS HQ while map is hidden behind overlay
          const preloadZooms = [6, 10, 15];
          let i = 0;
          const preloadNext = () => {
            if (i >= preloadZooms.length) {
              // Done — restore view and reveal
              map.jumpTo({ center: [80, 20], zoom: 1.8 });
              map.once("idle", () => setPreloading(false));
              return;
            }
            const z = preloadZooms[i++];
            map.jumpTo({ center: [NS_LON, NS_LAT], zoom: z });
            map.once("idle", preloadNext);
          };
          map.once("idle", preloadNext);
        }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {projectPositions.map(({ project, lat, lon, offsetX, offsetY }) => {
          const catColor = getCategoryColor(project.category);
          const isNS = project.tags?.includes("nsOfficial");
          const isHovered = hoveredId === project.id;
          const isPopup = popupProject?.project.id === project.id;

          // Fade in: invisible below zoom 3, full at 5
          const DOT_SHOW_ZOOM = 1.5;
          const DOT_FULL_ZOOM = 3;
          const dotOpacity = currentZoom < DOT_SHOW_ZOOM ? 0
            : currentZoom < DOT_FULL_ZOOM ? (currentZoom - DOT_SHOW_ZOOM) / (DOT_FULL_ZOOM - DOT_SHOW_ZOOM)
            : 1;

          return (
            <Marker
              key={project.id}
              longitude={lon}
              latitude={lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setPopupProject({ project, lat, lon });
                onSelectProject?.(project);
              }}
            >
              <div
                onMouseEnter={() => setHoveredId(project.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative flex items-center justify-center cursor-pointer"
                style={{
                  width: 28, height: 28,
                  opacity: dotOpacity,
                  transform: `translate(${offsetX}px, ${offsetY}px)`,
                  transition: "opacity 0.3s",
                  pointerEvents: dotOpacity > 0.3 ? "auto" : "none",
                }}
              >
                {/* Outer glow */}
                <div
                  className="absolute rounded-full transition-all duration-300"
                  style={{
                    width: isHovered || isPopup ? 24 : isNS ? 18 : 14,
                    height: isHovered || isPopup ? 24 : isNS ? 18 : 14,
                    background: `radial-gradient(circle, ${catColor}30 0%, transparent 70%)`,
                  }}
                />
                {/* Core dot */}
                <div
                  className="absolute rounded-full transition-all duration-200 border"
                  style={{
                    width: isHovered || isPopup ? 10 : isNS ? 8 : 6,
                    height: isHovered || isPopup ? 10 : isNS ? 8 : 6,
                    backgroundColor: catColor,
                    borderColor: catColor + "60",
                    boxShadow: `0 0 ${isHovered ? 12 : 6}px ${catColor}80`,
                  }}
                />
                {/* NS ring */}
                {isNS && (
                  <div
                    className="absolute rounded-full border animate-ping"
                    style={{
                      width: 16,
                      height: 16,
                      borderColor: catColor + "40",
                      animationDuration: "3s",
                    }}
                  />
                )}
              </div>
            </Marker>
          );
        })}

        {/* NS HQ Node — renders on top of project dots */}
        <Marker longitude={103.5943} latitude={1.3356} anchor="center" style={{ zIndex: 10 }}>
          <div
            className="relative flex items-center justify-center cursor-pointer"
            style={{ width: 48, height: 48, zIndex: 10 }}
            onClick={(e) => {
              e.stopPropagation();
              setZoomedIntoNode(true);
              setTimeout(() => {
                mapRef.current?.flyTo({
                  center: [NS_LON, NS_LAT],
                  zoom: 15,
                  duration: 1200,
                });
              }, 50);
            }}
          >
            <div
              className="absolute rounded-full animate-ping"
              style={{
                width: 48, height: 48,
                border: "1.5px solid rgba(255,255,255,0.15)",
                animationDuration: "3s",
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                width: 40, height: 40,
                background: "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(4px)",
              }}
            />
            <svg
              width="18"
              height="12"
              viewBox="0 0 30 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative z-10"
            >
              <path
                d="M9.04883 0C14.4015 1.58136e-05 18.0466 0.857342 21.4111 0.857422C24.5739 0.857419 26.8592 0.730968 29.0273 0.478516C29.2469 0.453142 29.4413 0.621298 29.4414 0.838867V19.2832C29.4411 19.4516 29.323 19.5976 29.1543 19.626C27.6623 19.8749 24.1475 20 21.4111 20C18.4798 19.9999 14.1466 19.1426 9.55859 19.1426C5.14747 19.1426 2.72034 19.3956 0.432617 19.7822C0.207077 19.8203 0.000341557 19.6499 0 19.4248V1.0332C3.69636e-05 0.851129 0.136849 0.697243 0.320312 0.673828C2.56107 0.389876 5.35291 0 9.04883 0ZM13.4951 8.76074C11.9493 8.65328 10.6111 8.66895 9.43164 8.66895V11.1475C10.2548 11.1475 11.7426 11.1495 13.4922 11.2998C13.4903 13.3072 13.492 15.0743 13.5088 15.4326C14.1458 15.5754 14.5286 15.5754 15.791 15.8018V11.5508C17.549 11.7554 18.8433 11.8613 20.1377 11.8613V9.29004C18.7357 9.29004 17.6985 9.187 15.791 8.98242V4.79199C15.7758 4.78999 14.1434 4.57627 13.5088 4.57617C13.5086 4.61678 13.5007 6.53989 13.4951 8.76074Z"
                fill="white"
              />
            </svg>
          </div>
        </Marker>

        {popupProject && (
          <Popup
            longitude={popupProject.lon}
            latitude={popupProject.lat}
            anchor="bottom"
            onClose={() => setPopupProject(null)}
            closeButton={false}
            className="ns-map-popup"
            offset={16}
          >
            <div
              className="px-3 py-2 rounded-md cursor-pointer"
              style={{
                background: "#111118",
                border: `1px solid ${getCategoryColor(popupProject.project.category)}30`,
                minWidth: 120,
              }}
              onClick={() => onSelectProject?.(popupProject.project)}
            >
              <div className="flex items-center gap-2">
                {popupProject.project.emoji && (
                  <span className="text-sm">{popupProject.project.emoji}</span>
                )}
                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "#e0e4e0", fontFamily: "monospace" }}
                  >
                    {popupProject.project.name}
                  </p>
                  {popupProject.project.description && (
                    <p
                      className="text-[10px] mt-0.5 line-clamp-1"
                      style={{ color: "#5a6a60" }}
                    >
                      {popupProject.project.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Back to world view button */}
      {zoomedIntoNode && (
        <button
          onClick={() => {
            setZoomedIntoNode(false);
            setPopupProject(null);
            setTimeout(() => {
              mapRef.current?.flyTo({
                center: [80, 20],
                zoom: 1.8,
                duration: 1500,
              });
            }, 50);
          }}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors"
          style={{
            background: "rgba(17,17,24,0.9)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span style={{ fontSize: 14 }}>&larr;</span>
          World View
        </button>
      )}

      {/* Loading overlay — hides tile preloading jumps */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#0c0c14",
          pointerEvents: preloading ? "auto" : "none",
          opacity: preloading ? 1 : 0,
          transition: "opacity 0.6s ease-out",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20" />
      </div>

      {/* Override maplibre popup styles */}
      <style>{`
        .ns-map-popup .maplibregl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        .ns-map-popup .maplibregl-popup-tip {
          border-top-color: #111118 !important;
        }
        .maplibregl-ctrl-group {
          background: #111118 !important;
          border: 1px solid #1e2e2a !important;
          border-radius: 6px !important;
        }
        .maplibregl-ctrl-group button {
          border-color: #1e2e2a !important;
        }
        .maplibregl-ctrl-group button + button {
          border-top-color: #1e2e2a !important;
        }
        .maplibregl-ctrl-group button span {
          filter: invert(1) brightness(0.7) !important;
        }
      `}</style>
    </div>
  );
}

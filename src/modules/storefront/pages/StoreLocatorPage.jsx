// Store locator — interactive Google Map with all showrooms as markers.
// On load the browser is asked for location; the nearest store is highlighted
// and scrolled into view in the sidebar list. Works gracefully when location
// is denied (shows all stores, no "nearest" badge).
import { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useStoreLocations } from "../hooks/useShop";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

// Haversine distance in km between two {lat,lng} points.
function haversine(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin2 = (x) => Math.sin(x / 2) ** 2;
  const c =
    2 *
    Math.asin(
      Math.sqrt(
        sin2(dLat) +
          Math.cos((a.lat * Math.PI) / 180) *
            Math.cos((b.lat * Math.PI) / 180) *
            sin2(dLng)
      )
    );
  return R * c;
}

// Default map center (India) — used before we know the user's location.
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const MAP_CONTAINER = { width: "100%", height: "100%" };
const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
};

export function StoreLocatorPage() {
  const { data: stores = [], isLoading, isError } = useStoreLocations();

  // Stores that actually have coordinates.
  const mappable = stores.filter((s) => s.lat != null && s.lng != null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: MAPS_KEY,
    version: "weekly",
    libraries: ["places"],
  });

  const mapRef = useRef(null);
  const cardRefs = useRef({});

  const [userPos, setUserPos] = useState(null);       // {lat, lng} | null
  const [locationErr, setLocationErr] = useState(""); // message when denied
  const [nearestId, setNearestId] = useState(null);   // store._id of nearest
  const [activeId, setActiveId] = useState(null);     // InfoWindow open on map
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(5);

  // Ask for location once stores are loaded and map is ready.
  useEffect(() => {
    if (!mappable.length || !isLoaded) return;

    if (!navigator.geolocation) {
      setLocationErr("Geolocation is not supported by your browser.");
      fitAllMarkers();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setUserPos(pos);
        setMapCenter(pos);
        setMapZoom(11);

        // Find closest store.
        let best = null;
        let bestDist = Infinity;
        mappable.forEach((s) => {
          const d = haversine(pos, { lat: s.lat, lng: s.lng });
          if (d < bestDist) { bestDist = d; best = s._id; }
        });
        setNearestId(best);

        // Scroll the nearest card into view.
        setTimeout(() => {
          if (best && cardRefs.current[best]) {
            cardRefs.current[best].scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }
        }, 400);
      },
      () => {
        setLocationErr("Location access denied. Showing all stores.");
        fitAllMarkers();
      },
      { timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappable.length, isLoaded]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  function fitAllMarkers() {
    if (!mapRef.current || !mappable.length) return;
    // eslint-disable-next-line no-undef
    const bounds = new window.google.maps.LatLngBounds();
    mappable.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    mapRef.current.fitBounds(bounds, 40);
  }

  function flyTo(store) {
    setMapCenter({ lat: store.lat, lng: store.lng });
    setMapZoom(15);
    setActiveId(store._id);
  }

  const nearestStore = stores.find((s) => s._id === nearestId);
  const nearestDist = nearestStore && userPos
    ? haversine(userPos, { lat: nearestStore.lat, lng: nearestStore.lng })
    : null;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "2rem", fontWeight: 800, color: "#16130e" }}>
          Our Showrooms
        </h1>
        <p style={{ margin: 0, color: "#6b6250" }}>
          Find the nearest Garuda showroom to visit us in person.
        </p>
      </div>

      {/* Nearest store banner */}
      {nearestStore && nearestDist !== null && (
        <div style={styles.nearestBanner}>
          <div style={styles.nearestBannerLeft}>
            <span style={styles.nearestPill}>📍 Nearest Store</span>
            <span style={styles.nearestName}>{nearestStore.name}</span>
            <span style={styles.nearestCity}>
              {[nearestStore.city, nearestStore.state].filter(Boolean).join(", ")}
            </span>
          </div>
          <div style={styles.nearestRight}>
            <span style={styles.nearestDist}>{nearestDist.toFixed(1)} km away</span>
            {nearestStore.lat != null && (
              <button
                style={styles.directionsBtn}
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${nearestStore.lat},${nearestStore.lng}`,
                    "_blank"
                  )
                }
              >
                Get Directions ↗
              </button>
            )}
          </div>
        </div>
      )}

      {/* Location error notice */}
      {locationErr && (
        <p style={styles.locErr}>⚠️ {locationErr}</p>
      )}

      {isLoading ? (
        <p style={{ color: "#6b6250" }}>Loading showrooms…</p>
      ) : isError ? (
        <p style={{ color: "#c0392b" }}>Failed to load showrooms.</p>
      ) : stores.length === 0 ? (
        <div className="sf-empty">No showrooms available yet.</div>
      ) : (
        <div style={styles.layout}>
          {/* ── Left: store list ── */}
          <div style={styles.list}>
            {stores.map((s) => {
              const isNearest = s._id === nearestId;
              const isMappable = s.lat != null && s.lng != null;
              const dist =
                userPos && isMappable
                  ? haversine(userPos, { lat: s.lat, lng: s.lng })
                  : null;

              return (
                <div
                  key={s._id}
                  ref={(el) => (cardRefs.current[s._id] = el)}
                  style={{
                    ...styles.card,
                    ...(isNearest ? styles.cardNearest : {}),
                  }}
                  onClick={() => isMappable && flyTo(s)}
                  role={isMappable ? "button" : undefined}
                  tabIndex={isMappable ? 0 : undefined}
                  onKeyDown={(e) => e.key === "Enter" && isMappable && flyTo(s)}
                >
                  {/* Card header */}
                  <div style={styles.cardHead}>
                    <div style={styles.pinBubble}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke={isNearest ? "#b58a2e" : "#666"} strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.storeName}>
                        {s.name}
                        {isNearest && (
                          <span style={styles.nearestTag}>Nearest</span>
                        )}
                      </div>
                      {dist !== null && (
                        <div style={styles.distTag}>{dist.toFixed(1)} km away</div>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  {s.address && (
                    <p style={styles.addr}>{s.address}</p>
                  )}
                  <p style={styles.addr}>
                    {[s.city, s.state, s.pincode].filter(Boolean).join(", ")}
                  </p>

                  {/* Hours */}
                  {(s.openingTime || s.closingTime) && (
                    <p style={styles.hours}>
                      🕐 {s.openingTime || "—"} – {s.closingTime || "—"}
                    </p>
                  )}

                  {/* Actions */}
                  <div style={styles.actions}>
                    {s.phone && (
                      <a href={`tel:${s.phone}`} style={styles.action}
                        onClick={(e) => e.stopPropagation()}>
                        📞 {s.phone}
                      </a>
                    )}
                    {s.email && (
                      <a href={`mailto:${s.email}`} style={styles.action}
                        onClick={(e) => e.stopPropagation()}>
                        ✉️ {s.email}
                      </a>
                    )}
                    {isMappable && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.directionsLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Directions ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Right: Google Map ── */}
          <div style={styles.mapWrap}>
            {!isLoaded ? (
              <div style={styles.mapPlaceholder}>Loading map…</div>
            ) : (
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER}
                center={mapCenter}
                zoom={mapZoom}
                options={MAP_OPTIONS}
                onLoad={onMapLoad}
              >
                {/* User location — blue dot */}
                {userPos && (
                  <Marker
                    position={userPos}
                    title="Your location"
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 7,
                      fillColor: "#4285F4",
                      fillOpacity: 1,
                      strokeColor: "#fff",
                      strokeWeight: 2.5,
                    }}
                  />
                )}

                {/* Store markers — red for regular, gold for nearest */}
                {mappable.map((s) => (
                  <Marker
                    key={s._id}
                    position={{ lat: s.lat, lng: s.lng }}
                    title={s.name}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 11,
                      fillColor: s._id === nearestId ? "#b58a2e" : "#e53935",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 3,
                    }}
                    onClick={() => {
                      setActiveId(s._id);
                      cardRefs.current[s._id]?.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                      });
                    }}
                  />
                ))}

                {/* InfoWindow for active store */}
                {activeId && mappable.find((s) => s._id === activeId) && (() => {
                  const s = mappable.find((x) => x._id === activeId);
                  return (
                    <InfoWindow
                      position={{ lat: s.lat, lng: s.lng }}
                      onCloseClick={() => setActiveId(null)}
                    >
                      <div style={{ maxWidth: 220, fontFamily: "Inter, sans-serif" }}>
                        <strong style={{ fontSize: 14, color: "#16130e" }}>{s.name}</strong>
                        {s.address && <p style={{ margin: "4px 0 2px", fontSize: 12, color: "#555" }}>{s.address}</p>}
                        <p style={{ margin: "0 0 4px", fontSize: 12, color: "#555" }}>
                          {[s.city, s.state, s.pincode].filter(Boolean).join(", ")}
                        </p>
                        {(s.openingTime || s.closingTime) && (
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: "#888" }}>
                            🕐 {s.openingTime} – {s.closingTime}
                          </p>
                        )}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12, color: "#b58a2e", fontWeight: 600, textDecoration: "none" }}
                        >
                          Get Directions ↗
                        </a>
                      </div>
                    </InfoWindow>
                  );
                })()}
              </GoogleMap>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline styles (consistent with storefront.css palette) ──────────────────

const styles = {
  nearestBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    background: "linear-gradient(135deg, #fff6dc, #f0e6c8)",
    border: "1px solid #e2d8bd",
    borderRadius: 14,
    padding: "14px 20px",
    marginBottom: 20,
  },
  nearestBannerLeft: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  nearestPill: {
    background: "#b58a2e",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 999,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  nearestName: { fontWeight: 700, color: "#16130e", fontSize: 15 },
  nearestCity: { color: "#6b6250", fontSize: 13 },
  nearestRight: { display: "flex", alignItems: "center", gap: 12 },
  nearestDist: { fontWeight: 700, color: "#b58a2e", fontSize: 14 },
  directionsBtn: {
    background: "#16130e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  locErr: {
    color: "#8a5e1a",
    background: "#fff8e1",
    border: "1px solid #f0d080",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 16,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: 20,
    alignItems: "start",
    // Responsive override applied via media query not available in inline styles —
    // handled via the sf-storelocator class added to the wrapping div in the CSS below.
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxHeight: 640,
    overflowY: "auto",
    paddingRight: 4,
  },
  mapWrap: {
    height: 640,
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #e6e6e6",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    position: "sticky",
    top: 90,
  },
  mapPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9a8f73",
    fontSize: 14,
    background: "#faf8f2",
  },
  card: {
    background: "#fff",
    border: "1px solid #eee5cf",
    borderRadius: 12,
    padding: 16,
    cursor: "default",
    transition: "box-shadow 0.18s, border-color 0.18s",
  },
  cardNearest: {
    border: "2px solid #b58a2e",
    background: "#fffdf5",
    boxShadow: "0 6px 20px rgba(181,138,46,0.12)",
  },
  cardHead: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  pinBubble: {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "#fff6dc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  storeName: {
    fontWeight: 700,
    fontSize: 14,
    color: "#16130e",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  nearestTag: {
    background: "#b58a2e",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 999,
    letterSpacing: "0.04em",
  },
  distTag: { fontSize: 11, color: "#b58a2e", fontWeight: 600, marginTop: 2 },
  addr: { margin: "2px 0", fontSize: 12, color: "#6b6250", lineHeight: 1.5 },
  hours: { margin: "6px 0 4px", fontSize: 12, color: "#9a8f73" },
  actions: { marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 },
  action: {
    fontSize: 12,
    color: "#16130e",
    textDecoration: "none",
    background: "#f7f3e7",
    padding: "4px 10px",
    borderRadius: 999,
    fontWeight: 500,
  },
  directionsLink: {
    fontSize: 12,
    color: "#b58a2e",
    fontWeight: 700,
    textDecoration: "none",
    background: "#fff6dc",
    padding: "4px 10px",
    borderRadius: 999,
  },
};

export default StoreLocatorPage;

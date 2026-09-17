// CoordinatePicker — 3-way coordinate input used on showroom create & settings forms.
//
// Option 1 · Manual   — type lat / lng numbers directly.
// Option 2 · Detect   — browser GPS auto-fills both fields.
// Option 3 · Search   — type an address → Google Places autocomplete →
//                       small map preview with a draggable marker confirms it.
//
// Props:
//   lat      {string|number}  controlled value
//   lng      {string|number}  controlled value
//   onChange {({lat, lng}) => void}  called whenever either value changes
//   disabled {boolean}        locks all inputs (view-only mode)

import { useState, useRef, useEffect, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const MAPS_KEY    = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const LIBRARIES   = ["places"];
const MAP_SIZE    = { width: "100%", height: 260 };
const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
};

// ── tiny helpers ─────────────────────────────────────────────────────────────

function round(n) {
  return Math.round(Number(n) * 1e7) / 1e7;
}

function isValid(lat, lng) {
  if (lat === "" || lng === "") return false;
  const la = Number(lat);
  const lo = Number(lng);
  return (
    !isNaN(la) && !isNaN(lo) &&
    la >= -90  && la <= 90  &&   // valid latitude range
    lo >= -180 && lo <= 180      // valid longitude range
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function CoordinatePicker({ lat, lng, onChange, disabled = false }) {
  const [mode, setMode]           = useState("manual");   // "manual" | "detect" | "search"
  const [detecting, setDetecting] = useState(false);
  const [detectErr, setDetectErr] = useState("");
  const [searchQ, setSearchQ]     = useState("");
  const [suggestions, setSuggs]   = useState([]);
  const [showSuggs, setShowSuggs] = useState(false);
  const [mapCenter, setMapCenter] = useState(
    isValid(lat, lng)
      ? { lat: Number(lat), lng: Number(lng) }
      : { lat: 20.5937, lng: 78.9629 }   // default: India
  );

  const autocompleteService = useRef(null);
  const geocoderRef         = useRef(null);
  const searchRef           = useRef(null);
  const suggsRef            = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: MAPS_KEY,
    version: "weekly",
    libraries: LIBRARIES,
  });

  // Initialise Places + Geocoder once the API is ready.
  useEffect(() => {
    if (!isLoaded) return;
    autocompleteService.current = new window.google.maps.places.AutocompleteService();
    geocoderRef.current         = new window.google.maps.Geocoder();
  }, [isLoaded]);

  // Sync map center when lat/lng change externally.
  useEffect(() => {
    if (isValid(lat, lng)) {
      setMapCenter({ lat: Number(lat), lng: Number(lng) });
    }
  }, [lat, lng]);

  // Close suggestions when clicking outside.
  useEffect(() => {
    function onPointerDown(e) {
      if (
        suggsRef.current && !suggsRef.current.contains(e.target) &&
        searchRef.current && !searchRef.current.contains(e.target)
      ) {
        setShowSuggs(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // ── Option 1: Manual input ──────────────────────────────────────────────

  function handleManual(field, value) {
    const next = { lat: String(lat), lng: String(lng), [field]: value };
    onChange({ lat: next.lat, lng: next.lng });
  }

  const manualInvalid =
    (lat !== "" && (isNaN(Number(lat)) || Number(lat) < -90  || Number(lat) > 90))  ||
    (lng !== "" && (isNaN(Number(lng)) || Number(lng) < -180 || Number(lng) > 180));

  // ── Option 2: Detect GPS ────────────────────────────────────────────────

  function detect() {
    setDetectErr("");
    if (!navigator.geolocation) {
      setDetectErr("Geolocation is not supported by your browser.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: String(round(coords.latitude)), lng: String(round(coords.longitude)) };
        onChange(pos);
        setMapCenter({ lat: Number(pos.lat), lng: Number(pos.lng) });
        setDetecting(false);
      },
      () => {
        setDetectErr("Location access denied. Please allow location or use another option.");
        setDetecting(false);
      },
      { timeout: 10000 }
    );
  }

  // ── Option 3: Search ────────────────────────────────────────────────────

  function handleSearchInput(e) {
    const q = e.target.value;
    setSearchQ(q);
    if (!q.trim() || !autocompleteService.current) { setSuggs([]); setShowSuggs(false); return; }
    autocompleteService.current.getPlacePredictions(
      { input: q, types: ["geocode", "establishment"] },
      (preds, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && preds) {
          setSuggs(preds);
          setShowSuggs(true);
        } else {
          setSuggs([]);
          setShowSuggs(false);
        }
      }
    );
  }

  function selectSuggestion(placeId, description) {
    setSearchQ(description);
    setShowSuggs(false);
    setSuggs([]);
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ placeId }, (results, status) => {
      if (status === "OK" && results[0]) {
        const loc = results[0].geometry.location;
        const pos = { lat: String(round(loc.lat())), lng: String(round(loc.lng())) };
        onChange(pos);
        setMapCenter({ lat: Number(pos.lat), lng: Number(pos.lng) });
      }
    });
  }

  // Dragging the marker updates coordinates.
  const onMarkerDrag = useCallback((e) => {
    const pos = {
      lat: String(round(e.latLng.lat())),
      lng: String(round(e.latLng.lng())),
    };
    onChange(pos);
    setMapCenter({ lat: Number(pos.lat), lng: Number(pos.lng) });
  }, [onChange]);

  // ── render ────────────────────────────────────────────────────────────────

  const hasCoords = isValid(lat, lng);

  return (
    <div style={S.root}>

      {/* Mode tabs */}
      {!disabled && (
        <div style={S.modeTabs}>
          {[
            { key: "manual", icon: "✏️", label: "Enter manually" },
            { key: "detect", icon: "📍", label: "Detect my location" },
            { key: "search", icon: "🔍", label: "Search address" },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              style={{ ...S.modeTab, ...(mode === key ? S.modeTabActive : {}) }}
              onClick={() => { setMode(key); setDetectErr(""); }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Option 1: Manual ── */}
      {(mode === "manual" || disabled) && (
        <div style={S.manualRow}>
          <div style={S.field}>
            <label style={S.label} htmlFor="cp-lat">Latitude</label>
            <input
              id="cp-lat"
              style={{ ...S.input, ...(lat !== "" && (isNaN(Number(lat)) || Number(lat) < -90 || Number(lat) > 90) ? S.inputErr : {}) }}
              type="number"
              step="any"
              value={lat}
              placeholder="e.g. 12.9716"
              disabled={disabled}
              onChange={(e) => handleManual("lat", e.target.value)}
            />
          </div>
          <div style={S.field}>
            <label style={S.label} htmlFor="cp-lng">Longitude</label>
            <input
              id="cp-lng"
              style={{ ...S.input, ...(lng !== "" && (isNaN(Number(lng)) || Number(lng) < -180 || Number(lng) > 180) ? S.inputErr : {}) }}
              type="number"
              step="any"
              value={lng}
              placeholder="e.g. 77.5946"
              disabled={disabled}
              onChange={(e) => handleManual("lng", e.target.value)}
            />
          </div>
        </div>
      )}
      {mode === "manual" && !disabled && manualInvalid && (
        <p style={S.err}>
          ⚠️ Latitude must be between −90 and 90. Longitude must be between −180 and 180.
          <br/>Tip: use the <strong>Search address</strong> tab to find the right coordinates automatically.
        </p>
      )}

      {/* ── Option 2: Detect ── */}
      {mode === "detect" && !disabled && (
        <div style={S.detectWrap}>
          <button
            type="button"
            style={{ ...S.detectBtn, ...(detecting ? S.detectBtnBusy : {}) }}
            onClick={detect}
            disabled={detecting}
          >
            {detecting ? "Detecting…" : "📍 Use my current location"}
          </button>
          {detectErr && <p style={S.err}>{detectErr}</p>}
          {hasCoords && !detecting && (
            <p style={S.detected}>
              ✅ Detected: <strong>{lat}</strong>, <strong>{lng}</strong>
            </p>
          )}
        </div>
      )}

      {/* ── Option 3: Search ── */}
      {mode === "search" && !disabled && (
        <div style={S.searchWrap}>
          <div style={S.searchInputWrap}>
            <input
              ref={searchRef}
              style={S.searchInput}
              type="text"
              placeholder="Search for the showroom address…"
              value={searchQ}
              onChange={handleSearchInput}
              autoComplete="off"
            />
            {showSuggs && suggestions.length > 0 && (
              <ul ref={suggsRef} style={S.suggList}>
                {suggestions.map((s) => (
                  <li
                    key={s.place_id}
                    style={S.suggItem}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fff6dc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                    onPointerDown={() => selectSuggestion(s.place_id, s.description)}
                  >
                    <span style={S.suggIcon}>📍</span>
                    <span>{s.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p style={S.searchHint}>
            Select a result to pin it on the map. Drag the marker to fine-tune.
          </p>
        </div>
      )}

      {hasCoords && isLoaded && (mode === "search" || mode === "detect" || disabled) && (
        <div style={S.mapWrap}>
          <GoogleMap
            mapContainerStyle={MAP_SIZE}
            center={mapCenter}
            zoom={15}
            options={MAP_OPTIONS}
          >
            <Marker
              position={mapCenter}
              draggable={!disabled && mode !== "detect"}
              onDragEnd={onMarkerDrag}
              title="Showroom location — drag to adjust"
            />
          </GoogleMap>
          <p style={S.coordDisplay}>
            📌 {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
            {!disabled && mode !== "detect" && (
              <span style={S.dragHint}> · drag the pin to adjust</span>
            )}
          </p>
        </div>
      )}

      {hasCoords && isLoaded && mode === "manual" && !disabled && (
        <div style={{ ...S.mapWrap, marginTop: 12 }}>
          <GoogleMap
            mapContainerStyle={MAP_SIZE}
            center={mapCenter}
            zoom={15}
            options={MAP_OPTIONS}
          >
            <Marker
              position={mapCenter}
              draggable
              onDragEnd={onMarkerDrag}
              title="Drag to adjust"
            />
          </GoogleMap>
          <p style={S.coordDisplay}>
            📌 {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
            <span style={S.dragHint}> · drag the pin to adjust</span>
          </p>
        </div>
      )}

    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const S = {
  root: { marginBottom: 4 },

  modeTabs: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  modeTab: {
    padding: "7px 14px",
    borderRadius: 999,
    border: "1.5px solid #e2d8bd",
    background: "#fff",
    color: "#6b6250",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  modeTabActive: {
    background: "#fff6dc",
    borderColor: "#b58a2e",
    color: "#16130e",
    fontWeight: 700,
  },

  // Manual
  manualRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  field:     { display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 160 },
  label:     { fontSize: 12, fontWeight: 600, color: "#16130e" },
  input: {
    padding: "8px 10px",
    border: "1.5px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    color: "#16130e",
    outline: "none",
    background: "#fff",
  },
  inputErr: {
    borderColor: "#e02424",
    background: "#fff5f5",
  },

  // Detect
  detectWrap: { display: "flex", flexDirection: "column", gap: 10 },
  detectBtn: {
    alignSelf: "flex-start",
    padding: "10px 20px",
    background: "#16130e",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  detectBtnBusy: { opacity: 0.6, cursor: "not-allowed" },
  detected: { fontSize: 13, color: "#2e7d32", margin: 0 },
  err:      { fontSize: 13, color: "#c0392b", margin: 0 },

  // Search
  searchWrap:      { display: "flex", flexDirection: "column", gap: 6 },
  searchInputWrap: { position: "relative" },
  searchInput: {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #ddd",
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  searchHint: { fontSize: 12, color: "#9a8f73", margin: 0 },
  suggList: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1.5px solid #e2d8bd",
    borderRadius: 10,
    listStyle: "none",
    margin: 0,
    padding: "4px 0",
    zIndex: 999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
    maxHeight: 240,
    overflowY: "auto",
  },
  suggItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: 13,
    color: "#16130e",
    background: "#fff",
    transition: "background 0.1s",
  },
  suggIcon: { flexShrink: 0, marginTop: 1 },

  // Map preview
  mapWrap: {
    borderRadius: 12,
    overflow: "hidden",
    border: "1.5px solid #e2d8bd",
    boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
  },
  coordDisplay: {
    margin: 0,
    padding: "8px 14px",
    fontSize: 12,
    color: "#6b6250",
    background: "#faf8f2",
    borderTop: "1px solid #e2d8bd",
  },
  dragHint: { color: "#b58a2e", fontStyle: "italic" },
};

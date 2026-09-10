// Loads the Google Maps JavaScript API (Places + Geocoding) once and provides:
//  - attachAutocomplete(inputEl, onPlace): type-to-search address autocomplete
//  - detectLocation(): use browser GPS + reverse geocode into an address object
//
// The API key comes from VITE_GOOGLE_MAPS_KEY. The key must be restricted in Google
// Cloud Console (HTTP referrers + Places/Geocoding/Maps JS APIs only).
import { useEffect, useState, useCallback } from "react";

const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
let scriptPromise = null;

function loadScript() {
  if (!KEY) return Promise.reject(new Error("Google Maps key missing"));
  if (window.google?.maps?.places) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

// Turn a Google place/geocode result into our flat address fields.
function parseComponents(components = []) {
  const get = (type) =>
    components.find((c) => c.types.includes(type))?.long_name || "";
  const city =
    get("locality") || get("administrative_area_level_2") || get("postal_town");
  return {
    city,
    state: get("administrative_area_level_1"),
    pincode: get("postal_code"),
  };
}

export function useGooglePlaces() {
  const [ready, setReady] = useState(Boolean(window.google?.maps?.places));
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    loadScript()
      .then(() => alive && setReady(true))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  // Attach autocomplete to an input; onPlace receives { address, city, state, pincode, lat, lng }.
  const attachAutocomplete = useCallback(
    (inputEl, onPlace) => {
      if (!ready || !inputEl || !window.google) return;
      const ac = new window.google.maps.places.Autocomplete(inputEl, {
        types: ["geocode"],
        componentRestrictions: { country: "in" },
        fields: ["formatted_address", "address_components", "geometry"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (!place.geometry) return;
        onPlace({
          address: place.formatted_address || inputEl.value,
          ...parseComponents(place.address_components),
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      });
    },
    [ready]
  );

  // Use browser geolocation + reverse geocode to detect the current address.
  const detectLocation = useCallback(async () => {
    if (!ready || !window.google) throw new Error("Maps not ready");
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
    );
    const { latitude: lat, longitude: lng } = pos.coords;
    const geocoder = new window.google.maps.Geocoder();
    const { results } = await geocoder.geocode({ location: { lat, lng } });
    const best = results?.[0];
    return {
      address: best?.formatted_address || "",
      ...parseComponents(best?.address_components),
      lat,
      lng,
    };
  }, [ready]);

  // Render (or update) a map in `el` centered at {lat,lng} with a red draggable marker.
  // Returns a small controller so the caller can re-center later. When the marker is
  // dragged, it reverse-geocodes and calls onChange with the new address object.
  const renderMap = useCallback(
    (el, center, onChange) => {
      if (!ready || !el || !window.google || !center?.lat) return null;
      const gmaps = window.google.maps;
      const position = { lat: Number(center.lat), lng: Number(center.lng) };

      const map = new gmaps.Map(el, {
        center: position,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
      });
      const marker = new gmaps.Marker({
        position,
        map,
        draggable: true,
        // Red marker.
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        },
      });

      const geocoder = new gmaps.Geocoder();
      marker.addListener("dragend", async () => {
        const p = marker.getPosition();
        const lat = p.lat();
        const lng = p.lng();
        try {
          const { results } = await geocoder.geocode({ location: { lat, lng } });
          const best = results?.[0];
          onChange?.({
            address: best?.formatted_address || "",
            ...parseComponents(best?.address_components),
            lat,
            lng,
          });
        } catch {
          onChange?.({ lat, lng });
        }
      });

      return {
        setCenter(next) {
          if (!next?.lat) return;
          const pos = { lat: Number(next.lat), lng: Number(next.lng) };
          map.setCenter(pos);
          marker.setPosition(pos);
        },
      };
    },
    [ready]
  );

  return { ready, error, hasKey: Boolean(KEY), attachAutocomplete, detectLocation, renderMap };
}

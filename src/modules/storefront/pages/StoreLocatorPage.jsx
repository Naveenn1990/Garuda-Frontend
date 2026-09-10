// Store locator: list of active showrooms with address and contact details.
import { useStoreLocations } from "../hooks/useShop";

export function StoreLocatorPage() {
  const { data: stores = [], isLoading, isError } = useStoreLocations();

  return (
    <div>
      <h1>Our Showrooms</h1>
      <p style={{ color: "#6b6250", marginBottom: 20 }}>
        Visit us at any of our showrooms.
      </p>

      {isLoading ? (
        <p>Loading...</p>
      ) : isError ? (
        <p style={{ color: "#c0392b" }}>Failed to load showrooms.</p>
      ) : stores.length === 0 ? (
        <div className="sf-empty">No showrooms available yet.</div>
      ) : (
        <div className="sf-stores">
          {stores.map((s) => (
            <div className="sf-store" key={s._id}>
              <h3>{s.name}</h3>
              {s.address && <p>{s.address}</p>}
              <p>
                {[s.city, s.state, s.pincode].filter(Boolean).join(", ")}
              </p>
              {s.phone && <p>📞 {s.phone}</p>}
              {s.email && <p>✉️ {s.email}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StoreLocatorPage;

// Root app: wraps the route tree in all global providers.
import AppProviders from "./app/providers/AppProviders";
import AppRoutes from "./app/routes/AppRoutes";

function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}

export default App;

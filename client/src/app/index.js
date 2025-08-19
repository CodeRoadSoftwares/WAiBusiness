import { StoreProvider } from "./providers";
import { AuthProvider } from "./providers/AuthProvider";
import { AppRouter } from "./router";

export const App = () => {
  return (
    <StoreProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </StoreProvider>
  );
};

export default App;

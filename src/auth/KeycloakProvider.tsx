import React, { createContext, useContext, useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import keycloak from "./keycloak";

interface AuthContextType {
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: () => void;
  logout: () => void;
  user: any; // Ideally typed according to your user profile
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isInitialized: false,
  login: () => {},
  logout: () => {},
  user: null,
});

export const useAuth = () => useContext(AuthContext);

export const KeycloakProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // TEMPORARY: Since Keycloak is not set up yet, we bypass it completely
    // to avoid unwanted redirects to localhost:8080/auth
    console.warn(
      "Keycloak is currently disabled. Falling back to mocked authentication mode.",
    );
    setIsAuthenticated(true);
    setUser({ username: "guest_user", email: "guest@example.com" });
    setIsInitialized(true);
  }, []);

  const login = () => keycloak.login();
  const logout = () => keycloak.logout();

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isInitialized, login, logout, user }}
    >
      {isInitialized ? (
        children
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 64px)",
            bgcolor: "background.default",
          }}
        >
          <CircularProgress
            size={60}
            thickness={4}
            sx={{ color: "primary.main", mb: 3 }}
          />
          <Typography variant="h6" color="text.secondary">
            Hitelesítés folyamatban...
          </Typography>
        </Box>
      )}
    </AuthContext.Provider>
  );
};

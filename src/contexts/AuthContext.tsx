import React, { createContext, useContext, useState, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import keycloak from "../auth/keycloak";
import axios from "axios";

export interface AchievementEarned {
  id: string;
  earned_at: string;
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  points: number;
  xp?: number;
  nickname?: string;
  bio?: string;
  avatar_url?: string;
  achievements?: AchievementEarned[];
  active_effects?: string[];
  challenge_streak?: number;
  last_challenge_date?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  updatePoints: (points: number) => void;
  updateUserContext: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const initRun = React.useRef(false);

  useEffect(() => {
    if (initRun.current) return;
    initRun.current = true;

    keycloak
      .init({ onLoad: "check-sso", checkLoginIframe: false })
      .then((authenticated) => {
        setIsAuthenticated(authenticated);
        if (authenticated && keycloak.token) {
          setToken(keycloak.token);
          localStorage.setItem("token", keycloak.token);
          syncUser(keycloak.token);
        } else {
          setIsInitialized(true);
        }
      })
      .catch((error) => {
        console.error("Keycloak init error", error);
        setIsInitialized(true);
      });

    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed && keycloak.token) {
            setToken(keycloak.token);
            localStorage.setItem("token", keycloak.token);
          }
        })
        .catch(() => {
          console.error("Failed to refresh token");
          logout();
        });
    };
  }, []);

  const syncUser = async (token: string) => {
    try {
      // It calls API Gateway, which forwards to user-service /auth/sync
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const response = await axios.post(
        `${API_URL}/auth/sync`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUser({
        id: response.data.id,
        email: response.data.email,
        roles: (response.data.roles || []).map((r: any) =>
          typeof r === "string" ? r : r.id,
        ),
        points: response.data.points || 0,
        xp: response.data.xp || 0,
        nickname: response.data.nickname,
        bio: response.data.bio,
        avatar_url: response.data.avatar_url,
        achievements: response.data.achievements || [],
        active_effects: response.data.active_effects || [],
      });

      // Sync completed lessons
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
        const completedRes = await axios.get(
          `${API_URL}/auth/me/lessons/completed`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const completed = completedRes.data.completed_lessons || [];
        localStorage.setItem(
          "coderealm_progress",
          JSON.stringify(completed),
        );
      } catch (err) {
        console.error("Failed to sync completed lessons", err);
      }
    } catch (err) {
      console.error("Failed to sync user", err);
    } finally {
      setIsInitialized(true);
    }
  };

  const login = () => keycloak.login();

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    localStorage.removeItem("coderealm_progress");
    localStorage.removeItem("bootdevclone_progress");
    keycloak.logout({ redirectUri: window.location.origin + "/" });
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  const updatePoints = (points: number) => {
    setUser((prev) => (prev ? { ...prev, points } : prev));
  };

  const updateUserContext = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  };

  if (!isInitialized) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "background.default",
          backgroundImage: "url('/bg.png')",
          color: "white",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{ color: "white", mb: 3 }}
        />
        <Typography variant="h6" color="white">
          Hitelesítés folyamatban...
        </Typography>
      </Box>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isInitialized,
        login,
        logout,
        hasRole,
        updatePoints,
        updateUserContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

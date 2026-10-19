import Keycloak from 'keycloak-js';

// Setup Keycloak instance as needed
// In a real application, these values would come from environment variables
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080/auth',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'coderealm',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'coderealm-frontend'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;

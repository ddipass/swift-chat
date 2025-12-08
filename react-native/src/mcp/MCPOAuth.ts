import { Linking } from 'react-native';
import { MCPServer, updateMCPServer } from '../storage/StorageUtils';

const REDIRECT_URI = 'swiftchat://oauth/callback';

interface OAuthConfig {
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
}

interface OAuthState {
  serverId: string;
  codeVerifier: string;
  clientId: string;
  tokenEndpoint: string;
}

/**
 * Start OAuth flow for MCP server
 */
export async function startOAuthFlow(server: MCPServer): Promise<void> {
  if (!server.url) {
    throw new Error('Server URL is required');
  }

  try {
    console.log('[OAuth] Starting flow for:', server.name);

    // Get OAuth configuration
    const config = await getOAuthConfig(server.url);
    console.log('[OAuth] Config received');

    if (!config.authorization_endpoint || !config.token_endpoint) {
      throw new Error('Invalid OAuth configuration');
    }

    // Register client dynamically
    console.log('[OAuth] Registering client...');
    const clientId = await registerClient(config, server.name);
    console.log('[OAuth] Client ID:', clientId);

    // Generate PKCE
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Generate state (use serverId)
    const state = server.id;

    // Store for callback
    storeOAuthState(state, {
      serverId: server.id,
      codeVerifier,
      clientId,
      tokenEndpoint: config.token_endpoint,
    });

    // Build auth URL
    const authUrl = buildAuthUrl(
      config.authorization_endpoint,
      clientId,
      codeChallenge,
      state,
    );

    console.log('[OAuth] Auth URL:', authUrl);

    // Check if URL can be opened
    const canOpen = await Linking.canOpenURL(authUrl);
    console.log('[OAuth] Can open URL:', canOpen);

    if (!canOpen) {
      throw new Error('Cannot open authorization URL');
    }

    // Open browser
    await Linking.openURL(authUrl);
    console.log('[OAuth] URL opened');
  } catch (error) {
    console.error('[OAuth] Error:', error);
    if (error instanceof Error) {
      throw new Error(`Authorization failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    const state = parsed.searchParams.get('state');

    if (!code) {
      throw new Error('Missing authorization code');
    }

    if (!state) {
      throw new Error('Missing state parameter');
    }

    // Get stored state
    const oauthState = getOAuthState(state);
    if (!oauthState) {
      throw new Error('Invalid or expired state');
    }

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(
      oauthState.tokenEndpoint,
      code,
      oauthState.clientId,
      oauthState.codeVerifier,
    );

    if (!tokenData.access_token) {
      throw new Error('No access token received');
    }

    // Update server with token
    updateMCPServer(oauthState.serverId, {
      authType: 'oauth',
      oauthToken: tokenData.access_token,
      oauthRefreshToken: tokenData.refresh_token,
      oauthExpiry: Date.now() + (tokenData.expires_in || 3600) * 1000,
    });

    // Clear state
    clearOAuthState(state);

    return oauthState.serverId;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return null;
  }
}

async function getOAuthConfig(serverUrl: string): Promise<OAuthConfig> {
  const configUrl = `${serverUrl}/.well-known/oauth-authorization-server`;

  const response = await fetch(configUrl);
  if (!response.ok) {
    throw new Error(`Failed to get OAuth config: ${response.status}`);
  }

  const config = await response.json();

  if (!config.authorization_endpoint || !config.token_endpoint) {
    throw new Error('Invalid OAuth configuration response');
  }

  return config;
}

async function registerClient(
  config: OAuthConfig,
  appName: string,
): Promise<string> {
  if (!config.registration_endpoint) {
    throw new Error('Dynamic client registration not supported by this server');
  }

  try {
    const response = await fetch(config.registration_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: appName || 'SwiftChat',
        redirect_uris: [REDIRECT_URI],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Client registration failed: ${response.status} ${errorText}`,
      );
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid registration response: not a valid JSON object');
    }

    if (!data.client_id) {
      throw new Error(
        `No client_id in registration response. Received: ${JSON.stringify(data)}`,
      );
    }

    return data.client_id;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Client registration error: ${error.message}`);
    }
    throw error;
  }
}

function buildAuthUrl(
  authEndpoint: string,
  clientId: string,
  codeChallenge: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
  });

  return `${authEndpoint}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

async function exchangeCodeForToken(
  tokenEndpoint: string,
  code: string,
  clientId: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: clientId,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

// PKCE helpers
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);

  // Check if crypto is available
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  } else {
    crypto.getRandomValues(array);
  }

  return base64URLEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  // Check if crypto.subtle is available
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Fallback: use plain verifier (not recommended but works)
    console.warn('crypto.subtle not available, using plain code challenge');
    return verifier;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

function base64URLEncode(buffer: Uint8Array): string {
  // Convert Uint8Array to string without spread operator
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }

  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]/g, '');
}

// State management (in-memory)
const oauthStates = new Map<string, OAuthState>();

function storeOAuthState(state: string, data: OAuthState) {
  oauthStates.set(state, data);

  // Auto-cleanup after 10 minutes
  setTimeout(
    () => {
      oauthStates.delete(state);
    },
    10 * 60 * 1000,
  );
}

function getOAuthState(state: string): OAuthState | undefined {
  return oauthStates.get(state);
}

function clearOAuthState(state: string) {
  oauthStates.delete(state);
}

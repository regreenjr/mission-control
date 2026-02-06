// Gateway configuration
// Uses Vercel API proxy to avoid CORS issues

// In production (Vercel), use the proxy API route
// In development, use localhost directly
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'

export const GATEWAY_URL = isLocalhost 
  ? 'http://localhost:38472' 
  : '/api/gateway'

// Auth token (used by local dev - proxy handles auth for production)
export const GATEWAY_TOKEN = 'xK9mQ4vL2pR7wZ8nJ3bT6yF1hD5sA0eC'

// Helper to make authenticated requests
export async function gatewayFetch(path: string, options: RequestInit = {}) {
  const url = `${GATEWAY_URL}${path}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  return response
}

// Check if gateway is reachable
export async function checkGatewayConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${GATEWAY_URL}/`, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}

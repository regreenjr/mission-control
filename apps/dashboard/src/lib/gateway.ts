// Gateway configuration
// Uses Tailscale Funnel URL for remote access, falls back to localhost for local dev

// Production URL via Tailscale Funnel
export const GATEWAY_URL = 'https://robbmacmini.tail8f0b6c.ts.net'

// Auth token (same for local and remote)
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

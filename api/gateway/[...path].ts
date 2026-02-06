// Vercel serverless function to proxy requests to Clawdbot gateway
// This avoids CORS issues by making the request server-side

const GATEWAY_URL = 'https://robbmacmini.tail8f0b6c.ts.net'
const GATEWAY_TOKEN = 'xK9mQ4vL2pR7wZ8nJ3bT6yF1hD5sA0eC'

export const config = {
  runtime: 'edge',
}

export default async function handler(request: Request) {
  const url = new URL(request.url)
  
  // Get the path after /api/gateway/
  const pathMatch = url.pathname.match(/\/api\/gateway\/(.*)/)
  const gatewayPath = pathMatch ? `/${pathMatch[1]}` : '/'
  
  // Build the gateway URL
  const gatewayUrl = `${GATEWAY_URL}${gatewayPath}${url.search}`
  
  try {
    // Forward the request to the gateway
    const response = await fetch(gatewayUrl, {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.text() 
        : undefined,
    })
    
    // Get the response body
    const body = await response.text()
    
    // Return with CORS headers
    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Gateway connection failed', details: String(error) }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

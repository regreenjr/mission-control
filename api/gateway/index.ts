// Vercel serverless function - index route for gateway proxy

const GATEWAY_URL = 'https://robbmacmini.tail8f0b6c.ts.net'
const GATEWAY_TOKEN = 'xK9mQ4vL2pR7wZ8nJ3bT6yF1hD5sA0eC'

export const config = {
  runtime: 'edge',
}

export default async function handler(request: Request) {
  try {
    const response = await fetch(`${GATEWAY_URL}/`, {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    
    const body = await response.text()
    
    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
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

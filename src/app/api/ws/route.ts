// WebSocket functionality removed for better performance
// Using polling and caching instead of real-time connections

export async function GET() {
  return new Response('WebSocket functionality disabled for performance optimization', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  })
}

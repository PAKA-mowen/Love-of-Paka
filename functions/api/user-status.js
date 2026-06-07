export async function onRequestGet({ request, env }) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  const token = match ? match[1] : null;
  let user = null;

  if (token) {
    user = await env.AUTH_STORE.get(`token:${token}`);
  }

  return new Response(JSON.stringify({ loggedIn: !!user, username: user || null }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
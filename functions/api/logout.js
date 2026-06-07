export async function onRequestGet({ request, env }) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  const token = match ? match[1] : null;

  if (token) {
    await env.AUTH_STORE.delete(`token:${token}`);
  }

  const headers = new Headers();
  headers.set('Set-Cookie', 'auth_token=; Path=/; Max-Age=0');
  headers.set('Location', '/');
  return new Response(null, { status: 302, headers });
}
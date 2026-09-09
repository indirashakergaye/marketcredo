import { next } from '@vercel/edge';

export const config = {
  matcher: [
    '/crm.html',
    '/blog-studio.html',
    '/og-generator.html',
    '/blog-template.html',
    '/market_credo_bloomberg.html',
    '/chips-variants-preview.html',
  ],
};

export default function middleware(req) {
  const [scheme, encoded] = (req.headers.get('authorization') || '').split(' ');
  if (scheme === 'Basic' && encoded) {
    const [u, p] = atob(encoded).split(':');
    if (u === process.env.ADMIN_USER && p === process.env.ADMIN_PASS) return next();
  }
  return new Response('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="MC Admin"' },
  });
}

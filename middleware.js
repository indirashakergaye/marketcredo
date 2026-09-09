import { next } from '@vercel/edge';

export const config = {
  // Both clean and .html forms: with cleanUrls enabled, /crm serves crm.html,
  // so a .html-only matcher would leave the clean path unprotected.
  matcher: [
    '/crm', '/crm.html',
    '/blog-studio', '/blog-studio.html',
    '/og-generator', '/og-generator.html',
    '/blog-template', '/blog-template.html',
    '/market_credo_bloomberg', '/market_credo_bloomberg.html',
    '/chips-variants-preview', '/chips-variants-preview.html',
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

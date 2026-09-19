// Statisk JSON med alt innholdet – brukes av appen (/app/) så den alltid viser det samme som nettsiden.
import type { APIRoute } from 'astro';
import { sections } from '../lib/content';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(sections), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

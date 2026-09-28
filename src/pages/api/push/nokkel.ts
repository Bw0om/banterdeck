// Den offentlige delen av varselnøkkelen (trygg å vise – den private ligger bare på serveren).
import type { APIRoute } from 'astro';
import { offentligNokkel } from '../../../lib/push';
import { json } from '../../../lib/konto';
export const prerender = false;
export const GET: APIRoute = async () => json({ nokkel: offentligNokkel() });

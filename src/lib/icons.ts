// Mitt vors sine egne ikoner (24×24, strek). Tar fargen fra teksten rundt (currentColor).
export const ICONS: Record<string, string> = {
 "nyhet": "<rect x=\"4\" y=\"5\" width=\"13\" height=\"14\" rx=\"2\"/><path d=\"M17 9h2.5a.5.5 0 0 1 .5.5V17a2 2 0 0 1-2 2H6\"/><path d=\"M7.5 9h6M7.5 12.5h6M7.5 16h3.5\"/>",
 "uttrykk": "<path d=\"M9.2 7.8 5.8 12l3.4 4.2M14 7.8 10.6 12l3.4 4.2M15.6 7.8 19 12l-3.4 4.2\"/>",
 "del": "<path d=\"M12 14.5V4M8 7.8 12 4l4 3.8\"/><path d=\"M7.5 11H6a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18 11h-1.5\"/>",
 "drikkeleker": "<path d=\"M6 8h10v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z\"/><path d=\"M16 10.5h1.5a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2H16\"/><path d=\"M6 8c0-1.7 1.3-3 3-3 .6-1 1.7-1.5 2.8-1.2C13 3 14.6 3.4 15.3 4.6 16.4 5.2 16.5 6.8 16 8\"/>",
 "favoritt": "<path d=\"m12 3.8 2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8Z\"/>",
 "grov": "<path d=\"M12 3.2c.9 3.6 4.9 5.4 4.9 10.3 0 3.6-2.2 6.5-4.9 6.5s-4.9-2.3-4.9-5.3c0-2.4 1.3-3.9 2.3-4.9.1 1.7.9 2.8 2 3 .1-3.7.6-6.4.6-9.6Z\"/>",
 "hjem": "<path d=\"M4 11 12 4.5 20 11v8.5a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1Z\"/>",
 "kopier": "<rect x=\"8.5\" y=\"8.5\" width=\"11.5\" height=\"11.5\" rx=\"2\"/><path d=\"M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5\"/>",
 "ordbok": "<path d=\"M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5Z\"/><path d=\"M12 6.5V20\"/>",
 "replikker": "<path d=\"M5.5 4.5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.5 4v-4h-1a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z\"/><path d=\"M8 9h8M8 12.5h5\"/>",
 "sok": "<circle cx=\"11\" cy=\"11\" r=\"6.5\"/><path d=\"m16 16 4.5 4.5\"/>",
 "terning": "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"3.5\"/><circle cx=\"8.6\" cy=\"8.6\" r=\"1.25\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"1.25\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15.4\" cy=\"15.4\" r=\"1.25\" fill=\"currentColor\" stroke=\"none\"/>",
 "mal": "<circle cx=\"12\" cy=\"12\" r=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 12h.01\"/>",
 "kalender": "<rect x=\"4\" y=\"5.5\" width=\"16\" height=\"14.5\" rx=\"2\"/><path d=\"M4 10h16M8.5 3.5v4M15.5 3.5v4\"/>",
 "sveip": "<rect x=\"9\" y=\"3.5\" width=\"10.5\" height=\"14.5\" rx=\"2\"/><path d=\"M9 7 6 7.8a1.5 1.5 0 0 0-1 1.8l2.4 9a1.5 1.5 0 0 0 1.8 1.1l5-1.3\"/>",
 "gjeng": "<circle cx=\"9\" cy=\"8.5\" r=\"3\"/><path d=\"M3.5 19c.4-3 2.6-5 5.5-5s5.1 2 5.5 5\"/><path d=\"M15 5.8a3 3 0 0 1 0 5.4M17.5 14.4c1.7.7 2.8 2.4 3 4.6\"/>",
 "telefon": "<rect x=\"6.5\" y=\"2.5\" width=\"11\" height=\"19\" rx=\"2.5\"/><path d=\"M10.5 18.5h3\"/>",
 "kort": "<rect x=\"9\" y=\"3\" width=\"11.5\" height=\"15.5\" rx=\"2\"/><path d=\"M6 6.6 4.4 7.3a2 2 0 0 0-1 2.6l4.3 9.8a2 2 0 0 0 2.6 1l2.9-1.3\"/>",
 "glass": "<path d=\"M6 8.5h12l-1.4 10.8a2 2 0 0 1-2 1.7H9.4a2 2 0 0 1-2-1.7L6 8.5Z\"/><path d=\"m13 8.5 2.2-5.5H18\"/>",
 "gnist": "<path d=\"M11 3.5c.7 4.3 2.2 5.8 6.5 6.5-4.3.7-5.8 2.2-6.5 6.5-.7-4.3-2.2-5.8-6.5-6.5 4.3-.7 5.8-2.2 6.5-6.5Z\"/><path d=\"M18 15c.3 1.8 1 2.5 2.8 2.8-1.8.3-2.5 1-2.8 2.8-.3-1.8-1-2.5-2.8-2.8 1.8-.3 2.5-1 2.8-2.8Z\"/>",
 "graf": "<path d=\"M3.5 20.5h17\"/><path d=\"m5 15.5 4.5-4.5 3.5 3.5 7-7\"/><path d=\"M15 7.5h5v5\"/>",
 "agent": "<path d=\"M2.5 12c1.4-3.6 5-7 9.5-7s8.1 3.4 9.5 7c-1.4 3.6-5 7-9.5 7s-8.1-3.4-9.5-7Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M4 20 20 4\"/>",
 "gave": "<rect x=\"3.5\" y=\"8\" width=\"17\" height=\"4\" rx=\"1\"/><path d=\"M5 12v7.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V12M12 8v12.5\"/><path d=\"M12 8c-1.6-3.6-5-3.9-5-1.8C7 7.6 9.4 8 12 8Zm0 0c1.6-3.6 5-3.9 5-1.8C17 7.6 14.6 8 12 8Z\"/>"
};

/** Ferdig SVG-streng – til kode som bygger HTML i nettleseren. */
export function iconSvg(name: string, size = 18): string {
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

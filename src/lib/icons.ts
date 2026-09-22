// Banterdecks egne ikoner (24×24, strek). Tar fargen fra teksten rundt (currentColor).
export const ICONS: Record<string, string> = {
 "del": "<path d=\"M12 14.5V4M8 7.8 12 4l4 3.8\"/><path d=\"M7.5 11H6a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18 11h-1.5\"/>",
 "drikkeleker": "<path d=\"M6 8h10v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z\"/><path d=\"M16 10.5h1.5a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2H16\"/><path d=\"M6 8c0-1.7 1.3-3 3-3 .6-1 1.7-1.5 2.8-1.2C13 3 14.6 3.4 15.3 4.6 16.4 5.2 16.5 6.8 16 8\"/>",
 "favoritt": "<path d=\"m12 3.8 2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8Z\"/>",
 "grov": "<path d=\"M12 3.2c.9 3.6 4.9 5.4 4.9 10.3 0 3.6-2.2 6.5-4.9 6.5s-4.9-2.3-4.9-5.3c0-2.4 1.3-3.9 2.3-4.9.1 1.7.9 2.8 2 3 .1-3.7.6-6.4.6-9.6Z\"/>",
 "hjem": "<path d=\"M4 11 12 4.5 20 11v8.5a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1Z\"/>",
 "kopier": "<rect x=\"8.5\" y=\"8.5\" width=\"11.5\" height=\"11.5\" rx=\"2\"/><path d=\"M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5\"/>",
 "ordbok": "<path d=\"M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5Z\"/><path d=\"M12 6.5V20\"/>",
 "replikker": "<path d=\"M5.5 4.5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.5 4v-4h-1a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z\"/><path d=\"M8 9h8M8 12.5h5\"/>",
 "sok": "<circle cx=\"11\" cy=\"11\" r=\"6.5\"/><path d=\"m16 16 4.5 4.5\"/>",
 "terning": "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"3.5\"/><circle cx=\"8.6\" cy=\"8.6\" r=\"1.25\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"1.25\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15.4\" cy=\"15.4\" r=\"1.25\" fill=\"currentColor\" stroke=\"none\"/>"
};

/** Ferdig SVG-streng – til kode som bygger HTML i nettleseren. */
export function iconSvg(name: string, size = 18): string {
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

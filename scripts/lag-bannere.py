# Lager ett banner (240x126 SVG) per lek i samme flate stil som resten av Mitt vors.
import math, os, json
UT = os.path.join(os.path.dirname(__file__), '..', 'public', 'illustrasjoner', 'lek')
os.makedirs(UT, exist_ok=True)
# Champagnenatt (samme palett som scripts/fargelegg-illustrasjoner.mjs)
BG = '#2A1A22'; KORAL = '#D9503C'; GULL = '#E4C47F'; KREM = '#F7EFE3'; MORK = '#1A1012'; TURK = '#C98B8F'; LILLA = '#C98B8F'; ROSA = '#EFA0A6'
FONT = 'Arial,Helvetica,sans-serif'

def svg(innhold, blob1=KORAL, blob2=GULL, bx=175, by=20):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 126" width="240" height="126">'
            f'<rect width="240" height="126" fill="{BG}"/><circle cx="{bx}" cy="{by}" r="80" fill="{blob1}" opacity=".14"/>'
            f'<circle cx="{240-bx}" cy="{126-by+20}" r="62" fill="{blob2}" opacity=".08"/>{innhold}</svg>')
def g(inner, rot=0, cx=120, cy=63, tx=0, ty=0, s=1):
    return f'<g transform="translate({tx} {ty}) rotate({rot} {cx} {cy}) scale({s})">{inner}</g>' if (tx or ty or s != 1) else f'<g transform="rotate({rot} {cx} {cy})">{inner}</g>'
def tekst(x, y, t, size=14, fill=MORK, w=700, anchor='middle'):
    t = t.replace('&', '&amp;').replace('<', '&lt;')
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-family="{FONT}" font-weight="{w}" text-anchor="{anchor}">{t}</text>'
def kort(x, y, w=34, h=48, rot=0, fill=KREM, merke='♠', mfarge=MORK, tekstf=None):
    cx, cy = x + w/2, y + h/2
    inn = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="{fill}"/>'
    if merke: inn += tekst(cx, cy + h*0.14, merke, size=h*0.42, fill=mfarge)
    return f'<g transform="rotate({rot} {cx} {cy})">{inn}</g>'
def telefon(x, y, w=32, h=58, rot=0, skjerm=KORAL, inn=''):
    cx, cy = x + w/2, y + h/2
    return (f'<g transform="rotate({rot} {cx} {cy})"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{KREM}"/>'
            f'<rect x="{x+3.5}" y="{y+7}" width="{w-7}" height="{h-14}" rx="3" fill="{skjerm}"/>'
            f'<rect x="{cx-5}" y="{y+2.5}" width="10" height="2.2" rx="1.1" fill="{MORK}"/>{inn}</g>')
def kopp(x, y, s=1, fill=KORAL, rim=KREM):
    # rød festkopp, x,y = øverste venstre
    w, h = 30*s, 36*s
    return (f'<path d="M{x} {y} L{x+w} {y} L{x+w-5*s} {y+h} L{x+5*s} {y+h} Z" fill="{fill}"/>'
            f'<rect x="{x-1*s}" y="{y-1*s}" width="{w+2*s}" height="{5*s}" rx="{2*s}" fill="{rim}"/>'
            f'<rect x="{x+3*s}" y="{y+12*s}" width="{w-6*s}" height="{2.4*s}" fill="{rim}" opacity=".35"/>')
def terning(x, y, s=34, n=5, rot=0, fill=KREM, prikk=MORK):
    cx, cy = x + s/2, y + s/2
    P = {1: [(0,0)], 2: [(-1,-1),(1,1)], 3: [(-1,-1),(0,0),(1,1)], 4: [(-1,-1),(1,-1),(-1,1),(1,1)],
         5: [(-1,-1),(1,-1),(0,0),(-1,1),(1,1)], 6: [(-1,-1),(1,-1),(-1,0),(1,0),(-1,1),(1,1)]}[n]
    d = s*0.26
    inn = f'<rect x="{x}" y="{y}" width="{s}" height="{s}" rx="{s*0.18}" fill="{fill}"/>' + ''.join(f'<circle cx="{cx+a*d}" cy="{cy+b*d}" r="{s*0.075}" fill="{prikk}"/>' for a, b in P)
    return f'<g transform="rotate({rot} {cx} {cy})">{inn}</g>'
def boble(x, y, w, h, fill=KREM, hale='v'):
    t = f'<path d="M{x+14} {y+h-2} l-6 12 l14 -12 Z" fill="{fill}"/>' if hale == 'v' else f'<path d="M{x+w-14} {y+h-2} l6 12 l-14 -12 Z" fill="{fill}"/>'
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{min(h/2, 14)}" fill="{fill}"/>' + t
def stjerne(cx, cy, r, fill=GULL, n=5):
    p = []
    for i in range(n*2):
        rr = r if i % 2 == 0 else r*0.45
        a = math.pi/n*i - math.pi/2
        p.append(f'{cx+rr*math.cos(a):.1f},{cy+rr*math.sin(a):.1f}')
    return f'<polygon points="{" ".join(p)}" fill="{fill}"/>'
def lyn(x, y, s=1, fill=GULL):
    return f'<path d="M{x+14*s} {y} L{x} {y+28*s} L{x+11*s} {y+28*s} L{x+5*s} {y+50*s} L{x+26*s} {y+18*s} L{x+14*s} {y+18*s} L{x+20*s} {y} Z" fill="{fill}"/>'
def flaske(x, y, s=1, fill=TURK, rot=0):
    cx, cy = x + 12*s, y + 40*s
    inn = (f'<rect x="{x+8*s}" y="{y}" width="{8*s}" height="{18*s}" rx="{2*s}" fill="{fill}"/>'
           f'<rect x="{x}" y="{y+16*s}" width="{24*s}" height="{56*s}" rx="{8*s}" fill="{fill}"/>'
           f'<rect x="{x+4*s}" y="{y+34*s}" width="{16*s}" height="{18*s}" rx="{2*s}" fill="{KREM}" opacity=".85"/>')
    return f'<g transform="rotate({rot} {cx} {cy})">{inn}</g>'
def glass(x, y, s=1, fill=GULL):
    return (f'<path d="M{x} {y} L{x+26*s} {y} L{x+22*s} {y+40*s} L{x+4*s} {y+40*s} Z" fill="{KREM}" opacity=".9"/>'
            f'<path d="M{x+2*s} {y+10*s} L{x+24*s} {y+10*s} L{x+21.5*s} {y+38*s} L{x+4.5*s} {y+38*s} Z" fill="{fill}"/>')
def mynt(cx, cy, r=10, fill=GULL):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"/><circle cx="{cx}" cy="{cy}" r="{r*0.7}" fill="none" stroke="{MORK}" stroke-opacity=".25" stroke-width="1.5"/>'
def pil(x1, y1, x2, y2, fill=KREM, w=4):
    a = math.atan2(y2-y1, x2-x1); l = 9
    p1 = (x2 - l*math.cos(a-0.5), y2 - l*math.sin(a-0.5)); p2 = (x2 - l*math.cos(a+0.5), y2 - l*math.sin(a+0.5))
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{fill}" stroke-width="{w}" stroke-linecap="round"/>'
            f'<polygon points="{x2},{y2} {p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}" fill="{fill}"/>')
def person(cx, y, fill=KREM, s=1):
    return f'<circle cx="{cx}" cy="{y+9*s}" r="{9*s}" fill="{fill}"/><path d="M{cx-17*s} {y+48*s} Q{cx-17*s} {y+21*s} {cx} {y+21*s} Q{cx+17*s} {y+21*s} {cx+17*s} {y+48*s} Z" fill="{fill}"/>'
def klokke(cx, cy, r=30, fill=KREM, hand=KORAL, merk=''):
    s = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"/><rect x="{cx-5}" y="{cy-r-9}" width="10" height="8" rx="2" fill="{GULL}"/>'
    s += f'<path d="M{cx} {cy} L{cx} {cy-r+4} A{r-4} {r-4} 0 0 1 {cx+(r-4)*math.sin(1.2):.1f} {cy-(r-4)*math.cos(1.2):.1f} Z" fill="{hand}" opacity=".85"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="3" fill="{MORK}"/>'
    if merk: s += tekst(cx, cy + r*0.55, merk, size=r*0.4, fill=MORK)
    return s

B = {}
# ---------- kortleker ----------
B['ring-of-fire'] = svg(''.join(kort(120 + 62*math.cos(a) - 11, 63 + 40*math.sin(a) - 15, 22, 30, math.degrees(a)+90, KREM if i % 2 else GULL, '♥♦♠♣'[i % 4], KORAL if i % 4 < 2 else MORK) for i, a in enumerate([k*math.pi/5 for k in range(10)])) + kopp(105, 45, 1), KORAL, GULL)
B['fuck-the-dealer'] = svg(kort(70, 38, 36, 52, -8, KREM, 'K', MORK) + kort(100, 34, 36, 52, 0, GULL, 'Q', MORK) + kort(130, 38, 36, 52, 8, KREM, 'J', KORAL) +
    '<path d="M150 28 q10 -14 22 -6" stroke="#f4ebdc" stroke-width="3" fill="none"/>' + tekst(185, 30, '?', 26, KORAL), GULL, KORAL)
B['bussruta'] = svg('<rect x="56" y="40" width="128" height="50" rx="10" fill="#f4b740"/><rect x="64" y="48" width="20" height="16" rx="3" fill="#141009"/><rect x="90" y="48" width="20" height="16" rx="3" fill="#141009"/><rect x="116" y="48" width="20" height="16" rx="3" fill="#141009"/><rect x="142" y="48" width="20" height="16" rx="3" fill="#141009"/><rect x="166" y="48" width="12" height="30" rx="3" fill="#141009"/><circle cx="84" cy="92" r="9" fill="#141009"/><circle cx="84" cy="92" r="4" fill="#f4ebdc"/><circle cx="156" cy="92" r="9" fill="#141009"/><circle cx="156" cy="92" r="4" fill="#f4ebdc"/>' +
    kort(28, 60, 22, 30, -16, KREM, '♥', KORAL) + kort(190, 58, 22, 30, 14, KREM, '♠', MORK), GULL, KORAL)
B['veddelopet'] = svg(''.join(kort(40 + i*42, 30 + [30, 10, 40, 22][i], 28, 38, [-6, 4, -3, 7][i], KREM, '♥♠♦♣'[i], KORAL if i in (0, 2) else MORK) for i in range(4)) +
    '<line x1="30" y1="24" x2="210" y2="24" stroke="#f4ebdc" stroke-width="2" stroke-dasharray="6 5" opacity=".6"/>' +
    ''.join(f'<rect x="{200+ (i%2)*6}" y="{8+i*6}" width="6" height="6" fill="{KREM if (i+j)%2 else MORK}"/>' for i in range(3) for j in range(1)), GULL, TURK)
B['krig'] = svg(kort(60, 34, 40, 58, -14, KREM, 'A', KORAL) + kort(140, 34, 40, 58, 14, KREM, 'K', MORK) +
    '<path d="M104 30 L136 96 M136 30 L104 96" stroke="#f4b740" stroke-width="6" stroke-linecap="round"/>', KORAL, KORAL)
B['pyramiden'] = svg(''.join(kort(120 - (r+1)*14 + c*28 - 13 + 13, 18 + (3-r)*0 + r*24, 24, 30, 0, [GULL, KREM, KORAL, KREM][r], ['♥', '♠', '♦', '♣'][(r+c) % 4], MORK) for r in range(4) for c in range(r+1)), GULL, KORAL, 120, 10)
B['over-eller-under'] = svg(kort(95, 28, 50, 70, 0, KREM, '7', KORAL) + '<path d="M60 30 L84 58 L70 58 L70 96 L50 96 L50 58 L36 58 Z" fill="#f4b740"/><path d="M180 96 L204 68 L190 68 L190 30 L170 30 L170 68 L156 68 Z" fill="#ff6a4d"/>', GULL, KORAL)
B['president'] = svg(kort(80, 44, 36, 50, -10, KREM, '2', KORAL) + kort(104, 40, 36, 50, 0, KREM, '2', MORK) + kort(128, 44, 36, 50, 10, KREM, '2', KORAL) +
    '<path d="M92 34 L100 12 L112 26 L122 6 L132 26 L144 12 L150 34 Z" fill="#f4b740"/>', GULL, GULL)
B['gris'] = svg('<circle cx="120" cy="66" r="42" fill="#ff8fb1"/><ellipse cx="120" cy="76" rx="22" ry="15" fill="#ff6a8f"/><circle cx="112" cy="76" r="4.5" fill="#141009"/><circle cx="128" cy="76" r="4.5" fill="#141009"/><circle cx="104" cy="52" r="4" fill="#141009"/><circle cx="136" cy="52" r="4" fill="#141009"/><path d="M84 36 L90 20 L102 30 Z M156 36 L150 20 L138 30 Z" fill="#ff8fb1"/>' +
    kort(28, 40, 26, 36, -14, KREM, '4', MORK) + kort(186, 40, 26, 36, 14, KREM, '4', KORAL), ROSA, KORAL)
# ---------- spørsmål og rom ----------
B['pekeleken'] = svg('<path d="M60 70 L140 70 Q152 70 152 58 Q152 48 140 48 L100 48 L100 40 Q100 30 90 30 L76 44 L60 56 Z" fill="#f4ebdc"/><rect x="44" y="52" width="22" height="30" rx="5" fill="#ff6a4d"/>' +
    person(190, 40, GULL) + tekst(190, 30, '!', 22, KORAL), KORAL, GULL)
B['forraeder'] = svg('<path d="M60 50 Q90 20 120 50 Q150 20 180 50 Q175 80 150 82 Q130 82 120 66 Q110 82 90 82 Q65 80 60 50 Z" fill="#141009" stroke="#f4b740" stroke-width="3"/><ellipse cx="92" cy="58" rx="12" ry="7" fill="#ff6a4d"/><ellipse cx="148" cy="58" rx="12" ry="7" fill="#ff6a4d"/>' +
    tekst(120, 112, '? ? ?', 16, KREM), KORAL, LILLA)
B['regelfabrikken'] = svg('<path d="M40 100 L40 60 L70 44 L70 60 L100 44 L100 60 L130 44 L130 100 Z" fill="#f4ebdc"/><rect x="138" y="30" width="16" height="70" fill="#f4ebdc"/><circle cx="150" cy="22" r="7" fill="#f4ebdc" opacity=".5"/><circle cx="160" cy="12" r="5" fill="#f4ebdc" opacity=".35"/>' +
    '<rect x="52" y="74" width="14" height="14" fill="#141009"/><rect x="82" y="74" width="14" height="14" fill="#141009"/>' + kort(160, 60, 26, 34, 12, GULL, '✎', MORK) + kort(184, 70, 26, 34, 22, KORAL, '!', KREM), GULL, TURK)
B['jeg-har-aldri'] = svg('<rect x="96" y="58" width="56" height="50" rx="16" fill="#f4ebdc"/>' + ''.join(f'<rect x="{98+k*14}" y="{[30,22,26,36][k]}" width="12" height="{[40,48,44,34][k]}" rx="6" fill="#f4ebdc"/>' for k in range(4)) +
    '<rect x="78" y="66" width="12" height="34" rx="6" fill="#f4ebdc" transform="rotate(-35 84 83)"/>' + tekst(60, 44, '10', 24, GULL) + tekst(190, 96, 'ALDRI', 14, KORAL), KORAL, GULL)
B['100-sporsmal'] = svg(boble(52, 26, 136, 60, KREM) + tekst(120, 70, '100', 36, KORAL) + tekst(200, 110, '?', 28, GULL) + tekst(34, 110, '?', 20, KREM), GULL, KORAL)
B['50-50'] = svg('<circle cx="120" cy="63" r="40" fill="#f4b740"/><path d="M120 23 A40 40 0 0 1 120 103 Z" fill="#ff6a4d"/>' + tekst(100, 70, 'JA', 14, MORK) + tekst(141, 70, 'NEI', 13, KREM), GULL, KORAL)
B['jug'] = svg('<path d="M86 34 L154 34 L150 104 Q150 110 144 110 L96 110 Q90 110 90 104 Z" fill="#f4ebdc"/><path d="M154 48 Q178 48 178 70 Q178 92 152 92" stroke="#f4ebdc" stroke-width="8" fill="none"/><path d="M92 54 L148 54 L146 104 L94 104 Z" fill="#f4b740"/>' +
    boble(26, 18, 50, 28, KORAL) + tekst(51, 37, '?', 18, KREM), GULL, KORAL)
B['hvem-skrev-det'] = svg('<rect x="56" y="28" width="96" height="70" rx="6" fill="#f4ebdc"/><rect x="66" y="42" width="60" height="6" rx="3" fill="#141009" opacity=".6"/><rect x="66" y="56" width="74" height="6" rx="3" fill="#141009" opacity=".6"/><rect x="66" y="70" width="44" height="6" rx="3" fill="#141009" opacity=".6"/>' +
    '<g transform="rotate(35 170 60)"><rect x="164" y="20" width="12" height="70" rx="3" fill="#ff6a4d"/><path d="M164 90 L176 90 L170 104 Z" fill="#f4b740"/></g>' + tekst(200, 40, '?', 30, GULL), KORAL, GULL)
B['bloffquizen'] = svg('<path d="M70 40 Q70 22 90 22 L150 22 Q170 22 170 40 L170 70 Q170 88 150 88 L90 88 Q70 88 70 70 Z" fill="#f4ebdc"/><circle cx="100" cy="52" r="7" fill="#141009"/><circle cx="140" cy="52" r="7" fill="#141009"/><path d="M104 72 Q120 80 136 72" stroke="#141009" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<path d="M120 56 L204 62 L120 66 Z" fill="#ff6a4d"/>' + tekst(46, 110, 'A  B  C', 14, GULL, anchor='start'), KORAL, LILLA)
B['samme-svar'] = svg(boble(30, 30, 76, 40, GULL) + tekst(68, 56, 'OST', 16, MORK) + boble(134, 30, 76, 40, GULL, 'h') + tekst(172, 56, 'OST', 16, MORK) + tekst(120, 105, '=', 30, KREM), GULL, TURK)
B['spionen'] = svg('<path d="M60 58 Q120 30 180 58 L170 62 Q120 40 70 62 Z" fill="#141009"/><path d="M70 40 Q120 4 170 40 L170 52 L70 52 Z" fill="#141009"/><rect x="60" y="50" width="120" height="8" rx="4" fill="#141009"/>' +
    '<circle cx="96" cy="78" r="16" fill="#141009" stroke="#f4ebdc" stroke-width="3"/><circle cx="144" cy="78" r="16" fill="#141009" stroke="#f4ebdc" stroke-width="3"/><path d="M112 78 L128 78" stroke="#f4ebdc" stroke-width="3"/>' +
    '<circle cx="196" cy="96" r="14" fill="none" stroke="#f4b740" stroke-width="4"/><line x1="206" y1="106" x2="220" y2="120" stroke="#f4b740" stroke-width="5" stroke-linecap="round"/>', TURK, KORAL)
B['hemmelig-oppdrag'] = svg('<rect x="60" y="34" width="120" height="70" rx="6" fill="#f4ebdc"/><path d="M60 38 L120 76 L180 38" stroke="#141009" stroke-opacity=".3" stroke-width="3" fill="none"/><circle cx="120" cy="76" r="14" fill="#ff6a4d"/>' +
    tekst(120, 81, 'X', 13, KREM) + tekst(120, 24, 'TOPP HEMMELIG', 11, GULL), KORAL, GULL)
B['hvem-er-jeg'] = svg('<circle cx="120" cy="74" r="34" fill="#f4ebdc"/><circle cx="108" cy="80" r="4" fill="#141009"/><circle cx="132" cy="80" r="4" fill="#141009"/><path d="M110 94 Q120 100 130 94" stroke="#141009" stroke-width="3" fill="none"/>' +
    '<g transform="rotate(-6 120 46)"><rect x="96" y="30" width="48" height="30" fill="#f4b740"/></g>' + tekst(120, 52, '???', 14, MORK) + tekst(190, 50, '?', 26, KORAL), GULL, KORAL)
B['to-sannheter-og-en-logn'] = svg(kort(52, 34, 40, 56, -6, KREM, '✓', TURK) + kort(100, 30, 40, 56, 0, KREM, '✓', TURK) + kort(148, 34, 40, 56, 6, KORAL, '✗', KREM), TURK, KORAL)
B['sannhet-eller-drikk'] = svg(boble(36, 26, 80, 44, KREM) + tekst(76, 54, 'SANT?', 15, MORK) + glass(150, 36, 1.3, GULL), GULL, KORAL)
B['rygg-mot-rygg'] = svg(person(100, 40, GULL) + person(140, 40, KORAL) + '<rect x="118" y="36" width="4" height="60" fill="#2a1f12"/>' + pil(76, 30, 50, 30, KREM, 3) + pil(164, 30, 190, 30, KREM, 3), GULL, KORAL)
B['rask-fakta'] = svg(klokke(88, 70, 32, KREM, KORAL) + boble(138, 30, 70, 40, GULL, 'h') + tekst(173, 57, 'FORT!', 14, MORK), KORAL, GULL)
B['snurr-flasken'] = svg('<circle cx="120" cy="66" r="44" fill="none" stroke="#f4ebdc" stroke-width="3" stroke-dasharray="8 7" opacity=".6"/>' + flaske(108, 26, 1, TURK, 65) + pil(170, 30, 184, 52, GULL, 4), TURK, GULL)
B['enten-eller'] = svg('<path d="M120 110 L120 70 L80 34 M120 70 L160 34" stroke="#f4ebdc" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="72" cy="28" r="16" fill="#ff6a4d"/><circle cx="168" cy="28" r="16" fill="#f4b740"/>' + tekst(72, 33, 'A', 14, KREM) + tekst(168, 33, 'B', 14, MORK), KORAL, GULL)
B['nodt-eller-sannhet'] = svg('<path d="M86 100 Q60 76 76 50 Q80 66 90 60 Q86 36 106 22 Q104 44 118 54 Q126 70 110 100 Z" fill="#ff6a4d"/><path d="M92 100 Q84 84 94 72 Q100 84 106 80 Q110 92 102 100 Z" fill="#f4b740"/>' +
    '<path d="M160 100 Q130 78 140 58 Q150 46 160 58 Q170 46 180 58 Q190 78 160 100 Z" fill="#f4ebdc"/>', KORAL, ROSA)
B['duoleken'] = svg('<path d="M96 96 Q64 72 72 50 Q80 36 96 48 Q112 36 120 50 Q128 72 96 96 Z" fill="#ff6a4d"/><path d="M144 96 Q112 72 120 50 Q128 36 144 48 Q160 36 168 50 Q176 72 144 96 Z" fill="#f4b740" opacity=".95"/>', KORAL, GULL)
B['tanken-bak-sangen'] = svg('<ellipse cx="140" cy="46" rx="56" ry="30" fill="#f4ebdc"/><circle cx="92" cy="86" r="8" fill="#f4ebdc"/><circle cx="76" cy="102" r="5" fill="#f4ebdc"/>' +
    tekst(140, 58, '♪ ♫', 30, KORAL) + person(56, 70, GULL, 0.9), LILLA, KORAL)
B['14-sporsmal'] = svg(''.join(tekst(40 + (i % 7)*27, 48 + (i // 7)*40, '?', 26, [GULL, KORAL, KREM][i % 3]) for i in range(14)), GULL, KORAL)
B['kategorier'] = svg('<rect x="64" y="22" width="112" height="86" rx="8" fill="#f4ebdc"/>' + ''.join(f'<circle cx="80" cy="{42+i*20}" r="5" fill="{[KORAL, GULL, TURK][i]}"/><rect x="92" y="{38+i*20}" width="{[62, 48, 70][i]}" height="8" rx="4" fill="#141009" opacity=".55"/>' for i in range(3)) + klokke(196, 30, 16, GULL, KORAL), TURK, GULL)
B['tommelen'] = svg('<path d="M92 104 L92 64 Q92 56 100 56 L112 56 L110 30 Q110 20 120 20 Q130 20 130 30 L132 56 L152 56 Q162 56 160 66 L154 96 Q152 104 144 104 Z" fill="#f4ebdc"/><rect x="72" y="62" width="18" height="44" rx="4" fill="#ff6a4d"/>' + tekst(190, 60, '!', 30, GULL), GULL, KORAL)
B['bossen-sier'] = svg('<circle cx="120" cy="42" r="20" fill="#f4ebdc"/><path d="M84 110 Q84 68 120 68 Q156 68 156 110 Z" fill="#141009" stroke="#f4ebdc" stroke-width="2"/><path d="M114 68 L126 68 L130 100 L120 108 L110 100 Z" fill="#ff6a4d"/>' + boble(160, 22, 60, 30, GULL, 'v') + tekst(190, 42, 'SIER', 12, MORK), KORAL, GULL)
B['ja-eller-nei'] = svg('<rect x="44" y="36" width="70" height="54" rx="10" fill="#3fb8a9"/><rect x="126" y="36" width="70" height="54" rx="10" fill="#ff6a4d"/>' + tekst(79, 71, 'JA', 22, KREM) + tekst(161, 71, 'NEI', 22, KREM), TURK, KORAL)
B['buffalo'] = svg('<path d="M86 60 Q66 58 60 34 Q76 46 92 46 Z M154 60 Q174 58 180 34 Q164 46 148 46 Z" fill="#f4ebdc"/><ellipse cx="120" cy="70" rx="36" ry="32" fill="#7a4a24"/><ellipse cx="120" cy="86" rx="18" ry="12" fill="#5a3418"/><circle cx="106" cy="64" r="4" fill="#141009"/><circle cx="134" cy="64" r="4" fill="#141009"/>' + glass(186, 60, 0.9, GULL), GULL, KORAL)
B['skal-refleksen'] = svg(glass(82, 40, 1.4, GULL) + glass(122, 40, 1.4, GULL) + lyn(108, 6, 0.7, KORAL) + tekst(120, 116, 'SKÅL!', 14, KREM), GULL, KORAL)
B['stilleleken'] = svg('<circle cx="120" cy="60" r="36" fill="#f4ebdc"/><rect x="100" y="70" width="40" height="6" rx="3" fill="#141009"/><rect x="116" y="42" width="10" height="44" rx="5" fill="#ff6a4d"/><circle cx="106" cy="52" r="3.5" fill="#141009"/><circle cx="134" cy="52" r="3.5" fill="#141009"/>' + tekst(190, 50, 'shh', 16, GULL) , LILLA, GULL)
# ---------- musikk ----------
B['opus'] = svg(terning(56, 44, 36, 6, -10) + terning(100, 36, 36, 3, 6, GULL) + '<rect x="150" y="30" width="46" height="64" rx="4" fill="#f4ebdc"/>' + ''.join(f'<rect x="156" y="{40+i*12}" width="{[30, 24, 34, 18][i]}" height="5" rx="2" fill="#141009" opacity=".5"/>' for i in range(4)), KORAL, GULL)
B['thunderstruck'] = svg(lyn(96, 14, 1.9, GULL) + tekst(60, 60, '♪', 32, KORAL) + tekst(180, 96, '♫', 32, KREM), GULL, KORAL)
B['power-hour'] = svg(klokke(120, 68, 38, KREM, KORAL, '60') + tekst(56, 60, '♪', 26, GULL) + tekst(186, 90, '♫', 26, GULL), KORAL, GULL)
B['drikke-bingo'] = svg('<rect x="70" y="16" width="100" height="100" rx="8" fill="#f4ebdc"/>' + ''.join(f'<rect x="{78+c*23}" y="{24+r*23}" width="19" height="19" rx="3" fill="{KORAL if (r, c) in [(0, 0), (1, 1), (2, 2), (3, 3), (0, 2)] else "#e6d6bd"}"/>' for r in range(4) for c in range(4)) + tekst(200, 60, '♪', 30, GULL), KORAL, GULL)
B['gjett-aret'] = svg('<rect x="76" y="26" width="88" height="80" rx="8" fill="#f4ebdc"/><rect x="76" y="26" width="88" height="22" rx="8" fill="#ff6a4d"/><rect x="92" y="18" width="6" height="16" rx="3" fill="#f4b740"/><rect x="142" y="18" width="6" height="16" rx="3" fill="#f4b740"/>' + tekst(120, 86, '19??', 24, MORK) + tekst(196, 70, '♪', 28, GULL), KORAL, GULL)
# ---------- terninger ----------
B['drikke-yatzy'] = svg(''.join(terning(34 + i*36, 46 + (i % 2)*8, 32, 6 if i < 4 else 5, [-8, 6, -4, 10, -12][i], [KREM, GULL, KREM, GULL, KORAL][i]) for i in range(5)), GULL, KORAL)
B['terningen-bestemmer'] = svg(terning(92, 30, 56, 3, -10, KREM) + pil(160, 40, 196, 40, GULL, 4) + tekst(206, 44, '?', 22, KORAL, anchor='start'), GULL, KORAL)
B['21-med-terninger'] = svg(terning(54, 40, 38, 6, -10) + terning(96, 34, 38, 5, 8, GULL) + tekst(176, 76, '21', 40, KORAL), KORAL, GULL)
B['drikkehjulet'] = svg(''.join(f'<path d="M120 63 L{120+46*math.cos(a):.1f} {63+46*math.sin(a):.1f} A46 46 0 0 1 {120+46*math.cos(a+math.pi/4):.1f} {63+46*math.sin(a+math.pi/4):.1f} Z" fill="{[KORAL, GULL, KREM, TURK][i % 4]}"/>' for i, a in enumerate([k*math.pi/4 for k in range(8)])) +
    '<circle cx="120" cy="63" r="9" fill="#141009"/><path d="M120 10 L112 -2 L128 -2 Z" fill="#f4ebdc" transform="translate(0 6)"/>', GULL, KORAL)
# ---------- kopper ----------
B['beer-pong'] = svg(''.join(kopp(92 + c*20 - r*10 + (r*0), 30 + r*26, 0.62) for r in range(3) for c in range(r+1)) + '<circle cx="54" cy="36" r="9" fill="#f4ebdc"/><path d="M60 42 Q80 60 90 50" stroke="#f4ebdc" stroke-dasharray="3 4" stroke-width="2" fill="none"/>', KORAL, GULL)
B['flip-cup'] = svg(kopp(70, 56, 1.1) + g(kopp(140, 30, 1.1), 160, 156, 50) + pil(110, 28, 130, 20, KREM, 3) + '<path d="M104 40 Q120 10 150 20" stroke="#f4ebdc" stroke-width="2" stroke-dasharray="4 4" fill="none"/>', KORAL, GULL)
B['rage-cage'] = svg(''.join(kopp(40 + i*30, 70 - (i % 2)*10, 0.75, [KORAL, KORAL, GULL, KORAL, KORAL, KORAL][i]) for i in range(6)) + '<circle cx="120" cy="30" r="8" fill="#f4ebdc"/>' + lyn(160, 10, 0.6, GULL), KORAL, GULL)
B['flunkyball'] = svg('<rect x="96" y="44" width="30" height="56" rx="6" fill="#3fb8a9"/><rect x="96" y="54" width="30" height="16" fill="#f4ebdc" opacity=".8"/><circle cx="170" cy="46" r="18" fill="#f4ebdc"/><path d="M156 38 Q170 46 184 38 M156 54 Q170 46 184 54" stroke="#141009" stroke-width="2" fill="none" opacity=".4"/>' + person(56, 56, GULL, 0.9), TURK, GULL)
B['mynt-i-glasset'] = svg(glass(100, 44, 1.6, GULL) + mynt(126, 26, 12) + '<path d="M140 18 Q150 10 158 18" stroke="#f4ebdc" stroke-width="2" fill="none"/>' + mynt(60, 96, 9) + mynt(186, 92, 9), GULL, KORAL)
B['korken'] = svg(flaske(64, 24, 1.1, TURK, -8) + '<rect x="150" y="50" width="26" height="34" rx="4" fill="#c9965a"/><rect x="150" y="50" width="26" height="6" rx="3" fill="#a87840"/>' + pil(104, 30, 142, 46, KREM, 3), TURK, GULL)
B['chandelier'] = svg(kopp(105, 45, 1, GULL) + ''.join(kopp(120 + 70*math.cos(a) - 12, 63 + 38*math.sin(a) - 14, 0.75) for a in [k*math.pi/3 for k in range(6)]), KORAL, GULL)
# ---------- prøver ----------
B['nyhetsrunden'] = svg('<rect x="52" y="22" width="120" height="86" rx="4" fill="#f4ebdc"/><rect x="62" y="32" width="100" height="12" fill="#141009"/><rect x="62" y="52" width="46" height="36" fill="#ff6a4d" opacity=".85"/>' + ''.join(f'<rect x="114" y="{54+i*9}" width="{[48, 40, 46, 30][i]}" height="4" fill="#141009" opacity=".5"/>' for i in range(4)) +
    '<circle cx="186" cy="84" r="20" fill="#f4b740"/>' + tekst(186, 91, 'NY', 14, MORK), GULL, KORAL)
B['nasjonal-vorsprove'] = svg('<rect x="70" y="16" width="92" height="100" rx="4" fill="#f4ebdc"/>' + ''.join(f'<rect x="80" y="{30+i*18}" width="12" height="12" rx="2" fill="none" stroke="#141009" stroke-width="2"/><rect x="98" y="{34+i*18}" width="{[50, 42, 54, 36, 46][i]}" height="4" fill="#141009" opacity=".5"/>' for i in range(5)) +
    '<path d="M82 36 L86 40 L94 28" stroke="#ff6a4d" stroke-width="3" fill="none"/><path d="M82 72 L86 76 L94 64" stroke="#ff6a4d" stroke-width="3" fill="none"/>' + tekst(196, 56, 'A+', 30, GULL), GULL, KORAL)
B['tilbake-til-5-trinn'] = svg('<rect x="40" y="22" width="160" height="80" rx="4" fill="#2f5d4a" stroke="#c9965a" stroke-width="6"/>' + tekst(120, 60, '2 + 2 = ?', 20, KREM, 400) + tekst(120, 88, '5. trinn', 14, GULL, 400), TURK, GULL)
# ---------- skjerm og brett ----------
B['beerio-kart'] = svg('<path d="M70 50 Q70 36 86 36 L154 36 Q170 36 170 50 L180 90 Q182 102 170 102 Q160 102 154 90 L146 80 L94 80 L86 90 Q80 102 70 102 Q58 102 60 90 Z" fill="#f4ebdc"/><rect x="84" y="54" width="18" height="6" rx="2" fill="#141009"/><rect x="90" y="48" width="6" height="18" rx="2" fill="#141009"/><circle cx="150" cy="52" r="5" fill="#ff6a4d"/><circle cx="160" cy="62" r="5" fill="#f4b740"/>' + ''.join(f'<rect x="{190+(i%2)*8}" y="{14+(i//2)*8}" width="8" height="8" fill="{KREM if i%3 else MORK}"/>' for i in range(6)), KORAL, GULL)
B['fotballkamp'] = svg('<circle cx="120" cy="63" r="42" fill="#f4ebdc"/><polygon points="120,46 134,56 129,72 111,72 106,56" fill="#141009"/><path d="M120 46 L120 22 M134 56 L156 48 M129 72 L144 92 M111 72 L96 92 M106 56 L84 48" stroke="#141009" stroke-width="3"/>', TURK, GULL)
B['eurovision'] = svg('<rect x="112" y="48" width="16" height="44" rx="6" fill="#f4ebdc"/><circle cx="120" cy="40" r="16" fill="#141009" stroke="#f4ebdc" stroke-width="3"/><rect x="118" y="92" width="4" height="22" fill="#f4ebdc"/>' + stjerne(60, 40, 14) + stjerne(186, 36, 10, KORAL) + stjerne(176, 90, 12, LILLA) + tekst(60, 100, '12', 22, GULL), LILLA, KORAL)
B['drikke-uno'] = svg(''.join(kort(64 + i*28, 34 + abs(i-2)*4, 36, 54, (i-2)*9, [KORAL, GULL, TURK, LILLA, KORAL][i], '+2' if i == 2 else '', KREM) for i in range(5)), KORAL, TURK)
B['sjakkdrikk'] = svg(''.join(f'<rect x="{60+c*15}" y="{63+r*15-30}" width="15" height="15" fill="{KREM if (r+c)%2 else "#6b4a2a"}"/>' for r in range(4) for c in range(8)) +
    '<circle cx="104" cy="16" r="8" fill="#141009" stroke="#f4ebdc" stroke-width="2"/><path d="M96 46 L112 46 L108 24 L100 24 Z" fill="#141009" stroke="#f4ebdc" stroke-width="2"/>' + glass(176, 50, 0.9, GULL), GULL, KORAL)

# Vorsprøven har egen side men samme slug-navn
alle = sorted(B)
for slug, s in B.items():
    open(os.path.join(UT, slug + '.svg'), 'w').write(s)
json.dump(alle, open(os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'bannere.json'), 'w'))
print(len(alle), 'bannere')

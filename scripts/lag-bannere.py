# Lager bildene til drikkelekene (240x126 SVG) i champagnenatt-stilen «Blanding»:
# vinsvart natt, faste figurer i dempet antikkgull, ett rødt Campari-element som viser hvor det skjer.
# Ting står rett på en tynn bordlinje og kaster skygge. Champagnebobler i kantene, gnistene fra logoen
# der noe skjer. Ingen tekst og ingen skrifttegn: bildene vises som <img>, og da finnes ikke sidens skrifter.
#
# Lager både ett banner per lek (public/illustrasjoner/lek/<slug>.svg + src/data/bannere.json)
# og de ti felles motivene (public/illustrasjoner/<motiv>.svg).
#
# Kjør fra prosjektmappa:  python scripts/lag-bannere.py
import math, os, json, random

ROT = os.path.join(os.path.dirname(__file__), '..')
UT_LEK = os.path.join(ROT, 'public', 'illustrasjoner', 'lek')
UT_MOTIV = os.path.join(ROT, 'public', 'illustrasjoner')
os.makedirs(UT_LEK, exist_ok=True)

# Blanding-paletten
BG = '#2A1A22'    # vinsvart bunn
G = '#B8995A'     # dempet antikkgull – figurene
GL = '#D4B77A'    # lys kant på gullet
GM = '#6E5A3C'    # gull i skygge
R = '#D9503C'     # campari – det som skjer
RM = '#9E3526'    # campari i skygge
K = '#F7EFE3'     # elfenben – bare små detaljer
M = '#1A1012'     # nesten svart
BAKKE = 112       # bordlinja

def n(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s == '-0' else s

# ---------- ramme ----------
def svg(slug, innhold, bakke=True, bobler=True):
    rng = random.Random(slug)
    ut = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 126" width="240" height="126"><rect width="240" height="126" fill="{BG}"/>'
    if bobler:
        for side in (0, 1):
            for _ in range(rng.randint(2, 3)):
                x = rng.uniform(10, 34) if side == 0 else rng.uniform(206, 230)
                y = rng.uniform(14, 98); r = rng.uniform(1.2, 2.6)
                ut += f'<circle cx="{n(x)}" cy="{n(y)}" r="{n(r)}" fill="none" stroke="{GL}" stroke-opacity="{n(rng.uniform(.25, .5))}" stroke-width=".9"/>'
    if bakke:
        ut += f'<line x1="24" y1="{BAKKE}" x2="216" y2="{BAKKE}" stroke="{G}" stroke-opacity=".35" stroke-width="1"/>'
    return ut + innhold + '</svg>'

def skygge(cx, w):
    return f'<ellipse cx="{n(cx)}" cy="{BAKKE}" rx="{n(w/2)}" ry="2.6" fill="{M}" opacity=".6"/>'

def gnister(cx, cy, s=1, farge=GL):
    return (f'<g stroke="{farge}" stroke-width="{n(1.8*s)}" stroke-linecap="round">'
            f'<line x1="{n(cx)}" y1="{n(cy)}" x2="{n(cx)}" y2="{n(cy-9*s)}"/>'
            f'<line x1="{n(cx-10*s)}" y1="{n(cy+2*s)}" x2="{n(cx-14.5*s)}" y2="{n(cy-4.5*s)}"/>'
            f'<line x1="{n(cx+10*s)}" y1="{n(cy+2*s)}" x2="{n(cx+14.5*s)}" y2="{n(cy-4.5*s)}"/></g>')

def roter(inn, grader, cx, cy):
    return f'<g transform="rotate({n(grader)} {n(cx)} {n(cy)})">{inn}</g>' if grader else inn

# ---------- tegn (former, ikke skrift) ----------
SORTER = {
    'hjerte': '<path d="M0 .38 C-.52 .02 -.56 -.42 -.26 -.47 C-.1 -.5 0 -.4 0 -.28 C0 -.4 .1 -.5 .26 -.47 C.56 -.42 .52 .02 0 .38 Z"/>',
    'ruter': '<path d="M0 -.5 L.36 0 L0 .5 L-.36 0 Z"/>',
    'spar': '<path d="M0 -.48 C.52 -.1 .56 .3 .26 .33 C.12 .35 .04 .28 .02 .2 L.12 .48 L-.12 .48 L-.02 .2 C-.04 .28 -.12 .35 -.26 .33 C-.56 .3 -.52 -.1 0 -.48 Z"/>',
    'klover': '<circle cy="-.22" r=".2"/><circle cx="-.22" cy=".1" r=".2"/><circle cx=".22" cy=".1" r=".2"/><path d="M-.12 .48 L0 .05 L.12 .48 Z"/>',
    'krone': '<path d="M-.5 .3 L-.5 -.2 L-.25 .05 L0 -.35 L.25 .05 L.5 -.2 L.5 .3 Z"/>',
    'stjerne': '<path d="M0 -.5 L.12 -.16 L.48 -.15 L.19 .06 L.29 .4 L0 .2 L-.29 .4 L-.19 .06 L-.48 -.15 L-.12 -.16 Z"/>',
}
def tegn(navn, cx, cy, s, farge):
    return f'<g transform="translate({n(cx)} {n(cy)}) scale({n(s)})" fill="{farge}">{SORTER[navn]}</g>'

def spm(cx, cy, s, farge):
    """Spørsmålstegn tegnet som strek, s = høyden."""
    return (f'<g transform="translate({n(cx)} {n(cy)}) scale({n(s)})"><path d="M-.26 -.26 C-.26 -.6 .3 -.6 .3 -.3 C.3 -.08 0 -.04 0 .14" fill="none" stroke="{farge}" stroke-width=".16" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<circle cy=".38" r=".095" fill="{farge}"/></g>')
def utrop(cx, cy, s, farge):
    return (f'<g transform="translate({n(cx)} {n(cy)}) scale({n(s)})"><line y1="-.44" y2=".12" stroke="{farge}" stroke-width=".17" stroke-linecap="round"/>'
            f'<circle cy=".38" r=".1" fill="{farge}"/></g>')
def hake(cx, cy, s, farge):
    return f'<path transform="translate({n(cx)} {n(cy)}) scale({n(s)})" d="M-.36 0 L-.1 .26 L.38 -.3" fill="none" stroke="{farge}" stroke-width=".16" stroke-linecap="round" stroke-linejoin="round"/>'
def kryss(cx, cy, s, farge):
    return f'<path transform="translate({n(cx)} {n(cy)}) scale({n(s)})" d="M-.3 -.3 L.3 .3 M.3 -.3 L-.3 .3" fill="none" stroke="{farge}" stroke-width=".16" stroke-linecap="round"/>'
def note(cx, cy, s, farge, dobbel=False):
    if dobbel:
        inn = (f'<ellipse cx="-.3" cy=".32" rx=".18" ry=".13" transform="rotate(-20 -.3 .32)"/><ellipse cx=".28" cy=".24" rx=".18" ry=".13" transform="rotate(-20 .28 .24)"/>'
               f'<path d="M-.14 .3 L-.14 -.4 L.44 -.5 L.44 .22" fill="none" stroke="{farge}" stroke-width=".07"/><path d="M-.14 -.4 L.44 -.5 L.44 -.36 L-.14 -.26 Z"/>')
    else:
        inn = (f'<ellipse cx="-.04" cy=".32" rx=".2" ry=".14" transform="rotate(-20 -.04 .32)"/>'
               f'<path d="M.14 .28 L.14 -.46 C.32 -.4 .44 -.26 .32 -.06" fill="none" stroke="{farge}" stroke-width=".07" stroke-linecap="round"/>')
    return f'<g transform="translate({n(cx)} {n(cy)}) scale({n(s)})" fill="{farge}">{inn}</g>'

# ---------- ting ----------
FLATE = {'gull': G, 'rod': R, 'bak': GM, 'lys': GL, 'krem': K}
def kort(x, y, w=34, h=48, rot=0, flate='gull', sort=None, sfarge=None, fyll=None):
    """Spillkort. sort = hjerte/ruter/spar/klover/krone eller None. flate 'bak' = baksiden."""
    fill = fyll or FLATE[flate]
    cx, cy = x + w/2, y + h/2
    inn = f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" rx="{n(w*.14)}" fill="{fill}"/>'
    if flate == 'bak':
        inn += f'<rect x="{n(x+3)}" y="{n(y+3)}" width="{n(w-6)}" height="{n(h-6)}" rx="{n(w*.08)}" fill="none" stroke="{GL}" stroke-opacity=".55" stroke-width=".8"/>'
        inn += tegn('ruter', cx, cy, h*.32, GL)
    else:
        inn += f'<rect x="{n(x+2.5)}" y="{n(y+2.5)}" width="{n(w-5)}" height="{n(h-5)}" rx="{n(w*.08)}" fill="none" stroke="{BG}" stroke-opacity=".28" stroke-width=".8"/>'
        if sort:
            sf = sfarge or (R if sort in ('hjerte', 'ruter') else BG)
            if h >= 30: inn += tegn(sort, x + w*.24, y + h*.17, h*.15, sf)
            inn += tegn(sort, cx, cy + h*.04, h*.4, sf)
        inn += f'<rect x="{n(x+w*.1)}" y="{n(y+2)}" width="{n(w*.8)}" height="1.2" rx=".6" fill="{K}" opacity=".18"/>'
    return roter(inn, rot, cx, cy)

def kopp(x, y, s=1, fill=R, skygge_=None):
    """Rød festkopp sett fra siden. x,y = øverste venstre hjørne."""
    w, h, t = 30*s, 36*s, 5*s
    inn = f'<path d="M{n(x)} {n(y)} L{n(x+w)} {n(y)} L{n(x+w-t)} {n(y+h)} L{n(x+t)} {n(y+h)} Z" fill="{fill}"/>'
    sk = skygge_ or (RM if fill == R else GM)
    inn += f'<path d="M{n(x+w*.68)} {n(y)} L{n(x+w)} {n(y)} L{n(x+w-t)} {n(y+h)} L{n(x+w*.68-t*.3)} {n(y+h)} Z" fill="{sk}" opacity=".7"/>'
    for a in (.38, .72):
        inn += f'<line x1="{n(x+t*a+1.5*s)}" y1="{n(y+h*a)}" x2="{n(x+w-t*a-1.5*s)}" y2="{n(y+h*a)}" stroke="{sk}" stroke-width="{n(1.2*s)}"/>'
    inn += f'<rect x="{n(x+4.5*s)}" y="{n(y+7*s)}" width="{n(2.4*s)}" height="{n(h-14*s)}" rx="{n(1.2*s)}" fill="{K}" opacity=".22"/>'
    inn += f'<rect x="{n(x-1*s)}" y="{n(y-1*s)}" width="{n(w+2*s)}" height="{n(4.5*s)}" rx="{n(2*s)}" fill="{GL}"/>'
    return inn

def glass(x, y, s=1, vaeske=G):
    """Vannglass med drikke og bobler. 26s bredt, 40s høyt."""
    w, h = 26*s, 40*s
    inn = f'<path d="M{n(x)} {n(y)} L{n(x+w)} {n(y)} L{n(x+w-4*s)} {n(y+h)} L{n(x+4*s)} {n(y+h)} Z" fill="{GL}" fill-opacity=".12" stroke="{GL}" stroke-width="1.4" stroke-linejoin="round"/>'
    inn += f'<path d="M{n(x+1.6*s)} {n(y+12*s)} L{n(x+w-1.6*s)} {n(y+12*s)} L{n(x+w-4.4*s)} {n(y+h-1.4*s)} L{n(x+4.4*s)} {n(y+h-1.4*s)} Z" fill="{vaeske}"/>'
    inn += f'<rect x="{n(x+1.6*s)}" y="{n(y+11*s)}" width="{n(w-3.2*s)}" height="{n(2.2*s)}" fill="{K}" opacity=".55"/>'
    for bx, by, br in ((.35, .55, .9), (.6, .72, .7), (.45, .85, .6)):
        inn += f'<circle cx="{n(x+w*bx)}" cy="{n(y+h*by)}" r="{n(br*s)}" fill="{K}" opacity=".6"/>'
    inn += f'<line x1="{n(x+3*s)}" y1="{n(y+3*s)}" x2="{n(x+5.4*s)}" y2="{n(y+h-4*s)}" stroke="{K}" stroke-opacity=".35" stroke-width="{n(1.2*s)}" stroke-linecap="round"/>'
    return inn

def flute(cx, bunn, s=1, rot=0, vaeske=G):
    """Champagneglass som i logoen. bunn = der foten står."""
    inn = (f'<path d="M-7.5 -60 H7.5 Q8 -32 0 -27 Q-8 -32 -7.5 -60 Z" fill="{GL}" fill-opacity=".14" stroke="{GL}" stroke-width="1.2"/>'
           f'<path d="M-7.3 -50 H7.3 Q7.8 -32 0 -27.5 Q-7.8 -32 -7.3 -50 Z" fill="{vaeske}"/>'
           f'<rect x="-7.3" y="-51" width="14.6" height="2" fill="{K}" opacity=".5"/>'
           f'<circle cx="-2" cy="-40" r=".9" fill="{K}" opacity=".7"/><circle cx="2" cy="-35" r=".7" fill="{K}" opacity=".7"/><circle cx="-.5" cy="-45" r=".6" fill="{K}" opacity=".7"/>'
           f'<rect x="-1.4" y="-28" width="2.8" height="24" fill="{G}"/><rect x="-9" y="-4.5" width="18" height="4.5" rx="2.2" fill="{G}"/>')
    t = f'translate({n(cx)} {n(bunn)}) rotate({n(rot)}) scale({n(s)})'
    return f'<g transform="{t}">{inn}</g>'

def terning(x, y, s=34, prikker=5, fill=G, prikk=None):
    prikk = prikk or (K if fill == R else BG)
    cx, cy = x + s/2, y + s/2
    P = {1: [(0, 0)], 2: [(-1, -1), (1, 1)], 3: [(-1, -1), (0, 0), (1, 1)], 4: [(-1, -1), (1, -1), (-1, 1), (1, 1)],
         5: [(-1, -1), (1, -1), (0, 0), (-1, 1), (1, 1)], 6: [(-1, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (1, 1)]}[prikker]
    d = s*.26
    inn = f'<rect x="{n(x)}" y="{n(y)}" width="{n(s)}" height="{n(s)}" rx="{n(s*.18)}" fill="{fill}"/>'
    inn += f'<rect x="{n(x+s*.14)}" y="{n(y+s*.07)}" width="{n(s*.72)}" height="{n(s*.08)}" rx="{n(s*.04)}" fill="{K if fill == R else GL}" opacity="{".3" if fill == R else ".7"}"/>'
    inn += f'<rect x="{n(x)}" y="{n(y+s*.8)}" width="{n(s)}" height="{n(s*.2)}" rx="{n(s*.1)}" fill="{RM if fill == R else GM}" opacity=".45"/>'
    inn += ''.join(f'<circle cx="{n(cx+a*d)}" cy="{n(cy+b*d)}" r="{n(s*.078)}" fill="{prikk}"/>' for a, b in P)
    return inn

def telefon(x, y, w=32, h=58, skjerm=BG, inn=''):
    ut = f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" rx="7" fill="{G}"/>'
    ut += f'<rect x="{n(x+1.5)}" y="{n(y+8)}" width="1.2" height="{n(h-16)}" rx=".6" fill="{GL}" opacity=".8"/>'
    ut += f'<rect x="{n(x+3.5)}" y="{n(y+7)}" width="{n(w-7)}" height="{n(h-14)}" rx="3" fill="{skjerm}"/>'
    ut += f'<rect x="{n(x+w/2-5)}" y="{n(y+2.5)}" width="10" height="2.2" rx="1.1" fill="{BG}"/>'
    ut += f'<rect x="{n(x+w/2-6)}" y="{n(y+h-4.5)}" width="12" height="1.8" rx=".9" fill="{GM}"/>'
    return ut + inn

def boble(x, y, w, h, fill=G, hale='v'):
    t = (f'<path d="M{n(x+14)} {n(y+h-2)} l-6 12 l14 -12 Z" fill="{fill}"/>' if hale == 'v'
         else f'<path d="M{n(x+w-14)} {n(y+h-2)} l6 12 l-14 -12 Z" fill="{fill}"/>')
    return (f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" rx="{n(min(h/2, 14))}" fill="{fill}"/>' + t +
            f'<rect x="{n(x+10)}" y="{n(y+3)}" width="{n(w*.4)}" height="1.4" rx=".7" fill="{K}" opacity=".25"/>')

def klokke(cx, cy, r=30, andel=1/6, fill=G):
    a = 2*math.pi*andel; ri = r*.8
    ex, ey = cx + ri*math.sin(a), cy - ri*math.cos(a)
    stor = 1 if andel > .5 else 0
    ut = (f'<rect x="{n(cx-r*.18)}" y="{n(cy-r-r*.3)}" width="{n(r*.36)}" height="{n(r*.17)}" rx="2" fill="{fill}"/>'
          f'<rect x="{n(cx-r*.05)}" y="{n(cy-r-r*.15)}" width="{n(r*.1)}" height="{n(r*.2)}" fill="{fill}"/>'
          f'<rect x="{n(-r*.1)}" y="{n(-r*1.2)}" width="{n(r*.2)}" height="{n(r*.15)}" rx="1.5" fill="{fill}" transform="translate({n(cx)} {n(cy)}) rotate(45)"/>'
          f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="{fill}"/>'
          f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r-2.5)}" fill="none" stroke="{GL}" stroke-opacity=".6" stroke-width="1"/>'
          f'<path d="M{n(cx)} {n(cy)} L{n(cx)} {n(cy-ri)} A{n(ri)} {n(ri)} 0 {stor} 1 {n(ex)} {n(ey)} Z" fill="{R}"/>')
    ut += f'<g transform="translate({n(cx)} {n(cy)})" stroke="{BG}" stroke-width="{n(max(1.2, r*.045))}" stroke-linecap="round">'
    ut += ''.join(f'<line y1="{n(-r*.92)}" y2="{n(-r*.8)}" transform="rotate({k*30})"/>' for k in range(12)) + '</g>'
    ut += f'<line x1="{n(cx)}" y1="{n(cy)}" x2="{n(ex)}" y2="{n(ey)}" stroke="{BG}" stroke-width="{n(max(1.6, r*.055))}" stroke-linecap="round"/>'
    ut += f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(max(2.2, r*.08))}" fill="{BG}"/>'
    return ut

def mynt(cx, cy, r=10):
    return (f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="{G}"/><circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r*.72)}" fill="none" stroke="{GM}" stroke-width="{n(r*.12)}"/>'
            f'<path d="M{n(cx-r*.7)} {n(cy-r*.35)} A{n(r*.8)} {n(r*.8)} 0 0 1 {n(cx-r*.1)} {n(cy-r*.78)}" fill="none" stroke="{GL}" stroke-width="{n(r*.14)}" stroke-linecap="round"/>' +
            tegn('stjerne', cx, cy, r*.75, GM))

def flaske(x, y, s=1, rot=0):
    cx, cy = x + 12*s, y + 40*s
    inn = (f'<rect x="{n(x+8*s)}" y="{n(y+2*s)}" width="{n(8*s)}" height="{n(18*s)}" rx="{n(2*s)}" fill="{GM}"/>'
           f'<rect x="{n(x+7*s)}" y="{n(y-2*s)}" width="{n(10*s)}" height="{n(6*s)}" rx="{n(1.5*s)}" fill="{R}"/>'
           f'<rect x="{n(x)}" y="{n(y+16*s)}" width="{n(24*s)}" height="{n(56*s)}" rx="{n(8*s)}" fill="{GM}"/>'
           f'<rect x="{n(x+2.5*s)}" y="{n(y+24*s)}" width="{n(2.4*s)}" height="{n(40*s)}" rx="{n(1.2*s)}" fill="{GL}" opacity=".45"/>'
           f'<rect x="{n(x)}" y="{n(y+34*s)}" width="{n(24*s)}" height="{n(20*s)}" fill="{G}"/>'
           f'<rect x="{n(x)}" y="{n(y+37*s)}" width="{n(24*s)}" height="{n(1.2*s)}" fill="{R}"/>' + tegn('stjerne', x + 12*s, y + 45*s, 9*s, GM))
    return roter(inn, rot, cx, cy)

def person(cx, y, s=1, fill=G):
    """Hode og skuldre. y = toppen av hodet, høyde 48s."""
    return (f'<circle cx="{n(cx)}" cy="{n(y+9*s)}" r="{n(9*s)}" fill="{fill}"/>'
            f'<path d="M{n(cx-17*s)} {n(y+48*s)} Q{n(cx-17*s)} {n(y+21*s)} {n(cx)} {n(y+21*s)} Q{n(cx+17*s)} {n(y+21*s)} {n(cx+17*s)} {n(y+48*s)} Z" fill="{fill}"/>'
            f'<path d="M{n(cx-6*s)} {n(y+4*s)} A{n(7*s)} {n(7*s)} 0 0 1 {n(cx+2*s)} {n(y+1.6*s)}" fill="none" stroke="{K}" stroke-opacity=".3" stroke-width="{n(1.4*s)}" stroke-linecap="round"/>')

def stjerne(cx, cy, r, fill=G):
    return tegn('stjerne', cx, cy, r*2, fill)

def lyn(x, y, s=1, fill=G):
    return (f'<path d="M{n(x+14*s)} {n(y)} L{n(x)} {n(y+28*s)} L{n(x+11*s)} {n(y+28*s)} L{n(x+5*s)} {n(y+50*s)} L{n(x+26*s)} {n(y+18*s)} L{n(x+14*s)} {n(y+18*s)} L{n(x+20*s)} {n(y)} Z" fill="{fill}"/>'
            f'<path d="M{n(x+14*s)} {n(y)} L{n(x)} {n(y+28*s)} L{n(x+3*s)} {n(y+28*s)} L{n(x+15.5*s)} {n(y+2*s)} Z" fill="{GL if fill != R else K}" opacity=".55"/>')

def pil(x1, y1, x2, y2, farge=GL, w=3):
    a = math.atan2(y2-y1, x2-x1); l = 3*w
    p1 = (x2 - l*math.cos(a-.5), y2 - l*math.sin(a-.5)); p2 = (x2 - l*math.cos(a+.5), y2 - l*math.sin(a+.5))
    return (f'<line x1="{n(x1)}" y1="{n(y1)}" x2="{n(x2-w*math.cos(a))}" y2="{n(y2-w*math.sin(a))}" stroke="{farge}" stroke-width="{n(w)}" stroke-linecap="round"/>'
            f'<polygon points="{n(x2)},{n(y2)} {n(p1[0])},{n(p1[1])} {n(p2[0])},{n(p2[1])}" fill="{farge}"/>')

def hjerte(cx, cy, s, fill):
    return tegn('hjerte', cx, cy, s, fill) + f'<ellipse cx="{n(cx-s*.22)}" cy="{n(cy-s*.28)}" rx="{n(s*.08)}" ry="{n(s*.05)}" fill="{K}" opacity=".35" transform="rotate(-30 {n(cx-s*.22)} {n(cy-s*.28)})"/>'

def hjul(cx, cy, r):
    farger = [G, GM, G, GM, G, R, G, GM]
    ut = f'<g transform="rotate(22.5 {n(cx)} {n(cy)})">'
    for k in range(8):
        a0, a1 = math.radians(45*k), math.radians(45*(k+1))
        ut += f'<path d="M{n(cx)} {n(cy)} L{n(cx+r*math.cos(a0))} {n(cy+r*math.sin(a0))} A{n(r)} {n(r)} 0 0 1 {n(cx+r*math.cos(a1))} {n(cy+r*math.sin(a1))} Z" fill="{farger[k]}"/>'
    ut += ''.join(f'<circle cx="{n(cx+(r-3.5)*math.cos(math.radians(45*k)))}" cy="{n(cy+(r-3.5)*math.sin(math.radians(45*k)))}" r="1.3" fill="{GL}"/>' for k in range(8))
    ut += '</g>'
    ut += f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="none" stroke="{GL}" stroke-opacity=".7" stroke-width="1.2"/>'
    ut += f'<circle cx="{n(cx)}" cy="{n(cy)}" r="6" fill="{BG}"/><circle cx="{n(cx)}" cy="{n(cy)}" r="2.6" fill="{GL}"/>'
    ut += f'<path d="M{n(cx-7)} {n(cy-r-10)} L{n(cx+7)} {n(cy-r-10)} L{n(cx)} {n(cy-r+1)} Z" fill="{GL}"/>'
    return ut

B = {}
# =====================================================================
# KORTLEKER
# =====================================================================
ring = ''
sorter = ['hjerte', 'spar', 'ruter', 'klover']
for k in range(12):
    if k == 2: continue
    a = math.radians(k*30); cx, cy = 120 + 46*math.sin(a), 63 - 46*math.cos(a)
    ring += kort(cx-6, cy-9, 12, 18, k*30, 'gull', sorter[k % 4])
a = math.radians(60); cx, cy = 120 + 60*math.sin(a), 63 - 60*math.cos(a)
ring += kort(cx-6, cy-9, 12, 18, 60, 'rod', 'hjerte', K)
ring += (f'<circle cx="120" cy="63" r="20" fill="none" stroke="{G}" stroke-width="2"/><circle cx="120" cy="63" r="15" fill="{G}" fill-opacity=".3"/>'
         f'<path d="M108 57 A13 13 0 0 1 117 50" fill="none" stroke="{GL}" stroke-width="1.6" stroke-linecap="round"/>'
         f'<circle cx="124" cy="66" r="1.2" fill="{K}" opacity=".6"/><circle cx="116" cy="69" r=".9" fill="{K}" opacity=".6"/>')
B['ring-of-fire'] = svg('ring-of-fire', ring, bakke=False)

B['fuck-the-dealer'] = svg('fuck-the-dealer',
    kort(66, 40, 36, 52, -10, 'gull', 'hjerte') + kort(136, 40, 36, 52, 10, 'gull', 'spar') + kort(101, 33, 38, 56, 0, 'gull', 'krone', R) +
    spm(196, 42, 30, R) + gnister(120, 22, .8), bakke=False)

buss = (f'<rect x="54" y="42" width="132" height="56" rx="12" fill="{G}"/><rect x="54" y="42" width="132" height="6" rx="3" fill="{GL}" opacity=".7"/>' +
        ''.join(f'<rect x="{64+i*25}" y="52" width="20" height="17" rx="3" fill="{BG}"/><rect x="{66+i*25}" y="54" width="5" height="13" rx="1.5" fill="{GL}" opacity=".18"/>' for i in range(4)) +
        f'<rect x="166" y="52" width="13" height="38" rx="3" fill="{BG}"/><rect x="54" y="76" width="106" height="5" fill="{R}"/>'
        f'<circle cx="182" cy="88" r="3" fill="{K}" opacity=".85"/><rect x="50" y="88" width="6" height="6" rx="2" fill="{R}"/>' + skygge(120, 130) +
        ''.join(f'<circle cx="{c}" cy="101" r="10" fill="{M}"/><circle cx="{c}" cy="101" r="4.2" fill="{GL}"/>' for c in (84, 156)))
B['bussruta'] = svg('bussruta', buss + kort(18, 18, 24, 34, 0, 'gull', 'hjerte') + kort(198, 18, 24, 34, 0, 'gull', 'spar'))

ved = f'<line x1="36" y1="16" x2="194" y2="16" stroke="{GL}" stroke-width="1.6" stroke-dasharray="5 4"/>'
ved += ''.join(f'<rect x="{196+(i%2)*6}" y="{6+(i//2)*6}" width="6" height="6" fill="{K if (i + i//2) % 2 else BG}"/>' for i in range(6))
ved += f'<line x1="196" y1="6" x2="196" y2="{BAKKE}" stroke="{G}" stroke-width="1.6"/>'
for i, (topp, s) in enumerate(zip([30, 22, 52, 40], ['hjerte', 'spar', 'ruter', 'klover'])):
    x = 44 + i*38
    ved += f'<line x1="{x+14}" y1="{topp+40}" x2="{x+14}" y2="{BAKKE}" stroke="{G}" stroke-opacity=".45" stroke-width="1.4" stroke-dasharray="2 4" stroke-linecap="round"/>'
    ved += kort(x, topp, 28, 38, 0, 'rod' if i == 1 else 'gull', s, K if i == 1 else None)
B['veddelopet'] = svg('veddelopet', ved)

sverd = (f'<g stroke-linecap="round"><line x1="98" y1="98" x2="142" y2="46" stroke="{GL}" stroke-width="3"/><line x1="142" y1="98" x2="98" y2="46" stroke="{GL}" stroke-width="3"/>'
         f'<line x1="99" y1="83" x2="112" y2="94" stroke="{G}" stroke-width="4"/><line x1="141" y1="83" x2="128" y2="94" stroke="{G}" stroke-width="4"/></g>'
         f'<circle cx="96" cy="100" r="3" fill="{G}"/><circle cx="144" cy="100" r="3" fill="{G}"/>')
B['krig'] = svg('krig', skygge(68, 44) + skygge(172, 44) + kort(48, 50, 40, 58, 0, 'gull', 'hjerte') + kort(152, 50, 40, 58, 0, 'gull', 'spar') + sverd + gnister(120, 40, 1, R))

pyr = skygge(120, 100)
for r in range(4):
    for c in range(r+1):
        x = 120 - (r+1)*12 + c*24 + 2; y = 16 + r*23
        if r == 0: pyr += kort(x, y, 20, 26, 0, 'rod', 'hjerte', K)
        elif (r, c) in [(2, 1), (3, 0)]: pyr += kort(x, y, 20, 26, 0, 'gull', ['spar', 'ruter'][r-2])
        else: pyr += kort(x, y, 20, 26, 0, 'bak')
B['pyramiden'] = svg('pyramiden', pyr + gnister(120, 12, .7))

B['over-eller-under'] = svg('over-eller-under',
    f'<path d="M58 30 L82 58 L68 58 L68 96 L48 96 L48 58 L34 58 Z" fill="{G}"/><path d="M58 30 L34 58 L40 58 L58 37 Z" fill="{GL}" opacity=".6"/>'
    f'<path d="M182 96 L206 68 L192 68 L192 30 L172 30 L172 68 L158 68 Z" fill="{R}"/>' + kort(94, 26, 52, 72, 0, 'gull', 'ruter'), bakke=False)

krone = (f'<path d="M90 36 L96 12 L108 26 L120 6 L132 26 L144 12 L150 36 Z" fill="{G}"/><rect x="90" y="34" width="60" height="6" rx="2" fill="{GL}"/>'
         f'<circle cx="96" cy="12" r="3" fill="{GL}"/><circle cx="120" cy="6" r="3.4" fill="{R}"/><circle cx="144" cy="12" r="3" fill="{GL}"/><circle cx="120" cy="26" r="3" fill="{R}"/>')
B['president'] = svg('president', kort(76, 54, 36, 50, -10, 'gull', 'klover') + kort(128, 54, 36, 50, 10, 'gull', 'ruter') + kort(101, 50, 38, 54, 0, 'gull', 'hjerte') + krone, bakke=False)

gris = (f'<path d="M84 40 L88 18 L106 32 Z M156 40 L152 18 L134 32 Z" fill="{G}"/><path d="M88 34 L90 24 L99 31 Z M152 34 L150 24 L141 31 Z" fill="{GM}"/>'
        f'<circle cx="120" cy="66" r="40" fill="{G}"/><path d="M90 46 A36 36 0 0 1 112 30" fill="none" stroke="{GL}" stroke-width="2.4" stroke-linecap="round"/>'
        f'<circle cx="92" cy="74" r="7" fill="{R}" opacity=".45"/><circle cx="148" cy="74" r="7" fill="{R}" opacity=".45"/>'
        f'<ellipse cx="120" cy="77" rx="20" ry="13" fill="{GL}"/><ellipse cx="113" cy="77" rx="3.4" ry="4.4" fill="{BG}"/><ellipse cx="127" cy="77" rx="3.4" ry="4.4" fill="{BG}"/>'
        f'<circle cx="104" cy="56" r="4.2" fill="{BG}"/><circle cx="136" cy="56" r="4.2" fill="{BG}"/><circle cx="105.4" cy="54.6" r="1.3" fill="{K}"/><circle cx="137.4" cy="54.6" r="1.3" fill="{K}"/>')
B['gris'] = svg('gris', gris + kort(20, 42, 26, 36, 0, 'gull', 'klover') + kort(194, 42, 26, 36, 0, 'gull', 'hjerte'), bakke=False)

# =====================================================================
# SPØRSMÅL OG ROM
# =====================================================================
haand = (f'<rect x="40" y="50" width="22" height="32" rx="5" fill="{R}"/><rect x="40" y="50" width="22" height="5" rx="2.5" fill="{K}" opacity=".25"/>'
         f'<path d="M60 70 L140 70 Q152 70 152 59 Q152 48 140 48 L100 48 L100 40 Q100 30 90 30 L76 44 L60 56 Z" fill="{G}"/>'
         f'<line x1="104" y1="59" x2="140" y2="59" stroke="{BG}" stroke-opacity=".25" stroke-width="1.2"/><path d="M78 48 L92 36" stroke="{GL}" stroke-width="1.6" stroke-linecap="round"/>'
         f'<g stroke="{GL}" stroke-width="1.6" stroke-linecap="round"><line x1="158" y1="50" x2="165" y2="47"/><line x1="160" y1="59" x2="168" y2="59"/><line x1="158" y1="68" x2="165" y2="71"/></g>')
B['pekeleken'] = svg('pekeleken', haand + skygge(192, 46) + person(192, 50, 1.3) + utrop(192, 30, 26, R))

maske = (f'<path d="M58 50 Q90 18 120 48 Q150 18 182 50 Q178 82 150 84 Q130 84 120 68 Q110 84 90 84 Q62 82 58 50 Z" fill="{GM}" stroke="{G}" stroke-width="2.5"/>'
         f'<path d="M66 50 Q90 28 114 48" fill="none" stroke="{GL}" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>'
         f'<ellipse cx="92" cy="60" rx="12" ry="7" fill="{R}"/><ellipse cx="148" cy="60" rx="12" ry="7" fill="{R}"/>'
         f'<path d="M58 52 L36 46 M182 52 L204 46" stroke="{G}" stroke-width="1.6" stroke-linecap="round"/>')
B['forraeder'] = svg('forraeder', maske + spm(98, 106, 16, G) + spm(120, 106, 16, GL) + spm(142, 106, 16, G), bakke=False)

fabrikk = (f'<path d="M40 110 L40 66 L70 50 L70 66 L100 50 L100 66 L130 50 L130 110 Z" fill="{G}"/><path d="M40 66 L70 50 L70 54 L40 70 Z" fill="{GL}" opacity=".6"/>'
           f'<rect x="138" y="34" width="16" height="76" fill="{GM}"/><rect x="136" y="32" width="20" height="5" rx="1.5" fill="{G}"/>'
           f'<circle cx="148" cy="22" r="7" fill="{GL}" opacity=".35"/><circle cx="158" cy="12" r="5" fill="{GL}" opacity=".25"/><circle cx="170" cy="7" r="3.4" fill="{GL}" opacity=".16"/>' +
           ''.join(f'<rect x="{x}" y="80" width="14" height="14" rx="1.5" fill="{R}" opacity=".9"/><path d="M{x+7} 80 V94 M{x} 87 H{x+14}" stroke="{BG}" stroke-width="1.4"/>' for x in (50, 78, 106)) +
           f'<line x1="156" y1="100" x2="212" y2="100" stroke="{G}" stroke-width="2"/>' + ''.join(f'<circle cx="{c}" cy="105" r="3" fill="{GM}"/>' for c in (162, 177, 192, 207)))
B['regelfabrikken'] = svg('regelfabrikken', skygge(86, 92) + fabrikk + kort(162, 70, 20, 28, 0, 'gull', 'hjerte') + kort(186, 70, 20, 28, 0, 'rod', 'spar', K))

fingre = ''
for x, h, ned in [(44, 36, 0), (59, 48, 0), (74, 54, 0), (89, 48, 0), (104, 30, 0), (127, 30, 0), (142, 48, 0), (157, 54, 0), (172, 48, 1), (187, 36, 1)]:
    if ned:
        fingre += f'<rect x="{x}" y="96" width="9" height="14" rx="4.5" fill="{R}"/><rect x="{x+2}" y="98" width="2" height="6" rx="1" fill="{K}" opacity=".3"/>'
    else:
        y = 110 - h
        fingre += (f'<rect x="{x}" y="{y}" width="9" height="{h}" rx="4.5" fill="{G}"/><rect x="{x+1.5}" y="{y+2}" width="5" height="6" rx="2.5" fill="{GL}" opacity=".85"/>'
                   f'<line x1="{x+2}" y1="{y+h*.45}" x2="{x+7}" y2="{y+h*.45}" stroke="{GM}" stroke-width="1"/>')
B['jeg-har-aldri'] = svg('jeg-har-aldri', skygge(120, 160) + fingre + gnister(180, 84, .7, R))

B['100-sporsmal'] = svg('100-sporsmal', boble(46, 20, 124, 62, G) + spm(84, 51, 24, BG) + spm(108, 51, 32, BG) + spm(134, 51, 24, BG) +
    boble(168, 66, 46, 32, R, 'h') + spm(191, 82, 20, K), bakke=False)

B['50-50'] = svg('50-50', f'<circle cx="120" cy="63" r="42" fill="none" stroke="{GL}" stroke-opacity=".5" stroke-width="1"/><circle cx="120" cy="63" r="38" fill="{G}"/>'
    f'<path d="M120 25 A38 38 0 0 1 120 101 Z" fill="{R}"/><path d="M92 40 A34 34 0 0 1 112 29" fill="none" stroke="{GL}" stroke-width="2.4" stroke-linecap="round"/>' +
    hake(102, 64, 24, BG) + kryss(139, 64, 20, K), bakke=False)

kanne = (skygge(120, 70) + f'<path d="M154 48 Q178 48 178 70 Q178 92 152 92" stroke="{GL}" stroke-width="6" fill="none" stroke-linecap="round"/>'
         f'<path d="M86 34 L154 34 L150 104 Q150 110 144 110 L96 110 Q90 110 90 104 Z" fill="{GL}" fill-opacity=".12" stroke="{GL}" stroke-width="1.6" stroke-linejoin="round"/>'
         f'<path d="M92 56 L148 56 L146 103 Q146 106 143 106 L97 106 Q94 106 94 103 Z" fill="{G}"/>' +
         ''.join(f'<circle cx="{x}" cy="55" r="5.4" fill="{K}" opacity=".9"/>' for x in (97, 108, 119, 130, 141)) +
         ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{K}" opacity=".55"/>' for x, y, r in ((108, 80, 1.3), (124, 92, 1.1), (136, 72, 1), (116, 98, .9))) +
         f'<line x1="91" y1="40" x2="95" y2="102" stroke="{K}" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/>')
B['jug'] = svg('jug', kanne + boble(26, 14, 46, 30, R) + spm(49, 29, 20, K))

papir = (f'<rect x="54" y="26" width="98" height="74" rx="4" fill="{G}"/><path d="M134 26 L152 26 L152 44 Z" fill="{BG}"/><path d="M134 26 L134 44 L152 44 Z" fill="{GM}"/>'
         + ''.join(f'<rect x="64" y="{40+i*13}" width="{w}" height="5" rx="2.5" fill="{BG}" opacity=".45"/>' for i, w in enumerate([58, 72, 64, 40])) +
         f'<g transform="rotate(35 170 62)"><rect x="164" y="20" width="12" height="66" rx="3" fill="{R}"/><rect x="164" y="20" width="12" height="9" rx="3" fill="{GL}"/><rect x="166" y="34" width="2.4" height="46" rx="1.2" fill="{K}" opacity=".3"/><path d="M164 86 L176 86 L170 100 Z" fill="{GL}"/><path d="M168.4 96 L171.6 96 L170 100 Z" fill="{M}"/></g>')
B['hvem-skrev-det'] = svg('hvem-skrev-det', papir + spm(34, 50, 26, GL), bakke=False)

bloff = (f'<path d="M70 40 Q70 22 90 22 L150 22 Q170 22 170 40 L170 70 Q170 88 150 88 L90 88 Q70 88 70 70 Z" fill="{G}"/><path d="M78 36 Q80 28 92 28" stroke="{GL}" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
         f'<circle cx="100" cy="50" r="6.5" fill="{BG}"/><circle cx="140" cy="50" r="6.5" fill="{BG}"/><circle cx="102" cy="48" r="2" fill="{K}"/><circle cx="142" cy="48" r="2" fill="{K}"/>'
         f'<path d="M104 72 Q120 80 136 72" stroke="{BG}" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
         f'<path d="M120 57 L206 62 L120 67 Z" fill="{R}"/><path d="M120 57 L206 62 L120 60 Z" fill="{K}" opacity=".25"/>' +
         ''.join(f'<rect x="{x}" y="100" width="30" height="11" rx="5.5" fill="{R if x == 105 else GM}"/>' for x in (68, 105, 142)))
B['bloffquizen'] = svg('bloffquizen', bloff, bakke=False)

B['samme-svar'] = svg('samme-svar', boble(28, 22, 74, 46, G) + stjerne(65, 45, 12, BG) + boble(138, 22, 74, 46, G, 'h') + stjerne(175, 45, 12, BG) +
    f'<rect x="106" y="90" width="28" height="5" rx="2.5" fill="{R}"/><rect x="106" y="100" width="28" height="5" rx="2.5" fill="{R}"/>' + gnister(120, 82, .7), bakke=False)

spion = (f'<path d="M58 58 Q120 32 182 58 L172 63 Q120 42 68 63 Z" fill="{GM}"/><path d="M72 42 Q120 4 168 42 L168 54 L72 54 Z" fill="{GM}"/>'
         f'<rect x="70" y="46" width="100" height="8" fill="{R}"/><path d="M84 38 Q104 18 130 16" fill="none" stroke="{GL}" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>'
         f'<circle cx="96" cy="78" r="15" fill="{BG}" stroke="{G}" stroke-width="3"/><circle cx="144" cy="78" r="15" fill="{BG}" stroke="{G}" stroke-width="3"/><path d="M111 78 L129 78" stroke="{G}" stroke-width="3"/>'
         f'<path d="M88 72 A9 9 0 0 1 96 68" fill="none" stroke="{GL}" stroke-width="1.6" stroke-linecap="round"/><path d="M136 72 A9 9 0 0 1 144 68" fill="none" stroke="{GL}" stroke-width="1.6" stroke-linecap="round"/>'
         f'<circle cx="198" cy="94" r="13" fill="{GL}" fill-opacity=".15" stroke="{G}" stroke-width="3.5"/><line x1="207.5" y1="103.5" x2="220" y2="116" stroke="{G}" stroke-width="5" stroke-linecap="round"/>')
B['spionen'] = svg('spionen', spion, bakke=False)

konvolutt = (f'<rect x="58" y="36" width="124" height="72" rx="5" fill="{G}"/><path d="M58 40 L120 78 L182 40" stroke="{BG}" stroke-opacity=".3" stroke-width="2.4" fill="none"/>'
             f'<path d="M58 104 L104 70 M182 104 L136 70" stroke="{BG}" stroke-opacity=".18" stroke-width="2"/>'
             f'<circle cx="120" cy="78" r="13" fill="{R}"/><circle cx="120" cy="78" r="9.5" fill="none" stroke="{RM}" stroke-width="1.6"/>' + stjerne(120, 78, 6, K) +
             f'<g transform="rotate(-6 120 20)"><rect x="92" y="12" width="56" height="16" rx="2" fill="none" stroke="{R}" stroke-width="1.6"/><rect x="99" y="17.5" width="42" height="2" fill="{R}"/><rect x="99" y="21.5" width="30" height="2" fill="{R}"/></g>')
B['hemmelig-oppdrag'] = svg('hemmelig-oppdrag', konvolutt, bakke=False)

hvem = (f'<circle cx="120" cy="76" r="32" fill="{G}"/><path d="M96 66 A26 26 0 0 1 110 50" fill="none" stroke="{GL}" stroke-width="2.4" stroke-linecap="round"/>'
        f'<circle cx="108" cy="82" r="3.6" fill="{BG}"/><circle cx="132" cy="82" r="3.6" fill="{BG}"/><path d="M110 95 Q120 101 130 95" stroke="{BG}" stroke-width="3" fill="none" stroke-linecap="round"/>'
        f'<g transform="rotate(-6 120 46)"><rect x="98" y="32" width="44" height="28" rx="2" fill="{R}"/><rect x="98" y="32" width="44" height="5" fill="{RM}"/></g>' + spm(120, 48, 18, K) + spm(194, 50, 28, GL))
B['hvem-er-jeg'] = svg('hvem-er-jeg', hvem, bakke=False)

B['to-sannheter-og-en-logn'] = svg('to-sannheter-og-en-logn',
    skygge(72, 40) + skygge(120, 40) + skygge(168, 40) + kort(52, 50, 40, 60, 0, 'gull') + hake(72, 80, 22, BG) + kort(100, 50, 40, 60, 0, 'gull') + hake(120, 80, 22, BG) +
    kort(148, 50, 40, 60, 0, 'rod') + kryss(168, 80, 18, K) + gnister(168, 42, .8, R))

B['sannhet-eller-drikk'] = svg('sannhet-eller-drikk', boble(30, 22, 82, 48, G) + spm(71, 46, 30, BG) + skygge(168, 40) + glass(150, 54, 1.4, R) + gnister(168, 44, .7))

B['rygg-mot-rygg'] = svg('rygg-mot-rygg', skygge(120, 96) + person(100, 50, 1.3, G) + person(140, 50, 1.3, R) + pil(80, 34, 50, 34, GL, 3) + pil(160, 34, 190, 34, GL, 3))

B['rask-fakta'] = svg('rask-fakta', klokke(82, 70, 32, .2) + boble(136, 26, 74, 42, G, 'h') + utrop(173, 47, 26, BG) + lyn(117, 18, .5, R), bakke=False)

snurr = (f'<circle cx="120" cy="63" r="46" fill="none" stroke="{G}" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="7 6"/>' + flaske(108, 26, .95, 65) +
         f'<path d="M150 20 A50 50 0 0 1 172 40" fill="none" stroke="{GL}" stroke-width="2.6" stroke-linecap="round"/><path d="M90 106 A50 50 0 0 1 68 86" fill="none" stroke="{GL}" stroke-width="2.6" stroke-linecap="round"/>'
         f'<polygon points="176,46 166,40 176,34" fill="{GL}" transform="rotate(40 172 40)"/><polygon points="64,80 74,86 64,92" fill="{GL}" transform="rotate(40 68 86)"/>')
B['snurr-flasken'] = svg('snurr-flasken', snurr, bakke=False)

vei = (f'<path d="M120 112 L120 72 L82 38 M120 72 L158 38" stroke="{G}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
       f'<path d="M120 108 L120 74 L84 42 M120 74 L156 42" stroke="{BG}" stroke-opacity=".45" stroke-width="1.4" stroke-dasharray="3 4" fill="none"/>'
       f'<circle cx="72" cy="28" r="17" fill="{R}"/><circle cx="72" cy="28" r="11" fill="none" stroke="{K}" stroke-opacity=".5" stroke-width="2"/>'
       f'<circle cx="168" cy="28" r="17" fill="{G}"/><circle cx="168" cy="28" r="11" fill="none" stroke="{BG}" stroke-opacity=".4" stroke-width="2"/>' + utrop(72, 29, 14, K) + spm(168, 28, 15, BG))
B['enten-eller'] = svg('enten-eller', vei)

flamme = (f'<path d="M86 110 Q60 86 76 60 Q80 76 90 70 Q86 46 106 32 Q104 54 118 64 Q126 80 110 110 Z" fill="{R}"/>'
          f'<path d="M92 110 Q84 94 94 82 Q100 94 106 90 Q110 102 102 110 Z" fill="{G}"/><path d="M98 110 Q95 103 99 97 Q102 104 104 102 Q105 108 102 110 Z" fill="{K}" opacity=".7"/>')
B['nodt-eller-sannhet'] = svg('nodt-eller-sannhet', skygge(98, 40) + skygge(160, 50) + flamme + hjerte(160, 86, 52, G) + gnister(98, 26, .8))

B['duoleken'] = svg('duoleken', hjerte(100, 62, 72, R) + f'<g opacity=".95">{hjerte(140, 62, 72, G)}</g>' + stjerne(60, 30, 6, GL) + stjerne(184, 96, 5, GL) + stjerne(190, 30, 4, G), bakke=False)

tanke = (f'<ellipse cx="142" cy="44" rx="58" ry="30" fill="{G}"/><ellipse cx="120" cy="30" rx="22" ry="14" fill="{G}"/><ellipse cx="166" cy="30" rx="24" ry="15" fill="{G}"/>'
         f'<path d="M98 30 Q104 20 116 20" stroke="{GL}" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
         f'<circle cx="92" cy="80" r="7" fill="{G}"/><circle cx="78" cy="94" r="4.5" fill="{G}"/>' + note(124, 46, 30, BG) + note(160, 46, 30, R, True))
B['tanken-bak-sangen'] = svg('tanken-bak-sangen', skygge(52, 36) + person(52, 64, 1, G) + tanke)

B['14-sporsmal'] = svg('14-sporsmal', ''.join(spm(39 + (i % 7)*27, 42 + (i // 7)*44, 26, [G, R, GL][i % 3]) for i in range(14)), bakke=False)

kat = (f'<rect x="62" y="22" width="112" height="90" rx="7" fill="{G}"/><rect x="62" y="22" width="112" height="5" rx="2.5" fill="{GL}" opacity=".7"/>'
       f'<rect x="102" y="14" width="32" height="12" rx="3" fill="{GM}"/><rect x="110" y="10" width="16" height="7" rx="3" fill="{GM}"/>' +
       ''.join(f'<circle cx="80" cy="{48+i*20}" r="5" fill="{[R, GM, BG][i]}"/><rect x="92" y="{44+i*20}" width="{[62, 48, 70][i]}" height="8" rx="4" fill="{BG}" opacity=".45"/>' for i in range(3)) +
       klokke(198, 34, 17, .4))
B['kategorier'] = svg('kategorier', kat, bakke=False)

tommel = (f'<rect x="70" y="60" width="20" height="48" rx="4" fill="{R}"/><rect x="73" y="64" width="3" height="40" rx="1.5" fill="{K}" opacity=".25"/>'
          f'<path d="M92 108 L92 64 Q92 56 100 56 L112 56 L110 30 Q110 20 120 20 Q130 20 130 30 L132 56 L152 56 Q162 56 160 66 L154 98 Q152 108 144 108 Z" fill="{G}"/>'
          f'<path d="M114 28 Q116 23 121 23" stroke="{GL}" stroke-width="2" fill="none" stroke-linecap="round"/>'
          + ''.join(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{GM}" stroke-width="1.4" stroke-linecap="round"/>' for x1, x2, y in ((134, 156, 70), (134, 154, 82), (134, 152, 94))) +
          gnister(122, 12, .8))
B['tommelen'] = svg('tommelen', tommel + utrop(194, 58, 34, GL), bakke=False)

sjef = (skygge(120, 76) + f'<path d="M82 110 Q82 66 120 66 Q158 66 158 110 Z" fill="{GM}"/><path d="M106 68 L120 92 L134 68 Z" fill="{K}" opacity=".85"/>'
        f'<path d="M115 68 L125 68 L129 98 L120 108 L111 98 Z" fill="{R}"/><path d="M106 68 L120 92 L100 84 Z M134 68 L120 92 L140 84 Z" fill="{G}"/>'
        f'<circle cx="120" cy="42" r="20" fill="{G}"/><path d="M106 34 A16 16 0 0 1 118 25" stroke="{GL}" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
        + boble(160, 16, 58, 32, G) + utrop(189, 32, 20, BG))
B['bossen-sier'] = svg('bossen-sier', sjef)

knapper = (f'<rect x="42" y="44" width="72" height="56" rx="12" fill="{GM}"/><rect x="42" y="36" width="72" height="56" rx="12" fill="{G}"/><rect x="52" y="40" width="52" height="3" rx="1.5" fill="{GL}"/>'
           f'<rect x="126" y="44" width="72" height="56" rx="12" fill="{RM}"/><rect x="126" y="36" width="72" height="56" rx="12" fill="{R}"/><rect x="136" y="40" width="52" height="3" rx="1.5" fill="{K}" opacity=".3"/>'
           + hake(78, 64, 30, BG) + kryss(162, 64, 26, K))
B['ja-eller-nei'] = svg('ja-eller-nei', knapper, bakke=False)

bøffel = (f'<path d="M86 58 Q64 58 58 32 Q76 46 92 44 Z M154 58 Q176 58 182 32 Q164 46 148 44 Z" fill="{GL}"/>'
          f'<ellipse cx="120" cy="68" rx="36" ry="32" fill="{GM}"/><path d="M92 50 Q100 38 116 36" stroke="{G}" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
          f'<ellipse cx="120" cy="86" rx="18" ry="12" fill="{G}"/><ellipse cx="113" cy="87" rx="2.8" ry="3.6" fill="{BG}"/><ellipse cx="127" cy="87" rx="2.8" ry="3.6" fill="{BG}"/>'
          f'<circle cx="106" cy="62" r="4" fill="{BG}"/><circle cx="134" cy="62" r="4" fill="{BG}"/><circle cx="107.2" cy="60.8" r="1.2" fill="{K}"/><circle cx="135.2" cy="60.8" r="1.2" fill="{K}"/>'
          f'<path d="M104 28 Q120 18 136 28 Q130 38 120 36 Q110 38 104 28 Z" fill="{G}"/>')
B['buffalo'] = svg('buffalo', bøffel + skygge(196, 34) + glass(184, 74, .9, R))

B['skal-refleksen'] = svg('skal-refleksen', skygge(98, 26) + skygge(142, 26) + flute(102, 110, 1.15, 12) + flute(138, 110, 1.15, -12) + gnister(120, 30, 1.1) + lyn(186, 22, .62, R))

stille = (f'<circle cx="120" cy="60" r="36" fill="{G}"/><path d="M94 46 A30 30 0 0 1 110 30" fill="none" stroke="{GL}" stroke-width="2.4" stroke-linecap="round"/>'
          f'<path d="M100 54 Q106 58 112 54 M128 54 Q134 58 140 54" stroke="{BG}" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
          f'<rect x="102" y="72" width="36" height="5" rx="2.5" fill="{BG}"/><rect x="115" y="46" width="10" height="44" rx="5" fill="{R}"/><rect x="117" y="49" width="2.4" height="12" rx="1.2" fill="{K}" opacity=".3"/>'
          f'<circle cx="178" cy="60" r="3.2" fill="{GL}"/><circle cx="190" cy="60" r="2.4" fill="{GL}" opacity=".7"/><circle cx="200" cy="60" r="1.6" fill="{GL}" opacity=".45"/>')
B['stilleleken'] = svg('stilleleken', stille, bakke=False)

# =====================================================================
# MUSIKK
# =====================================================================
ark = (f'<line x1="174" y1="92" x2="162" y2="{BAKKE}" stroke="{G}" stroke-width="2"/><line x1="174" y1="92" x2="186" y2="{BAKKE}" stroke="{G}" stroke-width="2"/>'
       f'<rect x="150" y="28" width="48" height="64" rx="3" fill="{G}"/>' +
       ''.join(f'<line x1="156" y1="{40+i*5}" x2="192" y2="{40+i*5}" stroke="{BG}" stroke-opacity=".45" stroke-width=".8"/>' for i in range(5)) +
       ''.join(f'<line x1="156" y1="{66+i*5}" x2="192" y2="{66+i*5}" stroke="{BG}" stroke-opacity=".45" stroke-width=".8"/>' for i in range(5)) +
       f'<ellipse cx="164" cy="50" rx="2.6" ry="2" fill="{BG}"/><ellipse cx="176" cy="45" rx="2.6" ry="2" fill="{BG}"/><ellipse cx="186" cy="76" rx="2.6" ry="2" fill="{R}"/><ellipse cx="168" cy="71" rx="2.6" ry="2" fill="{BG}"/>')
B['opus'] = svg('opus', skygge(70, 36) + skygge(109, 30) + terning(52, 74, 36, 6) + terning(94, 80, 30, 3, R) + ark)

B['thunderstruck'] = svg('thunderstruck', lyn(92, 12, 1.95, G) + note(56, 56, 32, R) + note(184, 88, 32, GL, True) + stjerne(176, 30, 5, GL), bakke=False)

B['power-hour'] = svg('power-hour', klokke(120, 68, 38, 1/6) + note(56, 60, 26, GL) + note(186, 86, 26, GL, True), bakke=False)

bingo = (f'<rect x="70" y="14" width="100" height="100" rx="8" fill="{G}"/><rect x="70" y="14" width="100" height="5" rx="2.5" fill="{GL}" opacity=".7"/>' +
         ''.join(f'<rect x="{78+c*23}" y="{24+r*23}" width="19" height="19" rx="3" fill="{BG}" opacity=".3"/>' for r in range(4) for c in range(4)) +
         ''.join(f'<circle cx="{87.5+c*23}" cy="{33.5+r*23}" r="7.5" fill="{R}" opacity=".92"/>' for r, c in [(0, 0), (1, 1), (2, 2), (3, 3), (0, 2)]) +
         note(200, 56, 30, GL))
B['drikke-bingo'] = svg('drikke-bingo', bingo, bakke=False)

kal = (f'<rect x="74" y="26" width="92" height="82" rx="8" fill="{G}"/><path d="M74 34 Q74 26 82 26 L158 26 Q166 26 166 34 L166 48 L74 48 Z" fill="{R}"/>'
       f'<rect x="90" y="16" width="6" height="18" rx="3" fill="{GL}"/><rect x="144" y="16" width="6" height="18" rx="3" fill="{GL}"/>' +
       ''.join(f'<rect x="{82+c*20}" y="{56+r*16}" width="14" height="10" rx="2" fill="{BG}" opacity=".3"/>' for r in range(3) for c in range(4)) +
       f'<rect x="120" y="70" width="18" height="14" rx="3" fill="none" stroke="{R}" stroke-width="2"/>' + spm(200, 62, 28, GL))
B['gjett-aret'] = svg('gjett-aret', kal, bakke=False)

# =====================================================================
# TERNINGER
# =====================================================================
yatzy = ''.join(skygge(48 + i*36, 28) for i in range(5))
yatzy += ''.join(terning(33 + i*36, 80, 30, 6, R if i == 4 else G) for i in range(5))
B['drikke-yatzy'] = svg('drikke-yatzy', yatzy + gnister(120, 66, 1))

B['terningen-bestemmer'] = svg('terningen-bestemmer', skygge(116, 52) + terning(88, 54, 56, 3) + pil(156, 64, 186, 64, GL, 3.4) + spm(204, 64, 32, R) + gnister(116, 44, .9))

B['21-med-terninger'] = svg('21-med-terninger', skygge(98, 40) + skygge(141, 34) + terning(78, 70, 40, 6) + terning(124, 76, 34, 5, R) + gnister(141, 66))

B['drikkehjulet'] = svg('drikkehjulet', skygge(120, 34) + f'<path d="M110 {BAKKE} L120 98 L130 {BAKKE} Z" fill="{GM}"/>' + hjul(120, 58, 44))

# =====================================================================
# KOPPER
# =====================================================================
pong = ''
for cx, cy in [(170, 33), (170, 57), (170, 81), (149.2, 45), (149.2, 69), (128.4, 57)]:
    pong += (f'<circle cx="{cx}" cy="{cy}" r="11" fill="{R if (cx, cy) == (128.4, 57) else G}"/><circle cx="{cx}" cy="{cy}" r="7" fill="{BG}" opacity=".75"/>'
             f'<path d="M{n(cx-7)} {n(cy-3)} A8 8 0 0 1 {n(cx-2)} {n(cy-8)}" fill="none" stroke="{GL if (cx, cy) != (128.4, 57) else K}" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round"/>')
pong += f'<path d="M53 82 Q92 4 124 46" fill="none" stroke="{GL}" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="2 5"/>'
pong += f'<circle cx="46" cy="88" r="7" fill="{K}"/><path d="M42 85 A5 5 0 0 1 46 82" fill="none" stroke="{GL}" stroke-width="1.4" stroke-linecap="round"/>'
B['beer-pong'] = svg('beer-pong', pong, bakke=False)

B['flip-cup'] = svg('flip-cup', skygge(86, 36) + kopp(70, 76, 1) + roter(kopp(140, 30, 1), 160, 155, 48) +
    f'<path d="M100 66 Q112 20 146 22" stroke="{GL}" stroke-width="1.8" stroke-dasharray="3 4" fill="none" stroke-linecap="round"/>' + pil(176, 66, 190, 82, GL, 2.6))

rage = ''.join(skygge(51 + i*28, 24) for i in range(6))
rage += ''.join(kopp(40 + i*28, 85, .75, G if i == 2 else R) for i in range(6))
B['rage-cage'] = svg('rage-cage', rage + f'<circle cx="120" cy="40" r="7" fill="{K}"/><path d="M116.5 37.5 A4.6 4.6 0 0 1 120 35.6" fill="none" stroke="{GL}" stroke-width="1.3" stroke-linecap="round"/>' +
    f'<path d="M120 48 L120 62" stroke="{GL}" stroke-width="1.4" stroke-dasharray="2 3" stroke-linecap="round"/>' + lyn(168, 16, .6, GL))

flunky = (skygge(114, 34) + f'<rect x="100" y="52" width="28" height="58" rx="6" fill="{GM}"/><rect x="100" y="52" width="28" height="6" rx="3" fill="{GL}"/>'
          f'<rect x="100" y="66" width="28" height="22" fill="{G}"/><rect x="100" y="74" width="28" height="4" fill="{R}"/><rect x="104" y="58" width="3" height="48" rx="1.5" fill="{K}" opacity=".22"/>'
          f'<circle cx="172" cy="44" r="16" fill="{GL}"/><path d="M158 38 Q172 46 186 38 M158 52 Q172 44 186 52" stroke="{GM}" stroke-width="1.6" fill="none"/>'
          f'<g stroke="{GL}" stroke-width="1.6" stroke-linecap="round" opacity=".7"><line x1="196" y1="34" x2="206" y2="30"/><line x1="198" y1="46" x2="210" y2="46"/></g>' +
          skygge(56, 34) + person(56, 62, 1, G))
B['flunkyball'] = svg('flunkyball', flunky)

mynter = (skygge(119, 46) + glass(98, 46, 1.6, G) + mynt(126, 22, 11) +
          f'<path d="M140 16 Q150 8 158 16" stroke="{GL}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M126 36 L126 44" stroke="{GL}" stroke-width="1.4" stroke-dasharray="2 3" stroke-linecap="round"/>'
          f'<circle cx="106" cy="40" r="2" fill="{R}"/><circle cx="96" cy="34" r="1.5" fill="{R}"/><circle cx="148" cy="40" r="1.7" fill="{R}"/>' +
          f'<ellipse cx="58" cy="108" rx="11" ry="3.4" fill="{GM}"/><ellipse cx="58" cy="106" rx="11" ry="3.4" fill="{G}"/>' + mynt(184, 100, 10))
B['mynt-i-glasset'] = svg('mynt-i-glasset', mynter)

korken = (skygge(76, 34) + flaske(64, 38, 1.0) + skygge(162, 30) +
          f'<path d="M150 88 L174 88 L172 110 L152 110 Z" fill="{GL}"/><ellipse cx="162" cy="88" rx="12" ry="3.4" fill="{G}"/>'
          f'<g fill="{GM}" opacity=".6"><circle cx="157" cy="96" r="1.2"/><circle cx="166" cy="99" r="1.1"/><circle cx="160" cy="104" r="1"/><circle cx="168" cy="92" r=".9"/></g>' +
          f'<path d="M96 36 Q128 20 150 64" stroke="{GL}" stroke-width="2" stroke-dasharray="3 4" fill="none" stroke-linecap="round"/>' + pil(146, 58, 154, 74, GL, 2.6) + gnister(84, 32, .7, R))
B['korken'] = svg('korken', korken)

lysekrone = ''
for k in range(6):
    a = k*math.pi/3; cx, cy = 120 + 70*math.cos(a), 63 + 38*math.sin(a)
    lysekrone += f'<circle cx="{n(cx)}" cy="{n(cy)}" r="11" fill="{R}"/><circle cx="{n(cx)}" cy="{n(cy)}" r="7" fill="{BG}" opacity=".7"/><path d="M{n(cx-7)} {n(cy-3)} A8 8 0 0 1 {n(cx-2)} {n(cy-8)}" fill="none" stroke="{K}" stroke-opacity=".5" stroke-width="1.3" stroke-linecap="round"/>'
lysekrone += f'<circle cx="120" cy="63" r="18" fill="{G}"/><circle cx="120" cy="63" r="12" fill="{BG}" opacity=".75"/><path d="M109 59 A12 12 0 0 1 116 51" fill="none" stroke="{GL}" stroke-width="1.8" stroke-linecap="round"/>' + gnister(120, 36, .8)
B['chandelier'] = svg('chandelier', lysekrone, bakke=False)

# =====================================================================
# PRØVER
# =====================================================================
avis = (f'<rect x="52" y="22" width="122" height="88" rx="4" fill="{G}"/><rect x="52" y="22" width="122" height="4" rx="2" fill="{GL}" opacity=".7"/><rect x="62" y="32" width="102" height="11" rx="2" fill="{BG}"/>'
        f'<rect x="62" y="52" width="46" height="38" rx="2" fill="{R}"/><path d="M62 82 L76 70 L86 78 L96 66 L108 76 L108 90 L62 90 Z" fill="{RM}"/><circle cx="98" cy="60" r="3.6" fill="{K}" opacity=".6"/>' +
        ''.join(f'<rect x="114" y="{54+i*9}" width="{[50, 40, 46, 30, 44][i]}" height="4" rx="2" fill="{BG}" opacity=".45"/>' for i in range(5)) +
        f'<rect x="62" y="96" width="102" height="4" rx="2" fill="{BG}" opacity=".3"/>'
        f'<circle cx="190" cy="86" r="18" fill="{GL}"/><circle cx="190" cy="86" r="14" fill="none" stroke="{GM}" stroke-width="1.4"/>' + stjerne(190, 86, 8, R))
B['nyhetsrunden'] = svg('nyhetsrunden', avis, bakke=False)

prove = (f'<rect x="68" y="14" width="96" height="102" rx="4" fill="{G}"/><rect x="68" y="14" width="96" height="4" rx="2" fill="{GL}" opacity=".7"/>' +
         ''.join(f'<rect x="78" y="{26+i*18}" width="11" height="11" rx="2" fill="none" stroke="{BG}" stroke-width="1.8"/><rect x="96" y="{29+i*18}" width="{[52, 42, 56, 36, 48][i]}" height="4" rx="2" fill="{BG}" opacity=".45"/>' for i in range(5)) +
         hake(84, 31, 14, R) + hake(84, 67, 14, R) + hake(84, 85, 14, R) +
         f'<path d="M184 70 L176 104 L186 98 L192 108 L196 70 Z" fill="{R}"/><path d="M200 70 L208 104 L198 98 L192 108 L188 70 Z" fill="{RM}"/>'
         f'<circle cx="192" cy="60" r="18" fill="{GL}"/><circle cx="192" cy="60" r="13.5" fill="none" stroke="{GM}" stroke-width="1.4"/>' + stjerne(192, 60, 8, GM))
B['nasjonal-vorsprove'] = svg('nasjonal-vorsprove', prove, bakke=False)

tavle = (f'<rect x="38" y="18" width="164" height="80" rx="4" fill="{GM}"/><rect x="44" y="24" width="152" height="68" rx="2" fill="{M}"/>'
         f'<rect x="34" y="96" width="172" height="7" rx="2" fill="{G}"/><rect x="60" y="99" width="12" height="3" rx="1.5" fill="{K}" opacity=".8"/>'
         f'<g stroke="{K}" stroke-opacity=".85" stroke-width="2.6" stroke-linecap="round" fill="none"><circle cx="70" cy="58" r="9"/><path d="M90 58 H104 M97 51 V65"/><circle cx="124" cy="58" r="9"/><path d="M144 54 H158 M144 62 H158"/></g>' +
         spm(178, 57, 22, K) + f'<path d="M58 80 Q90 76 120 82" stroke="{K}" stroke-opacity=".25" stroke-width="2" fill="none" stroke-linecap="round"/>'
         f'<circle cx="184" cy="88" r="8" fill="{R}"/><path d="M184 80 Q186 74 191 73 Q189 79 184 80 Z" fill="{G}"/><path d="M180 85 A5 5 0 0 1 183 82" stroke="{K}" stroke-opacity=".4" stroke-width="1.4" fill="none" stroke-linecap="round"/>')
B['tilbake-til-5-trinn'] = svg('tilbake-til-5-trinn', tavle, bakke=False)

# =====================================================================
# SKJERM OG BRETT
# =====================================================================
kontroll = (f'<path d="M70 50 Q70 36 86 36 L154 36 Q170 36 170 50 L180 90 Q182 102 170 102 Q160 102 154 90 L146 80 L94 80 L86 90 Q80 102 70 102 Q58 102 60 90 Z" fill="{G}"/>'
            f'<path d="M76 46 Q78 40 88 40 L120 40" stroke="{GL}" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
            f'<rect x="80" y="54" width="22" height="7" rx="2" fill="{BG}"/><rect x="87.5" y="46.5" width="7" height="22" rx="2" fill="{BG}"/>'
            f'<circle cx="148" cy="52" r="5" fill="{R}"/><circle cx="160" cy="62" r="5" fill="{GL}"/><circle cx="136" cy="62" r="5" fill="{GM}"/><circle cx="148" cy="72" r="5" fill="{GM}"/>'
            f'<rect x="110" y="56" width="8" height="3" rx="1.5" fill="{GM}"/><rect x="122" y="56" width="8" height="3" rx="1.5" fill="{GM}"/>' +
            ''.join(f'<rect x="{192+(i%2)*8}" y="{14+(i//2)*8}" width="8" height="8" fill="{K if (i + i//2) % 2 else BG}"/>' for i in range(6)) +
            f'<line x1="192" y1="14" x2="192" y2="58" stroke="{G}" stroke-width="1.6"/>')
B['beerio-kart'] = svg('beerio-kart', kontroll, bakke=False)

ball = (skygge(110, 70) + f'<circle cx="110" cy="68" r="42" fill="{G}"/><polygon points="110,51 124,61 119,77 101,77 96,61" fill="{BG}"/>'
        f'<path d="M110 51 L110 27 M124 61 L148 54 M119 77 L134 100 M101 77 L86 100 M96 61 L72 54" stroke="{BG}" stroke-width="2.4"/>'
        f'<path d="M80 48 A36 36 0 0 1 100 32" fill="none" stroke="{GL}" stroke-width="2.6" stroke-linecap="round"/>'
        f'<line x1="186" y1="40" x2="186" y2="{BAKKE}" stroke="{G}" stroke-width="2"/><path d="M186 40 L208 48 L186 56 Z" fill="{R}"/>')
B['fotballkamp'] = svg('fotballkamp', ball)

mikrofon = (skygge(120, 40) + f'<ellipse cx="120" cy="110" rx="18" ry="3" fill="{GM}"/><rect x="118" y="88" width="4" height="22" fill="{G}"/>'
            f'<rect x="111" y="50" width="18" height="42" rx="7" fill="{GM}"/><rect x="113.5" y="56" width="3" height="30" rx="1.5" fill="{GL}" opacity=".4"/>'
            f'<circle cx="120" cy="38" r="17" fill="{G}"/>' +
            ''.join(f'<line x1="{n(120-math.sqrt(max(0, 15**2-(dy)**2)))}" y1="{38+dy}" x2="{n(120+math.sqrt(max(0, 15**2-(dy)**2)))}" y2="{38+dy}" stroke="{BG}" stroke-opacity=".35" stroke-width="1"/>' for dy in (-10, -5, 0, 5, 10)) +
            f'<path d="M108 30 A13 13 0 0 1 116 25" fill="none" stroke="{GL}" stroke-width="2" stroke-linecap="round"/>' +
            stjerne(60, 40, 13, GL) + stjerne(186, 34, 9, R) + stjerne(176, 88, 11, G) + stjerne(64, 90, 7, R) + gnister(120, 12, .7))
B['eurovision'] = svg('eurovision', mikrofon)

uno = ''
for i, fyll in enumerate([R, G, GM, GL, R]):
    rot = (i-2)*9; x = 64 + i*24; y = 36 + abs(i-2)*4
    inn = f'<rect x="{x}" y="{y}" width="36" height="54" rx="5" fill="{fyll}"/><ellipse cx="{x+18}" cy="{y+27}" rx="11" ry="19" fill="{BG}" opacity=".25" transform="rotate(30 {x+18} {y+27})"/>'
    inn += f'<rect x="{x+3}" y="{y+3}" width="30" height="48" rx="3" fill="none" stroke="{K}" stroke-opacity=".3" stroke-width=".8"/>'
    if i == 2:
        inn += f'<rect x="{x+10}" y="{y+16}" width="12" height="17" rx="2" fill="{GL}"/><rect x="{x+15}" y="{y+21}" width="12" height="17" rx="2" fill="{G}" stroke="{GM}" stroke-width="1"/>'
    uno += roter(inn, rot, x + 18, y + 80)
B['drikke-uno'] = svg('drikke-uno', uno, bakke=False)

sjakk = skygge(108, 120) + ''.join(f'<rect x="{48+c*15}" y="{52+r*15}" width="15" height="15" fill="{G if (r+c) % 2 else GM}"/>' for r in range(4) for c in range(8))
sjakk += f'<rect x="48" y="52" width="120" height="60" fill="none" stroke="{GL}" stroke-opacity=".5" stroke-width="1"/>'
sjakk += (f'<path d="M96 66 Q96 58 101 54 Q96 50 99 45 Q103 41 107 45 Q110 50 105 54 Q110 58 110 66 Z" fill="{GL}"/><rect x="93" y="64" width="20" height="5" rx="2" fill="{GL}"/>'
          f'<path d="M126 66 L128 46 L140 46 L142 66 Z" fill="{M}"/><rect x="123" y="64" width="22" height="5" rx="2" fill="{M}"/><circle cx="134" cy="41" r="5" fill="{M}"/><path d="M131 34 H137 M134 31 V37" stroke="{M}" stroke-width="2"/>')
sjakk += skygge(194, 28) + glass(182, 74, .9, R)
B['sjakkdrikk'] = svg('sjakkdrikk', sjakk)

# =====================================================================
# DE TI FELLES MOTIVENE (når en lek ikke har sitt eget bilde)
# =====================================================================
MOTIV = {}
MOTIV['kort'] = svg('kort', kort(66, 40, 40, 58, -14, 'gull', 'hjerte') + kort(134, 40, 40, 58, 14, 'rod', 'ruter', K) + kort(99, 32, 42, 62, 0, 'gull', 'spar') + gnister(120, 20, .9), bakke=False)
MOTIV['bobler'] = svg('bobler', boble(52, 22, 92, 56, G) + spm(98, 48, 34, BG) + boble(136, 54, 62, 40, R, 'h') + utrop(167, 74, 26, K), bakke=False)
tlf = skygge(70, 36) + skygge(120, 40) + skygge(170, 36)
tlf += telefon(54, 52, 32, 58, BG, ''.join(f'<rect x="61" y="{64+i*8}" width="{[18, 14, 16, 10][i]}" height="4" rx="2" fill="{GL}" opacity=".7"/>' for i in range(4)))
tlf += telefon(101, 44, 38, 66, R, spm(120, 76, 24, K))
tlf += telefon(154, 52, 32, 58, BG, hake(170, 80, 18, GL))
MOTIV['telefoner'] = svg('telefoner', tlf)
MOTIV['musikk'] = svg('musikk', note(96, 62, 64, G, True) + note(162, 74, 38, R) +
    ''.join(f'<path d="M{186+i*8} {46-i*4} Q{196+i*10} 63 {186+i*8} {80+i*4}" fill="none" stroke="{GL}" stroke-opacity="{.8-i*.25}" stroke-width="2" stroke-linecap="round"/>' for i in range(3)), bakke=False)
MOTIV['terning'] = svg('terning', skygge(96, 46) + skygge(146, 38) + terning(72, 62, 48, 4) + terning(126, 70, 40, 2, R) + gnister(146, 60, 1))
kp = ''.join(skygge(c + 15*1.1, 30) for c in (62, 106, 150)) + kopp(62, 72, 1.1) + kopp(106, 72, 1.1, G) + kopp(150, 72, 1.1)
MOTIV['kopper'] = svg('kopper', kp + f'<circle cx="123" cy="40" r="7" fill="{K}"/><path d="M119.5 37.5 A4.6 4.6 0 0 1 123 35.6" fill="none" stroke="{GL}" stroke-width="1.3" stroke-linecap="round"/>' +
    f'<path d="M123 50 L123 62" stroke="{GL}" stroke-width="1.4" stroke-dasharray="2 3" stroke-linecap="round"/>')
MOTIV['quiz'] = svg('quiz', f'<rect x="66" y="16" width="92" height="98" rx="4" fill="{G}"/><rect x="66" y="16" width="92" height="4" rx="2" fill="{GL}" opacity=".7"/>' +
    ''.join(f'<rect x="76" y="{30+i*20}" width="12" height="12" rx="2" fill="none" stroke="{BG}" stroke-width="1.8"/><rect x="96" y="{34+i*20}" width="{[48, 38, 52, 30][i]}" height="4" rx="2" fill="{BG}" opacity=".45"/>' for i in range(4)) +
    hake(82, 36, 15, R) + hake(82, 76, 15, R) + spm(192, 62, 46, GL), bakke=False)
MOTIV['klokke'] = svg('klokke', klokke(120, 68, 40, .3) + gnister(176, 34, .8), bakke=False)
MOTIV['hjul'] = svg('hjul', skygge(120, 34) + f'<path d="M110 {BAKKE} L120 98 L130 {BAKKE} Z" fill="{GM}"/>' + hjul(120, 58, 44))
tv = (skygge(120, 60) + f'<rect x="114" y="92" width="12" height="14" fill="{GM}"/><rect x="96" y="104" width="48" height="6" rx="3" fill="{G}"/>'
      f'<rect x="58" y="20" width="124" height="76" rx="8" fill="{G}"/><rect x="65" y="27" width="110" height="62" rx="4" fill="{M}"/>'
      f'<path d="M72 34 L100 34" stroke="{GL}" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>'
      f'<circle cx="120" cy="58" r="17" fill="{R}"/><path d="M114 49 L130 58 L114 67 Z" fill="{K}"/>')
MOTIV['skjerm'] = svg('skjerm', tv)

# ---------- skriv ----------
for slug, s in B.items():
    with open(os.path.join(UT_LEK, slug + '.svg'), 'w', encoding='utf-8') as fil: fil.write(s)
for navn, s in MOTIV.items():
    with open(os.path.join(UT_MOTIV, navn + '.svg'), 'w', encoding='utf-8') as fil: fil.write(s)
alle = sorted(B)
with open(os.path.join(ROT, 'src', 'data', 'bannere.json'), 'w', encoding='utf-8') as fil: json.dump(alle, fil)
print(len(alle), 'bannere og', len(MOTIV), 'motiver')

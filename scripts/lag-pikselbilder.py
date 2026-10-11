# Lager bildene til drikkelekene (240x126 SVG) som pikselkunst i stua-stilen (se DESIGN.md):
# store, rette piksler, tykk svart kant rundt hver figur, flate stua-farger, hard pikselskygge og ett
# fargefelt per lek. Hver lek settes sammen av små figurer (kort, terninger, kopper, dyr, ansikter …).
# Ingen tekst og ingen skrifttegn: bildene vises som <img>, og da finnes ikke sidens skrifter.
#
# Lager ett bilde per lek (public/illustrasjoner/lek/<slug>.svg + src/data/bannere.json)
# og de ti felles motivene (public/illustrasjoner/<motiv>.svg).
#
# Kjør fra prosjektmappa:  python scripts/lag-pikselbilder.py
import os, json, random

ROT = os.path.join(os.path.dirname(__file__), '..')
UT_LEK = os.path.join(ROT, 'public', 'illustrasjoner', 'lek')
UT_MOTIV = os.path.join(ROT, 'public', 'illustrasjoner')
os.makedirs(UT_LEK, exist_ok=True)

PAL = {
    'k': '#16120F', 'y': '#FFD23F', 'l': '#FFE98F', 'o': '#FF5B1F', 'd': '#C23D0A', 'm': '#63E2A8', 'M': '#2EA873',
    'p': '#FF9CC2', 'P': '#F06A9E', 'w': '#FFF8EE', 'b': '#7CC6FE', 'B': '#3A7BD5', 's': '#F2B98B', 'S': '#C98D63',
    'n': '#B9773F', 'N': '#7A4A2A', 'g': '#2A292E', 'G': '#8A8580', 'r': '#E2363B',
}
FELT = ['#63E2A8', '#FF9CC2', '#7CC6FE', '#FFF8EE', '#FFB98A', '#C7B8FF']
CELLE, KOL, RAD = 6, 40, 21          # 40 x 21 piksler à 6 px = 240 x 126

def S(*rader):
    """En figur: rader med tegn fra PAL, '.' er tomt. Rader fylles ut til lik bredde."""
    b = max(len(r) for r in rader)
    return [r.ljust(b, '.') for r in rader]
def speil(f): return [r[::-1] for r in f]
def snu(f): return list(reversed(f))
def farge(f, fra, til): return [r.replace(fra, til) for r in f]

# ---------- figurer ----------
SUIT = {
    'hjerte': S('.o.o.', 'ooooo', 'ooooo', '.ooo.', '..o..'),
    'ruter': S('..o..', '.ooo.', 'ooooo', '.ooo.', '..o..'),
    'spar': S('..k..', '.kkk.', 'kkkkk', 'kkkkk', '..k..'),
    'klover': S('.kkk.', '.kkk.', 'kkkkk', 'kkkkk', '..k..'),
    'krone': S('k.k.k', 'kkkkk', 'kokok', 'kkkkk', '.....'),
}
def kort(suit='hjerte', flate='w'):
    f = [list(flate * 9) for _ in range(12)]
    if suit:
        g = SUIT[suit]
        for y, r in enumerate(g):
            for x, c in enumerate(r):
                if c != '.': f[y + 4][x + 2] = c
        f[1][1] = g[2][2]
    else:
        for y in range(2, 10):
            for x in range(2, 7): f[y][x] = 'o' if (x + y) % 2 else 'd'
    return [''.join(r) for r in f]
def terning(n=5, flate='w', prikk='k'):
    f = [list(flate * 9) for _ in range(9)]
    P = {1: [(4, 4)], 2: [(2, 2), (6, 6)], 3: [(2, 2), (4, 4), (6, 6)], 4: [(2, 2), (6, 2), (2, 6), (6, 6)],
         5: [(2, 2), (6, 2), (4, 4), (2, 6), (6, 6)], 6: [(2, 2), (6, 2), (2, 4), (6, 4), (2, 6), (6, 6)]}[n]
    for x, y in P: f[y][x] = prikk
    return [''.join(r) for r in f]

KOPP = S('wwwwwwww', 'oooooooo', 'owoooooo', '.owoooo.', '.oooooo.', '.dddddd.', '.oooooo.', '..oooo..', '..oooo..')
OL = S('wwwwww..', 'wwwwwww.', 'ylyyyykk', 'ylyyyyk.k', 'yyyyyyk.k', 'yyyyyykk', 'yyyyyy..', 'yyyyyy..', '.yyyy...')
SHOT = S('wwwww', 'wyyyw', 'wyyyw', '.www.')
FLASKE = S('..k..', '.mmm.', '.mmm.', '.mmm.', 'mmmmm', 'mwmmm', 'wwwww', 'wooow', 'wwwww', 'mmmmm', 'mwmmm', 'mmmmm', 'mmmmm')
TELEFON = S('kkkkkkkk', 'kbbbbbbk', 'kbwwwbbk', 'kbbbbbbk', 'kbwwbbbk', 'kbbbbbbk', 'kbwwwwbk', 'kbbbbbbk', 'kbbbbbbk', 'kbbbbbbk', 'kkkkkkkk', 'kkkwwkkk', 'kkkkkkkk')
def boble(b=11, h=7, flate='w', hale='v'):
    f = [flate * b for _ in range(h)]
    f[0] = '.' + flate * (b - 2) + '.'; f[-1] = '.' + flate * (b - 2) + '.'
    t = ('..' + flate + flate) if hale == 'v' else (('.' * (b - 4)) + flate + flate)
    f += [t.ljust(b, '.'), (('..' + flate) if hale == 'v' else ('.' * (b - 3) + flate)).ljust(b, '.')]
    return f
SPM = S('.kkk.', 'k...k', '....k', '..kk.', '..k..', '.....', '..k..')
UTROP = S('k', 'k', 'k', 'k', 'k', '.', 'k')
HAKE = S('......k', '.....kk', 'k...kk.', 'kk.kk..', '.kkk...', '..k....')
KRYSS = S('k...k', '.k.k.', '..k..', '.k.k.', 'k...k')
NOTE = S('..yyyyy', '..y...y', '..y...y', '..y...y', 'yyy.yyy', 'yyy.yyy')
NOTE1 = S('..oo', '..o.o', '..o..', '..o..', 'ooo..', 'ooo..')
STJERNE = S('...y...', '...y...', 'yyyyyyy', '.yyyyy.', '..yyy..', '.yy.yy.', '.y...y.')
LYN = S('...yyy', '..yyy.', '.yyy..', 'yyyyyy', '...yy.', '..yy..', '.yy...', 'yy....')
def person(skjorte='o', har='N', hud='s'):
    return S(f'..{har * 5}..', f'.{har * 7}.', f'.{har}{hud * 5}{har}.', f'.{hud}k{hud * 3}k{hud}.', f'.{hud * 7}.', f'..{hud}kkk{hud}..', f'...{hud * 3}...',
             f'.{skjorte * 7}.', skjorte * 9, skjorte * 9, skjorte * 9)
def ansikt(uttrykk='smil', flate='y'):
    f = [list(r) for r in S('...' + flate * 5 + '...', '.' + flate * 9 + '.', '.' + flate * 9 + '.', flate * 11, flate * 11, flate * 11, flate * 11, flate * 11,
                             '.' + flate * 9 + '.', '.' + flate * 9 + '.', '...' + flate * 5 + '...')]
    for x, y in ((3, 4), (7, 4), (3, 3), (7, 3)): f[y][x] = 'k'
    munn = {'smil': [(3, 7), (4, 8), (5, 8), (6, 8), (7, 7)], 'glis': [(3, 7), (4, 7), (5, 7), (6, 7), (7, 7), (4, 8), (5, 8), (6, 8)],
            'o': [(5, 7), (5, 8), (4, 7), (6, 7), (4, 8), (6, 8)], 'rett': [(3, 7), (4, 7), (5, 7), (6, 7), (7, 7)],
            'glidelas': [(2, 7), (3, 7), (4, 7), (5, 7), (6, 7), (7, 7), (8, 7), (3, 6), (5, 6), (7, 6), (3, 8), (5, 8), (7, 8)]}[uttrykk]
    for x, y in munn: f[y][x] = 'k'
    if uttrykk == 'glis':
        for x in (4, 5, 6): f[8][x] = 'w'
    return [''.join(r) for r in f]
KRONE = S('y...y...y', 'yy.yyy.yy', 'yyyyyyyyy', 'yoyyoyyoy', 'yyyyyyyyy')
BALL = S('...wwwww...', '..wwkkkww..', '.wwkkkkkww.', 'wwwwkkkwwww', 'wkwwwwwwwkw', 'kkkwwwwwkkk', 'wkwwwwwwwkw', 'wwwwkkkwwww', '.wwkkkkkww.', '..wwkkkww..', '...wwwww...')
PINGPONG = S('.ww.', 'wwww', 'wwww', '.ww.')
MIKROFON = S('.ggggg.', 'gGgGgGg', 'ggGgGgg', 'gGgGgGg', '.ggggg.', '..yyy..', '...y...', '...y...', '...y...', '...y...', '..yyy..', '.yyyyy.')
KONTROLLER = S('..yyyy....yyyy..', '.yyyyyyyyyyyyyy.', 'yykyyyyyyyyyoyyy', 'ykkkyyyyyyyoyoyy', 'yykyyyyyyyyyoyyy', 'yyyyyyyyyyyyyyyy', 'yyyyy......yyyyy', '.yyy........yyy.')
FLAGG = S('kooooo', 'kooooo', 'kooooo', 'k.....', 'k.....', 'k.....', 'k.....', 'k.....', 'k.....', 'k.....')
MAALFLAGG = S('kwkwk', 'kkwkw', 'kwkwk', 'k....', 'k....', 'k....', 'k....', 'k....', 'k....', 'k....')
SJAKK = S(*[''.join('y' if (x + y) % 2 else 'm' for x in range(12)) for y in range(8)])
TAARN = S('k.k.k', 'kkkkk', '.kkk.', '.kkk.', 'kkkkk')
ARK = S('wwwwwwwwww', 'wkkwwwwwww', 'wkkwkkkkkw', 'wwwwwwwwww', 'wowwwwwwww', 'wwwwkkkkww', 'wwwwwwwwww', 'wkkwwwwwww', 'wkkwkkkkkw', 'wwwwwwwwww', 'wowwkkkwww', 'wwwwwwwwww')
TV = S('kkkkkkkkkkkkkkk', 'kbbbbbbbbbbbbbk', 'kbbbbbbobbbbbbk', 'kbbbbbbooobbbbk', 'kbbbbbbooooobbk', 'kbbbbbbooobbbbk', 'kbbbbbbobbbbbbk', 'kbbbbbbbbbbbbbk', 'kkkkkkkkkkkkkkk', '......kkk......', '....kkkkkkk....')
PIL_OPP = S('...y...', '..yyy..', '.yyyyy.', 'yyyyyyy', '..yyy..', '..yyy..', '..yyy..', '..yyy..')
PIL_NED = snu(farge(PIL_OPP, 'y', 'o'))
HAAND = S('..ssss........', '.ssssss.......', 'osssssssssssss', 'osssssssssssss', 'osssssss......', 'osssssss......', '.ssssss.......')
MASKE = S('.mmmmm.....mmmmm.', 'mmmmmmm...mmmmmmm', 'mmkkkkmmmmmkkkkmm', 'mmkkkkmmmmmkkkkmm', '.mmmmmm...mmmmmm.', '..mmmm.....mmmm..')
FABRIKK = S('..............GG', '.............GG.', 'y.....y.....kkk.', 'yy....yy....kkk.', 'yyy...yyy...kkk.', 'yyyy..yyyy..kkk.', 'yyyyyyyyyyyykkk.', 'yoyyoyyoyyyykkk.', 'yyyyyyyyyyyykkk.', 'yoyyoyyoyyyykkk.', 'yyyyyyyyyyyykkkk')
FINGRE = S('...s.s.s...', '...s.s.s.s.', '.s.s.s.s.s.', '.s.s.s.s.s.', '.sssssssss.', '.sssssssss.', '..sssssss..', '..sssssss..', '...ooooo...', '...ooooo...')
HJERTE = S('.oo...oo.', 'oooo.oooo', 'ooooooooo', 'ooowooooo', '.ooooooo.', '..ooooo..', '...ooo...', '....o....')
FLAMME = S('....o....', '...oo....', '...ooo...', '..oooo.o.', '..ooyoooo', '.ooyyyooo', '.ooyyyyoo', 'ooyyyyyoo', 'ooyyyyyoo', '.ooyyyoo.', '..ooooo..')
KALENDER = S('.k.....k.', 'ooooooooo', 'ooooooooo', 'wwwwwwwww', 'wkwkwkwkw', 'wwwwwwwww', 'wkwkwowkw', 'wwwwwwwww', 'wkwkwkwkw', 'wwwwwwwww')
MEDALJE = S('o.....o', 'oo...oo', '.oo.oo.', '..yyy..', '.yyyyy.', 'yyywyyy', 'yywwwyy', 'yyywyyy', '.yyyyy.', '..yyy..')
KLOKKE = S('....kkk....', '...wwwww...', '..wwwwwww..', '.wwwwkwwww.', 'wwwwwkwwwww', 'wwwwwkwwwww', 'wwwwwkkkwww', 'wwwwwwwwwww', 'wwwwwwwwwww', '.wwwwwwwww.', '..wwwwwww..', '...wwwww...')
HJUL = S('...yyyoo...', '..yyyyooo..', '.yyyyyoooo.', 'yyyyyyooooo', 'yyyyyyooooo', 'mmmmmkppppp', 'mmmmmmppppp', 'mmmmmmppppp', '.mmmmmpppp.', '..mmmmppp..', '...mmmpp...')
PEKER = S('kkk', '.k.')
MULDVARP = S('....nnnn....', '...nnnnnn...', '..nnnnnnnn..', '..nkknnkkn..', '..nkkkkkkn..', '..nnnppnnn..', '..nnnnnnnn..', '.NNNnnnnNNN.', 'NNNNNNNNNNNN', '.NN.NNN.NN..')
BREV = S('wwwwwwwwwwww', 'wkwwwwwwwwkw', 'wwkwwwwwwkww', 'wwwkwwwwkwww', 'wwwwkookwwww', 'wwwwwoowwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww')
FISK = S('....mmmmm....m', '...mmmmmmm..mm', '..mwkmmmmmmmm.', '..mmmmmmmmmm..', '...mmmmmmm.mm.', '....mmmmm....m')
SAU = S('..wwwwwww....', '.wwwwwwwwww..', 'wwwwwwwwkkkk.', 'wwwwwwwwkwkk.', 'wwwwwwwwkkkk.', '.wwwwwwwww...', '..k.k..k.k...', '..k.k..k.k...')
NESE = S('...NNNN.......', '..NNNNNN......', '..ssssss......', '..sksssk......', '..sssssssssss.', '..ssssss......', '..ssooss......', '...ssss.......')
BLYANT = S('..........yy', '.........yyy', '........yyy.', '.......yyy..', '......yyy...', '.....yyy....', '....yyy.....', '...ppy......', '...kp.......', '..k.........')
MYNT = S('....yyyy....', '..yyyyyyyy..', '.yylllllyyy.', '.ylyyyyyyly.', '.ylykkkkyly.', '.ylyyyykyly.', '.ylykkkkyly.', '.ylyyyyyyly.', '.yylllllyyy.', '..yyyyyyyy..', '....yyyy....')
GRIS = S('.pp......pp.', '.ppp....ppp.', '..pppppppp..', '.pppppppppp.', '.ppkppppkpp.', 'pppppppppppp', 'ppppPPPPpppp', 'pppPkPPkPppp', 'ppppPPPPpppp', '.pppppppppp.', '..pppppppp..')
BUSS = S('yyyyyyyyyyyyyyyyyy', 'ybbbybbbybbbyybbby', 'ybbbybbbybbbyybbby', 'ybbbybbbybbbyybbby', 'yyyyyyyyyyyyyybbby', 'ooooooooooooyybbby', 'yyyyyyyyyyyyyyyyyy', 'yyyyyyyyyyyyyyyyyy', '..kkk.......kkk...', '..kkk.......kkk...')
AVIS = S('wwwwwwwwwwww', 'woooooooooow', 'woooooooooow', 'wwwwwwwwwwww', 'wkkkkwmmmmmw', 'wwwwwwmmmmmw', 'wkkkkwmmmmmw', 'wwwwwwmmmmmw', 'wkkkkwwwwwww', 'wwwwwwkkkkkw', 'wkkkkwwwwwww', 'wwwwwwwwwwww')
AGENT = S('...kkkkk...', '..kkkkkkk..', '..kooooook..', 'kkkkkkkkkkk', '..sssssss..', '.kkkkskkkkk.', '.kkkksskkkk.', '..sssssss..', '..ssskkss..', '...sssss...')
TOMMEL = S('...ss.....', '...sss....', '...sss....', '..ssss....', 'osssssssss', 'oSssssssss', 'osssssSsss', 'oSssssssss', 'ossssSssss', '.sssssssss')
KORK = S('.nnn.', 'nNnnn', 'nnnNn', '.nnn.')
TRAPP = S('............yyy', '............yyy', '.........yyyyyy', '.........yyyyyy', '......yyyyyyyyy', '......yyyyyyyyy', '...yyyyyyyyyyyy', '...yyyyyyyyyyyy', 'yyyyyyyyyyyyyyy', 'yyyyyyyyyyyyyyy')
MUGGE = S('wwwwwwww..', 'wwwwwwwwk.', 'yyyyyyyykk', 'ylyyyyyy.k', 'ylyyyyyy.k', 'yyyyyyyykk', 'yyyyyyyyk.', 'yyyyyyyy..', '.yyyyyy...')
TANKE = S('..wwwwwwww..', '.wwwwwwwwww.', 'wwwkkwwwwwww', 'wwwkwkwkkwww', 'wwwkwwwkwkww', 'wwkkwwkkwwww', '.wwwwwwwwww.', '..wwwwwwww..', '..ww........', '.w..........')
HODE_KJENT = S('...kkkk...', '..kkkkkk..', '.ssssssss.', '.sksssks..', '.ssssssss.', '.sskkkss..', '..ssssss..', '...ssss...')

# ---------- tegnebrett ----------
class Brett:
    def __init__(s, kol=KOL, rad=RAD):
        s.kol, s.rad = kol, rad
        s.c = [[None] * kol for _ in range(rad)]
    def legg(s, f, x, y):
        """Legger en figur med svart kant rundt (og under figurene som ligger der fra før)."""
        h, b = len(f), len(f[0])
        fyllt = lambda xx, yy: 0 <= yy < h and 0 <= xx < b and f[yy][xx] != '.'
        for yy in range(-1, h + 1):
            for xx in range(-1, b + 1):
                if fyllt(xx, yy): continue
                if any(fyllt(xx + dx, yy + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    s.sett(x + xx, y + yy, 'k')
        for yy in range(h):
            for xx in range(b):
                if f[yy][xx] != '.': s.sett(x + xx, y + yy, f[yy][xx])
    def sett(s, x, y, c):
        if 0 <= x < s.kol and 0 <= y < s.rad: s.c[y][x] = c

def bredde(f): return len(f[0])
def rekke(*deler, gap=2, bunn=17, svev=None):
    """Legger figurer etter hverandre, midtstilt, med føttene på samme linje. svev = {indeks: løft}."""
    svev = svev or {}
    total = sum(bredde(f) + 2 for f in deler) + gap * (len(deler) - 1)
    x = (KOL - total) // 2 + 1
    ut = []
    for i, f in enumerate(deler):
        ut.append((f, x, bunn - len(f) - svev.get(i, 0)))
        x += bredde(f) + 2 + gap
    return ut

def tegn(slug, plasser, pynt=True):
    """Tegner figurene på et stort brett, finner motivet og skalerer pikslene så det får plass (6, 5 eller 4 px)."""
    stor = Brett(120, 80)
    for f, x, y in plasser: stor.legg(f, x + 40, y + 30)
    fylt = [(x, y) for y, r in enumerate(stor.c) for x, c in enumerate(r) if c]
    x0, x1 = min(p[0] for p in fylt), max(p[0] for p in fylt)
    y0, y1 = min(p[1] for p in fylt), max(p[1] for p in fylt)
    w, h = x1 - x0 + 2, y1 - y0 + 2                      # + skyggen
    celle = max(3, min(CELLE, 232 // (w + 2), 118 // (h + 2)))
    kol, rad = 240 // celle + 1, 126 // celle + 1
    ox, oy = (240 - w * celle) // 2, (126 - h * celle) // 2   # motivet midt i bildet (i px)
    c = {(x - x0, y - y0): stor.c[y][x] for x, y in fylt}
    skygge = {(x + 1, y + 1) for (x, y) in c if (x + 1, y + 1) not in c}
    rng = random.Random(slug)
    felt = FELT[sum(ord(ch) for ch in slug) % len(FELT)]
    deler = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 126" width="240" height="126" shape-rendering="crispEdges"><rect width="240" height="126" fill="{felt}"/>']
    # Pynt: små pikselgnister der det er tomt (i rutenettet til motivet, så de står i takt)
    if pynt:
        opptatt = {(ox + x * celle, oy + y * celle) for (x, y) in c} | {(ox + x * celle, oy + y * celle) for (x, y) in skygge}
        gx0, gy0 = -(ox // celle), -(oy // celle)
        for _ in range(rng.randint(2, 4)):
            for forsok in range(30):
                gx, gy = rng.randint(gx0 + 1, gx0 + kol - 4), rng.randint(gy0 + 1, gy0 + rad - 4)
                ruter = [(gx + i, gy + j) for i in range(-1, 4) for j in range(-1, 4)]
                if all((x, y) not in c and (x, y) not in skygge for x, y in ruter):
                    px = lambda v, o: o + v * celle
                    if not (0 <= px(gx, ox) and px(gx + 3, ox) <= 240 and 0 <= px(gy, oy) and px(gy + 3, oy) <= 126): continue
                    farg = rng.choice(['#FFF8EE', '#16120F'])
                    for i, j in ((1, 0), (0, 1), (1, 1), (2, 1), (1, 2)):
                        deler.append(f'<rect x="{px(gx + i, ox)}" y="{px(gy + j, oy)}" width="{celle}" height="{celle}" fill="{farg}"/>')
                    break
    def lop(punkter, fyll):
        ut = []
        for y in sorted({p[1] for p in punkter}):
            xs = sorted(p[0] for p in punkter if p[1] == y)
            s0 = forrige = xs[0]
            for x in xs[1:] + [None]:
                if x is not None and x == forrige + 1: forrige = x; continue
                ut.append(f'<rect x="{ox + s0 * celle}" y="{oy + y * celle}" width="{(forrige - s0 + 1) * celle}" height="{celle}" fill="{fyll}"/>')
                if x is not None: s0 = forrige = x
        return ut
    deler += lop(skygge, '#16120F')
    for ch, hex_ in PAL.items():
        pk = {p for p, v in c.items() if v == ch}
        if pk: deler += lop(pk, hex_)
    return ''.join(deler) + '</svg>'

# ---------- lekene ----------
B = {}
K = kort
B['100-sporsmal'] = tegn('100-sporsmal', rekke(farge(SPM, 'k', 'o'), boble(13, 8, 'w'), farge(SPM, 'k', 'o'), svev={0: 6, 2: 2}))
B['14-sporsmal'] = tegn('14-sporsmal', rekke(boble(11, 7, 'y'), boble(11, 7, 'w', 'h'), svev={0: 6}))
B['21-med-terninger'] = tegn('21-med-terninger', rekke(terning(5), terning(6, 'o', 'w'), OL))
B['50-50'] = tegn('50-50', rekke(farge(HAKE, 'k', 'M'), S(*[('y' * 6 + 'o' * 6) for _ in range(10)]), farge(KRYSS, 'k', 'r'), svev={0: 3, 2: 3}))
B['beer-pong'] = tegn('beer-pong', rekke(PINGPONG, KOPP, KOPP, KOPP, svev={0: 9}, gap=0))
B['beerio-kart'] = tegn('beerio-kart', rekke(KONTROLLER, MAALFLAGG))
B['bloffquizen'] = tegn('bloffquizen', rekke(FISK, farge(SPM, 'k', 'o'), svev={0: 3, 1: 5}))
B['bossen-sier'] = tegn('bossen-sier', rekke(KRONE, boble(11, 7, 'w'), svev={0: 2, 1: 6}) + [(person('m'), 13, 7)])
B['buffalo'] = tegn('buffalo', rekke(speil(HAAND), OL, svev={0: 4}))
B['bussruta'] = tegn('bussruta', rekke(K('hjerte'), BUSS, K('spar'), gap=1, svev={0: 4, 2: 4}))
B['chandelier'] = tegn('chandelier', rekke(KOPP, KOPP, farge(KOPP, 'o', 'm'), KOPP, KOPP, gap=0) + [(PINGPONG, 18, 1)])
B['drikke-bingo'] = tegn('drikke-bingo', rekke(S(*[''.join('o' if (x * 3 + y * 5) % 7 == 0 else 'y' for x in range(13)) for y in range(11)]), NOTE, svev={1: 5}))
B['drikke-uno'] = tegn('drikke-uno', rekke(K(None, 'o'), K(None, 'y'), K(None, 'm'), K(None, 'b'), gap=-3))
B['drikke-yatzy'] = tegn('drikke-yatzy', rekke(terning(6), terning(6), terning(6, 'o', 'w'), gap=1, svev={1: 3}))
B['drikkehjulet'] = tegn('drikkehjulet', rekke(HJUL) + [(PEKER, 18, 1)])
B['duoleken'] = tegn('duoleken', rekke(person('o'), HJERTE, person('m', 'y'), svev={1: 5}))
B['enten-eller'] = tegn('enten-eller', rekke(boble(9, 6, 'o'), S('y...y', 'yy.yy', '.yyy.', '..y..', '..y..', '..y..', '..y..'), boble(9, 6, 'm', 'h'), svev={0: 6, 2: 6}))
B['eurovision'] = tegn('eurovision', rekke(STJERNE, MIKROFON, farge(STJERNE, 'y', 'o'), svev={0: 6, 2: 3}))
B['flip-cup'] = tegn('flip-cup', rekke(KOPP, snu(KOPP), KOPP, svev={1: 7}))
B['flunkyball'] = tegn('flunkyball', rekke(FLASKE, BALL, FLASKE))
B['forraeder'] = tegn('forraeder', rekke(NESE, farge(SPM, 'k', 'o'), svev={1: 3}))
B['fotballkamp'] = tegn('fotballkamp', rekke(BALL, FLAGG))
B['fuck-the-dealer'] = tegn('fuck-the-dealer', rekke(K('hjerte'), K('krone', 'y'), K('spar'), farge(SPM, 'k', 'o'), gap=0, svev={1: 2, 3: 4}))
B['gjett-aret'] = tegn('gjett-aret', rekke(KALENDER, farge(SPM, 'k', 'o'), svev={1: 2}))
B['gris'] = tegn('gris', rekke(K('klover'), GRIS, K('hjerte'), svev={0: 2, 2: 2}))
B['hemmelig-oppdrag'] = tegn('hemmelig-oppdrag', rekke(AGENT, BREV, svev={1: 1}))
B['hvem-er-jeg'] = tegn('hvem-er-jeg', rekke(HODE_KJENT, farge(SPM, 'k', 'o'), svev={1: 3}) + [(S('yyyyy', 'yyyyy', 'yyyyy'), 15, 3)])
B['hvem-skrev-det'] = tegn('hvem-skrev-det', rekke(BREV, BLYANT, svev={0: 1}))
B['ja-eller-nei'] = tegn('ja-eller-nei', rekke(S(*['M' * 9] * 7), S(*['r' * 9] * 7), svev={0: 3, 1: 3}) + [(farge(HAKE, 'k', 'w'), 12, 8), (farge(KRYSS, 'k', 'w'), 24, 9)])
B['jeg-har-aldri'] = tegn('jeg-har-aldri', rekke(FINGRE, OL))
B['jug'] = tegn('jug', rekke(MUGGE, farge(SPM, 'k', 'o'), svev={1: 4}))
B['kategorier'] = tegn('kategorier', rekke(ARK, farge(HAKE, 'k', 'M'), svev={1: 4}))
B['korken'] = tegn('korken', rekke(FLASKE, KORK, OL, svev={1: 8}))
B['krig'] = tegn('krig', rekke(K('hjerte'), S('k.......k', '.k.....k.', '..k...k..', '...k.k...', '....k....', '...k.k...', '..k...k..', '.y.....y.', 'y.......y'), K('spar'), svev={1: 2}))
B['mynt-i-glasset'] = tegn('mynt-i-glasset', rekke(MYNT, OL, svev={0: 4}))
B['nasjonal-vorsprove'] = tegn('nasjonal-vorsprove', rekke(ARK, MEDALJE, svev={1: 1}))
B['nodt-eller-sannhet'] = tegn('nodt-eller-sannhet', rekke(FLAMME, HJERTE, svev={1: 1}))
B['nyhetsrunden'] = tegn('nyhetsrunden', rekke(AVIS, farge(SPM, 'k', 'o'), svev={1: 4}))
B['opus'] = tegn('opus', rekke(K('ruter'), KLOKKE, K('klover'), svev={0: 1, 2: 1}))
B['over-eller-under'] = tegn('over-eller-under', rekke(PIL_OPP, K('ruter'), PIL_NED, svev={0: 3, 2: 0}))
B['pekeleken'] = tegn('pekeleken', rekke(HAAND, person('m', 'y'), svev={0: 4}))
B['power-hour'] = tegn('power-hour', rekke(KLOKKE, LYN, OL, svev={1: 3}))
B['president'] = tegn('president', rekke(K('klover'), K('hjerte'), K('ruter'), gap=-2) + [(KRONE, 15, 1)])
B['pyramiden'] = tegn('pyramiden', [(K('hjerte' if (r, c) in ((0, 0), (2, 1), (3, 2)) else None), 20 - r * 6 + c * 12, r * 8) for r in range(4) for c in range(r + 1)])
B['rage-cage'] = tegn('rage-cage', rekke(KOPP, KOPP, farge(KOPP, 'o', 'm'), KOPP, gap=0) + [(PINGPONG, 18, 2)])
B['rask-fakta'] = tegn('rask-fakta', rekke(ansikt('glis'), LYN, ansikt('o', 'p'), svev={1: 2}))
B['regelfabrikken'] = tegn('regelfabrikken', rekke(FABRIKK, K('hjerte')))
B['ring-of-fire'] = tegn('ring-of-fire', [(S('www', 'www', 'www', 'www'), 20 + round(8 * __import__('math').cos(a / 9 * 6.283)) - 1, 8 + round(7 * __import__('math').sin(a / 9 * 6.283)) - 1) for a in range(9)] + [(SHOT, 18, 8)])
B['rygg-mot-rygg'] = tegn('rygg-mot-rygg', rekke(person('o'), speil(person('m', 'y')), gap=-2))
B['samme-svar'] = tegn('samme-svar', rekke(SAU, SAU, gap=1, svev={1: 0}))
B['sannhet-eller-drikk'] = tegn('sannhet-eller-drikk', rekke(boble(11, 7, 'w'), OL, svev={0: 6}))
B['sjakkdrikk'] = tegn('sjakkdrikk', rekke(SJAKK, SHOT) + [(TAARN, 11, 4)])
B['skal-refleksen'] = tegn('skal-refleksen', rekke(OL, LYN, speil(OL), gap=0, svev={1: 4}))
B['snurr-flasken'] = tegn('snurr-flasken', rekke(S(*[''.join(r[i] for r in reversed(FLASKE)) for i in range(5)]), svev={0: 6}) + [(S('k..', '.k.', '..k'), 9, 4), (S('..k', '.k.', 'k..'), 28, 12)])
B['spionen'] = tegn('spionen', rekke(MULDVARP))
B['stilleleken'] = tegn('stilleleken', rekke(ansikt('glidelas'), farge(NOTE1, 'o', 'w'), svev={1: 5}) + [(farge(KRYSS, 'k', 'r'), 21, 4)])
B['tanken-bak-sangen'] = tegn('tanken-bak-sangen', rekke(person('p'), TANKE, svev={1: 7}) + [(NOTE1, 24, 3)])
B['terningen-bestemmer'] = tegn('terningen-bestemmer', rekke(terning(4), terning(1, 'o', 'w')) + [(KRONE, 21, 3)])
B['thunderstruck'] = tegn('thunderstruck', rekke(NOTE, LYN, OL, svev={0: 5, 1: 2}))
B['tilbake-til-5-trinn'] = tegn('tilbake-til-5-trinn', rekke(TRAPP, OL, svev={1: 10}))
B['to-sannheter-og-en-logn'] = tegn('to-sannheter-og-en-logn', rekke(S(*['M' * 7] * 6), S(*['M' * 7] * 6), S(*['r' * 7] * 6), gap=1) + [(farge(HAKE, 'k', 'w')[:5], 8, 12), (farge(HAKE, 'k', 'w')[:5], 17, 12), (farge(KRYSS, 'k', 'w'), 27, 12)])
B['tommelen'] = tegn('tommelen', rekke(TOMMEL, farge(UTROP, 'k', 'o'), svev={1: 3}))
B['veddelopet'] = tegn('veddelopet', rekke(K('hjerte'), K('spar'), K('ruter'), K('klover'), MAALFLAGG, gap=0, svev={0: 3, 1: 1, 2: 5, 3: 2}))

# ---------- de ti felles motivene ----------
MOTIV = {
    'kort': tegn('kort', rekke(K('hjerte'), K('spar'), K('ruter'), gap=-2, svev={1: 2})),
    'bobler': tegn('bobler', rekke(boble(12, 8, 'y'), boble(10, 6, 'o', 'h'), svev={0: 5})),
    'telefoner': tegn('telefoner', rekke(TELEFON, farge(TELEFON, 'b', 'o'), TELEFON, gap=1, svev={1: 2})),
    'musikk': tegn('musikk', rekke(NOTE, NOTE1, svev={0: 4})),
    'terning': tegn('terning', rekke(terning(4), terning(2, 'o', 'w'), svev={0: 3})),
    'kopper': tegn('kopper', rekke(KOPP, farge(KOPP, 'o', 'y'), KOPP, gap=1)),
    'quiz': tegn('quiz', rekke(ARK, farge(SPM, 'k', 'o'), svev={1: 4})),
    'klokke': tegn('klokke', rekke(KLOKKE)),
    'hjul': tegn('hjul', rekke(HJUL) + [(PEKER, 18, 1)]),
    'skjerm': tegn('skjerm', rekke(TV)),
}

for slug, s in B.items():
    with open(os.path.join(UT_LEK, slug + '.svg'), 'w', encoding='utf-8') as fil: fil.write(s)
for navn, s in MOTIV.items():
    with open(os.path.join(UT_MOTIV, navn + '.svg'), 'w', encoding='utf-8') as fil: fil.write(s)
with open(os.path.join(ROT, 'src', 'data', 'bannere.json'), 'w', encoding='utf-8') as fil: json.dump(sorted(B), fil)
print(len(B), 'bilder og', len(MOTIV), 'motiver')

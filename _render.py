#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont

# ---- paleta ----
BG       = (15, 16, 32)
BG2      = (22, 24, 46)
BORDER   = (44, 46, 78)
TEXT     = (243, 241, 255)
MUTED    = (163, 160, 200)
GOLD     = (233, 196, 106)
GOLD2    = (244, 213, 141)
ACCENT2  = (179, 164, 255)
GREEN    = (126, 224, 184)

F = "/usr/share/fonts/truetype/dejavu/"
def font(name, size): return ImageFont.truetype(F + name, size)

f_kicker = font("DejaVuSans-Bold.ttf", 18)
f_h1     = font("DejaVuSans-Bold.ttf", 52)
f_sub    = font("DejaVuSans.ttf", 22)
f_pill   = font("DejaVuSans.ttf", 19)
f_num    = font("DejaVuSans-Bold.ttf", 26)
f_btitle = font("DejaVuSans-Bold.ttf", 26)
f_btime  = font("DejaVuSans-Bold.ttf", 19)
f_hour   = font("DejaVuSans-Bold.ttf", 23)
f_name   = font("DejaVuSans-Bold.ttf", 22)
f_note   = font("DejaVuSans.ttf", 18)
f_tag    = font("DejaVuSans-Bold.ttf", 15)
f_foot   = font("DejaVuSans.ttf", 17)

# ---- dados ----
blocks = [
    ("1", "Abertura Especial", "16:00 - 16:25", [
        ("16:00", "Abertura / Boas-vindas", None, None),
        ("16:05", "Louvor com a Igreja", "2 músicas congregacionais", ("2 músicas", "a")),
        ("16:15", "Quarteto Musivoz", "3 músicas seguidas - Liberação", ("3 músicas", "a")),
    ]),
    ("2", "Primeira Parte", "16:25 - 17:20", [
        ("16:25", "Ministério Jaspe", "3 músicas seguidas - Apresentação Única", ("3 músicas", "a")),
        ("16:40", "Quarteto Jubilus Diadema", None, ("2 músicas", "a")),
        ("16:50", "Ministério CADES", None, ("2 músicas", "a")),
        ("17:00", "Grupo JELD", None, ("2 músicas", "a")),
        ("17:10", "Família Tigre", None, ("2 músicas", "a")),
        ("17:15", "Quarteto Jubilus Campanário", None, ("2 músicas", "a")),
    ]),
    ("3", "Palavra", "17:20 - 17:35", [
        ("17:20", "Sermão - Pastor Webber", "15 minutos", ("Pregação", "w")),
    ]),
    ("4", "Segunda Parte", "17:35 - 18:00", [
        ("17:35", "Quarteto Jubilus Campanário", None, ("1 música", "a")),
        ("17:40", "Família Tigre", None, ("1 música", "a")),
        ("17:45", "Grupo JELD", None, ("1 música", "a")),
        ("17:50", "Ministério CADES", None, ("1 música", "a")),
        ("17:55", "Quarteto Jubilus Diadema", None, ("1 música", "a")),
    ]),
    ("5", "Encerramento", "18:00 - 18:10", [
        ("18:00", "Todos os Grupos", 'Música: "Jerusalém"', ("Conjunto", "f")),
        ("18:05", "Oração Final / Encerramento", None, ("Final", "f")),
    ]),
]

# ---- layout ----
W = 900
PAD = 40
content_w = W - 2 * PAD

def rr(d, box, r, **kw): d.rounded_rectangle(box, radius=r, **kw)

# medir altura
def block_height(items):
    h = 70  # head
    for (_, _, note, _) in items:
        h += 56 if note else 44
    return h + 16

total_h = 40 + 70 + 64 + 56  # top + header area + pills + spacing
for (_, _, _, items) in blocks:
    total_h += block_height(items) + 24
total_h += 70  # footer

img = Image.new("RGB", (W, total_h), BG)
d = ImageDraw.Draw(img)

def center_text(d, cx, y, text, fnt, fill):
    w = d.textlength(text, font=fnt)
    d.text((cx - w/2, y), text, font=fnt, fill=fill)

y = 40
# kicker
center_text(d, W/2, y, "P R O G R A M A Ç Ã O", f_kicker, GOLD); y += 36
center_text(d, W/2, y, "Encontro de Louvor", f_h1, GOLD2); y += 64
center_text(d, W/2, y, "Roteiro completo do evento - 16h00 às 18h10", f_sub, MUTED); y += 42

# pills
pills = ["5 blocos", "2h10 de duração", "10 participações"]
gap = 14
widths = [d.textlength(p, font=f_pill) + 32 for p in pills]
totalw = sum(widths) + gap * (len(pills) - 1)
px = (W - totalw) / 2
for p, pw in zip(pills, widths):
    rr(d, [px, y, px + pw, y + 38], 19, fill=BG2, outline=BORDER, width=1)
    center_text(d, px + pw/2, y + 8, p, f_pill, TEXT)
    px += pw + gap
y += 38 + 40

# blocos
for (num, title, time, items) in blocks:
    bh = block_height(items)
    rr(d, [PAD, y, W - PAD, y + bh], 18, fill=BG2, outline=BORDER, width=1)
    # head
    hy = y + 16
    rr(d, [PAD + 22, hy, PAD + 22 + 46, hy + 46], 12, fill=GOLD)
    center_text(d, PAD + 22 + 23, hy + 8, num, f_num, (27, 20, 48))
    d.text((PAD + 22 + 60, hy + 2), title, font=f_btitle, fill=TEXT)
    tw = d.textlength(time, font=f_btime)
    d.text((W - PAD - 22 - tw, hy + 9), time, font=f_btime, fill=GOLD)
    # separator
    sy = y + 70
    d.line([(PAD + 16, sy), (W - PAD - 16, sy)], fill=BORDER, width=1)
    # items
    iy = sy + 10
    for idx, (hour, name, note, tag) in enumerate(items):
        rowh = 56 if note else 44
        d.text((PAD + 24, iy + 6), hour, font=f_hour, fill=ACCENT2)
        tx = PAD + 24 + 80
        d.text((tx, iy + 4), name, font=f_name, fill=TEXT)
        if note:
            d.text((tx, iy + 30), note, font=f_note, fill=MUTED)
        if tag:
            label, kind = tag
            col = {"a": ACCENT2, "w": GOLD, "f": GREEN}[kind]
            bgc = {"a": (33, 32, 64), "w": (45, 40, 28), "f": (24, 48, 40)}[kind]
            lw = d.textlength(label.upper(), font=f_tag) + 24
            tagx = W - PAD - 24 - lw
            tagy = iy + (rowh - 30) / 2
            rr(d, [tagx, tagy, tagx + lw, tagy + 30], 15, fill=bgc, outline=col, width=1)
            d.text((tagx + 12, tagy + 6), label.upper(), font=f_tag, fill=col)
        # dashed separator
        if idx < len(items) - 1:
            ly = iy + rowh - 2
            x0 = PAD + 24
            while x0 < W - PAD - 24:
                d.line([(x0, ly), (x0 + 6, ly)], fill=BORDER, width=1)
                x0 += 12
        iy += rowh
    y += bh + 24

center_text(d, W/2, y + 6, "Programação sujeita a ajustes conforme o andamento do evento.", f_foot, MUTED)

img.save("/home/user/synapsepreocessos/programacao-evento.png", "PNG")
print("OK", img.size)

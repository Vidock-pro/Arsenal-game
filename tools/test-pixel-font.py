"""Vérifie la police produite : nécessite fonttools, comme le générateur."""
from pathlib import Path
from fontTools.ttLib import TTFont

font = TTFont(Path(__file__).resolve().parents[1] / 'dist/assets/arsenal-pixel.ttf')
cmap = font.getBestCmap()
glyphs = font['glyf']
question = glyphs[cmap[ord('?')]].compile(glyphs)
for character in '0123456789,.:% +-−×()\u00a0\u202f':
    assert ord(character) in cmap, f'Caractère absent : {character!r}'
    drawing = glyphs[cmap[ord(character)]].compile(glyphs)
    if character not in ' \u00a0\u202f':
        assert drawing != question, f'Faux point d’interrogation : {character!r}'
        assert glyphs[cmap[ord(character)]].numberOfContours > 0
# Ne pas masquer la police de repli avec de faux glyphes.
assert ord('@') not in cmap
print('Police pixel : contrôles réussis.')

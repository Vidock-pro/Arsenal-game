"""Build the standalone player and reproducible source archive (Python stdlib)."""
from pathlib import Path
import zipfile
root = Path(__file__).resolve().parent
engine = (root / 'dist/engine.js').read_text().replace('export ', '')
app = (root / 'dist/app.js').read_text().split('\n', 1)[1]
app = app.replace('src="assets/', 'src="dist/assets/').replace('href="arsenal-source.zip" download', 'href="README.md"')
css = (root / 'dist/style.css').read_text().replace("url('assets/", "url('dist/assets/")
standalone = '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Arsenal</title><style>' + css + '</style><div id="app"></div><div id="toast" role="status" aria-live="polite"></div><script>' + engine + '\n' + app + '</script></html>'
(root / 'JOUER.html').write_text(standalone)
files = [p for p in root.rglob('*') if p.is_file() and not any(x in p.relative_to(root).parts for x in ['.git','.openai','node_modules','__pycache__']) and p.suffix not in ['.zip','.tar','.gz']]
with zipfile.ZipFile(root / 'dist/arsenal-source.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(files): z.write(p,Path('arsenal') / p.relative_to(root))
print('Created JOUER.html and dist/arsenal-source.zip')

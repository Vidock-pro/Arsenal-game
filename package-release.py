"""Assemble le jeu autonome et son archive source, sans dépendance Python externe."""

import base64
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXCLUDED_DIRECTORIES = {".git", ".openai", "node_modules", "__pycache__"}
ARCHIVE_SUFFIXES = {".zip", ".tar", ".gz"}


def read_source(relative_path):
    """Utilise UTF-8 aussi sur Windows pour préserver les accents."""
    return (ROOT / relative_path).read_text(encoding="utf-8")


def build_player():
    """Regroupe les sources dans une page ouvrable directement depuis le disque."""
    # Le moteur et l’interface partagent ici le même script, sans import de module.
    engine = re.sub(r"^export\s+", "", read_source("dist/engine.js"), flags=re.MULTILINE)
    app = re.sub(
        r"import\s*\{[\s\S]*?\}\s*from\s*['\"]\./engine\.js['\"];?",
        "", read_source("dist/app.js"), count=1,
    )
    app = app.replace('src="assets/', 'src="dist/assets/')
    app = app.replace("'assets/rising-sun-game-loop.wav'", "'dist/assets/rising-sun-game-loop.wav'")
    app = app.replace("'assets/dogs-of-war-menu-loop.wav'", "'dist/assets/dogs-of-war-menu-loop.wav'")
    app = app.replace('href="arsenal-source.zip" download', 'href="README.md"')

    # La page est à la racine ; les images restent dans dist/assets.
    css = read_source("dist/style.css") + "\n" + read_source("dist/pixel-skin.css")
    css = re.sub(r"url\(([\"']?)assets/", r"url(\1dist/assets/", css)
    font_bytes = (ROOT / "dist/assets/arsenal-pixel.ttf").read_bytes()
    font_url = "data:font/ttf;base64," + base64.b64encode(font_bytes).decode("ascii")
    css = css.replace("dist/assets/arsenal-pixel.ttf", font_url)

    page = f'''<!doctype html>
<!-- Fichier généré : modifier dist/ puis relancer python package-release.py. -->
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Arsenal</title>
    <style>
{css}
    </style>
  </head>
  <body>
    <div id="app"></div>
    <div id="toast" role="status" aria-live="polite"></div>
    <script>
{engine}
{app}
    </script>
  </body>
</html>
'''
    (ROOT / "JOUER.html").write_text(page, encoding="utf-8")


def build_archive():
    """Emporte les sources et images, sans outils installés ni anciennes archives."""
    files = (
        path for path in ROOT.rglob("*")
        if path.is_file()
        and not EXCLUDED_DIRECTORIES.intersection(path.relative_to(ROOT).parts)
        and path.suffix not in ARCHIVE_SUFFIXES
    )
    with zipfile.ZipFile(ROOT / "dist/arsenal-source.zip", "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(files):
            archive.write(path, Path("arsenal") / path.relative_to(ROOT))


if __name__ == "__main__":
    build_player()
    build_archive()
    print("Created JOUER.html and dist/arsenal-source.zip")

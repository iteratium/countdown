#!/bin/sh
# GitHub Pages lets browsers keep every file for 10 minutes, and we can't change that. So
# index.html loads its own stylesheet and scripts as style.css?v=1a2b3c4d, where the
# number is a short hash of the file's contents. Change a file and its number changes, so
# a visitor with an old copy cached fetches the new one as soon as they get the new page.
#
# Run this before committing any change to the css or js files (it changes nothing if
# they are unchanged):  ./release.sh
cd "$(dirname "$0")" || exit 1

for f in style.css script.js office.js sky.js season.js guard.js; do
  hash=$(shasum -a 1 "$f" | cut -c1-8)
  perl -pi -e "s{((?:src|href)=\"$f)(\?v=[0-9a-f]+)?\"}{\$1?v=$hash\"}" index.html
done

grep -oE '(src|href)="[a-z]+\.(css|js)\?v=[0-9a-f]+"' index.html

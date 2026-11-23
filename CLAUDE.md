# Vanilla Gorilla themes

This repository holds themes for Vanilla Gorilla. A theme is a copy of the files that go in `src/` of a Vanilla Gorilla site.

## Commands

* `npm run assemble`: make `themes/` and `themes.json` from `src/`.
* `npm run check`: build a site with each theme. Fail on a warning or a broken link.
* `npm test`: assemble, then check.

## Writing style

Write in the spirit of ASD STE100. Use direct sentences. Limit each procedural step to one action. Do not use unnecessary synonyms.

## Rules

* **Edit `src/` only.** `themes/` and `themes.json` are generated. Run `npm run assemble` after each change and commit the result.
* **Never change `build.js`.** A theme has no build code. If a theme needs a thing that the template `build.js` cannot do, open an issue in `exhibita/vanilla-gorilla`.
* **Shared HTML.** All themes of one type use the HTML in `src/bases/<type>/`. Change the base when all themes of the type need the change. Put a file in `src/themes/<name>/` only when one theme needs different HTML.
* **Selector contract.** Keep the selectors in `docs/THEMING.md` of the template. Keep the CSS custom property names of the shipped theme.
* **Relative links.** Start each internal link and asset path with `./`.
* **No placeholders.** Write complete code.
* **CSS.** Write vanilla CSS. Put shared rules in `src/bases/<type>/_core.css`, the custom properties in `tokens.css`, and the rules of one theme in its `style.css`.
* **No dependencies.** The scripts use Node.js built-in modules only.

## Before you finish

1. Run `npm test`.
2. Look at the changed pages at 1280 pixels and at 390 pixels.
3. Update `previews/<name>.jpg` if the home page changed.
4. List the edge cases you verified.

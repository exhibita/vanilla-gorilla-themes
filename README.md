# Vanilla Gorilla themes

Themes for [Vanilla Gorilla](https://github.com/exhibita/vanilla-gorilla) static site generator. Each folder in `themes/` is a copy of the files that go in `src/` of a Vanilla Gorilla site.

A theme changes only the presentation: templates, skeletons, the stylesheet, the home page and demo content. A theme never changes `build.js`.

## Themes

| Name | Type | Look |
|---|---|---|
| `broadsheet` | Blog | Newspaper editorial |
| `margin` | Blog | Quiet essay column, dates in the left margin |
| `night-shift` | Blog | Dark developer blog with a sidebar |
| `field-notes` | Blog | Travel journal, taped photographs |
| `zine` | Blog | Loud, thick outlines, hard shadows |
| `atelier` | Blog | High-contrast magazine, large italics |
| `maison` | Salon | Monochrome luxury |
| `lived-in` | Salon | Boho terracotta, arched photographs |
| `barber-blade` | Salon | Classic barbershop |
| `bloom` | Salon | Pastel family salon |
| `chroma` | Salon | Dark colour-specialist studio |
| `still` | Salon | Scandinavian minimal |

`previews/<name>.jpg` shows the home page of each theme. `themes.json` lists the themes for tools.

## Install a theme by hand

1. Make a new site: `npx create-vanilla-gorilla my-site`.
2. Run `npm install` in the site folder.
3. In `src/`, delete each path in the `replaces` list of `themes.json`.
4. Copy the contents of `themes/<name>/` into `src/`.
5. Run `npm run build`.
6. Open `dist/index.html` in a browser.

## Template version

Each theme has a `minTemplateVersion` in `themes.json`. All themes build with template version 3.

The themes show a picture and a label for each post in the blog index and in the recent posts list. The demo posts set them with `image:` and `badge:` in the front matter. These keys need template version 4. With version 3, the lists show the title, the date and the summary only.

## What is in a theme folder

| Path | Role |
|---|---|
| `templates/` | Header, footer, blog index and gallery index |
| `skeletons/` | Blog, page, gallery and links skeletons |
| `css/style.css` | The stylesheet. The build makes `style.min.css` from it |
| `index.html` | The home page |
| `images/` | Placeholder art (SVG). Replace it with photographs |
| `blog/`, `gallery/`, `links/`, `about/` | Demo content |
| `services/`, `booking/`, `shop/`, `js/cart.js` | Salon themes only |

Each theme keeps the selector contract from `docs/THEMING.md` of the template and the CSS custom property names of the shipped theme.

## Change the text

The site name, tagline, telephone number, email address and street address are demo values. Find them in `templates/header.html`, `templates/footer.html`, `index.html` and, for a salon, `services/index.html` and `booking/index.html`.

The home page of a blog theme names one post as the lead story. Change the link, the title and the summary in `index.html` when you publish a new lead story.

## Salon themes: booking

`booking/index.html` has one "Open the booking calendar" link. Replace its address with the link from your scheduling tool.

## Salon themes: shopping bag

`js/cart.js` keeps the bag in the browser (`localStorage`). It has no payment processor. The `<dialog id="cart-drawer">` element in `templates/footer.html` has two settings:

- `data-checkout-url`: the address of a payment or order page. When it is set, the button says "Go to checkout" and opens that address.
- `data-checkout-email`: the address that receives the order as an email. The bag uses it when `data-checkout-url` is empty.

To add a product, copy one `product-card` in `shop/index.html`. Give the button a unique `data-id`, a `data-name`, a `data-price` (a number) and a `data-image`.

To show a product that is not for sale, replace its button with `<p class="product-soon">Coming soon</p>`.

## How this repository is organized

```
src/
├── bases/
│   ├── blog/            # HTML, demo content and _core.css that all blog themes share
│   └── salon/           # the same for salon themes; defaults.json has the default text
├── themes/<name>/
│   ├── theme.json       # title, type, description, fonts, minimum template version, text values
│   ├── tokens.css       # the :root custom properties
│   ├── style.css        # the rules of this theme only
│   ├── images/          # placeholder art
│   └── ...              # a file here replaces the file of the base with the same path
└── order.json           # the order of the themes in themes.json
themes/<name>/           # GENERATED. The installable theme folders
themes.json              # GENERATED. The manifest
previews/<name>.jpg      # home page screenshots
scripts/assemble.mjs     # makes themes/ and themes.json from src/
scripts/check.mjs        # builds a site with each theme and fails on a warning or a broken link
```

Do not edit `themes/` or `themes.json`. Edit `src/`, then run `npm run assemble`. Commit the result.

In a base file, `{{NAME}}` is replaced by the value of `NAME` from `tokens` in `theme.json`, or from `defaults.json` of the base.

## Commands

* `npm run assemble`: make `themes/` and `themes.json` from `src/`.
* `npm run check`: clone the template, build a site with each theme, and report warnings and broken links.
* `npm run check -- --template ../vanilla-gorilla`: use a local copy of the template.
* `npm run check -- maison zine`: check only the named themes.
* `npm test`: assemble, then check.

The scripts have no dependencies. They need Node.js 20.18.1 or newer and git.

## Add a theme

1. Copy one folder in `src/themes/` to a new name. Use lower-case letters, digits and hyphens.
2. Change `theme.json`, `tokens.css` and `style.css`.
3. Add the name to `src/order.json`.
4. Run `npm test`.
5. Add `previews/<name>.jpg`, a screenshot of the home page that is 1280 pixels wide.
6. Add the theme to the table in this file.

## themes.json

```json
{
  "manifestVersion": 1,
  "replaces": ["blog", "gallery", "..."],
  "themes": [
    {
      "name": "maison",
      "title": "Maison",
      "type": "salon",
      "description": "Monochrome luxury salon: ...",
      "path": "themes/maison",
      "preview": "previews/maison.jpg",
      "minTemplateVersion": 3
    }
  ]
}
```

- `replaces`: paths under `src/` of the template that a tool must delete before it copies a theme. They are the sample content and the presentation files of the shipped theme.
- `path`: the folder to copy into `src/`.
- `minTemplateVersion`: the lowest `vanillaGorilla.templateVersion` that the theme builds with.

A change to the shape of this file that a tool cannot read increases `manifestVersion`.

## License

AGPL-3.0-or-later, the same license as the Vanilla Gorilla template. See `LICENSE`. A site that uses a theme keeps this license for the theme files.

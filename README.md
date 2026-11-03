# ANYWARE — studio website

Static site. No build step. Open `index.html` or host the folder anywhere, for example GitHub Pages (`.nojekyll` is included).

```
index.html            main page: hero, game list, Mobius purchase, about
assets/css/style.css  styles
assets/js/main.js     itch.io buy button + store widget (payments only)
assets/img/           logo, favicons, game covers
games/                the playable browser games (open in a new tab)
```

## Games

| Game | Price | How it's delivered |
| --- | --- | --- |
| OCTAKILL | Free | `games/octakill.html` (plays in the browser) |
| Supremacy [PRE-ALPHA] | Free | `games/supremacy.html` (plays in the browser) |
| PlanetBox | Free | `games/planetbox.html` (plays in the browser) |
| Mobius | $1 | sold on itch.io: https://anyware-studios.itch.io/mobius |

## itch.io (payments only)

`assets/js/main.js` loads itch.io's official API (`https://static.itch.io/api.js`) and:

- turns every link with `data-itch-buy="<game>"` into the itch.io checkout popup
- renders the itch.io store widget into every element with `data-itch-embed="<game>"`

If itch.io can't be reached, the buy links still go to the itch.io page, and the widget is hidden.
To skip the widget's ID lookup, add the numeric game ID: `data-itch-id="1234567"`.

## Updating

- **Update a game:** replace its file in `games/`.
- **Cover art:** replace the image in `assets/img/` (keep the file name).
- **Add a paid game:** copy the Mobius card, then set `data-itch-buy` to the game's itch.io slug.

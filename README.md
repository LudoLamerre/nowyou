# nowYou — site

Site statique de l'application nowYou, hébergé sur GitHub Pages. Tout est en HTML, CSS et JavaScript : aucun build n'est nécessaire côté GitHub, les pages générées sont commitées.

## Pages

- `index.html` : landing (fonctionnalités, captures, bibliothèque, confidentialité). Pas de liens vers les stores pour l'instant.
- Les fiches de biais ne sont pas publiées sur le site (réservées à l'app) ; `data/biases.json` sert seulement aux compteurs et aux noms des biais vedettes de la landing.
- `support/`, `confidentialite/`, `cgu/`, `mentions-legales/`, `404.html`.

## Mettre à jour

Les pages sont produites par `scripts/build.js` à partir de `data/biases.json` (copie des données de l'app) et de `site.config.json` (URL du site, e-mail).

```bash
node scripts/build.js
```

- Renseigner `siteUrl` dans `site.config.json` avec l'URL GitHub Pages définitive (canonical, Open Graph, sitemap), puis relancer le build.
- Après une modification des fiches dans l'app, recopier les quatre JSON fusionnés dans `data/biases.json` et relancer le build.
- `scripts/extract-icons.js` régénère `scripts/icons.json` depuis les icônes Phosphor du dépôt de l'app (déjà commité, à relancer seulement pour ajouter une icône).

## Visuels

Les illustrations (`femme.png`, `ampoule.png`, `cat-*.png`, `logo-horizontal.png`) viennent de `nowYou/assets/illustrations` dans le dépôt de l'app ; les captures `phone-*.webp` sont les mockups marketing recadrés sur le téléphone.

## Crédits

Icônes [Phosphor](https://phosphoricons.com) (MIT), police [Manrope](https://fonts.google.com/specimen/Manrope) (SIL OFL).

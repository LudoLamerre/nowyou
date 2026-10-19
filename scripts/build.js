// Generates the static site (landing, bias library, legal pages) from data/biases.json
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const config = require('../site.config.json');
const icons = require('./icons.json');
const biases = require('../data/biases.json');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const esc = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const icon = (name, cls = '') => {
  if (!icons[name]) throw new Error(`Unknown icon ${name}`);
  return `<svg class="icon ${cls}" viewBox="0 0 256 256" aria-hidden="true">${icons[name]}</svg>`;
};

const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ /g, ' ')
    .toLowerCase()
    .trim();

const write = (relative, html) => {
  const file = path.join(ROOT, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};

const CATEGORIES = {
  pensee: { label: 'Pensée', icon: 'brain', tagline: 'Raisonnement, mémoire, attention', chip: 'chip--teal' },
  emotions: { label: 'Émotions', icon: 'heart', tagline: 'Ressenti, humeur, anticipation', chip: 'chip' },
  social: { label: 'Social', icon: 'usersThree', tagline: 'Les autres, le groupe, l’image de soi', chip: 'chip--blue' },
  decisions: { label: 'Décisions', icon: 'gear', tagline: 'Choix, argent, risque', chip: 'chip--amber' },
};
const ORDER = ['pensee', 'emotions', 'social', 'decisions'];

const sorted = [...biases].sort((a, b) => {
  const cat = ORDER.indexOf(a.category) - ORDER.indexOf(b.category);
  if (cat !== 0) return cat;
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return a.name.localeCompare(b.name, 'fr');
});
const featured = biases.filter((b) => b.featured).sort((a, b) => a.featuredOrder - b.featuredOrder);
const totalQuestions = biases.reduce((sum, b) => sum + b.questions.length, 0);

const bubble = (category, cls = '') =>
  `<span class="bubble cat--${category} ${cls}">${icon(CATEGORIES[category].icon)}</span>`;

// ─── Layout ──────────────────────────────────────────────────────────────────

function storeButtons() {
  const store = (url, name, iconName) =>
    url
      ? `<a class="btn btn--store" href="${esc(url)}" target="_blank" rel="noopener">${icon(iconName)}<span><small>Télécharger sur</small><strong>${name}</strong></span></a>`
      : `<span class="btn btn--store" aria-disabled="true">${icon(iconName)}<span><small>Bientôt disponible sur</small><strong>${name}</strong></span></span>`;
  return store(config.appStoreUrl, 'App Store', 'appleLogo') + store(config.playStoreUrl, 'Google Play', 'googlePlayLogo');
}

function layout({ title, description, depth, body, active = '', scripts = [], pathname = '' }) {
  const rel = '../'.repeat(depth);
  const nav = [
    ['', 'Accueil', 'home'],
    ['biais/', 'Les biais', 'biais'],
    ['support/', 'Support', 'support'],
  ]
    .map(
      ([href, label, key]) =>
        `<li><a href="${rel}${href || './'}"${active === key ? ' aria-current="page"' : ''}>${label}</a></li>`,
    )
    .join('');
  const fullTitle = title === config.appName ? `${config.appName} — ${config.tagline}` : `${title} — ${config.appName}`;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#F6F4EF">
<link rel="canonical" href="${esc(config.siteUrl)}/${pathname}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(config.siteUrl)}/assets/img/og-image.png">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${rel}assets/img/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="${rel}assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rel}assets/css/style.css">
</head>
<body>
<a class="visually-hidden" href="#main">Aller au contenu</a>
<header class="site-header">
  <div class="container nav">
    <a class="brand" href="${rel}./" aria-label="nowYou, accueil"><img src="${rel}assets/img/logo-512.png" alt="" width="38" height="38"><b>now<span>You</span></b></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Menu"><span></span></button>
    <ul class="nav-links" id="nav-links">
      ${nav}
      <li><a class="btn btn--accent" href="${rel}#telecharger">Télécharger</a></li>
    </ul>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="container">
    <p>© ${config.year} ${esc(config.appName)} · ${esc(config.creator)}</p>
    <ul>
      <li><a href="${rel}biais/">Les biais</a></li>
      <li><a href="${rel}support/">Support</a></li>
      <li><a href="${rel}confidentialite/">Confidentialité</a></li>
      <li><a href="${rel}cgu/">CGU</a></li>
      <li><a href="${rel}mentions-legales/">Mentions légales</a></li>
    </ul>
  </div>
</footer>
<script src="${rel}assets/js/main.js" defer></script>
${scripts.map((s) => `<script src="${rel}${s}" defer></script>`).join('\n')}
</body>
</html>
`;
}

// ─── Landing ─────────────────────────────────────────────────────────────────

function landing() {
  const categoryCards = ORDER.map((id) => {
    const count = biases.filter((b) => b.category === id).length;
    return `<a class="cat-card cat--${id}" href="biais/#categorie=${id}">
      <span class="bubble">${icon(CATEGORIES[id].icon)}</span>
      <strong>${CATEGORIES[id].label}</strong>
      <span>${esc(CATEGORIES[id].tagline)}</span>
      <span class="count">${count} biais</span>
    </a>`;
  }).join('');

  const featuredChips = featured
    .map((b) => `<a class="chip" href="biais/${b.id}/">${esc(b.name)}</a>`)
    .join('');

  const body = `
<section class="hero">
  <span class="blob" style="width:420px;height:420px;top:-160px;right:-120px;background:var(--teal-soft)"></span>
  <span class="blob" style="width:220px;height:220px;top:420px;left:-120px;background:var(--peach)"></span>
  <div class="container">
    <div>
      <p class="hero-eyebrow"><span class="sparkles"></span> Application mobile · biais cognitifs</p>
      <h1>Des biais<br>à la <span class="accent">clarté</span>.</h1>
      <div class="dash"></div>
      <p class="lead">nowYou vous aide à identifier et comprendre les biais cognitifs pour mieux vous connaître et faire des choix plus éclairés au quotidien.</p>
      <div class="hero-actions" id="telecharger">${storeButtons()}</div>
    </div>
    <div class="hero-visual">
      <img src="assets/img/screen-connaitre.webp" alt="Écran d’accueil de nowYou : « Mieux se connaître »" width="853" height="1844" loading="eager">
    </div>
  </div>
  <div class="container">
    <div class="stats">
      <div class="stat"><strong>${biases.length}</strong><span>biais expliqués</span></div>
      <div class="stat"><strong>${totalQuestions}</strong><span>questions de quiz</span></div>
      <div class="stat"><strong>4</strong><span>catégories</span></div>
      <div class="stat"><strong>0</strong><span>compte, 0 donnée envoyée</span></div>
    </div>
  </div>
</section>

<section class="section" id="fonctionnalites">
  <div class="container">
    <div class="section-head">
      <h2>Trois façons d’avancer</h2>
      <p>Une fiche d’une minute, trois questions, et votre parcours progresse. Sans jargon, sans pavé.</p>
    </div>
    <div class="grid-3">
      <article class="card">
        <span class="bubble cat--emotions">${icon('userCircle')}</span>
        <h3>Mieux se connaître</h3>
        <p>Prendre du recul sur ses pensées et repérer les raccourcis qui décident à notre place.</p>
      </article>
      <article class="card">
        <span class="bubble cat--pensee">${icon('magnifyingGlass')}</span>
        <h3>Explorer</h3>
        <p>Découvrir les biais qui influencent nos choix, classés par thème, avec un exemple du quotidien.</p>
      </article>
      <article class="card">
        <span class="bubble cat--decisions">${icon('lightbulb')}</span>
        <h3>Apprendre</h3>
        <p>Des connaissances pour agir au quotidien : comment le cerveau simplifie, et cinq réflexes pour déceler un biais.</p>
      </article>
    </div>
  </div>
</section>

<section class="section" id="app">
  <div class="container">
    <div class="feature">
      <div>
        <span class="chip chip--teal">Explorer</span>
        <h2>Explorer ses biais</h2>
        <p class="muted">Identifiez les raccourcis mentaux qui influencent vos décisions. Recherchez par nom ou par thème, filtrez par catégorie.</p>
        <ul>
          <li>${icon('checkCircle')}<span>${biases.length} biais, 4 catégories : Pensée, Émotions, Social, Décisions</span></li>
          <li>${icon('checkCircle')}<span>Chaque fiche : définition, exemple du quotidien, signaux, parade</span></li>
          <li>${icon('checkCircle')}<span>Les 12 biais les plus courants mis en avant</span></li>
        </ul>
      </div>
      <div class="feature-visual">
        <span class="blob" style="background:var(--teal-soft)"></span>
        <img src="assets/img/screen-explorer.webp" alt="Écran Explorer de nowYou" width="853" height="1844" loading="lazy">
      </div>
    </div>
    <div class="feature">
      <div>
        <span class="chip">Mon parcours</span>
        <h2>Suivre son parcours</h2>
        <p class="muted">Avancez pas à pas : lisez une fiche, répondez à trois questions, et le biais rejoint votre parcours.</p>
        <ul>
          <li>${icon('checkCircle')}<span>Un quiz de trois questions par biais, portant uniquement sur la fiche</span></li>
          <li>${icon('checkCircle')}<span>Deux bonnes réponses suffisent pour valider un biais</span></li>
          <li>${icon('checkCircle')}<span>Progression, biais découverts et taux de réussite, tout en local</span></li>
        </ul>
      </div>
      <div class="feature-visual">
        <span class="blob" style="background:var(--coral-soft)"></span>
        <img src="assets/img/screen-parcours.webp" alt="Écran Mon parcours de nowYou" width="853" height="1844" loading="lazy">
      </div>
    </div>
  </div>
</section>

<section class="section" id="comment">
  <div class="container">
    <div class="section-head">
      <h2>Comment ça marche</h2>
      <p>Pas de cours magistral : un rythme court, pensé pour tenir dans une pause.</p>
    </div>
    <div class="grid-3 steps">
      <div class="step"><span class="num">1</span><span class="bubble">${icon('bookOpen')}</span><h3>Lire une fiche</h3><p class="muted">Une minute suffit : le mécanisme, un exemple, trois signaux pour le repérer.</p></div>
      <div class="step"><span class="num">2</span><span class="bubble">${icon('chatCircleDots')}</span><h3>Répondre à trois questions</h3><p class="muted">Un bouton par réponse, une explication à chaque fois.</p></div>
      <div class="step"><span class="num">3</span><span class="bubble">${icon('trophy')}</span><h3>Voir son parcours avancer</h3><p class="muted">Le biais rejoint vos découvertes. Revenez le réviser quand vous voulez.</p></div>
    </div>
  </div>
</section>

<section class="section" id="bibliotheque">
  <div class="container">
    <div class="section-head">
      <h2>La bibliothèque des biais</h2>
      <p>Toutes les fiches de l’application sont aussi lisibles ici, gratuitement.</p>
    </div>
    <div class="grid-4">${categoryCards}</div>
    <h3 style="margin-top:40px">Les plus courants</h3>
    <div class="chips">${featuredChips}</div>
  </div>
</section>

<section class="section" id="confidentialite">
  <div class="container">
    <div class="privacy">
      <span class="blob" style="width:360px;height:360px;right:-140px;bottom:-200px;background:rgba(43,179,177,.25)"></span>
      <div>
        <h2>Vos données restent chez vous</h2>
        <p>nowYou ne demande pas de compte et n’envoie aucune requête. Votre progression est enregistrée sur votre téléphone, et nulle part ailleurs.</p>
        <a class="btn btn--outline" href="confidentialite/">Lire la politique de confidentialité</a>
      </div>
      <ul>
        <li>${icon('wifiSlash')}<span>Fonctionne 100 % hors ligne</span></li>
        <li>${icon('userCircle')}<span>Aucun compte, aucune inscription</span></li>
        <li>${icon('cloudSlash')}<span>Aucune donnée collectée ni transmise</span></li>
        <li>${icon('shieldCheck')}<span>Aucun traceur, aucune publicité</span></li>
      </ul>
    </div>
  </div>
</section>

<section class="cta">
  <div class="container">
    <h2>Mieux se connaître, <span class="accent">dès aujourd’hui</span>.</h2>
    <p class="muted">Comprendre les biais cognitifs pour faire des choix plus clairs au quotidien.</p>
    <div class="hero-actions">${storeButtons()}</div>
  </div>
</section>
`;
  return layout({
    title: config.appName,
    description: 'nowYou est une application mobile pour identifier et comprendre les biais cognitifs : 70 fiches courtes, des quiz, un parcours, sans compte et sans collecte de données.',
    depth: 0,
    active: 'home',
    body,
    pathname: '',
  });
}

// ─── Library ─────────────────────────────────────────────────────────────────

function libraryIndex() {
  const filters = [
    `<button class="filter filter--all" type="button" data-category="all" aria-pressed="true">Tous</button>`,
    ...ORDER.map(
      (id) =>
        `<button class="filter filter--${id}" type="button" data-category="${id}" aria-pressed="false">${icon(CATEGORIES[id].icon)}${CATEGORIES[id].label}</button>`,
    ),
  ].join('');

  const cards = sorted
    .map((b) => {
      const search = normalize([b.name, b.theme, b.summary, CATEGORIES[b.category].label, ...(b.altNames || [])].join(' '));
      return `<a class="bias-card" href="${b.id}/" data-category="${b.category}" data-search="${esc(search)}">
      <div class="top">${bubble(b.category)}${b.featured ? '<span class="chip">Biais courant</span>' : ''}</div>
      <span class="theme cat--${b.category}" style="background:none">${esc(b.theme)}</span>
      <h3>${esc(b.name)}</h3>
      <p>${esc(b.summary)}</p>
    </a>`;
    })
    .join('');

  const body = `
<section class="page-hero">
  <span class="blob" style="width:360px;height:360px;top:-160px;right:-120px;background:var(--teal-soft)"></span>
  <div class="container">
    <nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="../">Accueil</a><span>›</span><span>Les biais</span></nav>
    <h1>Explorer <span class="accent">les biais</span></h1>
    <div class="dash"></div>
    <p class="lead muted" style="max-width:36rem">Les ${biases.length} fiches de l’application. Recherchez un biais, un synonyme ou un thème, ou filtrez par catégorie.</p>
  </div>
  <div class="container toolbar">
    <label class="search"><span class="visually-hidden">Rechercher</span>${icon('magnifyingGlass')}<input id="search" type="search" placeholder="Rechercher un biais ou un thème" autocomplete="off"></label>
    <div class="filters">${filters}</div>
    <p class="count" id="count">${biases.length} biais</p>
  </div>
</section>
<section class="container">
  <div class="bias-grid">
    ${cards}
    <p class="empty" id="empty" hidden>Aucun biais ne correspond. Essayez un autre mot, ou retirez un filtre.</p>
  </div>
</section>
`;
  return layout({
    title: 'Les biais cognitifs',
    description: `Les ${biases.length} biais cognitifs expliqués dans nowYou : définition, exemple du quotidien, signaux pour les repérer et parade.`,
    depth: 1,
    active: 'biais',
    body,
    scripts: ['assets/js/biais.js'],
    pathname: 'biais/',
  });
}

function biasPage(bias, index) {
  const cat = CATEGORIES[bias.category];
  const prev = sorted[index - 1];
  const next = sorted[index + 1];
  const related = sorted.filter((b) => b.category === bias.category && b.id !== bias.id).slice(0, 4);

  const body = `
<section class="page-hero">
  <span class="blob" style="width:360px;height:360px;top:-160px;right:-120px;background:var(--teal-soft)"></span>
  <span class="blob" style="width:200px;height:200px;top:260px;left:-100px;background:var(--peach)"></span>
  <div class="container">
    <nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="../../">Accueil</a><span>›</span><a href="../">Les biais</a><span>›</span><a href="../#categorie=${bias.category}">${cat.label}</a></nav>
    <div class="bias-hero">
      ${bubble(bias.category)}
      <span class="theme cat--${bias.category}" style="background:none">${esc(bias.theme)}</span>
      <h1>${esc(bias.name)}</h1>
      <p class="lead">${esc(bias.summary)}</p>
      ${bias.featured ? '<span class="chip">Biais courant</span>' : ''}
    </div>
  </div>
</section>
<section class="container bias-body">
  <div>
    <article class="card"><h2>En bref</h2><p>${esc(bias.definition)}</p></article>
    <article class="card card--tint cat--${bias.category}" style="color:var(--ink)"><h2>${icon('quotes')}Au quotidien</h2><p>${esc(bias.example)}</p></article>
    <article class="card"><h2>${icon('eye')}Comment le repérer</h2><ul class="spot">${bias.howToSpot.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></article>
    <article class="card card--night"><h2>${icon('lightbulb')}La parade</h2><p>${esc(bias.tip)}</p></article>
    ${bias.origin ? `<p class="origin">${esc(bias.origin)}</p>` : ''}
    <div class="pager">
      ${prev ? `<a href="../${prev.id}/"><span>Précédent</span>${esc(prev.name)}</a>` : '<span></span>'}
      ${next ? `<a class="next" href="../${next.id}/"><span>Suivant</span>${esc(next.name)}</a>` : ''}
    </div>
  </div>
  <aside class="aside">
    <div class="card">
      <h3>Testez-vous dans l’app</h3>
      <p>Trois questions sur cette fiche, et le biais rejoint votre parcours. Sans compte, hors ligne.</p>
      <a class="btn btn--accent" href="../../#telecharger">Découvrir nowYou ${icon('arrowRight')}</a>
      <div class="related">
        <h3>Dans la même catégorie</h3>
        ${related.map((r) => `<a href="../${r.id}/">${bubble(r.category)}${esc(r.name)}${icon('caretRight', 'chev')}</a>`).join('')}
      </div>
    </div>
  </aside>
</section>
`;
  return layout({
    title: bias.name,
    description: bias.summary,
    depth: 2,
    active: 'biais',
    body,
    pathname: `biais/${bias.id}/`,
  });
}

// ─── Static pages ────────────────────────────────────────────────────────────

function staticPage({ slug, title, intro, content, description }) {
  const plainTitle = title.replace(/<[^>]+>/g, '');
  const body = `
<section class="page-hero">
  <span class="blob" style="width:360px;height:360px;top:-160px;right:-120px;background:var(--teal-soft)"></span>
  <div class="container">
    <nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="../">Accueil</a><span>›</span><span>${esc(plainTitle)}</span></nav>
    <h1>${title}</h1>
    <div class="dash"></div>
    <p class="lead muted" style="max-width:40rem">${intro}</p>
  </div>
</section>
<section class="container prose">${content}</section>
`;
  return layout({ title: plainTitle, description, depth: 1, active: slug, body, pathname: `${slug}/` });
}

const mail = `<a href="mailto:${config.contactEmail}">${config.contactEmail}</a>`;

const supportPage = () =>
  staticPage({
    slug: 'support',
    title: 'Support',
    intro: 'Une question, une erreur dans une fiche, une idée de biais à ajouter ? Écrivez-nous.',
    description: 'Support et questions fréquentes de l’application nowYou.',
    content: `
<div class="card"><h3>${icon('envelopeSimple')} Contact</h3><p>${mail}<br>Réponse sous quelques jours, en français.</p></div>
<h2>Questions fréquentes</h2>
<h3>L’application fonctionne-t-elle hors ligne ?</h3>
<p>Oui, entièrement. nowYou n’envoie aucune requête : les fiches, les quiz et votre progression sont sur votre téléphone.</p>
<h3>Faut-il créer un compte ?</h3>
<p>Non. Il n’y a ni inscription, ni connexion, ni collecte de données.</p>
<h3>Comment un biais est-il « découvert » ?</h3>
<p>Après la lecture d’une fiche, un quiz de trois questions porte uniquement sur son contenu. Deux bonnes réponses suffisent ; un sans-faute est signalé. Vous pouvez refaire un quiz autant de fois que vous voulez.</p>
<h3>Comment réinitialiser ma progression ?</h3>
<p>La progression est stockée localement par l’application. Désinstaller puis réinstaller nowYou la remet à zéro.</p>
<h3>Puis-je signaler une erreur ou proposer un biais ?</h3>
<p>Oui, par e-mail à ${mail}. Les fiches s’appuient sur la psychologie cognitive et l’économie comportementale (Kahneman, Tversky, Asch, Thaler…) et sont relues, mais une correction est toujours bienvenue.</p>
<h3>nowYou remplace-t-elle un accompagnement ?</h3>
<p>Non. nowYou est une application pédagogique. Elle ne fournit ni diagnostic ni conseil médical ou psychologique.</p>
`,
  });

const privacyPage = () =>
  staticPage({
    slug: 'confidentialite',
    title: 'Politique de <span class="accent">confidentialité</span>',
    intro: 'nowYou ne collecte, ne stocke sur serveur et ne transmet aucune donnée personnelle. Tout reste sur votre appareil.',
    description: 'Politique de confidentialité de l’application nowYou : aucune collecte de données, aucun compte, fonctionnement 100 % local.',
    content: `
<p><em>Dernière mise à jour : ${config.updatedAt}.</em></p>
<p>Cette politique s’applique à l’application mobile nowYou (iOS et Android) éditée par ${esc(config.creator)}, ainsi qu’au présent site. Elle décrit, en toute transparence, ce que l’application fait de vos données : rien.</p>

<h2>1. Aucune collecte de données</h2>
<p>nowYou ne collecte aucune donnée personnelle. L’application :</p>
<ul>
  <li>ne demande pas de compte, d’adresse e-mail, de nom ni de mot de passe ;</li>
  <li>n’effectue aucune requête réseau : elle fonctionne entièrement hors ligne ;</li>
  <li>n’intègre aucun outil d’analyse d’audience, de publicité, de suivi ni de rapport de plantage ;</li>
  <li>ne demande aucune autorisation système (pas d’accès à la localisation, aux contacts, à l’appareil photo, au micro ni aux notifications).</li>
</ul>

<h2>2. Données enregistrées sur votre appareil</h2>
<p>Pour fonctionner, nowYou mémorise localement, dans le stockage privé de l’application :</p>
<ul>
  <li>le fait que l’introduction a été vue ;</li>
  <li>les fiches de biais que vous avez ouvertes ;</li>
  <li>vos résultats aux quiz (meilleur score, nombre d’essais, date de réussite).</li>
</ul>
<p>Ces informations ne quittent jamais votre téléphone. Elles ne sont ni synchronisées, ni sauvegardées sur un serveur, ni accessibles à l’éditeur. Désinstaller l’application les supprime définitivement.</p>

<h2>3. Services tiers</h2>
<p>L’application n’embarque aucun service tiers. Les boutiques d’applications (App Store d’Apple, Google Play) peuvent collecter des statistiques de téléchargement selon leurs propres politiques, indépendantes de nowYou.</p>
<p>Le présent site est hébergé par GitHub Pages, qui peut enregistrer des journaux techniques de connexion (adresse IP) conformément à la <a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">politique de confidentialité de GitHub</a>. Le site n’utilise ni cookie ni outil de mesure d’audience. Les polices sont chargées depuis Google Fonts.</p>

<h2>4. Enfants</h2>
<p>nowYou ne collectant aucune donnée, elle peut être utilisée à tout âge. Son contenu, à visée pédagogique, s’adresse toutefois en priorité aux adultes et adolescents.</p>

<h2>5. Vos droits</h2>
<p>Aucune donnée vous concernant n’étant détenue par l’éditeur, il n’y a rien à consulter, rectifier ou effacer de notre côté. Vous gardez à tout moment la maîtrise des données locales en désinstallant l’application. Pour toute question, écrivez à ${mail}.</p>

<h2>6. Modifications</h2>
<p>Si l’application évoluait pour utiliser un service en ligne, cette politique serait mise à jour avant la publication de la version concernée, et la date de mise à jour modifiée en conséquence.</p>

<h2>7. Contact</h2>
<p>${esc(config.creator)} · ${mail}</p>
`,
  });

const termsPage = () =>
  staticPage({
    slug: 'cgu',
    title: 'Conditions générales <span class="accent">d’utilisation</span>',
    intro: 'Les règles simples qui encadrent l’usage de l’application nowYou.',
    description: 'Conditions générales d’utilisation de l’application mobile nowYou.',
    content: `
<p><em>Dernière mise à jour : ${config.updatedAt}.</em></p>

<h2>1. Objet</h2>
<p>Les présentes conditions régissent l’utilisation de l’application mobile nowYou (« l’Application »), éditée par ${esc(config.creator)} (« l’Éditeur »). En installant ou en utilisant l’Application, vous acceptez ces conditions.</p>

<h2>2. Description du service</h2>
<p>nowYou est une application pédagogique qui présente des biais cognitifs sous forme de fiches courtes (définition, exemple, signaux, parade) accompagnées de quiz, et qui suit votre progression. L’Application fonctionne sans compte et sans connexion internet.</p>

<h2>3. Nature des contenus</h2>
<p>Les contenus ont une vocation d’information et de vulgarisation. Ils ne constituent ni un diagnostic, ni un avis médical, psychologique ou professionnel, ni une incitation à prendre une décision particulière. Si vous traversez une difficulté, rapprochez-vous d’un professionnel de santé.</p>
<p>L’Éditeur s’efforce de proposer des contenus exacts, fondés sur la littérature en psychologie cognitive et en économie comportementale, mais ne garantit pas leur exhaustivité ni leur actualité. Toute erreur peut être signalée à ${mail}.</p>

<h2>4. Accès et disponibilité</h2>
<p>L’Application est fournie « en l’état ». L’Éditeur peut la faire évoluer, la suspendre ou en arrêter la distribution à tout moment, sans que cela ouvre droit à indemnité. Les conditions de distribution (prix éventuel, mises à jour) sont celles des boutiques d’applications.</p>

<h2>5. Données</h2>
<p>L’Application n’effectue aucune requête réseau et ne collecte aucune donnée personnelle. Votre progression est stockée localement sur votre appareil. Voir la <a href="../confidentialite/">politique de confidentialité</a>.</p>

<h2>6. Propriété intellectuelle</h2>
<p>Les textes, l’identité visuelle, le logo et la structure de l’Application sont la propriété de l’Éditeur. Toute reproduction ou diffusion à des fins commerciales sans autorisation est interdite. La consultation et le partage des fiches à des fins personnelles ou pédagogiques non commerciales sont libres, avec mention de la source.</p>
<p>L’Application utilise des composants tiers sous licence libre, notamment les icônes <a href="https://phosphoricons.com" target="_blank" rel="noopener">Phosphor</a> (licence MIT) et la police <a href="https://fonts.google.com/specimen/Manrope" target="_blank" rel="noopener">Manrope</a> (licence SIL Open Font).</p>

<h2>7. Responsabilité</h2>
<p>L’utilisation de l’Application se fait sous votre seule responsabilité. L’Éditeur ne saurait être tenu responsable des décisions prises sur la base des contenus, ni d’un dysfonctionnement de l’appareil ou de la perte de la progression locale (par exemple après désinstallation).</p>

<h2>8. Modifications des conditions</h2>
<p>L’Éditeur peut modifier les présentes conditions. La version en vigueur est celle publiée sur ce site, avec sa date de mise à jour.</p>

<h2>9. Droit applicable</h2>
<p>Les présentes conditions sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français sont compétents.</p>

<h2>10. Contact</h2>
<p>${esc(config.creator)} · ${mail}</p>
`,
  });

const legalPage = () =>
  staticPage({
    slug: 'mentions-legales',
    title: 'Mentions légales',
    intro: 'Informations relatives à l’éditeur et à l’hébergement de ce site.',
    description: 'Mentions légales du site nowYou.',
    content: `
<h2>Éditeur</h2>
<p>${esc(config.creator)}<br>Contact : ${mail}</p>
<h2>Hébergement</h2>
<p>Ce site est hébergé par GitHub Pages, un service de GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis.</p>
<h2>Propriété intellectuelle</h2>
<p>Les contenus de ce site et de l’application nowYou sont la propriété de l’éditeur, sauf mention contraire. Icônes <a href="https://phosphoricons.com" target="_blank" rel="noopener">Phosphor</a> (licence MIT) ; police <a href="https://fonts.google.com/specimen/Manrope" target="_blank" rel="noopener">Manrope</a> (licence SIL Open Font).</p>
<h2>Données personnelles</h2>
<p>Voir la <a href="../confidentialite/">politique de confidentialité</a>.</p>
`,
  });

const notFoundPage = () =>
  layout({
    title: 'Page introuvable',
    description: 'Cette page n’existe pas.',
    depth: 0,
    body: `
<section class="page-hero"><div class="container" style="text-align:center;padding:40px 0 80px">
  <span class="sparkles"></span>
  <h1>Page <span class="accent">introuvable</span></h1>
  <p class="muted">Un raccourci de trop. Retournons sur le bon chemin.</p>
  <p><a class="btn btn--primary" href="./">Retour à l’accueil</a> <a class="btn btn--outline" href="biais/">Voir les biais</a></p>
</div></section>`,
    pathname: '404.html',
  });

// ─── Build ───────────────────────────────────────────────────────────────────

const pages = [];
write('index.html', landing());
pages.push('');
write('biais/index.html', libraryIndex());
pages.push('biais/');
sorted.forEach((bias, index) => {
  write(`biais/${bias.id}/index.html`, biasPage(bias, index));
  pages.push(`biais/${bias.id}/`);
});
for (const [slug, page] of [
  ['support', supportPage],
  ['confidentialite', privacyPage],
  ['cgu', termsPage],
  ['mentions-legales', legalPage],
]) {
  write(`${slug}/index.html`, page());
  pages.push(`${slug}/`);
}
write('404.html', notFoundPage());
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map((p) => `  <url><loc>${config.siteUrl}/${p}</loc></url>`)
    .join('\n')}\n</urlset>\n`,
);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
console.log(`${pages.length} pages generated`);

// Client-side search and category filter for the bias library
(function () {
  var input = document.getElementById('search');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.bias-card'));
  var filters = Array.prototype.slice.call(document.querySelectorAll('.filter'));
  var count = document.getElementById('count');
  var empty = document.getElementById('empty');
  if (!input || !cards.length) return;

  var category = 'all';

  function normalize(value) {
    return value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ /g, ' ')
      .toLowerCase()
      .trim();
  }

  function apply() {
    var words = normalize(input.value).split(/\s+/).filter(Boolean);
    var visible = 0;
    cards.forEach(function (card) {
      var haystack = card.getAttribute('data-search');
      var matchesCategory = category === 'all' || card.getAttribute('data-category') === category;
      var matchesWords = words.every(function (word) {
        return haystack.indexOf(word) !== -1;
      });
      var show = matchesCategory && matchesWords;
      card.hidden = !show;
      if (show) visible += 1;
    });
    count.textContent = visible + ' biais';
    empty.hidden = visible !== 0;
  }

  function select(next) {
    category = next;
    filters.forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-category') === next ? 'true' : 'false');
    });
    apply();
  }

  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      var next = button.getAttribute('data-category');
      select(category === next && next !== 'all' ? 'all' : next);
    });
  });

  input.addEventListener('input', apply);

  // Deep link: biais/#categorie=social
  var match = /categorie=([a-z]+)/.exec(window.location.hash);
  if (match && document.querySelector('.filter[data-category="' + match[1] + '"]')) {
    select(match[1]);
  } else {
    apply();
  }
})();

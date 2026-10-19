// Extracts the duotone SVG of a few Phosphor icons (MIT) from the app's node_modules into scripts/icons.json
const fs = require('fs');
const path = require('path');

const DEFS = path.join(__dirname, '..', '..', 'nowYou', 'node_modules', 'phosphor-react-native', 'src', 'defs');
const NAMES = [
  'Brain', 'MagnifyingGlass', 'Lightbulb', 'Heart', 'UsersThree', 'Gear', 'Compass', 'Path', 'Lightning',
  'CheckCircle', 'SealCheck', 'LockSimple', 'DeviceMobile', 'ShieldCheck', 'WifiSlash', 'Eye', 'Quotes',
  'ArrowRight', 'ArrowLeft', 'CaretRight', 'EnvelopeSimple', 'Trophy', 'Timer', 'Funnel', 'Question',
  'Shuffle', 'Pause', 'ArrowsClockwise', 'ChatCircleDots', 'Target', 'CloudSlash', 'UserCircle', 'BookOpen',
  'AppleLogo', 'GooglePlayLogo', 'ChartBar', 'Sparkle', 'HandPointing', 'ListMagnifyingGlass', 'Info',
];

const icons = {};
for (const name of NAMES) {
  const source = fs.readFileSync(path.join(DEFS, `${name}.tsx`), 'utf8');
  const start = source.indexOf("'duotone'");
  const end = source.indexOf('\n  [', start);
  const block = source.slice(start, end === -1 ? undefined : end);
  const paths = [];
  const re = /<Path\s+d="([^"]+)"(\s+opacity=\{duotoneOpacity\}\s+fill=\{duotoneColor\})?\s*\/>/g;
  let match;
  while ((match = re.exec(block))) {
    paths.push(match[2] ? `<path d="${match[1]}" opacity=".2"/>` : `<path d="${match[1]}"/>`);
  }
  if (!paths.length) throw new Error(`No duotone paths for ${name}`);
  const key = name.charAt(0).toLowerCase() + name.slice(1);
  icons[key] = paths.join('');
}
fs.writeFileSync(path.join(__dirname, 'icons.json'), JSON.stringify(icons, null, 1) + '\n');
console.log(`${Object.keys(icons).length} icons extracted`);

// Regenerates the menu tabs and sections in index.html from menu.json.
//
// Everything between the MENU:START and MENU:END markers in index.html is
// replaced, so edit menu.json rather than that part of the HTML.
//
// Usage: node scripts/build-menu.mjs
// Runs automatically via .github/workflows/build-menu.yml when menu.json
// changes on main.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const menuPath = join(root, 'menu.json');
const htmlPath = join(root, 'index.html');

const START = '<!-- MENU:START';
const END = '<!-- MENU:END -->';

// Badge text -> CSS class (see .badge-* styles in index.html)
const BADGES = {
  "Chef's Special": 'badge-chef',
  Vegetarian: 'badge-veg',
  Spicy: 'badge-spicy',
};

// ── Validation ──────────────────────────────────────────────────────────────

function validate(menu) {
  const errors = [];
  const isNum = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  const isStr = (s) => typeof s === 'string' && s.trim() !== '';

  function checkPrice(price, where) {
    if (price === undefined) return;
    if (isNum(price)) return;
    if (price && typeof price === 'object' && isNum(price.regular) && isNum(price.large)) return;
    errors.push(`${where}.price must be a number (e.g. 12.99) or {"regular": 13.0, "large": 22.0}`);
  }

  function checkItem(item, where) {
    if (!item || typeof item !== 'object') return errors.push(`${where} must be an object`);
    if (!isStr(item.name)) errors.push(`${where} is missing a "name"`);
    const label = isStr(item.name) ? `${where} ("${item.name}")` : where;
    checkPrice(item.price, label);
    for (const key of ['note', 'description', 'priceSuffix']) {
      if (item[key] !== undefined && typeof item[key] !== 'string') {
        errors.push(`${label}.${key} must be text`);
      }
    }
    if (item.badge !== undefined && !BADGES[item.badge]) {
      errors.push(`${label}.badge "${item.badge}" must be one of: ${Object.keys(BADGES).join(', ')}`);
    }
  }

  function checkItems(items, where) {
    if (!Array.isArray(items)) return errors.push(`${where}.items must be a list`);
    items.forEach((item, i) => checkItem(item, `${where}.items[${i}]`));
  }

  if (!Array.isArray(menu.sections) || menu.sections.length === 0) {
    errors.push('"sections" must be a non-empty list');
    return errors;
  }

  const ids = new Set();
  menu.sections.forEach((s, i) => {
    const where = `sections[${i}]`;
    if (!isStr(s.id) || !/^[a-z0-9-]+$/.test(s.id)) {
      errors.push(`${where}.id must be lowercase letters, numbers or dashes`);
    } else if (ids.has(s.id)) {
      errors.push(`${where}.id "${s.id}" is used more than once`);
    }
    ids.add(s.id);
    if (!isStr(s.title)) errors.push(`${where} is missing a "title"`);
    if ((s.items === undefined) === (s.subsections === undefined)) {
      errors.push(`${where} must have either "items" or "subsections" (not both)`);
    }
    if (s.items !== undefined) checkItems(s.items, where);
    if (s.subsections !== undefined) {
      if (!Array.isArray(s.subsections)) errors.push(`${where}.subsections must be a list`);
      else s.subsections.forEach((sub, j) => {
        if (!isStr(sub.title)) errors.push(`${where}.subsections[${j}] is missing a "title"`);
        checkItems(sub.items, `${where}.subsections[${j}]`);
      });
    }
    if (s.pricing !== undefined) {
      if (!Array.isArray(s.pricing)) errors.push(`${where}.pricing must be a list`);
      else s.pricing.forEach((p, j) => {
        if (!isStr(p.label) || !isNum(p.regular) || !isNum(p.large)) {
          errors.push(`${where}.pricing[${j}] needs "label", "regular" and "large"`);
        }
      });
    }
  });
  return errors;
}

// ── Rendering ───────────────────────────────────────────────────────────────

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const money = (n) => `$${n.toFixed(2)}`;

function formatPrice(item) {
  if (item.price === undefined) return null;
  const base =
    typeof item.price === 'number'
      ? money(item.price)
      : `${money(item.price.regular)} / ${money(item.price.large)}`;
  return item.priceSuffix ? `${base} ${item.priceSuffix}` : base;
}

function renderItem(item) {
  const note = item.note
    ? ` <small style="font-weight: 400; color: var(--muted)">(${esc(item.note)})</small>`
    : '';
  const price = formatPrice(item);
  return [
    `<div class="menu-item">`,
    item.badge && `  <span class="menu-item-badge ${BADGES[item.badge]}">${esc(item.badge)}</span>`,
    `  <div class="menu-item-header">`,
    `    <span class="menu-item-name">${esc(item.name)}${note}</span>`,
    price && `    <span class="menu-item-price">${esc(price)}</span>`,
    `  </div>`,
    item.description && `  <p class="menu-item-desc">${esc(item.description)}</p>`,
    `</div>`,
  ].filter(Boolean);
}

function renderGrid(items, isLast) {
  const style = isLast ? '' : ' style="margin-bottom: 2rem"';
  return [
    `<div class="menu-grid"${style}>`,
    ...items.flatMap(renderItem).map((l) => '  ' + l),
    `</div>`,
  ];
}

function renderSection(section, isFirst) {
  const lines = [];
  if (section.pricing) {
    const parts = section.pricing.map(
      (p) => `<strong>${esc(p.label)}:</strong> Regular ${money(p.regular)} / Large ${money(p.large)}`,
    );
    lines.push(`<div class="price-note">${parts.join(' &nbsp;|&nbsp; ')}</div>`);
  }
  if (section.note) lines.push(`<p class="menu-section-note">${esc(section.note)}</p>`);
  if (section.items) {
    lines.push(...renderGrid(section.items, true));
  } else {
    section.subsections.forEach((sub, i) => {
      lines.push(`<div class="menu-section-title" style="margin-bottom: 1.2rem">${esc(sub.title)}</div>`);
      lines.push(...renderGrid(sub.items, i === section.subsections.length - 1));
    });
  }
  return [
    `<!-- ${esc(section.title.toUpperCase())} -->`,
    `<div class="menu-section${isFirst ? ' active' : ''}" id="tab-${section.id}">`,
    ...lines.map((l) => '  ' + l),
    `</div>`,
  ];
}

function renderMenu(menu, indent) {
  const tabs = menu.sections.map(
    (s, i) =>
      `  <button class="tab-btn${i === 0 ? ' active' : ''}" onclick="showTab('${s.id}')" role="tab">${esc(s.title)}</button>`,
  );
  const lines = [
    `<div class="menu-tabs" role="tablist">`,
    ...tabs,
    `</div>`,
    ...menu.sections.flatMap((s, i) => ['', ...renderSection(s, i === 0)]),
  ];
  return lines.map((l) => (l ? indent + l : l)).join('\n');
}

// ── Main ────────────────────────────────────────────────────────────────────

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

const menuText = readFileSync(menuPath, 'utf8');
let menu;
try {
  menu = JSON.parse(menuText);
} catch (e) {
  const pos = Number(/position (\d+)/.exec(e.message)?.[1]);
  const line = Number.isNaN(pos) ? null : menuText.slice(0, pos).split('\n').length;
  fail(
    `menu.json is not valid JSON${line ? ` (around line ${line})` : ''}: ${e.message}\n` +
      '  Look for a missing or extra comma, quote or bracket.',
  );
}

const errors = validate(menu);
if (errors.length) {
  fail(`menu.json has ${errors.length} problem(s):\n  - ${errors.join('\n  - ')}`);
}

const html = readFileSync(htmlPath, 'utf8');
const startIdx = html.indexOf(START);
const endIdx = html.indexOf(END);
if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
  fail('Could not find the <!-- MENU:START --> / <!-- MENU:END --> markers in index.html');
}

// Keep the markers themselves; replace only what's between them.
const startLineEnd = html.indexOf('\n', startIdx) + 1;
const endLineStart = html.lastIndexOf('\n', endIdx) + 1;
const indent = html.slice(endLineStart, endIdx);

const updated =
  html.slice(0, startLineEnd) + renderMenu(menu, indent) + '\n' + html.slice(endLineStart);

if (updated === html) {
  console.log('index.html menu is already up to date.');
} else {
  writeFileSync(htmlPath, updated);
  const count = menu.sections.reduce(
    (n, s) => n + (s.items ?? s.subsections.flatMap((x) => x.items)).length,
    0,
  );
  console.log(`Updated index.html: ${menu.sections.length} sections, ${count} items.`);
}

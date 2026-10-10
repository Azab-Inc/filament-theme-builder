import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [agents, tickets] = await Promise.all([
  readFile(new URL('../AGENTS.md', import.meta.url), 'utf8'),
  readFile(new URL('../TICKETS.md', import.meta.url), 'utf8'),
]);

test('repository guidance records the gated demo-first sequence', () => {
  assert.match(agents, /FTB-009A[\s\S]*FTB-009B[\s\S]*FTB-010/);
  assert.match(agents, /FTB-027\/028[\s\S]*parallel[\s\S]*outside the current plan/i);
});

test('ticket plan separates the three ordered milestone slices', () => {
  for (const milestone of ['FTB-009A', 'FTB-009B', 'FTB-010']) {
    assert.match(tickets, new RegExp(`## ${milestone}\\b`));
  }
  assert.match(tickets, /FTB-009A[\s\S]*FTB-009B[\s\S]*FTB-010/);
  assert.match(tickets, /FTB-027[\s\S]*parallel[\s\S]*FTB-028[\s\S]*parallel/i);
});

test('milestone ticket sections specify their required implementation scope', () => {
  const section = (heading, nextHeading) => {
    const start = tickets.indexOf(heading);
    const end = tickets.indexOf(nextHeading, start);

    assert.notEqual(start, -1, `missing ticket heading: ${heading}`);
    assert.notEqual(end, -1, `missing following ticket heading: ${nextHeading}`);

    return tickets.slice(start, end);
  };

  const domain = section('## FTB-009A', '## FTB-009B');
  assert.match(domain, /SPECS\.md §14/);
  assert.match(domain, /customers[\s\S]*addresses[\s\S]*products[\s\S]*orders/);
  assert.match(domain, /migrations[\s\S]*Eloquent models[\s\S]*relationships/i);
  assert.match(domain, /factories[\s\S]*deterministic seeders/i);

  const resources = section('## FTB-009B', '<a id="ftb-010"></a>');
  assert.match(resources, /core Filament CRUD resources/);
  assert.match(resources, /navigation/i);

  const relationships = section('## FTB-010', '<a id="ftb-011"></a>');
  assert.match(relationships, /Relation Managers/);
  assert.match(relationships, /Nested Resources/);
  assert.match(relationships, /attach and detach/i);
  assert.match(relationships, /associate and dissociate/i);
});

test('existing ticket anchors remain unique and stable', () => {
  for (const id of ['ftb-009', 'ftb-010', 'ftb-027', 'ftb-028']) {
    assert.equal(tickets.split(`<a id="${id}">`).length - 1, 1, `${id} anchor must occur once`);
  }
});

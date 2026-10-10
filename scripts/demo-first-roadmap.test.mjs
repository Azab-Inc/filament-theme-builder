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

test('existing ticket anchors remain unique and stable', () => {
  for (const id of ['ftb-009', 'ftb-010', 'ftb-027', 'ftb-028']) {
    assert.equal(tickets.split(`<a id="${id}">`).length - 1, 1, `${id} anchor must occur once`);
  }
});

<?php

namespace Tests\Feature\AiOperability;

use PHPUnit\Framework\TestCase;

class DemoShowcaseCapabilityInventoryTest extends TestCase
{
    public function test_ticket_sequence_and_scope_are_explicit(): void
    {
        $tickets = file_get_contents(dirname(__DIR__, 4).'/TICKETS.md');

        $this->assertStringContainsString('Phase 1 → FTB-011 → FTB-012 → FTB-013 → FTB-014 → FTB-015 → FTB-016 → FTB-017 → FTB-018', $tickets);
        foreach (['FTB-009A', 'FTB-009B', 'FTB-010'] as $completedTicket) {
            $this->assertMatchesRegularExpression('/## '.$completedTicket.'.*?\*\*Status:\*\* done/s', $tickets);
        }
        foreach (['FTB-027', 'FTB-028'] as $outOfScopeTicket) {
            $this->assertStringContainsString($outOfScopeTicket.' (parallel operational ticket', $tickets);
        }
        foreach (range(11, 18) as $number) {
            $ticket = sprintf('FTB-%03d', $number);
            $this->assertSame(1, substr_count($tickets, '<a id="'.strtolower($ticket).'"></a>'), $ticket.' anchor must occur once.');
        }
        $this->assertStringContainsString('official demo is research inspiration only; identity is independent', $tickets);
    }

    public function test_coverage_manifest_and_inventory_define_stable_operability_contract(): void
    {
        $root = dirname(__DIR__, 4);
        $coverage = file_get_contents($root.'/COVERAGE.md');
        $inventory = file_get_contents($root.'/docs/ai-operability/demo-showcase-capability-inventory.md');

        foreach ([
            'phase-1', 'dashboard.stats', 'dashboard.revenue-orders-chart', 'dashboard.recent-orders',
            'dashboard.low-stock', 'showcase.forms', 'showcase.tables', 'showcase.infolists',
            'showcase.actions', 'showcase.notifications', 'showcase.navigation', 'showcase.states',
            'panel.icons', 'panel.branding',
        ] as $identifier) {
            $this->assertStringContainsString($identifier, $coverage);
        }
        $this->assertStringNotContainsString('copy the official demo', strtolower($coverage));
        $this->assertStringContainsString('official demo is research inspiration', strtolower($coverage));

        $rows = array_filter(explode("\n", $inventory), fn (string $line): bool => str_starts_with($line, '| `'));
        $this->assertNotEmpty($rows, 'Inventory must contain capability rows.');
        $ids = [];
        foreach ($rows as $row) {
            $cells = array_map('trim', explode('|', $row));
            $this->assertMatchesRegularExpression('/^`([^`]+)`$/', $cells[1], 'Each capability row has a stable ID.');
            preg_match('/^`([^`]+)`$/', $cells[1], $matches);
            $ids[] = $matches[1];
            $this->assertNotSame('', $cells[2], 'Each capability names its surface.');
            $this->assertContains($cells[3], ['read-only', 'mutation', 'presentation-only']);
            $this->assertNotSame('', $cells[4], 'Each capability names its authorization policy.');
            $this->assertNotSame('', $cells[5], 'Each capability names its confirmation policy.');
            $this->assertStringContainsString('MCP', $cells[6], 'Each capability names MCP tool status.');
        }
        $this->assertCount(count(array_unique($ids)), $ids, 'Capability IDs must be unique.');
    }
}

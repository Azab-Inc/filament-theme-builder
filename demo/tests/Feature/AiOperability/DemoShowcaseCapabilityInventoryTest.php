<?php

namespace Tests\Feature\AiOperability;

use PHPUnit\Framework\TestCase;

class DemoShowcaseCapabilityInventoryTest extends TestCase
{
    public function test_ticket_sequence_and_scope_are_explicit(): void
    {
        $tickets = file_get_contents(dirname(__DIR__, 4).'/TICKETS.md');

        $this->assertStringContainsString('Phase 1 → FTB-011 → FTB-012 → FTB-013 → FTB-014 → FTB-015 → FTB-016 → FTB-017 → FTB-018', $tickets);
        $this->assertStringContainsString('prose delivery order (not hard dependency blockers)', strtolower($tickets));
        $this->assertStringContainsString('dependency map below remains the source of hard blockers', strtolower($tickets));
        foreach (['branded existing dashboard shell', 'four commerce widgets', 'resource icons', 'representative badges'] as $phaseOneOwner) {
            $this->assertStringContainsString($phaseOneOwner, strtolower($tickets));
        }
        foreach (['Showcase navigation/index', 'search', 'profile', 'authentication', 'tenant'] as $phaseFifteenOwner) {
            $this->assertStringContainsString($phaseFifteenOwner, $tickets);
        }
        $this->assertStringContainsString('integrate (not duplicate) Phase 1 widgets/navigation', $tickets);
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

        $this->assertStringContainsString('| `showcase.navigation.tenant-presentation` |', $inventory);
        $this->assertStringContainsString('No tenant persistence or tenant membership is used', $inventory);
        $this->assertStringContainsString('No MCP mutation tool is needed for read-only or presentation-only surfaces', $inventory);

        foreach ([
            'phase-1', 'dashboard.stats', 'dashboard.revenue-orders-chart', 'dashboard.recent-orders',
            'dashboard.low-stock', 'showcase.forms', 'showcase.tables', 'showcase.infolists',
            'showcase.actions', 'showcase.notifications', 'showcase.navigation', 'showcase.states',
            'panel.icons', 'panel.branding',
        ] as $identifier) {
            $this->assertStringContainsString($identifier, $coverage);
        }
        foreach ([
            'DemoShowcaseDashboard', 'CommerceStatsOverviewWidget', 'RevenueOrdersChartWidget',
            'RecentOrdersWidget', 'LowStockWidget', 'ResourceIconSet', 'RepresentativeBadgeSet',
            'ShowcaseFormsPage', 'ProductEditorForm', 'CustomerContactForm', 'OrderStatusForm',
            'SectionGridLayout', 'WizardStepsLayout', 'TabbedFormLayout', 'ShowcaseTablesPage',
            'ProductsTableFixture', 'OrdersTableFixture', 'InventoryTableFixture',
            'InfolistsShowcase', 'OrderDetailsInfolist', 'CustomerProfileInfolist',
            'ProductDetailsInfolist', 'ShowcaseActionsPage', 'OrderActionsFixture', 'ProductActionsFixture',
            'DeleteProductConfirmationModal', 'OrderStatusModal', 'OrderStatusNotification',
            'InventoryWarningNotification', 'ActionFailureNotification', 'ShowcaseIndexPage',
            'ShowcaseSidebarNavigation', 'GlobalSearchSurface', 'ProfileMenuSurface', 'LoginSurface',
            'TenantSwitcherSurface', 'ShowcaseStateControls', 'FormValidationState', 'FormFocusState',
            'TableEmptyState', 'TableLoadingState', 'TableSelectedRowState', 'ActionLoadingState',
            'ModalOpenState', 'NotificationVisibleState', 'IconPackConfiguration',
            'SemanticResourceIconOverrides', 'PanelBrandingSettings',
        ] as $fixtureName) {
            $this->assertStringContainsString($fixtureName, $coverage);
        }
        $this->assertStringNotContainsString('copy the official demo', strtolower($coverage));
        $this->assertStringContainsString('official demo is research inspiration', strtolower($coverage));
        $this->assertStringContainsString('| Capability | Surface | Operation | Authorization | Confirmation | MCP tool/status |', $inventory);
        foreach ([
            'phase-1', 'dashboard.stats', 'dashboard.revenue-orders-chart', 'dashboard.recent-orders',
            'dashboard.low-stock', 'showcase.forms', 'showcase.tables', 'showcase.infolists',
            'showcase.actions', 'showcase.notifications', 'showcase.navigation', 'showcase.states',
            'panel.icons', 'panel.branding',
        ] as $identifier) {
            $this->assertStringContainsString('| `'.$identifier.'` |', $inventory);
        }

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
            match ($cells[3]) {
                'read-only' => [
                    $this->assertMatchesRegularExpression('/public|panel authorization|authenticated/i', $cells[4]),
                    $this->assertSame('None', $cells[5]),
                    $this->assertMatchesRegularExpression('/No MCP (read tool|tool)/i', $cells[6]),
                ],
                'presentation-only' => [
                    $this->assertMatchesRegularExpression('/no domain|synthetic|in-memory/i', $cells[4]),
                    $this->assertMatchesRegularExpression('/no confirmation|^none$/i', $cells[5]),
                    $this->assertStringContainsString('No MCP mutation tool', $cells[6]),
                ],
                'mutation' => [
                    $this->assertMatchesRegularExpression('/authorization|builder theme state|project-owner/i', $cells[4]),
                    $this->assertMatchesRegularExpression('/explicit|user action/i', $cells[5]),
                    $this->assertMatchesRegularExpression('/No MCP (mutation )?tool/i', $cells[6]),
                ],
            };
            $this->assertStringContainsString('not available', strtolower($cells[6]));
        }
        $this->assertCount(count(array_unique($ids)), $ids, 'Capability IDs must be unique.');
    }
}

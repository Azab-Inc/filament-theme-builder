<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\ProcessScope;
use App\Mcp\ThemeRelay\RelayLifecycle;
use App\Mcp\ThemeRelay\RelayStore;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

abstract class LocalThemeToolTestCase extends TestCase
{
    protected string $relayPath;

    protected function setUp(): void
    {
        parent::setUp();
        $this->relayPath = sys_get_temp_dir().'/ftb-mcp-tools-'.bin2hex(random_bytes(8));
        config(['local-theme-relay.storage_path' => $this->relayPath]);
        $this->app->instance(RelayStore::class, new FileRelayStore($this->relayPath));
        $this->app->instance(ProcessScope::class, new ProcessScope('local-theme-test-process'));
        $this->app->bind(LocalThemeToolRegistry::class, ServerLocalThemeToolRegistry::class);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->relayPath);
        parent::tearDown();
    }

    protected function approveBrowserPair(string $id, string $session): void
    {
        $hash = hash('sha256', str_repeat('a', 64));
        $lifecycle = app(RelayLifecycle::class);
        $lifecycle->createPendingPairing($id, $session, $hash);
        $claim = $lifecycle->issuePairingClaim($id, $hash, $session);
        self::assertNotNull($claim);
        self::assertSame($session, $lifecycle->approveClaim($id, $claim['claimId'], $hash, $session));
    }

    protected function pairExpiry(string $id): int
    {
        $pair = json_decode((string) app(RelayStore::class)->read('pairing-'.$id), true);

        return $pair['expiresAt'];
    }
}

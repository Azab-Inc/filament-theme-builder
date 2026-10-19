<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\ThemeRelay\RelayStore;
use Symfony\Component\Process\Process;

final class LocalThemeMcpProcessScopeTest extends LocalThemeRelayBrowserTestCase
{
    public function test_separate_ftb_mcp_process_cannot_use_another_processs_approved_pair_or_operation(): void
    {
        $pairingId = 'subprocess-pair';
        $this->approveBrowserPairForProcess($pairingId);
        chown($this->relayPath, posix_geteuid());
        chmod($this->relayPath, 0700);
        $ownerResponses = $this->runMcp($this->requests([
            ['tools/call', ['name' => 'local_theme_pair', 'arguments' => ['pairing_id' => $pairingId]]],
            ['tools/call', ['name' => 'local_theme_list', 'arguments' => ['pairing_id' => $pairingId]]],
        ]));
        self::assertSame('approved', $ownerResponses[1]['result']['structuredContent']['status']);
        $operationId = $ownerResponses[2]['result']['structuredContent']['operation_id'];
        $pair = json_decode((string) app(RelayStore::class)->read('pairing-'.$pairingId), true);
        $ownerProcess = $pair['processId'];
        $this->approveBrowserPairForProcess('second-process-pair');

        $otherResponses = $this->runMcp($this->requests([
            ['tools/call', ['name' => 'local_theme_pair', 'arguments' => ['pairing_id' => $pairingId]]],
            ['tools/call', ['name' => 'local_theme_list', 'arguments' => ['pairing_id' => $pairingId]]],
            ['tools/call', ['name' => 'local_theme_operation_status', 'arguments' => ['operation_id' => $operationId]]],
            ['tools/call', ['name' => 'local_theme_pair', 'arguments' => ['pairing_id' => 'second-process-pair']]],
            ['tools/call', ['name' => 'local_theme_list', 'arguments' => ['pairing_id' => 'second-process-pair']]],
        ]));
        foreach (array_slice($otherResponses, 1, 3) as $response) {
            self::assertSame(['error' => 'pairing_required'], $response['result']['structuredContent']);
        }
        self::assertSame('approved', $otherResponses[4]['result']['structuredContent']['status']);
        self::assertSame('pending', $otherResponses[5]['result']['structuredContent']['status']);
        self::assertSame($ownerProcess, json_decode((string) app(RelayStore::class)->read('pairing-'.$pairingId), true)['processId']);
        $secondProcess = json_decode((string) app(RelayStore::class)->read('pairing-second-process-pair'), true)['processId'];
        self::assertNotSame($ownerProcess, $secondProcess);
        self::assertCount(2, app(RelayStore::class)->keys('operation-'));
    }

    private function runMcp(string $input): array
    {
        $process = new Process([PHP_BINARY, base_path('artisan'), 'ftb:mcp'], base_path(), [
            'APP_ENV' => 'testing', 'APP_URL' => 'http://localhost:8000',
            'FTB_LOCAL_MCP_ENABLED' => 'true', 'FTB_LOCAL_RELAY_PATH' => $this->relayPath,
        ]);
        $process->setInput($input);
        $process->run();
        self::assertSame(0, $process->getExitCode(), $process->getErrorOutput());
        self::assertSame('', $process->getErrorOutput());

        return array_map(static fn (string $line): array => json_decode($line, true, 512, JSON_THROW_ON_ERROR),
            array_filter(explode("\n", trim($process->getOutput()))));
    }

    private function requests(array $calls): string
    {
        $requests = [['jsonrpc' => '2.0', 'id' => 1, 'method' => 'initialize', 'params' => [
            'protocolVersion' => '2025-03-26', 'capabilities' => [], 'clientInfo' => ['name' => 'process-test', 'version' => '1'],
        ]], ['jsonrpc' => '2.0', 'method' => 'notifications/initialized']];
        foreach ($calls as $index => [$method, $params]) {
            $requests[] = ['jsonrpc' => '2.0', 'id' => $index + 2, 'method' => $method, 'params' => $params];
        }

        return implode("\n", array_map(json_encode(...), $requests))."\n";
    }
}

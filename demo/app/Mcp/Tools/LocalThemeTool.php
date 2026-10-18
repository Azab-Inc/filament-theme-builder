<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\ThemeRelay\ProcessScope;
use App\Mcp\ThemeRelay\RelayClock;
use App\Mcp\ThemeRelay\RelayLifecycle;
use App\Mcp\ThemeRelay\RelayStore;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Tool;
use Throwable;

abstract class LocalThemeTool extends Tool
{
    public function __construct(protected ProcessScope $scope, protected RelayStore $store,
        protected RelayLifecycle $lifecycle, protected RelayClock $clock) {}

    public function toArray(): array
    {
        $tool = parent::toArray();
        $tool['inputSchema']['additionalProperties'] = false;

        return $tool;
    }

    /**
     * @param  list<string>  $keys
     * @return array<string, mixed>
     */
    protected function input(Request $request, array $keys): array
    {
        $input = $request->all();
        $actual = array_keys($input);
        sort($actual);
        $expected = $keys;
        sort($expected);
        if ($actual !== $expected) {
            throw new \InvalidArgumentException('invalid_input');
        }

        return $input;
    }

    /** @param callable(): array<string, mixed> $action */
    protected function safe(callable $action): ResponseFactory
    {
        try {
            return Response::structured($action());
        } catch (Throwable) {
            return Response::structured(['error' => 'pairing_required']);
        }
    }

    protected function boundedString(mixed $value, int $max, int $min = 1): string
    {
        if (! is_string($value) || mb_strlen($value) < $min || mb_strlen($value) > $max) {
            throw new \InvalidArgumentException('invalid_input');
        }

        return $value;
    }

    /** @return array<string, mixed> */
    protected function pairing(string $id): array
    {
        if (! preg_match('/\A[a-zA-Z0-9_-]{1,120}\z/', $id)) {
            throw new \RuntimeException('pairing_required');
        }
        $pair = json_decode((string) $this->store->read('pairing-'.$id), true);
        if (! is_array($pair) || ($pair['pairingId'] ?? null) !== $id
            || ! in_array($pair['status'] ?? null, ['pending', 'approved'], true)
            || ! is_int($pair['expiresAt'] ?? null) || $pair['expiresAt'] <= $this->clock->now()) {
            throw new \RuntimeException('pairing_required');
        }

        return $pair;
    }

    /** @return array<string, mixed> */
    protected function authorize(string $id): array
    {
        $pair = $this->pairing($id);
        if (($pair['status'] ?? null) !== 'approved' || ! is_string($pair['sessionId'] ?? null)
            || ! $this->lifecycle->authorize($id, $this->scope->processId, $this->clock->now())->ok) {
            throw new \RuntimeException('pairing_required');
        }
        $session = json_decode((string) $this->store->read('session-'.$pair['sessionId']), true);
        if (! is_array($session) || ($session['pairingId'] ?? null) !== $id
            || ($session['processId'] ?? null) !== $this->scope->processId) {
            throw new \RuntimeException('pairing_required');
        }

        return $session;
    }
}

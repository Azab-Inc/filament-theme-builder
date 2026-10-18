<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final class OperationResultLifecycle
{
    private readonly RelayRecordReader $reader;

    public function __construct(private readonly RelayStore $store, private readonly RelayClock $clock,
        private readonly OperationResultStore $results, private readonly OperationResultWriter $writer,
        private readonly OperationRetentionLifecycle $retention)
    {
        $this->reader = new RelayRecordReader($store);
    }

    /**
     * @param  array<string, mixed>  $session
     * @param  array<string, mixed>  $result
     */
    public function publish(string $id, array $result, array $session): ?string
    {
        $record = $this->reader->read('operation-'.$id);
        if (! $this->belongs($record, $session) || ($record['status'] ?? null) !== 'pending'
            || ($record['expiresAt'] ?? 0) <= $this->clock->now()) {
            return null;
        }
        if (isset($result['errorCategory'])) {
            $keys = array_keys($result);
            sort($keys);
            if ($keys !== ['errorCategory', 'version'] || ($result['version'] ?? null) !== 1) {
                return null;
            }

            return $this->writer->reject($id, $result['errorCategory'], $session) ? 'rejected' : null;
        }
        if ($record['kind'] === 'import') {
            return $this->writer->completeImport($id, $record, $result, $session) ? 'approved' : null;
        }
        if (! OperationResultValidator::valid((string) $record['kind'], $result)) {
            return null;
        }
        $json = json_encode($result, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        if (strlen($json) > RelayLimits::MAX_THEME_BYTES) {
            return null;
        }

        return $this->results->publish($id, $record['pairingId'], $record['processId'], $record['digest'], $json)
            ? 'approved' : null;
    }

    /**
     * @param  array<string, mixed>  $session
     * @return array<string, mixed>|null
     */
    public function status(string $id, array $session): ?array
    {
        if (! preg_match('/\A[a-f0-9]{64}\z/', $id)) {
            return null;
        }
        $this->retention->expire($id, $session);
        $record = $this->reader->read('operation-'.$id);
        if (! $this->belongs($record, $session)) {
            return null;
        }
        $status = ($record['status'] === 'pending' && $record['expiresAt'] <= $this->clock->now()) ? 'expired' : $record['status'];
        if ($status === 'consumed') {
            $status = 'approved';
        }
        if (! in_array($status, ['pending', 'approved', 'rejected', 'expired', 'disconnected'], true)) {
            return null;
        }
        $result = ['version' => 1, 'status' => $status];
        foreach (['recordId', 'errorCategory'] as $field) {
            if (is_string($record[$field] ?? null)) {
                $result[$field] = $record[$field];
            }
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>|null  $record
     * @param  array<string, mixed>  $session
     */
    private function belongs(?array $record, array $session): bool
    {
        return $record !== null && ($record['pairingId'] ?? null) === $session['pairingId']
            && ($record['processId'] ?? null) === $session['processId'];
    }
}

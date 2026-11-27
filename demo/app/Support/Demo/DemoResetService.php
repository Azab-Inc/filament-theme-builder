<?php

namespace App\Support\Demo;

use App\Support\Uploads\TemporaryUploadStorage;
use RuntimeException;

final class DemoResetService
{
    public function __construct(
        private readonly TemporaryUploadStorage $uploads,
        private readonly ?bool $sqliteAvailable = null,
    ) {}

    /** @return array{uploads_deleted: int} */
    public function reset(string $snapshot, string $database, string $lockPath): array
    {
        if ($snapshot === '' || ! is_file($snapshot) || $database === '' || $database === ':memory:') {
            throw new RuntimeException('DEMO_SNAPSHOT_PATH and a file-backed database are required.');
        }

        $lockDirectory = dirname($lockPath);
        if (! is_dir($lockDirectory) && ! mkdir($lockDirectory, 0750, true) && ! is_dir($lockDirectory)) {
            throw new RuntimeException('The demo reset lock directory could not be created.');
        }

        $lock = fopen($lockPath, 'c');
        if ($lock === false || ! flock($lock, LOCK_EX | LOCK_NB)) {
            throw new RuntimeException('The demo reset lock could not be acquired.');
        }

        try {
            $databaseDirectory = dirname($database);
            if (! is_dir($databaseDirectory) && ! mkdir($databaseDirectory, 0750, true) && ! is_dir($databaseDirectory)) {
                throw new RuntimeException('The demo database directory could not be created.');
            }

            $snapshotIsSqlite = $this->hasSqliteHeader($snapshot);
            $databaseIsSqlite = $this->hasSqliteHeader($database);
            if ($snapshotIsSqlite || $databaseIsSqlite) {
                if (! $this->sqliteSupportAvailable()) {
                    throw new RuntimeException('The SQLite3 extension is required to restore SQLite snapshots safely.');
                }
                if (! $snapshotIsSqlite || ! $databaseIsSqlite || ! $this->isValidSqliteDatabase($snapshot) || ! $this->isValidSqliteDatabase($database)) {
                    throw new RuntimeException('The SQLite snapshot or destination is invalid.');
                }
                $this->restoreSqliteInPlace($snapshot, $database);
            } else {
                $this->installSnapshotAtomically($snapshot, $database, $databaseDirectory);
            }

            $cleanup = $this->uploads->clearAll();
            if ($cleanup['failed'] !== []) {
                throw new RuntimeException('Temporary demo upload cleanup failed for: '.implode(', ', $cleanup['failed']));
            }

            return ['uploads_deleted' => $cleanup['deleted']];
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    private function hasSqliteHeader(string $path): bool
    {
        if (! is_file($path)) {
            return false;
        }

        $handle = fopen($path, 'rb');
        $header = $handle === false ? false : fread($handle, 16);
        if (is_resource($handle)) {
            fclose($handle);
        }
        if ($header !== "SQLite format 3\000") {
            return false;
        }

        return true;
    }

    private function sqliteSupportAvailable(): bool
    {
        return $this->sqliteAvailable ?? (extension_loaded('sqlite3') && class_exists(\SQLite3::class));
    }

    private function isValidSqliteDatabase(string $path): bool
    {
        try {
            $database = new \SQLite3($path, SQLITE3_OPEN_READONLY);
            $database->busyTimeout(5000);
            $valid = $database->querySingle('SELECT 1') === 1;
            $database->close();

            return $valid;
        } catch (\Throwable) {
            return false;
        }
    }

    private function restoreSqliteInPlace(string $snapshot, string $database): void
    {
        $source = null;
        $destination = null;

        try {
            $source = new \SQLite3($snapshot, SQLITE3_OPEN_READONLY);
            $destination = new \SQLite3($database, SQLITE3_OPEN_READWRITE);
            $source->busyTimeout(5000);
            $destination->busyTimeout(5000);

            if (! $source->backup($destination)) {
                throw new RuntimeException('The SQLite snapshot could not be restored in place.');
            }
        } catch (\Throwable $exception) {
            throw new RuntimeException('The SQLite snapshot could not be restored in place.', 0, $exception);
        } finally {
            $source?->close();
            $destination?->close();
        }
    }

    private function installSnapshotAtomically(string $snapshot, string $database, string $databaseDirectory): void
    {
        $temporary = tempnam($databaseDirectory, basename($database).'.reset-');
        if ($temporary === false || ! copy($snapshot, $temporary) || ! rename($temporary, $database)) {
            if ($temporary !== false) {
                @unlink($temporary);
            }

            throw new RuntimeException('The snapshot could not be installed atomically.');
        }
    }
}

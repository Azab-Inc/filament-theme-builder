<?php

namespace App\Support\Demo;

use App\Support\Uploads\TemporaryUploadStorage;
use RuntimeException;

final class DemoResetService
{
    public function __construct(private readonly TemporaryUploadStorage $uploads) {}

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
        if ($lock === false || ! flock($lock, LOCK_EX)) {
            throw new RuntimeException('The demo reset lock could not be acquired.');
        }

        try {
            $databaseDirectory = dirname($database);
            if (! is_dir($databaseDirectory) && ! mkdir($databaseDirectory, 0750, true) && ! is_dir($databaseDirectory)) {
                throw new RuntimeException('The demo database directory could not be created.');
            }

            $temporary = tempnam($databaseDirectory, basename($database).'.reset-');
            if ($temporary === false || ! copy($snapshot, $temporary) || ! rename($temporary, $database)) {
                if ($temporary !== false) {
                    @unlink($temporary);
                }

                throw new RuntimeException('The snapshot could not be installed atomically.');
            }

            return ['uploads_deleted' => $this->uploads->clearAll()];
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}

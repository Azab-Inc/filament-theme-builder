<?php

namespace App\Console\Commands;

use App\Support\Uploads\TemporaryUploadStorage;
use Illuminate\Console\Command;

class CleanupTemporaryUploadsCommand extends Command
{
    protected $signature = 'uploads:cleanup';

    protected $description = 'Remove temporary demo uploads older than the configured retention period';

    public function handle(): int
    {
        $directory = (string) config('maintenance.temporary_uploads_path');

        if ($directory === '') {
            $this->info('Upload cleanup skipped: the temporary upload directory is not configured.');

            return self::SUCCESS;
        }

        if (! file_exists($directory)) {
            $this->info('Upload cleanup skipped: the temporary upload directory is not configured.');

            return self::SUCCESS;
        }

        if (! is_dir($directory)) {
            $this->error('Upload cleanup failed: the configured temporary upload path is not a directory.');

            return self::FAILURE;
        }

        $result = app(TemporaryUploadStorage::class)->cleanupExpired();

        if ($result['failed'] !== []) {
            $this->error('Upload cleanup failed for: '.implode(', ', $result['failed']));

            return self::FAILURE;
        }

        $this->info("Temporary upload cleanup removed {$result['deleted']} file(s).");

        return self::SUCCESS;
    }
}

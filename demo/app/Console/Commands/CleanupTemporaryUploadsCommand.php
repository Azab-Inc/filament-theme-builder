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

        if (! is_dir($directory)) {
            $this->info('Upload cleanup skipped: the temporary upload directory is not configured.');

            return self::SUCCESS;
        }

        $deleted = app(TemporaryUploadStorage::class)->cleanupExpired();

        $this->info("Temporary upload cleanup removed {$deleted} file(s).");

        return self::SUCCESS;
    }
}

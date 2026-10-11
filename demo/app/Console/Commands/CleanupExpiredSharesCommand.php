<?php

namespace App\Console\Commands;

use App\Models\Share;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;

class CleanupExpiredSharesCommand extends Command
{
    protected $signature = 'shares:cleanup-expired';

    protected $description = 'Remove expired records from the persistent shares database when its schema is available';

    public function handle(): int
    {
        $database = (string) config('maintenance.shares_database');

        if (! is_file($database)) {
            $this->info('Share cleanup skipped: the persistent shares database is not configured.');

            return self::SUCCESS;
        }

        try {
            Config::set('database.connections.shares', [
                'driver' => 'sqlite',
                'database' => $database,
            ]);

            if (! Schema::connection('shares')->hasTable('shares') || ! Schema::connection('shares')->hasColumn('shares', 'expires_at')) {
                throw new \RuntimeException('The shares expiry schema is not available.');
            }
        } catch (\Throwable) {
            $this->info('Share cleanup skipped: the shares expiry schema is not available.');

            return self::SUCCESS;
        }

        try {
            $deleted = Share::on('shares')
                ->whereNotNull('expires_at')
                ->where('expires_at', '<=', now())
                ->delete();
        } catch (\Throwable $exception) {
            $this->error('Share cleanup failed: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->info("Expired share cleanup removed {$deleted} record(s).");

        return self::SUCCESS;
    }
}

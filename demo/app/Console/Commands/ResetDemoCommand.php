<?php

namespace App\Console\Commands;

use App\Support\Demo\DemoResetService;
use Illuminate\Console\Command;
use Throwable;

class ResetDemoCommand extends Command
{
    protected $signature = 'demo:reset';

    protected $description = 'Restore the disposable demo SQLite database from its configured snapshot';

    public function handle(DemoResetService $reset): int
    {
        $snapshot = (string) config('maintenance.demo_snapshot_path', '');
        $database = (string) config('database.connections.'.config('database.default').'.database');
        $lockPath = (string) config('maintenance.demo_reset_lock_path', storage_path('app/private/demo-reset.lock'));

        if ($snapshot === '' || ! is_file($snapshot) || $database === '' || $database === ':memory:') {
            $this->info('Demo reset skipped: DEMO_SNAPSHOT_PATH and a file-backed database are required.');

            return self::SUCCESS;
        }

        try {
            $result = $reset->reset($snapshot, $database, $lockPath);
        } catch (Throwable $exception) {
            $this->error('Demo reset failed: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->info('Demo database reset from the configured snapshot.');
        $this->info("Temporary demo upload cleanup removed {$result['uploads_deleted']} file(s).");

        return self::SUCCESS;
    }
}

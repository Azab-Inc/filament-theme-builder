<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ResetDemoCommand extends Command
{
    protected $signature = 'demo:reset';

    protected $description = 'Restore the disposable demo SQLite database from its configured snapshot';

    public function handle(): int
    {
        $snapshot = (string) config('maintenance.demo_snapshot_path', '');
        $database = (string) config('database.connections.'.config('database.default').'.database');

        if ($snapshot === '' || ! is_file($snapshot) || $database === '' || $database === ':memory:') {
            $this->info('Demo reset skipped: DEMO_SNAPSHOT_PATH and a file-backed database are required.');

            return self::SUCCESS;
        }

        $temporary = $database.'.resetting';

        if (! copy($snapshot, $temporary) || ! rename($temporary, $database)) {
            $this->error('Demo reset failed: snapshot could not be installed atomically.');

            return self::FAILURE;
        }

        $this->info('Demo database reset from the configured snapshot.');

        return self::SUCCESS;
    }
}

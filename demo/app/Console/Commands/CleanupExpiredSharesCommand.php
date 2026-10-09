<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PDO;

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

        $pdo = new PDO('sqlite:'.$database);
        $tableStatement = $pdo->query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'shares'");
        $columnsStatement = $pdo->query('PRAGMA table_info(shares)');

        if ($tableStatement === false || $columnsStatement === false) {
            $this->info('Share cleanup skipped: the shares expiry schema is not available.');

            return self::SUCCESS;
        }

        $table = $tableStatement->fetchColumn();
        $columns = $columnsStatement->fetchAll(PDO::FETCH_ASSOC);

        if ($table !== 'shares') {
            $this->info('Share cleanup skipped: the shares expiry schema is not available.');

            return self::SUCCESS;
        }

        if (! array_filter($columns, fn (array $column): bool => $column['name'] === 'expires_at')) {
            $this->info('Share cleanup skipped: the shares expiry schema is not available.');

            return self::SUCCESS;
        }

        $deleted = $pdo->exec("DELETE FROM shares WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')");
        $this->info("Expired share cleanup removed {$deleted} record(s).");

        return self::SUCCESS;
    }
}

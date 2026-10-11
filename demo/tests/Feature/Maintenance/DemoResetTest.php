<?php

namespace Tests\Feature\Maintenance;

use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class DemoResetTest extends TestCase
{
    private string $database;

    private string $snapshot;

    private string $uploads;

    private string $lock;

    protected function setUp(): void
    {
        parent::setUp();

        $this->database = tempnam(sys_get_temp_dir(), 'demo-db-');
        $this->snapshot = tempnam(sys_get_temp_dir(), 'demo-snapshot-');
        $this->uploads = sys_get_temp_dir().'/demo-uploads-'.bin2hex(random_bytes(6));
        $this->lock = tempnam(sys_get_temp_dir(), 'demo-lock-');

        file_put_contents($this->snapshot, "snapshot\n");
        file_put_contents($this->database, "mutated\n");
        mkdir($this->uploads);
        file_put_contents($this->uploads.'/temporary-upload.pdf', 'temporary');

        Config::set('database.connections.sqlite.database', $this->database);
        Config::set('database.default', 'sqlite');
        Config::set('maintenance.demo_snapshot_path', $this->snapshot);
        Config::set('maintenance.demo_reset_lock_path', $this->lock);
        Config::set('maintenance.temporary_uploads_path', $this->uploads);
    }

    protected function tearDown(): void
    {
        foreach ([$this->database, $this->snapshot, $this->lock] as $path) {
            @unlink($path);
        }

        @unlink($this->uploads.'/temporary-upload.pdf');
        @rmdir($this->uploads);

        parent::tearDown();
    }

    public function test_reset_atomically_restores_the_snapshot_and_cleans_temporary_uploads(): void
    {
        $this->artisan('demo:reset')
            ->expectsOutputToContain('Demo database reset from the configured snapshot.')
            ->expectsOutputToContain('Temporary demo upload cleanup removed 1 file(s).')
            ->assertExitCode(0);

        $this->assertSame("snapshot\n", file_get_contents($this->database));
        $this->assertFileDoesNotExist($this->uploads.'/temporary-upload.pdf');
    }

    public function test_repeated_reset_is_deterministic_and_does_not_touch_persistent_shares(): void
    {
        $shares = tempnam(sys_get_temp_dir(), 'shares-');
        file_put_contents($shares, "persistent share\n");
        Config::set('maintenance.shares_database', $shares);

        try {
            $this->artisan('demo:reset')->assertExitCode(0);
            $first = file_get_contents($this->database);

            file_put_contents($this->database, "different mutation\n");
            $this->artisan('demo:reset')->assertExitCode(0);

            $this->assertSame($first, file_get_contents($this->database));
            $this->assertSame("persistent share\n", file_get_contents($shares));
        } finally {
            @unlink($shares);
        }
    }
}

<?php

namespace Tests\Feature\Uploads;

use Tests\TestCase;

class MaintenanceConfigurationTest extends TestCase
{
    public function test_production_upload_defaults_are_five_mb_twenty_five_mb_five_hundred_mb_and_four_hundred_mb(): void
    {
        $this->assertSame(5 * 1024 * 1024, config('maintenance.temporary_upload_max_bytes'));
        $this->assertSame(25 * 1024 * 1024, config('maintenance.temporary_upload_owner_quota_bytes'));
        $this->assertSame(500 * 1024 * 1024, config('maintenance.temporary_upload_global_limit_bytes'));
        $this->assertSame(400 * 1024 * 1024, config('maintenance.temporary_upload_global_cleanup_bytes'));
    }

    public function test_production_upload_default_is_private_and_not_publicly_served(): void
    {
        $path = (string) config('maintenance.temporary_uploads_path');

        $this->assertSame(storage_path('app/private/tmp'), $path);
        $this->assertStringNotContainsString(storage_path('app/public'), $path);
    }
}

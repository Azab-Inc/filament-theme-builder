<?php

return [
    'demo_snapshot_path' => env('DEMO_SNAPSHOT_PATH', database_path('demo-snapshot.sqlite')),
    'demo_reset_lock_path' => env('DEMO_RESET_LOCK_PATH', storage_path('app/private/demo-reset.lock')),
    'shares_database' => env('SHARES_DATABASE', '/var/lib/shares/shares.sqlite'),
    'temporary_uploads_path' => env('TEMP_UPLOADS_PATH', storage_path('app/private/tmp')),
    'temporary_upload_retention_hours' => (int) env('TEMP_UPLOAD_RETENTION_HOURS', 24),
    'temporary_upload_max_bytes' => (int) env('TEMP_UPLOAD_MAX_BYTES', 5 * 1024 * 1024),
    'temporary_upload_owner_quota_bytes' => (int) env('TEMP_UPLOAD_OWNER_QUOTA_BYTES', 25 * 1024 * 1024),
    'temporary_upload_global_limit_bytes' => (int) env('TEMP_UPLOAD_GLOBAL_LIMIT_BYTES', 500 * 1024 * 1024),
    'temporary_upload_global_cleanup_bytes' => (int) env('TEMP_UPLOAD_GLOBAL_CLEANUP_BYTES', 400 * 1024 * 1024),
];

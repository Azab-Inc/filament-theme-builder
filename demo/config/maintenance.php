<?php

return [
    'demo_snapshot_path' => env('DEMO_SNAPSHOT_PATH', ''),
    'shares_database' => env('SHARES_DATABASE', '/var/lib/shares/shares.sqlite'),
    'temporary_uploads_path' => env('TEMP_UPLOADS_PATH', storage_path('app/public/tmp')),
    'temporary_upload_retention_hours' => (int) env('TEMP_UPLOAD_RETENTION_HOURS', 24),
];

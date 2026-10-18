<?php

return [
    'enabled' => env('FTB_LOCAL_MCP_ENABLED', false),
    'origin' => env('FTB_LOCAL_BUILDER_ORIGIN', 'http://127.0.0.1:4175'),
    'host' => env('FTB_LOCAL_BUILDER_HOST', '127.0.0.1:4175'),
    'storage_path' => env('FTB_LOCAL_RELAY_PATH', sys_get_temp_dir().'/ftb-local-theme-relay'),
    'max_envelope_bytes' => 6_356_992,
    'pairing_seconds' => 300,
    'idle_seconds' => 1800,
    'session_seconds' => 28800,
    'heartbeat_seconds' => 15,
    'lease_seconds' => 45,
    'operation_seconds' => 300,
];

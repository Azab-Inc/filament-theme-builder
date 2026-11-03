<?php

$origin = (string) env('FTB_LOCAL_BUILDER_ORIGIN', env('APP_URL', 'http://127.0.0.1:4175'));
$originParts = parse_url($origin);
$defaultHost = is_array($originParts) && isset($originParts['host'])
    ? $originParts['host'].(isset($originParts['port']) ? ':'.$originParts['port'] : '')
    : '127.0.0.1:4175';

return [
    'enabled' => env('FTB_LOCAL_MCP_ENABLED', false),
    'origin' => $origin,
    'host' => env('FTB_LOCAL_BUILDER_HOST', $defaultHost),
    'storage_path' => env('FTB_LOCAL_RELAY_PATH', sys_get_temp_dir().'/ftb-local-theme-relay'),
    'max_envelope_bytes' => 6_356_992,
    'pairing_seconds' => 300,
    'idle_seconds' => 1800,
    'session_seconds' => 28800,
    'heartbeat_seconds' => 15,
    'lease_seconds' => 45,
    'operation_seconds' => 300,
];

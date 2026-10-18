<?php

return [
    'enabled' => env('FTB_LOCAL_MCP_ENABLED', false),
    'pairing_seconds' => 300,
    'idle_seconds' => 1800,
    'session_seconds' => 28800,
    'heartbeat_seconds' => 15,
    'lease_seconds' => 45,
    'operation_seconds' => 300,
];

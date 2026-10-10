<?php

$allowedOrigins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('FTB_PREVIEW_ALLOWED_ORIGINS', '')),
)));

return [
    'allowed_origins' => $allowedOrigins,
];

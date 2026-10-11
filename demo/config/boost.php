<?php

use App\Mcp\Tools\PreviewTemporaryUpload;

return [
    'mcp' => [
        'tools' => [
            'include' => [
                PreviewTemporaryUpload::class,
            ],
        ],
    ],
];

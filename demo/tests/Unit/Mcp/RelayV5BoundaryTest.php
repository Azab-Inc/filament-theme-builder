<?php

declare(strict_types=1);

namespace Tests\Unit\Mcp;

use App\Mcp\ThemeRelay\OperationResultValidator;
use App\Mcp\ThemeRelay\RelayImportPreviewValidator;
use PHPUnit\Framework\TestCase;

final class RelayV5BoundaryTest extends TestCase
{
    public function test_v5_import_preview_is_accepted_for_current_output(): void
    {
        self::assertTrue(RelayImportPreviewValidator::valid([
            'sourceVersion' => 5, 'targetVersion' => 5, 'migrationPath' => [5], 'displayName' => 'Current',
            'summary' => [], 'payloadDigest' => str_repeat('a', 64), 'byteLength' => 2,
        ]));
    }

    public function test_v5_export_result_is_accepted_for_current_output(): void
    {
        self::assertTrue(OperationResultValidator::valid('export', [
            'version' => 1, 'filename' => 'filament-theme.json', 'schemaVersion' => 5, 'json' => '{}',
        ]));
    }
}

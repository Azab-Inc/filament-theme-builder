<?php

namespace Tests\Feature;

use Tests\TestCase;

class PreviewPaddingCatalogTest extends TestCase
{
    public function test_padding_catalog_is_available_from_the_php_resource_path(): void
    {
        $path = resource_path('theme-registry/filament-padding-targets.json');

        $this->assertFileExists($path);
        $catalog = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame(1, $catalog['version']);
        $this->assertSame('5.9.0', $catalog['compatibility']);
        $this->assertContains('tables.cell.text', array_column($catalog['targets'], 'id'));
    }
}

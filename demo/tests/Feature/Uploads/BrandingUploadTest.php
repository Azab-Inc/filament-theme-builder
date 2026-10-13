<?php

namespace Tests\Feature\Uploads;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BrandingUploadTest extends TestCase
{
    public function test_branding_upload_requires_a_safe_image_and_returns_a_reference(): void
    {
        Storage::fake('local');

        $response = $this->post('/api/branding-assets', [
            'asset' => UploadedFile::fake()->create('logo.png', 10, 'image/png'),
        ]);

        $response->assertOk()->assertJsonPath('reference', fn (mixed $reference): bool => is_string($reference) && preg_match('/^[a-f0-9]{64}\/[a-f0-9]{40}\.png$/', $reference) === 1);
    }

    public function test_branding_upload_rejects_executable_content_and_uses_existing_quota_rules(): void
    {
        $response = $this->post('/api/branding-assets', [
            'asset' => UploadedFile::fake()->create('payload.php', 10, 'application/x-php'),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('asset');
    }
}

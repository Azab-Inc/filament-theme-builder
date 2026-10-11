<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Tools\PreviewTemporaryUpload;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;
use Laravel\Boost\Mcp\Boost;
use Laravel\Boost\Rules\RuleRepository;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Tests\TestCase;

class TemporaryUploadMcpToolTest extends TestCase
{
    use RefreshDatabase;

    private string $directory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->directory = sys_get_temp_dir().'/ftb-mcp-upload-'.bin2hex(random_bytes(6));
        mkdir($this->directory, 0750, true);

        Config::set('maintenance.temporary_uploads_path', $this->directory);
        Config::set('maintenance.temporary_upload_max_bytes', 5 * 1024 * 1024);
        Config::set('maintenance.temporary_upload_owner_quota_bytes', 1024 * 1024);
        Config::set('maintenance.temporary_upload_global_limit_bytes', 500 * 1024);
        Config::set('maintenance.temporary_upload_global_cleanup_bytes', 400 * 1024);
        $this->app->instance(RuleRepository::class, new RuleRepository($this->directory.'/rules'));
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->directory);

        parent::tearDown();
    }

    public function test_preview_requires_authenticated_mcp_owner_and_rejects_override(): void
    {
        $tool = app(PreviewTemporaryUpload::class);

        $this->assertJsonResponse($tool->handle(new Request([
            'operation' => 'preview',
            'filename' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 100,
        ])), 'authentication_required');

        Auth::login(User::factory()->create());

        $this->assertJsonResponse($tool->handle(new Request([
            'operation' => 'preview',
            'filename' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 100,
            'owner' => 'another-owner',
        ])), 'owner_override_not_allowed');
    }

    public function test_boost_registers_the_preview_tool_through_the_installed_mcp_server(): void
    {
        Boost::tools()->assertRegistered(PreviewTemporaryUpload::class);
    }

    public function test_preview_returns_validation_result_and_does_not_mutate_storage(): void
    {
        Auth::login($user = User::factory()->create());
        $tool = app(PreviewTemporaryUpload::class);

        $response = $tool->handle(new Request([
            'operation' => 'preview',
            'filename' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 100,
        ]));

        $payload = $this->responsePayload($response);
        $this->assertTrue($payload['accepted']);
        $this->assertSame($user->getAuthIdentifier(), $payload['owner_id']);
        $this->assertArrayHasKey('confirmation_token', $payload);
        $this->assertSame([], array_values(array_diff(scandir($this->directory) ?: [], ['.', '..'])));
    }

    public function test_preview_rejects_file_content_and_path_inputs(): void
    {
        Auth::login(User::factory()->create());
        $tool = app(PreviewTemporaryUpload::class);

        foreach (['content' => 'bytes', 'base64' => 'encoded', 'path' => '/tmp/file.jpg'] as $field => $value) {
            $this->assertJsonResponse($tool->handle(new Request([
                'operation' => 'preview',
                'filename' => 'photo.jpg',
                'mime_type' => 'image/jpeg',
                'size_bytes' => 100,
                $field => $value,
            ])), 'unsupported_upload_input');
        }

        $this->assertJsonResponse($tool->handle(new Request([
            'operation' => 'preview',
            'filename' => '/tmp/photo.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 100,
        ])), 'unsupported_upload_input');
    }

    public function test_commit_requires_confirmation_then_truthfully_refuses_binary_mutation(): void
    {
        Auth::login(User::factory()->create());
        $tool = app(PreviewTemporaryUpload::class);
        $arguments = [
            'operation' => 'commit',
            'filename' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 100,
        ];

        $this->assertJsonResponse($tool->handle(new Request($arguments)), 'confirmation_required');

        $preview = $this->responsePayload($tool->handle(new Request([
            ...$arguments,
            'operation' => 'preview',
        ])));

        $this->assertJsonResponse($tool->handle(new Request([
            ...$arguments,
            'confirmed' => true,
            'confirmation_token' => $preview['confirmation_token'],
        ])), 'unsupported_upload_input');
        $this->assertSame([], array_values(array_diff(scandir($this->directory) ?: [], ['.', '..'])));
    }

    public function test_commit_rejects_stale_confirmation_token(): void
    {
        Auth::login(User::factory()->create());
        $tool = app(PreviewTemporaryUpload::class);

        $preview = $this->responsePayload($tool->handle(new Request([
            'operation' => 'preview',
            'filename' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 100,
        ])));
        $expired = Crypt::encryptString(json_encode([
            'owner_id' => Auth::id(),
            'filename' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 100,
            'expires_at' => now()->subMinute()->timestamp,
        ], JSON_THROW_ON_ERROR));

        $this->assertNotSame($expired, $preview['confirmation_token']);
        $this->assertJsonResponse($tool->handle(new Request([
            'operation' => 'commit',
            'filename' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 100,
            'confirmed' => true,
            'confirmation_token' => $expired,
        ])), 'confirmation_invalid');
    }

    /** @return array<string, mixed> */
    private function responsePayload(Response $response): array
    {
        $content = $response->content()->toArray()['text'] ?? '';

        return json_decode($content, true, flags: JSON_THROW_ON_ERROR);
    }

    private function assertJsonResponse(Response $response, string $error): void
    {
        $this->assertSame($error, $this->responsePayload($response)['error']);
    }

    private function removeDirectory(string $directory): void
    {
        if (! is_dir($directory)) {
            return;
        }

        foreach (new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        ) as $file) {
            $file->isDir() ? rmdir($file->getPathname()) : unlink($file->getPathname());
        }

        rmdir($directory);
    }
}

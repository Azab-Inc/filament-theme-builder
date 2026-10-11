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

    public function test_actual_boost_stdio_transport_initializes_lists_tool_and_refuses_unauthenticated_call(): void
    {
        [$exitCode, $responses] = $this->runBoostStdio([
            [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => 'initialize',
                'params' => [
                    'protocolVersion' => '2025-11-25',
                    'capabilities' => [],
                    'clientInfo' => ['name' => 'ftb-027-verification', 'version' => '1.0.0'],
                ],
            ],
            [
                'jsonrpc' => '2.0',
                'id' => 2,
                'method' => 'tools/list',
                'params' => [],
            ],
            [
                'jsonrpc' => '2.0',
                'id' => 3,
                'method' => 'tools/call',
                'params' => [
                    'name' => 'showcase_anonymous_upload_preview',
                    'arguments' => [
                        'operation' => 'preview',
                        'filename' => 'photo.jpg',
                        'mime_type' => 'image/jpeg',
                        'size_bytes' => 100,
                        'owner' => 'caller-selected-owner',
                    ],
                ],
            ],
        ]);

        $this->assertSame(0, $exitCode);
        $this->assertSame('2025-11-25', $responses[0]['result']['protocolVersion']);

        $tool = collect($responses[1]['result']['tools'])
            ->firstWhere('name', 'showcase_anonymous_upload_preview');
        $this->assertIsArray($tool);
        $this->assertFalse($tool['inputSchema']['additionalProperties']);
        $this->assertSame(['preview', 'commit'], $tool['inputSchema']['properties']['operation']['enum']);

        $callText = $responses[2]['result']['content'][0]['text'] ?? null;
        $this->assertSame(['error' => 'authentication_required'], json_decode($callText, true, flags: JSON_THROW_ON_ERROR));
    }

    public function test_tool_schema_is_explicit_and_rejects_additional_properties(): void
    {
        $schema = app(PreviewTemporaryUpload::class)->toArray()['inputSchema'];

        $this->assertSame(['preview', 'commit'], $schema['properties']['operation']['enum']);
        $this->assertFalse($schema['additionalProperties']);
        $this->assertSame([
            'operation',
            'filename',
            'mime_type',
            'size_bytes',
        ], $schema['required']);
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

    public function test_preview_rejects_file_content_paths_owner_and_session_override_inputs(): void
    {
        Auth::login(User::factory()->create());
        $tool = app(PreviewTemporaryUpload::class);

        foreach ([
            'content' => 'bytes',
            'base64' => 'encoded',
            'path' => '/tmp/file.jpg',
            'executable' => 'php -r "danger"',
            'extra_field' => 'ignored input must not be accepted',
            'owner' => 'another-owner',
            'session_owner' => 'another-session-owner',
        ] as $field => $value) {
            $this->assertJsonResponse($tool->handle(new Request([
                'operation' => 'preview',
                'filename' => 'photo.jpg',
                'mime_type' => 'image/jpeg',
                'size_bytes' => 100,
                $field => $value,
            ])), in_array($field, ['owner', 'session_owner'], true) ? 'owner_override_not_allowed' : 'unsupported_upload_input');
        }

        $this->assertJsonResponse($tool->handle(new Request([
            'operation' => 'preview',
            'filename' => '/tmp/photo.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 100,
        ])), 'unsupported_upload_input');
    }

    public function test_preview_rejects_missing_or_malformed_argument_types_without_coercion(): void
    {
        Auth::login(User::factory()->create());
        $tool = app(PreviewTemporaryUpload::class);
        $valid = [
            'operation' => 'preview',
            'filename' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 100,
        ];

        foreach ([
            ['operation' => 1],
            ['filename' => ['photo.jpg']],
            ['mime_type' => 42],
            ['size_bytes' => '100'],
            ['size_bytes' => -1],
            ['confirmed' => 'true'],
            ['confirmation_token' => ['token']],
        ] as $invalid) {
            $this->assertJsonResponse($tool->handle(new Request([...$valid, ...$invalid])), 'invalid_arguments');
        }

        $this->assertJsonResponse($tool->handle(new Request([...$valid, 'operation' => 'archive'])), 'invalid_operation');

        foreach (['operation', 'filename', 'mime_type', 'size_bytes'] as $required) {
            $arguments = $valid;
            unset($arguments[$required]);

            $this->assertJsonResponse($tool->handle(new Request($arguments)), 'invalid_arguments');
        }
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

    /**
     * @param  list<array<string, mixed>>  $requests
     * @return array{int, list<array<string, mixed>>}
     */
    private function runBoostStdio(array $requests): array
    {
        $process = proc_open(
            [PHP_BINARY, 'artisan', 'mcp:start', 'laravel-boost'],
            [
                ['pipe', 'r'],
                ['pipe', 'w'],
                ['pipe', 'w'],
            ],
            $pipes,
            base_path(),
            [...getenv(), 'APP_ENV' => 'local', 'APP_DEBUG' => 'false'],
        );

        $this->assertIsResource($process);

        foreach ($requests as $request) {
            fwrite($pipes[0], json_encode($request, JSON_THROW_ON_ERROR).PHP_EOL);
        }
        fclose($pipes[0]);

        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);

        $this->assertSame('', trim($stderr));

        $responses = [];
        foreach (explode(PHP_EOL, trim($stdout)) as $line) {
            if ($line === '') {
                continue;
            }

            try {
                $responses[] = json_decode($line, true, flags: JSON_THROW_ON_ERROR);
            } catch (\JsonException $exception) {
                $this->fail($exception->getMessage().' in stdio output: '.substr($line, 0, 200));
            }
        }

        return [$exitCode, $responses];
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

<?php

namespace App\Mcp\Tools;

use App\Support\Uploads\TemporaryUploadStorage;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Facades\Crypt;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;
use Throwable;

#[IsReadOnly]
final class PreviewTemporaryUpload extends Tool
{
    protected string $name = 'showcase_anonymous_upload_preview';

    protected string $title = 'Preview anonymous demo upload';

    protected string $description = 'Preview a metadata-only anonymous demo upload using the same validation and quota boundary as the UI. This tool never accepts file bytes or filesystem paths and cannot commit uploads because the installed MCP transport has no safe binary upload contract.';

    public function __construct(?TemporaryUploadStorage $storage = null)
    {
        $this->storage = $storage ?? app(TemporaryUploadStorage::class);
    }

    private readonly TemporaryUploadStorage $storage;

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'operation' => $schema->string()->description('Use preview to validate metadata; use commit only to receive the explicit unsupported binary-input response.')->required(),
            'filename' => $schema->string()->max(255)->description('The client filename, not a path.')->required(),
            'mime_type' => $schema->string()->max(127)->description('The declared MIME type.')->required(),
            'size_bytes' => $schema->integer()->min(0)->description('The declared file size in bytes.')->required(),
            'confirmed' => $schema->boolean()->description('Explicit confirmation for a commit attempt.'),
            'confirmation_token' => $schema->string()->max(4096)->description('Opaque token returned by an accepted preview.'),
        ];
    }

    public function handle(Request $request): Response
    {
        if ($request->user() === null) {
            return Response::json(['error' => 'authentication_required']);
        }

        foreach (['owner', 'path', 'filesystem_path', 'content', 'base64', 'data'] as $forbidden) {
            if ($request->get($forbidden) !== null) {
                return Response::json(['error' => $forbidden === 'owner' ? 'owner_override_not_allowed' : 'unsupported_upload_input']);
            }
        }

        $operation = (string) $request->get('operation');
        $filename = (string) $request->get('filename');
        $mime = (string) $request->get('mime_type');
        $size = (int) $request->get('size_bytes');
        $owner = (string) $request->user()->getAuthIdentifier();

        if (str_contains($filename, '/') || str_contains($filename, '\\')) {
            return Response::json(['error' => 'unsupported_upload_input']);
        }

        if (! in_array($operation, ['preview', 'commit'], true)) {
            return Response::json(['error' => 'invalid_operation']);
        }

        if ($operation === 'commit') {
            if ($request->boolean('confirmed') !== true) {
                return Response::json(['error' => 'confirmation_required']);
            }

            if (! $this->confirmationIsValid(
                (string) $request->get('confirmation_token'),
                $owner,
                $filename,
                $mime,
                $size,
            )) {
                return Response::json(['error' => 'confirmation_invalid']);
            }

            return Response::json(['error' => 'unsupported_upload_input']);
        }

        try {
            $preview = $this->storage->preview($filename, $mime, $size, $owner);
        } catch (Throwable $throwable) {
            return Response::json([
                'accepted' => false,
                'error' => 'validation_failed',
                'message' => $this->validationMessage($throwable),
            ]);
        }

        return Response::json([
            ...$preview,
            'owner_id' => $request->user()->getAuthIdentifier(),
            'confirmation_token' => Crypt::encryptString(json_encode([
                'owner_id' => $owner,
                'filename' => $filename,
                'mime_type' => $mime,
                'size_bytes' => $size,
                'expires_at' => now()->addMinutes(5)->timestamp,
            ], JSON_THROW_ON_ERROR)),
        ]);
    }

    private function confirmationIsValid(string $token, string $owner, string $filename, string $mime, int $size): bool
    {
        try {
            $payload = json_decode(Crypt::decryptString($token), true, flags: JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            return false;
        }

        return is_array($payload)
            && ($payload['owner_id'] ?? null) === $owner
            && ($payload['filename'] ?? null) === $filename
            && ($payload['mime_type'] ?? null) === $mime
            && ($payload['size_bytes'] ?? null) === $size
            && is_int($payload['expires_at'] ?? null)
            && $payload['expires_at'] >= now()->timestamp;
    }

    private function validationMessage(Throwable $throwable): string
    {
        return method_exists($throwable, 'errors')
            ? (string) (data_get($throwable->errors(), 'product_image.0') ?? 'The upload metadata was rejected.')
            : 'The upload metadata was rejected.';
    }
}

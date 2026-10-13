<?php

namespace App\Http\Controllers;

use App\Support\Uploads\TemporaryUploadStorage;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

final class PanelBrandingUploadController extends Controller
{
    public function store(Request $request, TemporaryUploadStorage $storage): mixed
    {
        $file = $request->file('asset');
        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages(['asset' => 'A branding image is required.']);
        }
        if (! in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'], true)) {
            throw ValidationException::withMessages(['asset' => 'Branding assets must be JPEG, PNG, or WebP images.']);
        }

        $reference = $storage->store($file, $this->owner($request));

        return response()->json(['reference' => $reference]);
    }

    public function show(string $reference): mixed
    {
        if (! preg_match('/^[a-f0-9]{64}\/[a-f0-9]{40}\.(?:jpg|jpeg|png|webp)$/i', $reference)) {
            abort(404);
        }
        $path = rtrim((string) config('maintenance.temporary_uploads_path'), '/').'/'.$reference;
        if (! is_file($path)) {
            abort(404);
        }

        return response()->file($path, ['Cache-Control' => 'no-store']);
    }

    private function owner(Request $request): string
    {
        $session = $request->hasSession() ? $request->session()->getId() : hash('sha256', $request->userAgent().'|'.$request->ip());

        return $request->ip().'|'.$session;
    }
}

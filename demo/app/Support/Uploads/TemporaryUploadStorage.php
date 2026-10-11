<?php

namespace App\Support\Uploads;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\ValidationException;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

final class TemporaryUploadStorage
{
    /** @var array<string, string> */
    private const ALLOWED_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf',
    ];

    public function store(UploadedFile $file, string $owner): string
    {
        $this->validate($file);

        $ownerDirectory = hash('sha256', $owner);
        $size = (int) $file->getSize();
        $currentOwnerSize = $this->sizeOf($this->rootPath().'/'.$ownerDirectory);

        if (($currentOwnerSize + $size) > (int) config('maintenance.temporary_upload_owner_quota_bytes')) {
            throw ValidationException::withMessages([
                'product_image' => 'Your temporary upload space is full. Remove a file before uploading another.',
            ]);
        }

        $this->makeGlobalRoom($size);

        $mime = $file->getMimeType();
        if (! array_key_exists($mime, self::ALLOWED_TYPES)) {
            throw ValidationException::withMessages([
                'product_image' => 'The upload must be a JPEG, PNG, WebP, or PDF file.',
            ]);
        }

        $extension = self::ALLOWED_TYPES[$mime];
        $relativePath = $ownerDirectory.'/'.sha1(random_bytes(32)).'.'.$extension;
        $absolutePath = $this->rootPath().'/'.$relativePath;
        File::ensureDirectoryExists(dirname($absolutePath), 0750);

        if (! copy($file->getRealPath(), $absolutePath)) {
            throw ValidationException::withMessages([
                'product_image' => 'The upload could not be stored safely. Please try again.',
            ]);
        }

        chmod($absolutePath, 0640);

        return $relativePath;
    }

    public function cleanupExpired(): int
    {
        $cutoff = now()->subHours((int) config('maintenance.temporary_upload_retention_hours'))->getTimestamp();
        $deleted = 0;

        foreach ($this->files() as $file) {
            if ($file->getMTime() <= $cutoff && unlink($file->getPathname())) {
                $deleted++;
            }
        }

        return $deleted;
    }

    private function validate(UploadedFile $file): void
    {
        $mime = $file->getMimeType();
        $extension = strtolower($file->getClientOriginalExtension());
        $expectedExtension = self::ALLOWED_TYPES[$mime] ?? null;
        $extensions = $mime === 'image/jpeg' ? ['jpg', 'jpeg'] : [$expectedExtension];

        if ($expectedExtension === null || ! in_array($extension, $extensions, true)) {
            throw ValidationException::withMessages([
                'product_image' => 'The upload must be a JPEG, PNG, WebP, or PDF file.',
            ]);
        }

        if ((int) $file->getSize() > (int) config('maintenance.temporary_upload_max_bytes')) {
            throw ValidationException::withMessages([
                'product_image' => 'The upload must be 5 MB or smaller.',
            ]);
        }
    }

    private function makeGlobalRoom(int $incomingSize): void
    {
        $currentSize = $this->sizeOf($this->rootPath());
        $limit = (int) config('maintenance.temporary_upload_global_limit_bytes');

        if (($currentSize + $incomingSize) <= $limit) {
            return;
        }

        $target = (int) config('maintenance.temporary_upload_global_cleanup_bytes');
        foreach ($this->filesSortedOldestFirst() as $file) {
            if ($currentSize <= $target) {
                break;
            }

            $currentSize -= $file->getSize();
            unlink($file->getPathname());
        }

        if (($currentSize + $incomingSize) > $limit) {
            throw ValidationException::withMessages([
                'product_image' => 'Temporary upload storage is full. Please try again shortly.',
            ]);
        }
    }

    /** @return list<SplFileInfo> */
    private function files(): array
    {
        if (! is_dir($this->rootPath())) {
            return [];
        }

        $files = [];
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($this->rootPath(), RecursiveDirectoryIterator::SKIP_DOTS)) as $file) {
            if ($file->isFile()) {
                $files[] = $file;
            }
        }

        return $files;
    }

    /** @return list<SplFileInfo> */
    private function filesSortedOldestFirst(): array
    {
        $files = $this->files();
        usort($files, static fn (SplFileInfo $a, SplFileInfo $b): int => $a->getMTime() <=> $b->getMTime());

        return $files;
    }

    private function sizeOf(string $directory): int
    {
        $size = 0;
        foreach ($this->filesIn($directory) as $file) {
            $size += $file->getSize();
        }

        return $size;
    }

    /** @return list<SplFileInfo> */
    private function filesIn(string $directory): array
    {
        if (! is_dir($directory)) {
            return [];
        }

        $files = [];
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)) as $file) {
            if ($file->isFile()) {
                $files[] = $file;
            }
        }

        return $files;
    }

    private function rootPath(): string
    {
        return rtrim((string) config('maintenance.temporary_uploads_path'), '/');
    }
}

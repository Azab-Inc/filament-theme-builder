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
        $this->validateMetadata(
            (string) $file->getClientOriginalName(),
            (string) $file->getMimeType(),
            (int) $file->getSize(),
        );

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

    /**
     * Validate an upload's metadata and quotas without writing or deleting files.
     *
     * @return array{accepted: true, extension: string, owner_bytes: int, global_bytes: int, purge_count: int}
     */
    public function preview(string $filename, string $mime, int $size, string $owner): array
    {
        $extension = $this->validateMetadata($filename, $mime, $size);
        $ownerDirectory = hash('sha256', $owner);
        $ownerBytes = $this->sizeOf($this->rootPath().'/'.$ownerDirectory);
        $ownerLimit = (int) config('maintenance.temporary_upload_owner_quota_bytes');

        if (($ownerBytes + $size) > $ownerLimit) {
            throw ValidationException::withMessages([
                'product_image' => 'Your temporary upload space is full. Remove a file before uploading another.',
            ]);
        }

        [$globalBytes, $purgeCount] = $this->previewGlobalRoom($size);

        return [
            'accepted' => true,
            'extension' => $extension,
            'owner_bytes' => $ownerBytes,
            'global_bytes' => $globalBytes,
            'purge_count' => $purgeCount,
        ];
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

    public function clearAll(): int
    {
        $deleted = 0;

        foreach ($this->files() as $file) {
            if (unlink($file->getPathname())) {
                $deleted++;
            }
        }

        return $deleted;
    }

    private function validateMetadata(string $filename, string $mime, int $size): string
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $expectedExtension = self::ALLOWED_TYPES[$mime] ?? null;
        $extensions = $mime === 'image/jpeg' ? ['jpg', 'jpeg'] : [$expectedExtension];

        if ($expectedExtension === null || ! in_array($extension, $extensions, true)) {
            throw ValidationException::withMessages([
                'product_image' => 'The upload must be a JPEG, PNG, WebP, or PDF file.',
            ]);
        }

        if ($size < 0 || $size > (int) config('maintenance.temporary_upload_max_bytes')) {
            throw ValidationException::withMessages([
                'product_image' => 'The upload must be 5 MB or smaller.',
            ]);
        }

        return $expectedExtension;
    }

    /** @return array{int, int} */
    private function previewGlobalRoom(int $incomingSize): array
    {
        $currentSize = $this->sizeOf($this->rootPath());
        $limit = (int) config('maintenance.temporary_upload_global_limit_bytes');

        if (($currentSize + $incomingSize) <= $limit) {
            return [$currentSize, 0];
        }

        $target = (int) config('maintenance.temporary_upload_global_cleanup_bytes');
        $purgeCount = 0;
        foreach ($this->filesSortedOldestFirst() as $file) {
            if ($currentSize <= $target) {
                break;
            }

            $currentSize -= $file->getSize();
            $purgeCount++;
        }

        if (($currentSize + $incomingSize) > $limit) {
            throw ValidationException::withMessages([
                'product_image' => 'Temporary upload storage is full. Please try again shortly.',
            ]);
        }

        return [$currentSize, $purgeCount];
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

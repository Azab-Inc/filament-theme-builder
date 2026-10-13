<?php

namespace Tests\Feature\Uploads;

use App\Support\Uploads\TemporaryUploadStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class TemporaryUploadStorageTest extends TestCase
{
    use RefreshDatabase;

    private string $directory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->directory = sys_get_temp_dir().'/ftb-upload-'.bin2hex(random_bytes(6));
        mkdir($this->directory, 0750, true);

        Config::set('maintenance.temporary_uploads_path', $this->directory);
        Config::set('maintenance.temporary_upload_max_bytes', 5 * 1024 * 1024);
        Config::set('maintenance.temporary_upload_owner_quota_bytes', 1024 * 1024);
        Config::set('maintenance.temporary_upload_global_limit_bytes', 500 * 1024);
        Config::set('maintenance.temporary_upload_global_cleanup_bytes', 400 * 1024);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->directory);

        parent::tearDown();
    }

    public function test_it_stores_allowed_uploads_with_a_safe_generated_path(): void
    {
        $path = app(TemporaryUploadStorage::class)->store(
            UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg'),
            'anonymous-session',
        );

        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}\/[a-f0-9]{40}\.(jpg|jpeg)$/', $path);
        $this->assertFileExists($this->directory.'/'.$path);
        $this->assertSame(0640, fileperms($this->directory.'/'.$path) & 0777);
    }

    #[DataProvider('allowedUploads')]
    public function test_it_stores_each_allowed_format(string $name, string $mime, string $extension): void
    {
        $path = app(TemporaryUploadStorage::class)->store(
            UploadedFile::fake()->create($name, 1, $mime),
            'anonymous-session',
        );

        $this->assertStringEndsWith('.'.$extension, $path);
        $this->assertFileExists($this->directory.'/'.$path);
    }

    /** @return array<string, array{string, string, string}> */
    public static function allowedUploads(): array
    {
        return [
            'jpeg' => ['photo.jpg', 'image/jpeg', 'jpg'],
            'png' => ['photo.png', 'image/png', 'png'],
            'webp' => ['photo.webp', 'image/webp', 'webp'],
            'pdf' => ['document.pdf', 'application/pdf', 'pdf'],
        ];
    }

    #[DataProvider('disallowedUploads')]
    public function test_it_rejects_disallowed_mime_and_extension_pairs(string $name, string $mime): void
    {
        $this->expectException(ValidationException::class);

        app(TemporaryUploadStorage::class)->store(
            UploadedFile::fake()->create($name, 100, $mime),
            'anonymous-session',
        );
    }

    /** @return array<string, array{string, string}> */
    public static function disallowedUploads(): array
    {
        return [
            'php' => ['payload.php', 'application/x-php'],
            'svg' => ['graphic.svg', 'image/svg+xml'],
            'executable' => ['payload.exe', 'application/x-msdownload'],
        ];
    }

    public function test_it_rejects_files_larger_than_five_megabytes(): void
    {
        $this->expectException(ValidationException::class);

        app(TemporaryUploadStorage::class)->store(
            UploadedFile::fake()->create('large.pdf', 5 * 1024 + 1, 'application/pdf'),
            'anonymous-session',
        );
    }

    public function test_it_enforces_the_anonymous_owner_quota(): void
    {
        Config::set('maintenance.temporary_upload_owner_quota_bytes', 25 * 1024);

        $owner = hash('sha256', 'anonymous-session');
        mkdir($this->directory.'/'.$owner, 0750, true);
        file_put_contents($this->directory.'/'.$owner.'/existing.bin', str_repeat('x', 25 * 1024));

        $this->expectException(ValidationException::class);

        app(TemporaryUploadStorage::class)->store(
            UploadedFile::fake()->create('photo.png', 1, 'image/png'),
            'anonymous-session',
        );
    }

    public function test_it_purges_oldest_files_to_the_bounded_global_cleanup_target(): void
    {
        $owner = hash('sha256', 'anonymous-session');
        mkdir($this->directory.'/'.$owner, 0750, true);
        $old = $this->directory.'/'.$owner.'/old.bin';
        $new = $this->directory.'/'.$owner.'/new.bin';
        file_put_contents($old, str_repeat('o', 120 * 1024));
        file_put_contents($new, str_repeat('n', 390 * 1024));
        touch($old, now()->subHour()->getTimestamp());
        touch($new, now()->getTimestamp());

        app(TemporaryUploadStorage::class)->store(
            UploadedFile::fake()->create('photo.webp', 1, 'image/webp'),
            'anonymous-session',
        );

        $this->assertFileDoesNotExist($old);
        $this->assertFileExists($new);
        $this->assertLessThanOrEqual(400 * 1024 + 1, $this->directorySize());
    }

    public function test_preview_accepts_allowed_metadata_without_mutating_storage(): void
    {
        $before = $this->directorySize();

        $preview = app(TemporaryUploadStorage::class)->preview(
            'photo.jpg',
            'image/jpeg',
            100,
            'anonymous-session',
        );

        $this->assertTrue($preview['accepted']);
        $this->assertSame('jpg', $preview['extension']);
        $this->assertSame($before, $this->directorySize());
        $this->assertSame([], array_values(array_diff(scandir($this->directory) ?: [], ['.', '..'])));
    }

    public function test_preview_rejects_disallowed_metadata(): void
    {
        $this->expectException(ValidationException::class);

        app(TemporaryUploadStorage::class)->preview(
            'graphic.svg',
            'image/svg+xml',
            100,
            'anonymous-session',
        );
    }

    public function test_preview_rejects_size_and_owner_quota_limits(): void
    {
        $this->expectException(ValidationException::class);

        app(TemporaryUploadStorage::class)->preview(
            'large.pdf',
            'application/pdf',
            5 * 1024 * 1024 + 1,
            'anonymous-session',
        );
    }

    public function test_preview_rejects_owner_quota_without_deleting_existing_files(): void
    {
        Config::set('maintenance.temporary_upload_owner_quota_bytes', 25 * 1024);

        $owner = hash('sha256', 'anonymous-session');
        mkdir($this->directory.'/'.$owner, 0750, true);
        file_put_contents($this->directory.'/'.$owner.'/existing.bin', str_repeat('x', 25 * 1024));

        $before = $this->directorySize();

        try {
            app(TemporaryUploadStorage::class)->preview(
                'photo.png',
                'image/png',
                1,
                'anonymous-session',
            );
            $this->fail('Expected the owner quota to be rejected.');
        } catch (ValidationException) {
            $this->assertSame($before, $this->directorySize());
            $this->assertFileExists($this->directory.'/'.$owner.'/existing.bin');
        }
    }

    public function test_cleanup_expired_removes_files_older_than_the_24_hour_retention_window(): void
    {
        $owner = hash('sha256', 'anonymous-session');
        mkdir($this->directory.'/'.$owner, 0750, true);
        $expired = $this->directory.'/'.$owner.'/expired.png';
        $fresh = $this->directory.'/'.$owner.'/fresh.png';
        file_put_contents($expired, 'expired');
        file_put_contents($fresh, 'fresh');
        touch($expired, now()->subHours(25)->getTimestamp());
        touch($fresh, now()->subHours(23)->getTimestamp());

        $result = app(TemporaryUploadStorage::class)->cleanupExpired();

        $this->assertSame(1, $result['deleted']);
        $this->assertFileDoesNotExist($expired);
        $this->assertFileExists($fresh);
    }

    public function test_preview_reports_global_cleanup_without_performing_it(): void
    {
        $owner = hash('sha256', 'anonymous-session');
        mkdir($this->directory.'/'.$owner, 0750, true);
        $old = $this->directory.'/'.$owner.'/old.bin';
        $new = $this->directory.'/'.$owner.'/new.bin';
        file_put_contents($old, str_repeat('o', 120 * 1024));
        file_put_contents($new, str_repeat('n', 390 * 1024));
        touch($old, now()->subHour()->getTimestamp());
        touch($new, now()->getTimestamp());

        $preview = app(TemporaryUploadStorage::class)->preview(
            'photo.webp',
            'image/webp',
            1,
            'anonymous-session',
        );

        $this->assertSame(1, $preview['purge_count']);
        $this->assertFileExists($old);
        $this->assertFileExists($new);
    }

    private function directorySize(): int
    {
        $size = 0;
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($this->directory)) as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $size;
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

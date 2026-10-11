<?php

namespace Tests\Feature\Uploads;

use App\Support\Uploads\TemporaryUploadStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Validation\ValidationException;
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

    public function test_it_rejects_disallowed_mime_and_extension_pairs(): void
    {
        $this->expectException(ValidationException::class);

        app(TemporaryUploadStorage::class)->store(
            UploadedFile::fake()->create('payload.php', 100, 'application/x-php'),
            'anonymous-session',
        );
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

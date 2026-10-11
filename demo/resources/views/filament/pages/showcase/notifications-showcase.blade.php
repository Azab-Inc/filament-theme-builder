<x-filament-panels::page>
    <div class="space-y-6">
        <section aria-label="Notification fixtures" class="grid gap-4 md:grid-cols-2">
            @foreach ([
                ['title' => 'Success notification', 'body' => 'A successful local fixture event.', 'class' => 'text-success-600'],
                ['title' => 'Danger notification', 'body' => 'A dangerous local fixture event.', 'class' => 'text-danger-600'],
                ['title' => 'Warning notification', 'body' => 'A warning local fixture event.', 'class' => 'text-warning-600'],
                ['title' => 'Info notification', 'body' => 'An informational local fixture event.', 'class' => 'text-info-600'],
            ] as $notification)
                <article role="status" aria-label="{{ $notification['title'] }}" class="rounded-xl border border-gray-200 p-4 dark:border-white/10">
                    <h2 class="font-semibold {{ $notification['class'] }}">{{ $notification['title'] }}</h2>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ $notification['body'] }}</p>
                </article>
            @endforeach
            <article role="status" aria-label="Persistent fixture notification" class="rounded-xl border border-gray-200 p-4 dark:border-white/10">
                <h2 class="font-semibold">Persistent fixture notification</h2>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">This fixture uses the native persistent notification API.</p>
            </article>
            <article role="status" aria-label="Transient fixture notification" class="rounded-xl border border-gray-200 p-4 dark:border-white/10">
                <h2 class="font-semibold">Transient fixture notification</h2>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">This fixture uses the native transient notification API.</p>
            </article>
        </section>
        <p role="status" aria-live="polite">Last notification: {{ $lastNotification }}</p>
    </div>
</x-filament-panels::page>

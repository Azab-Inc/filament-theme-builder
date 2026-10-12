<x-filament-panels::page>
    @php
        $sidebar = \App\Filament\Pages\Showcase\ShowcaseSidebarNavigation::class;
        $search = \App\Filament\Pages\Showcase\GlobalSearchSurface::class;
        $profile = \App\Filament\Pages\Showcase\ProfileMenuSurface::class;
        $login = \App\Filament\Pages\Showcase\LoginSurface::class;
        $tenant = \App\Filament\Pages\Showcase\TenantSwitcherSurface::class;
        $resourceIcons = \App\Filament\Pages\Showcase\ResourceIconSet::items();
        $badges = \App\Filament\Pages\Showcase\RepresentativeBadgeSet::items();
    @endphp
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <x-filament::section
            heading="Native showcase surfaces"
            description="Explore the real Filament pages already registered in this panel."
        >
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <x-filament::button tag="a" :href="\App\Filament\Pages\Showcase\FormsShowcase::getUrl()" outlined>
                    Forms &amp; Schemas
                </x-filament::button>
                <x-filament::button tag="a" :href="\App\Filament\Pages\Showcase\TablesShowcase::getUrl()" outlined>
                    Tables
                </x-filament::button>
                <x-filament::button tag="a" :href="\App\Filament\Pages\Showcase\InfolistsShowcase::getUrl()" outlined>
                    Infolists
                </x-filament::button>
                <x-filament::button tag="a" :href="\App\Filament\Pages\Showcase\ActionsShowcase::getUrl()" outlined>
                    Actions &amp; Modals
                </x-filament::button>
                <x-filament::button tag="a" :href="\App\Filament\Pages\Showcase\NotificationsShowcase::getUrl()" outlined>
                    Notifications
                </x-filament::button>
                <x-filament::button tag="a" :href="\App\Filament\Pages\Showcase\DemoShowcaseDashboard::getUrl()">
                    Dashboard
                </x-filament::button>
            </div>
        </x-filament::section>

        <x-filament::section
            heading="Panel controls"
            description="Native navigation, search, profile, and authentication controls remain available in the panel shell."
        >
            <div class="space-y-4 text-sm text-gray-600 dark:text-gray-300" role="region" aria-label="Showcase navigation surfaces">
                <section aria-label="Global search surface">
                    <strong class="text-gray-950 dark:text-white">Search:</strong>
                    press {{ $search::keyboardHint() }} to search for {{ $search::exampleQuery() }}.
                </section>
                <section aria-label="Profile menu surface">
                    <strong class="text-gray-950 dark:text-white">Profile:</strong>
                    the topbar user menu exposes {{ implode(' and ', $profile::actions()) }}.
                </section>
                <section aria-label="Login surface">
                    <strong class="text-gray-950 dark:text-white">Authentication:</strong>
                    focused pages use the existing login; {{ $login::credentialHint() }}.
                </section>
                <section aria-label="Sidebar navigation surface">
                    <strong class="text-gray-950 dark:text-white">Sidebar:</strong>
                    {{ $sidebar::description() }}
                </section>
            </div>
        </x-filament::section>

        <x-filament::section heading="Resource icon set" description="Representative resource icons from the existing panel navigation.">
            <div class="fi-ftb-resource-icon-set grid grid-cols-2 gap-3 sm:grid-cols-4" role="region" aria-label="Resource icon set">
                @foreach ($resourceIcons as $resource)
                    <div class="flex items-center gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        <x-filament::icon :icon="$resource['icon']" class="h-5 w-5" :aria-label="$resource['label'].' icon'" />
                        <span>{{ $resource['label'] }}</span>
                    </div>
                @endforeach
            </div>
        </x-filament::section>

        <x-filament::section heading="Representative badges" description="Stable badge variants used by the deterministic commerce fixtures.">
            <div class="fi-ftb-representative-badge-set flex flex-wrap gap-2" role="region" aria-label="Representative badge set">
                @foreach ($badges as $badge)
                    <x-filament::badge :color="$badge['color']">{{ $badge['label'] }}</x-filament::badge>
                @endforeach
            </div>
        </x-filament::section>

        <x-filament::section
            heading="Demo lifecycle"
            aria-label="Demo reset notice"
            description="Demo data resets every 10 minutes."
        >
            <p class="text-sm text-gray-600 dark:text-gray-300">
                Changes to showcase records and temporary uploads are disposable. Persistent shared themes are kept separately.
            </p>
        </x-filament::section>

        <x-filament::section
            heading="Controlled tenant presentation"
            description="A safe presentation-only fixture for a future tenant switcher."
            class="lg:col-span-2"
        >
            <div role="region" aria-label="Controlled tenant presentation" data-tenant-persistence="none" class="fi-ftb-tenant-switcher space-y-3">
                <p class="text-sm text-gray-600 dark:text-gray-300">Demo workspace · Presentation only</p>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                    {{ $tenant::persistencePolicy() }}
                </p>
                <div class="flex flex-wrap gap-2" aria-label="Controlled tenant options">
                    @foreach ($tenant::options() as $option)
                        <x-filament::badge :color="$loop->first ? 'primary' : 'gray'">{{ $option }}</x-filament::badge>
                    @endforeach
                </div>
            </div>
        </x-filament::section>
    </div>
</x-filament-panels::page>

<x-filament-panels::page>
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
                <x-filament::button tag="a" :href="\Filament\Pages\Dashboard::getUrl()">
                    Dashboard
                </x-filament::button>
            </div>
        </x-filament::section>

        <x-filament::section
            heading="Panel controls"
            description="Native navigation, search, profile, and authentication controls remain available in the panel shell."
        >
            <ul class="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li><strong class="text-gray-950 dark:text-white">Search:</strong> press Ctrl K to open global search.</li>
                <li><strong class="text-gray-950 dark:text-white">Profile:</strong> use the topbar user menu to open Profile or Sign out.</li>
                <li><strong class="text-gray-950 dark:text-white">Authentication:</strong> focused showcase pages require the seeded demo credentials.</li>
                <li><strong class="text-gray-950 dark:text-white">Sidebar:</strong> collapse the desktop sidebar to inspect icon-only navigation and badges.</li>
            </ul>
        </x-filament::section>

        <x-filament::section
            heading="Controlled tenant presentation"
            description="A safe presentation-only fixture for a future tenant switcher."
            class="lg:col-span-2"
        >
            <div role="region" aria-label="Controlled tenant presentation" class="space-y-3">
                <p class="text-sm text-gray-600 dark:text-gray-300">Demo workspace · Presentation only</p>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                    No tenant is persisted, switched, or used for authorization in this preview.
                </p>
                <div class="flex flex-wrap gap-2" aria-label="Controlled tenant options">
                    <x-filament::badge color="primary">Demo workspace</x-filament::badge>
                    <x-filament::badge color="gray">Read-only preview</x-filament::badge>
                </div>
            </div>
        </x-filament::section>
    </div>
</x-filament-panels::page>

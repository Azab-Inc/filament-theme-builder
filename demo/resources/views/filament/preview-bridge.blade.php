<script id="ftb-preview-bridge">
    (() => {
        const configuredOrigins = @json(config('preview.allowed_origins'));
        const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : [window.location.origin];
        const palette = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
        const styleId = 'ftb-managed-theme';

        function updateTheme(message) {
            if (message?.type !== 'ftb:theme:update' || message.schemaVersion !== 1 ||
                message.theme?.schemaVersion !== 1 || !/^#[\da-f]{6}$/i.test(message.theme?.colors?.primary ?? '')) {
                return false;
            }

            const hex = message.theme.colors.primary;
            const channels = hex.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16));
            const style = document.getElementById(styleId) ?? document.createElement('style');
            style.id = styleId;
            style.textContent = `:root { --ftb-primary: ${hex}; ${palette.map((shade, index) => {
                const base = Math.round(255 * (10 - index) / 10);
                const rgb = channels.map((channel) => Math.round(channel * index / 10 + base));
                return `--primary-${shade}: rgb(${rgb.join(' ')});`;
            }).join(' ')} }`;
            document.head.append(style);
            window.dispatchEvent(new CustomEvent('ftb:theme:updated', { detail: message.theme }));
            return true;
        }

    window.addEventListener('message', (event) => {
        if (!allowedOrigins.includes(event.origin) || event.source !== window.parent) {
            return;
        }

        if (updateTheme(event.data)) {
            window.dispatchEvent(new CustomEvent('ftb:preview-message-accepted'));
        }
    });
    })();
</script>

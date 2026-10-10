<script id="ftb-preview-bridge">
    window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin || event.source !== window.parent) {
            return;
        }

        // FTB-003 adds protocol handling; this event only signals that trust checks passed.
        window.dispatchEvent(new CustomEvent('ftb:preview-message-accepted'));
    });
</script>

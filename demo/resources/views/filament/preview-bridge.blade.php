<script id="ftb-preview-bridge">
    window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin || event.source !== window.parent) {
            return;
        }

        // FTB-003 owns protocol behavior; this FTB-002 hook intentionally processes no messages.
    });
</script>

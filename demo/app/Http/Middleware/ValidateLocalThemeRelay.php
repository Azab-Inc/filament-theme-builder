<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class ValidateLocalThemeRelay
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            return $this->validateAndForward($request, $next);
        } catch (Throwable) {
            return response()->json(['error' => 'relay_unavailable'], 503);
        }
    }

    private function validateAndForward(Request $request, Closure $next): Response
    {
        $bootstrap = $request->is('local-theme/relay/bootstrap');
        if (! config('local-theme-relay.enabled') || ! app()->environment(['local', 'testing'])) {
            return response()->json(['error' => 'relay_unavailable'], 404);
        }
        if ((string) $request->headers->get('Host') !== (string) config('local-theme-relay.host')
            || ! $request->hasSession() || strlen((string) $request->header('X-FTB-Tab-Key')) > 128) {
            return response()->json(['error' => 'relay_unavailable'], 403);
        }
        if (! $bootstrap && ! $request->cookies->has((string) config('session.cookie'))) {
            return response()->json(['error' => 'relay_unavailable'], 403);
        }
        if (! $this->sameOrigin($request)) {
            return response()->json(['error' => 'relay_unavailable'], 403);
        }
        if ($request->isMethod('post') && ! hash_equals($request->session()->token(), (string) $request->header('X-CSRF-TOKEN'))) {
            return response()->json(['error' => 'relay_unavailable'], 403);
        }
        if ($request->isMethod('post') && ! $request->isJson()) {
            return response()->json(['error' => 'invalid_request'], 415);
        }
        if ($request->isMethod('post') && (int) $request->header('Content-Length', '0') > (int) config('local-theme-relay.max_envelope_bytes')
            || $request->isMethod('post') && strlen($request->getContent()) > (int) config('local-theme-relay.max_envelope_bytes')) {
            return response()->json(['error' => 'relay_request_too_large'], 413);
        }
        if (! $bootstrap && ! preg_match('/\A[a-f0-9]{64}\z/', (string) $request->header('X-FTB-Tab-Key'))) {
            return response()->json(['error' => 'relay_unavailable'], 403);
        }
        if (! $this->withinRateLimit($request)) {
            return response()->json(['error' => 'relay_rate_limited'], 429);
        }

        return $next($request);
    }

    private function sameOrigin(Request $request): bool
    {
        $origin = (string) config('local-theme-relay.origin');
        if ($request->headers->has('Origin')) {
            return hash_equals($origin, (string) $request->header('Origin'));
        }
        $referer = parse_url((string) $request->header('Referer'));
        if (is_array($referer) && isset($referer['scheme'], $referer['host'])
            && ! isset($referer['user'], $referer['pass'])) {
            $refererOrigin = $referer['scheme'].'://'.$referer['host']
                .(isset($referer['port']) ? ':'.$referer['port'] : '');

            return hash_equals($origin, $refererOrigin);
        }

        return $request->header('Sec-Fetch-Site') === 'same-origin';
    }

    private function withinRateLimit(Request $request): bool
    {
        $now = time();
        $bucket = (int) floor($now / 60);
        $rate = $request->session()->get('local-theme-relay-rate', ['bucket' => $bucket, 'count' => 0]);
        $count = ($rate['bucket'] ?? null) === $bucket ? (int) ($rate['count'] ?? 0) + 1 : 1;
        $request->session()->put('local-theme-relay-rate', ['bucket' => $bucket, 'count' => $count]);

        return $count <= 120;
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SupportChatProxyController extends Controller
{
    /**
     * Public chat (no login required):
     * - forwards to bookingtocbs /api/ai/support-chat/public
     */
    public function publicChat(Request $request)
    {
        $data = $request->validate([
            'message' => ['required','string','max:2000'],
            'conversation_id' => ['nullable','string','max:80'],
            'page_context' => ['nullable','string','max:200'],
        ]);

        $baseUrl = (string) config('services.bookingtocbs.base_url');
        $apiKey  = (string) config('services.bookingtocbs.joli_api_key');

        if ($baseUrl === '' || $apiKey === '') {
            return response()->json(['message' => 'Support chat is not configured'], 500);
        }

        $conversationId = $data['conversation_id'] ?: Str::uuid()->toString();

        $resp = Http::timeout(30)
            ->acceptJson()
            ->withHeaders([
                'X-JOLI-API-KEY' => $apiKey,
            ])
            ->post($baseUrl . '/api/ai/support-chat/public', [
                'message' => $data['message'],
                'conversation_id' => $conversationId,
                'page_context' => $data['page_context'] ?? null,
            ]);

        if (!$resp->ok()) {
            return response()->json([
                'message' => 'Support is temporarily unavailable',
            ], 502);
        }

        return response()->json($resp->json());
    }

    /**
     * Private chat (requires auth):
     * - forwards to bookingtocbs /api/ai/support-chat
     * - injects customer email header so bookingtocbs can answer booking status
     */
    public function chat(Request $request)
    {
        $data = $request->validate([
            'message' => ['required','string','max:2000'],
            'conversation_id' => ['nullable','string','max:80'],
            'page_context' => ['nullable','string','max:200'],
        ]);

        $user = $request->user();
        $email = $user?->email;

        if (!$email) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $baseUrl = (string) config('services.bookingtocbs.base_url');
        $apiKey  = (string) config('services.bookingtocbs.joli_api_key');

        if ($baseUrl === '' || $apiKey === '') {
            return response()->json(['message' => 'Support chat is not configured'], 500);
        }

        $conversationId = $data['conversation_id'] ?: Str::uuid()->toString();

        $resp = Http::timeout(30)
            ->acceptJson()
            ->withHeaders([
                'X-JOLI-API-KEY' => $apiKey,
                'X-CUSTOMER-EMAIL' => $email,
            ])
            ->post($baseUrl . '/api/ai/support-chat', [
                'message' => $data['message'],
                'conversation_id' => $conversationId,
                'page_context' => $data['page_context'] ?? null,
            ]);

        if (!$resp->ok()) {
            return response()->json([
                'message' => 'Support is temporarily unavailable',
            ], 502);
        }

        return response()->json($resp->json());
    }
}

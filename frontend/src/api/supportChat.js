import { AUTH_API } from "./axios";

/**
 * Public chat (works even if user is not logged in)
 */
export async function supportChatPublic({ message, conversation_id, page_context }) {
  const res = await AUTH_API.post(
    "/api/support/chat/public",
    { message, conversation_id, page_context },
    { withCredentials: true }
  );
  return res.data;
}

/**
 * Private chat (requires logged-in user)
 * - can answer booking status because auth backend injects customer email
 */
export async function supportChatPrivate({ message, conversation_id, page_context }) {
  const res = await AUTH_API.post(
    "/api/support/chat",
    { message, conversation_id, page_context },
    { withCredentials: true }
  );
  return res.data;
}

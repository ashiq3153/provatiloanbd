import { supabase } from './supabase';

type ChatAction = 'get_messages' | 'send_message' | 'mark_seen';

async function callChatGateway<T>(chatAction: ChatAction, payload: Record<string, unknown> = {}): Promise<T | null> {
  const telegramWebApp = (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
  const initData = telegramWebApp?.initData;
  if (!initData) {
    console.error('Chat gateway: Telegram initData is missing');
    return null;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.access_token) {
    console.error('Chat gateway: authenticated session is missing', sessionError);
    return null;
  }

  const response = await fetch('/api/telegram-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      initData,
      accessToken: sessionData.session.access_token,
      action: 'chat',
      chatAction,
      payload,
    }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    console.error('Chat gateway request failed:', result?.error || response.statusText);
    return null;
  }
  return result.data as T;
}

export async function getMyChatMessages<T = any[]>(): Promise<T> {
  return (await callChatGateway<T>('get_messages')) || ([] as unknown as T);
}

export async function sendMyChatMessage(message: string, replyTo?: string | null, attachmentUrl?: string | null): Promise<boolean> {
  return (await callChatGateway<boolean>('send_message', { message, replyTo: replyTo || null, attachmentUrl: attachmentUrl || null })) === true;
}

export async function markMyChatMessagesSeen(ids: string[]): Promise<boolean> {
  if (!ids.length) return true;
  return (await callChatGateway<boolean>('mark_seen', { ids })) === true;
}

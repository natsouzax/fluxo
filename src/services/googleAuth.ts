import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { AgendaEvent } from '../data/types';

WebBrowser.maybeCompleteAuthSession();

// Google Calendar integration.
//
// This is real OAuth wiring, but it needs a Google Cloud OAuth client that
// only the app owner can create (Google Cloud Console -> APIs & Services ->
// Credentials -> OAuth client ID -> Android, using this app's package name
// and SHA-1). Once you have it, drop the client id in app.json under
// `expo.extra.googleOAuthClientId` (see README "Conectando o Google").
// Until then, `hasGoogleClientId()` returns false and the Connections screen
// shows the feature as "em breve" instead of a broken button.

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
];

export function getGoogleClientId(): string | undefined {
  // Resolved lazily to avoid importing app.json config at module init time
  // in environments (like Jest) where expo-constants isn't mocked.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Constants = require('expo-constants').default;
  const configured = Constants.expoConfig?.extra?.googleOAuthClientId;
  // Must be a non-empty string: a placeholder like `{}` or `""` in app.json is
  // truthy/defined but would send a malformed client_id to Google.
  return typeof configured === 'string' && configured.trim() ? configured.trim() : undefined;
}

export function hasGoogleClientId(): boolean {
  return Boolean(getGoogleClientId());
}

export function useGoogleAuthRequest() {
  const clientId = getGoogleClientId();
  return AuthSession.useAuthRequest(
    {
      clientId: clientId ?? 'missing-client-id',
      scopes: SCOPES,
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'fluxo' }),
      responseType: AuthSession.ResponseType.Token,
    },
    discovery
  );
}

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  status?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

export async function fetchCalendarEvents(accessToken: string, from: Date, until: Date): Promise<GoogleCalendarEvent[]> {
  const items: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      timeMin: from.toISOString(), timeMax: until.toISOString(),
      maxResults: '250', singleEvents: 'true', orderBy: 'startTime',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 401) throw new Error('A sessão Google expirou. Reconecte em Ajustes.');
    if (!res.ok) throw new Error(`Falha ao atualizar Google Calendar (${res.status}).`);
    const data: { items?: GoogleCalendarEvent[]; nextPageToken?: string } = await res.json();
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items.filter((item) => item.status !== 'cancelled' && item.start && item.end);
}

export function toAgendaEvents(items: GoogleCalendarEvent[]): AgendaEvent[] {
  return items.flatMap((item) => {
    const start = item.start?.dateTime ?? item.start?.date;
    const end = item.end?.dateTime ?? item.end?.date;
    if (!start || !end) return [];
    return [{
      id: `google:${item.id}`,
      title: item.summary?.trim() || 'Evento sem título',
      start, end, source: 'google' as const,
      notes: item.description?.trim(),
      location: item.location?.trim(),
      url: item.htmlLink,
    }];
  });
}

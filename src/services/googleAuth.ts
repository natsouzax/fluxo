import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Google Calendar, Gmail and Drive integration.
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
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

export function getGoogleClientId(): string | undefined {
  // Resolved lazily to avoid importing app.json config at module init time
  // in environments (like Jest) where expo-constants isn't mocked.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Constants = require('expo-constants').default;
  return Constants.expoConfig?.extra?.googleOAuthClientId;
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

export async function fetchUpcomingCalendarEvents(accessToken: string) {
  const now = new Date().toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=10&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Google Calendar error (${res.status})`);
  const data = await res.json();
  return data.items ?? [];
}

export async function fetchRecentFinanceEmails(accessToken: string) {
  const query = encodeURIComponent('fatura OR boleto OR pagamento OR recibo');
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Gmail error (${res.status})`);
  const data = await res.json();
  return data.messages ?? [];
}

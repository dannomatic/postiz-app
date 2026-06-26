// Thin client for the GoHighLevel (LeadConnector) Social Planner API.
// All GHL request/response shape lives here so field-name tweaks against the
// live API are a single-file change.

const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

function ghlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: GHL_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export interface GhlAccount {
  id: string;
  platform: string; // normalized lowercase, e.g. 'facebook', 'instagram'
  name?: string;
}

// GET /social-media-posting/:locationId/accounts
export async function ghlListAccounts(
  locationId: string,
  token: string
): Promise<GhlAccount[]> {
  const res = await fetch(
    `${GHL_BASE}/social-media-posting/${locationId}/accounts`,
    { headers: ghlHeaders(token) }
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GHL accounts ${res.status}: ${text}`);
  }
  const data = text ? JSON.parse(text) : {};
  const accounts = data?.accounts || data?.results?.accounts || [];
  return accounts.map((a: any) => ({
    id: a.id || a._id,
    platform: String(a.platform || a.type || '').toLowerCase(),
    name: a.name,
  }));
}

export interface GhlUser {
  id: string;
  name?: string;
  email?: string;
}

// GET /users/?locationId=... — used to resolve the GHL user that authors posts
// (createPost requires a userId). Requires the token to have users.readonly.
export async function ghlListUsers(
  locationId: string,
  token: string
): Promise<GhlUser[]> {
  const res = await fetch(
    `${GHL_BASE}/users/?locationId=${encodeURIComponent(locationId)}`,
    { headers: ghlHeaders(token) }
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GHL users ${res.status}: ${text}`);
  }
  const data = text ? JSON.parse(text) : {};
  return (data?.users || []).map((u: any) => ({
    id: u.id || u._id,
    name: u.name,
    email: u.email,
  }));
}

export interface GhlCreatePostInput {
  accountIds: string[];
  summary: string;
  media?: { url: string; type?: string }[];
  scheduleDate: string; // ISO 8601
  userId: string; // required by GHL — the authoring user
}

// POST /social-media-posting/:locationId/posts
export async function ghlCreatePost(
  locationId: string,
  token: string,
  input: GhlCreatePostInput
) {
  const body: Record<string, any> = {
    accountIds: input.accountIds,
    summary: input.summary,
    type: 'post', // GHL enum: post | story | reel
    status: 'scheduled', // GHL enum: draft | scheduled | published | ...
    scheduleDate: input.scheduleDate,
    userId: input.userId,
  };
  if (input.media?.length) {
    body.media = input.media;
  }

  const res = await fetch(
    `${GHL_BASE}/social-media-posting/${locationId}/posts`,
    {
      method: 'POST',
      headers: ghlHeaders(token),
      body: JSON.stringify(body),
    }
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GHL createPost ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

import { HttpException, Injectable } from '@nestjs/common';
import { GhlRepository } from '@gitroom/nestjs-libraries/database/prisma/ghl/ghl.repository';
import { TemplatesService } from '@gitroom/nestjs-libraries/database/prisma/templates/templates.service';
import {
  ghlCreatePost,
  ghlListAccounts,
  ghlListUsers,
} from '@gitroom/nestjs-libraries/integrations/ghl/ghl.client';

// Map Postiz provider identifiers to GHL social platform names.
const PLATFORM_MAP: Record<string, string> = {
  facebook: 'facebook',
  instagram: 'instagram',
  linkedin: 'linkedin',
  x: 'twitter',
  twitter: 'twitter',
  tiktok: 'tiktok',
  youtube: 'youtube',
  pinterest: 'pinterest',
  google: 'google',
  gmb: 'google',
};

function toGhlPlatform(providerIdentifier?: string): string | undefined {
  if (!providerIdentifier) return undefined;
  const base = providerIdentifier.replace(/-(page|standalone)$/, '');
  return PLATFORM_MAP[base] || PLATFORM_MAP[providerIdentifier];
}

function stripHtml(s?: string): string {
  return (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class GhlService {
  constructor(
    private _ghlRepository: GhlRepository,
    private _templatesService: TemplatesService
  ) {}

  async getConnection(orgId: string, customerId: string) {
    const conn = await this._ghlRepository.getByCustomer(orgId, customerId);
    if (!conn) {
      return { connected: false };
    }
    let accounts: any[] = [];
    try {
      accounts = JSON.parse(conn.accountsCache || '[]');
    } catch {
      accounts = [];
    }
    return { connected: true, locationId: conn.locationId, accounts };
  }

  async setConnection(
    orgId: string,
    customerId: string,
    locationId: string,
    token: string,
    userId?: string
  ) {
    // Validates the token + location by listing the sub-account's accounts.
    const accounts = await ghlListAccounts(locationId, token);

    // createPost requires a GHL authoring user; auto-detect one if not provided.
    let resolvedUserId = userId?.trim() || null;
    if (!resolvedUserId) {
      try {
        const users = await ghlListUsers(locationId, token);
        resolvedUserId = users[0]?.id || null;
      } catch {
        resolvedUserId = null; // token may lack users.readonly; user can set it manually
      }
    }

    await this._ghlRepository.upsert(
      orgId,
      customerId,
      locationId,
      token,
      resolvedUserId,
      JSON.stringify(accounts)
    );
    return { connected: true, accounts, userId: resolvedUserId };
  }

  removeConnection(orgId: string, customerId: string) {
    return this._ghlRepository.remove(orgId, customerId);
  }

  async scheduleTemplate(orgId: string, templateId: string, date: string) {
    const template = await this._templatesService.getTemplate(orgId, templateId);
    if (!template) {
      throw new HttpException('Template not found', 404);
    }
    if (!template.customerId) {
      throw new HttpException(
        'This library item has no client, so it cannot be scheduled to GoHighLevel.',
        400
      );
    }

    const conn = await this._ghlRepository.getByCustomer(
      orgId,
      template.customerId
    );
    if (!conn) {
      throw new HttpException(
        'This client is not connected to GoHighLevel.',
        400
      );
    }
    if (!conn.userId) {
      throw new HttpException(
        'No GoHighLevel authoring user is set for this client. Reconnect with a token that has the users.readonly scope, or provide a User ID.',
        400
      );
    }

    // Refresh the sub-account's connected accounts (fall back to cache).
    let accounts: any[] = [];
    try {
      accounts = await ghlListAccounts(conn.locationId, conn.token);
      await this._ghlRepository.updateAccountsCache(
        conn.id,
        JSON.stringify(accounts)
      );
    } catch {
      try {
        accounts = JSON.parse(conn.accountsCache || '[]');
      } catch {
        accounts = [];
      }
    }

    const posts = template.payload?.posts || [];
    const ids = posts
      .map((p: any) => p.integration?.id)
      .filter(Boolean) as string[];
    const integMap = await this._ghlRepository.getIntegrationsMap(orgId, ids);

    const scheduleDate = new Date(date).toISOString();
    const scheduled: string[] = [];
    const skipped: string[] = [];

    for (const p of posts) {
      const provider = integMap.get(p.integration?.id);
      const ghlPlatform = toGhlPlatform(provider);
      const match = ghlPlatform
        ? accounts.find((a) => a.platform === ghlPlatform)
        : undefined;

      const label = provider || p.integration?.id || 'unknown';
      if (!match) {
        // Postiz channel has no matching connected account on the GHL side.
        skipped.push(label);
        continue;
      }

      const value0 = p.value?.[0] || {};
      const summary = stripHtml(value0.content);
      const media = (value0.image || [])
        .map((m: any) => ({ url: m.path }))
        .filter((m: any) => !!m.url);

      try {
        await ghlCreatePost(conn.locationId, conn.token, {
          accountIds: [match.id],
          summary,
          media,
          scheduleDate,
          userId: conn.userId,
        });
        scheduled.push(label);
      } catch (e: any) {
        skipped.push(`${label} (error: ${e?.message || 'failed'})`);
      }
    }

    return { scheduled, skipped };
  }
}

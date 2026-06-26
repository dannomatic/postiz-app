import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GhlRepository {
  constructor(
    private _ghl: PrismaRepository<'ghlConnection'>,
    private _integration: PrismaRepository<'integration'>
  ) {}

  getByCustomer(orgId: string, customerId: string) {
    return this._ghl.model.ghlConnection.findFirst({
      where: { orgId, customerId, deletedAt: null },
    });
  }

  async upsert(
    orgId: string,
    customerId: string,
    locationId: string,
    token: string,
    accountsCache: string
  ) {
    const existing = await this._ghl.model.ghlConnection.findFirst({
      where: { customerId },
    });
    if (existing) {
      await this._ghl.model.ghlConnection.update({
        where: { id: existing.id },
        data: { orgId, locationId, token, accountsCache, deletedAt: null },
      });
      return { id: existing.id };
    }
    const { id } = await this._ghl.model.ghlConnection.create({
      data: { orgId, customerId, locationId, token, accountsCache },
    });
    return { id };
  }

  updateAccountsCache(id: string, accountsCache: string) {
    return this._ghl.model.ghlConnection.update({
      where: { id },
      data: { accountsCache },
    });
  }

  async remove(orgId: string, customerId: string) {
    await this._ghl.model.ghlConnection.updateMany({
      where: { orgId, customerId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  async getIntegrationsMap(orgId: string, ids: string[]) {
    const list = await this._integration.model.integration.findMany({
      where: { organizationId: orgId, id: { in: ids } },
      select: { id: true, providerIdentifier: true },
    });
    return new Map<string, string>(
      list.map((i) => [i.id, i.providerIdentifier])
    );
  }
}

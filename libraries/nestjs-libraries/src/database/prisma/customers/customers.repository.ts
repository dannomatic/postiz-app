import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomersRepository {
  constructor(
    private _customer: PrismaRepository<'customer'>,
    private _integration: PrismaRepository<'integration'>,
    private _pillar: PrismaRepository<'pillar'>
  ) {}

  list(orgId: string) {
    return this._customer.model.customer.findMany({
      where: {
        orgId,
        deletedAt: null,
      },
      include: {
        integrations: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            providerIdentifier: true,
            picture: true,
          },
        },
        pillars: {
          where: { deletedAt: null },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async addPillar(orgId: string, customerId: string, name: string) {
    const { id } = await this._pillar.model.pillar.create({
      data: { orgId, customerId, name },
    });
    return { id };
  }

  async removePillar(orgId: string, customerId: string, pillarId: string) {
    await this._pillar.model.pillar.updateMany({
      where: { id: pillarId, customerId, orgId },
      data: { deletedAt: new Date() },
    });
    return { id: pillarId };
  }

  getById(orgId: string, id: string) {
    return this._customer.model.customer.findFirst({
      where: { id, orgId, deletedAt: null },
    });
  }

  async create(orgId: string, name: string, pillars: string[]) {
    const cleanPillars = Array.from(
      new Set((pillars || []).map((p) => p.trim()).filter(Boolean))
    );

    const existing = await this._customer.model.customer.findFirst({
      where: { orgId, name, deletedAt: null },
    });

    const customerId =
      existing?.id ||
      (
        await this._customer.model.customer.create({
          data: { name, orgId },
        })
      ).id;

    if (cleanPillars.length) {
      await this._pillar.model.pillar.createMany({
        data: cleanPillars.map((p) => ({ orgId, customerId, name: p })),
      });
    }

    return { id: customerId };
  }

  async rename(orgId: string, id: string, name: string) {
    await this._customer.model.customer.update({
      where: { id, orgId },
      data: { name },
    });
    return { id };
  }

  async remove(orgId: string, id: string) {
    // Detach channels so they aren't left pointing at a deleted client.
    await this._integration.model.integration.updateMany({
      where: { organizationId: orgId, customerId: id },
      data: { customerId: null },
    });
    await this._customer.model.customer.update({
      where: { id, orgId },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  // Replace the full set of channels assigned to a client.
  async assignChannels(orgId: string, id: string, integrationIds: string[]) {
    const ids = integrationIds || [];

    // Unassign channels currently on this client but no longer selected.
    await this._integration.model.integration.updateMany({
      where: {
        organizationId: orgId,
        customerId: id,
        ...(ids.length ? { NOT: { id: { in: ids } } } : {}),
      },
      data: { customerId: null },
    });

    // Assign the selected channels to this client.
    if (ids.length) {
      await this._integration.model.integration.updateMany({
        where: { organizationId: orgId, id: { in: ids } },
        data: { customerId: id },
      });
    }

    return { id };
  }
}

import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomersRepository {
  constructor(
    private _customer: PrismaRepository<'customer'>,
    private _integration: PrismaRepository<'integration'>
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
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  getById(orgId: string, id: string) {
    return this._customer.model.customer.findFirst({
      where: { id, orgId, deletedAt: null },
    });
  }

  async create(orgId: string, name: string) {
    const existing = await this._customer.model.customer.findFirst({
      where: { orgId, name, deletedAt: null },
    });
    if (existing) {
      return { id: existing.id };
    }
    const { id } = await this._customer.model.customer.create({
      data: { name, orgId },
    });
    return { id };
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

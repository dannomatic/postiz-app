import { Injectable } from '@nestjs/common';
import { CustomersRepository } from '@gitroom/nestjs-libraries/database/prisma/customers/customers.repository';

@Injectable()
export class CustomersService {
  constructor(private _customersRepository: CustomersRepository) {}

  list(orgId: string) {
    return this._customersRepository.list(orgId);
  }

  create(orgId: string, name: string, pillars: string[]) {
    return this._customersRepository.create(orgId, name, pillars);
  }

  addPillar(orgId: string, customerId: string, name: string) {
    return this._customersRepository.addPillar(orgId, customerId, name);
  }

  removePillar(orgId: string, customerId: string, pillarId: string) {
    return this._customersRepository.removePillar(orgId, customerId, pillarId);
  }

  rename(orgId: string, id: string, name: string) {
    return this._customersRepository.rename(orgId, id, name);
  }

  remove(orgId: string, id: string) {
    return this._customersRepository.remove(orgId, id);
  }

  assignChannels(orgId: string, id: string, integrationIds: string[]) {
    return this._customersRepository.assignChannels(orgId, id, integrationIds);
  }
}

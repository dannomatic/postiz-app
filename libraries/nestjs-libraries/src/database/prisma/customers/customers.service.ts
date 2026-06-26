import { Injectable } from '@nestjs/common';
import { CustomersRepository } from '@gitroom/nestjs-libraries/database/prisma/customers/customers.repository';

@Injectable()
export class CustomersService {
  constructor(private _customersRepository: CustomersRepository) {}

  list(orgId: string) {
    return this._customersRepository.list(orgId);
  }

  create(orgId: string, name: string) {
    return this._customersRepository.create(orgId, name);
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

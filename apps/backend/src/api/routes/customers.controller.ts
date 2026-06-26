import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { CustomersService } from '@gitroom/nestjs-libraries/database/prisma/customers/customers.service';
import {
  AssignChannelsDto,
  CustomerDto,
  UpdateCustomerDto,
} from '@gitroom/nestjs-libraries/dtos/customers/customer.dto';

@ApiTags('Customers')
@Controller('/customers')
export class CustomersController {
  constructor(private _customersService: CustomersService) {}

  // Client management (create/rename/delete/assign) is admin-only. Listing is
  // open so any user can pick a client when creating library items.
  // The org role lives on req.org.users[0].role (per UserOrganization), not on
  // the user object; the global isSuperAdmin flag also grants access.
  private assertAdmin(org: Organization, user: User) {
    const role = (org as any)?.users?.[0]?.role;
    if (
      !(user as any)?.isSuperAdmin &&
      role !== 'ADMIN' &&
      role !== 'SUPERADMIN'
    ) {
      throw new HttpException('Unauthorized', 403);
    }
  }

  @Get('/')
  list(@GetOrgFromRequest() org: Organization) {
    return this._customersService.list(org.id);
  }

  @Post('/')
  create(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: CustomerDto
  ) {
    this.assertAdmin(org, user);
    return this._customersService.create(org.id, body.name);
  }

  @Put('/')
  rename(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: UpdateCustomerDto
  ) {
    this.assertAdmin(org, user);
    return this._customersService.rename(org.id, body.id, body.name);
  }

  @Put('/:id/channels')
  assignChannels(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Param('id') id: string,
    @Body() body: AssignChannelsDto
  ) {
    this.assertAdmin(org, user);
    return this._customersService.assignChannels(
      org.id,
      id,
      body.integrationIds || []
    );
  }

  @Delete('/:id')
  remove(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Param('id') id: string
  ) {
    this.assertAdmin(org, user);
    return this._customersService.remove(org.id, id);
  }
}

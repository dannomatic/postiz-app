import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { GhlService } from '@gitroom/nestjs-libraries/database/prisma/ghl/ghl.service';
import {
  GhlConnectionDto,
  GhlScheduleDto,
} from '@gitroom/nestjs-libraries/dtos/ghl/ghl.dto';

@ApiTags('GHL')
@Controller('/ghl')
export class GhlController {
  constructor(private _ghlService: GhlService) {}

  // Connecting/disconnecting a client's GHL sub-account is admin-only;
  // scheduling is open to any user. Mirrors the customers controller gate.
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

  @Get('/connection/:customerId')
  getConnection(
    @GetOrgFromRequest() org: Organization,
    @Param('customerId') customerId: string
  ) {
    return this._ghlService.getConnection(org.id, customerId);
  }

  @Post('/connection/:customerId')
  setConnection(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Param('customerId') customerId: string,
    @Body() body: GhlConnectionDto
  ) {
    this.assertAdmin(org, user);
    return this._ghlService.setConnection(
      org.id,
      customerId,
      body.locationId,
      body.token,
      body.userId
    );
  }

  @Delete('/connection/:customerId')
  removeConnection(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Param('customerId') customerId: string
  ) {
    this.assertAdmin(org, user);
    return this._ghlService.removeConnection(org.id, customerId);
  }

  @Post('/schedule/:templateId')
  schedule(
    @GetOrgFromRequest() org: Organization,
    @Param('templateId') templateId: string,
    @Body() body: GhlScheduleDto
  ) {
    return this._ghlService.scheduleTemplate(
      org.id,
      templateId,
      body.date,
      body.draft
    );
  }
}

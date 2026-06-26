import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { TemplatesService } from '@gitroom/nestjs-libraries/database/prisma/templates/templates.service';
import { TemplateDto } from '@gitroom/nestjs-libraries/dtos/templates/template.dto';

@ApiTags('Templates')
@Controller('/templates')
export class TemplatesController {
  constructor(private _templatesService: TemplatesService) {}

  @Get('/')
  async getTemplates(
    @GetOrgFromRequest() org: Organization,
    @Query('customer') customer?: string,
    @Query('category') category?: string,
    @Query('postType') postType?: string,
    @Query('tag') tag?: string
  ) {
    return this._templatesService.getTemplates(org.id, {
      customerId: customer,
      category,
      postType,
      tagId: tag,
    });
  }

  @Get('/:id')
  async getTemplate(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._templatesService.getTemplate(org.id, id);
  }

  @Post('/')
  async createTemplate(
    @GetOrgFromRequest() org: Organization,
    @Body() body: TemplateDto
  ) {
    return this._templatesService.createOrUpdate(org.id, body);
  }

  @Put('/')
  async updateTemplate(
    @GetOrgFromRequest() org: Organization,
    @Body() body: TemplateDto
  ) {
    return this._templatesService.createOrUpdate(org.id, body);
  }

  @Delete('/:id')
  async deleteTemplate(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._templatesService.deleteTemplate(org.id, id);
  }
}

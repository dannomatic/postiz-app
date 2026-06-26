import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { TemplatesService } from '@gitroom/nestjs-libraries/database/prisma/templates/templates.service';
import { TemplateDto } from '@gitroom/nestjs-libraries/dtos/templates/template.dto';

@ApiTags('Public API')
@Controller('/public/v1/templates')
export class PublicTemplatesController {
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

  @Delete('/:id')
  async deleteTemplate(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._templatesService.deleteTemplate(org.id, id);
  }
}

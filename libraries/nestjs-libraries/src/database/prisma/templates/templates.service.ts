import { Injectable } from '@nestjs/common';
import {
  TemplateFilters,
  TemplatesRepository,
} from '@gitroom/nestjs-libraries/database/prisma/templates/templates.repository';
import { TemplateDto } from '@gitroom/nestjs-libraries/dtos/templates/template.dto';

@Injectable()
export class TemplatesService {
  constructor(private _templatesRepository: TemplatesRepository) {}

  async getTemplates(orgId: string, filters: TemplateFilters = {}) {
    const templates = await this._templatesRepository.getTemplates(
      orgId,
      filters
    );
    return templates.map((template) => ({
      ...template,
      payload: this.parsePayload(template.payload),
    }));
  }

  async getTemplate(orgId: string, id: string) {
    const template = await this._templatesRepository.getTemplate(orgId, id);
    if (!template) {
      return template;
    }
    return { ...template, payload: this.parsePayload(template.payload) };
  }

  createOrUpdate(orgId: string, body: TemplateDto) {
    return this._templatesRepository.createOrUpdate(orgId, body);
  }

  deleteTemplate(orgId: string, id: string) {
    return this._templatesRepository.deleteTemplate(orgId, id);
  }

  private parsePayload(payload: string) {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
}

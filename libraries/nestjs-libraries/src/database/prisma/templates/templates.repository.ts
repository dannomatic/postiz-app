import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { TemplateDto } from '@gitroom/nestjs-libraries/dtos/templates/template.dto';
import { v4 as uuidv4 } from 'uuid';

export interface TemplateFilters {
  customerId?: string;
  pillarId?: string;
  category?: string;
  postType?: string;
  tagId?: string;
}

@Injectable()
export class TemplatesRepository {
  constructor(
    private _templates: PrismaRepository<'template'>,
    private _templateTags: PrismaRepository<'templateTags'>
  ) {}

  getTemplates(orgId: string, filters: TemplateFilters = {}) {
    const { customerId, pillarId, category, postType, tagId } = filters;
    return this._templates.model.template.findMany({
      where: {
        orgId,
        deletedAt: null,
        ...(customerId ? { customerId } : {}),
        ...(pillarId ? { pillarId } : {}),
        ...(category ? { category } : {}),
        ...(postType ? { postType } : {}),
        ...(tagId ? { tags: { some: { tagId } } } : {}),
      },
      include: {
        customer: true,
        pillar: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  getTemplate(orgId: string, id: string) {
    return this._templates.model.template.findFirst({
      where: {
        id,
        orgId,
        deletedAt: null,
      },
      include: {
        customer: true,
        pillar: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
      },
    });
  }

  deleteTemplate(orgId: string, id: string) {
    return this._templates.model.template.update({
      where: {
        id,
        orgId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async createOrUpdate(orgId: string, body: TemplateDto, userId?: string) {
    const id = body.id || uuidv4();
    const payload =
      typeof body.payload === 'string'
        ? body.payload
        : JSON.stringify(body.payload ?? null);

    const { id: templateId } = await this._templates.model.template.upsert({
      where: {
        id,
        orgId,
      },
      create: {
        id,
        orgId,
        name: body.name,
        category: body.category || null,
        postType: body.postType || null,
        customerId: body.customerId || null,
        pillarId: body.pillarId || null,
        updatedById: userId || null,
        payload,
      },
      update: {
        name: body.name,
        category: body.category || null,
        postType: body.postType || null,
        customerId: body.customerId || null,
        pillarId: body.pillarId || null,
        updatedById: userId || null,
        payload,
      },
    });

    // Reset the tag links so an update reflects the exact tag selection.
    await this._templateTags.model.templateTags.deleteMany({
      where: { templateId },
    });

    if (body.tags?.length) {
      await this._templateTags.model.templateTags.createMany({
        data: body.tags.map((tag) => ({ templateId, tagId: tag.value })),
        skipDuplicates: true,
      });
    }

    return { id: templateId };
  }
}

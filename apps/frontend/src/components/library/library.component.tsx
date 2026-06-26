'use client';
import 'reflect-metadata';

import React, { FC, useCallback, useMemo, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import useSWR from 'swr';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { AddEditModal } from '@gitroom/frontend/components/new-launch/add.edit.modal';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { ManageClientsModal } from '@gitroom/frontend/components/library/manage.clients.modal';
import {
  NewLibraryItemModal,
  NewLibraryLaunch,
} from '@gitroom/frontend/components/library/new.library.item.modal';

const distinct = (arr: string[]) =>
  Array.from(new Set(arr.filter(Boolean))).sort();

export const LibraryComponent: FC = () => {
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();
  const user = useUser();
  const isAdmin =
    !!(user as any)?.isSuperAdmin ||
    ['ADMIN', 'SUPERADMIN'].includes((user as any)?.role);

  const [search, setSearch] = useState('');
  const [pillar, setPillar] = useState('');
  const [postType, setPostType] = useState('');
  const [customer, setCustomer] = useState('');
  const [tag, setTag] = useState('');

  const loadIntegrations = useCallback(
    async (path: string) => (await (await fetch(path)).json()).integrations,
    []
  );
  const { data: integrations = [] } = useSWR(
    '/integrations/list',
    loadIntegrations,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
      fallbackData: [],
    }
  );

  const loadTemplates = useCallback(
    async () => (await fetch('/templates')).json(),
    []
  );
  const { data: templates = [], mutate } = useSWR('templates', loadTemplates, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    fallbackData: [],
  });

  const pillars = useMemo(() => {
    const map = new Map<string, string>();
    templates.forEach((p: any) => {
      if (p.pillar?.id) map.set(p.pillar.id, p.pillar.name || p.pillar.id);
    });
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [templates]);
  const postTypes = useMemo(
    () => distinct(templates.map((p: any) => p.postType)),
    [templates]
  );
  const customers = useMemo(() => {
    const map = new Map<string, string>();
    templates.forEach((p: any) => {
      if (p.customer?.id) map.set(p.customer.id, p.customer.name || p.customer.id);
    });
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [templates]);
  const allTags = useMemo(
    () =>
      distinct(
        templates.flatMap((p: any) =>
          (p.tags || []).map((tt: any) => tt?.tag?.name).filter(Boolean)
        )
      ),
    [templates]
  );

  const filtered = useMemo(() => {
    return templates.filter((p: any) => {
      if (search && !p.name?.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (pillar && p.pillar?.id !== pillar) return false;
      if (postType && p.postType !== postType) return false;
      if (customer && p.customer?.id !== customer) return false;
      if (
        tag &&
        !(p.tags || []).some((tt: any) => tt?.tag?.name === tag)
      )
        return false;
      return true;
    });
  }, [templates, search, pillar, postType, customer, tag]);

  const channelCount = (template: any) =>
    (template.payload?.posts || []).length;

  const previewText = (template: any) => {
    const first = template.payload?.posts?.[0]?.value?.[0]?.content || '';
    return first.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const addToSchedule = useCallback(
    (template: any) => () => {
      const set = {
        posts: (template.payload?.posts || [])
          .filter((p: any) =>
            integrations.find((i: any) => i.id === p.integration?.id)
          )
          .map((p: any) => ({
            integration: p.integration,
            settings: p.settings || {},
            value: (p.value || []).map((v: any) => ({
              content: v.content,
              media: v.image || [],
            })),
          })),
      };

      if (!set.posts.length) {
        toaster.show(
          t(
            'template_no_matching_channels',
            'None of this template’s channels are connected anymore.'
          ),
          'warning'
        );
        return;
      }

      modal.openModal({
        id: 'add-edit-modal',
        closeOnClickOutside: false,
        removeLayout: true,
        closeOnEscape: false,
        withCloseButton: false,
        askClose: true,
        fullScreen: true,
        classNames: {
          modal: 'w-[100%] max-w-[1400px] text-textColor',
        },
        children: (
          <AddEditModal
            allIntegrations={integrations.map((p: any) => ({ ...p }))}
            integrations={integrations.map((p: any) => ({ ...p }))}
            set={set}
            date={newDayjs()}
            mutate={() => {}}
            reopenModal={() => {}}
          />
        ),
        title: ``,
      });
    },
    [integrations, modal, toaster, t]
  );

  const remove = useCallback(
    (template: any) => async () => {
      if (
        await deleteDialog(
          t(
            'delete_template_confirm',
            `Are you sure you want to delete "${template.name}"?`
          )
        )
      ) {
        await fetch(`/templates/${template.id}`, { method: 'DELETE' });
        mutate();
        toaster.show(t('template_deleted', 'Template deleted'), 'success');
      }
    },
    [mutate]
  );

  const launchFromWizard = useCallback(
    (p: NewLibraryLaunch) => {
      modal.closeAll();
      modal.openModal({
        id: 'add-edit-modal',
        closeOnClickOutside: false,
        removeLayout: true,
        closeOnEscape: false,
        withCloseButton: false,
        askClose: true,
        fullScreen: true,
        classNames: { modal: 'w-[100%] max-w-[1400px] text-textColor' },
        children: (
          <AddEditModal
            allIntegrations={integrations.map((x: any) => ({ ...x }))}
            integrations={integrations.map((x: any) => ({ ...x }))}
            selectedChannels={p.channelIds}
            date={newDayjs()}
            mutate={mutate}
            reopenModal={() => {}}
            libraryDefaults={{
              name: p.name,
              pillarId: p.pillarId,
              postType: p.postType,
              customerId: p.customerId,
              tags: p.tags,
            }}
          />
        ),
        title: ``,
      });
    },
    [integrations, modal, mutate]
  );

  const openNewLibraryItem = useCallback(() => {
    modal.openModal({
      title: ``,
      withCloseButton: true,
      closeOnEscape: true,
      closeOnClickOutside: true,
      children: <NewLibraryItemModal onLaunch={launchFromWizard} />,
    });
  }, [launchFromWizard]);

  const openManageClients = useCallback(() => {
    modal.openModal({
      title: ``,
      withCloseButton: true,
      closeOnEscape: true,
      closeOnClickOutside: true,
      children: <ManageClientsModal />,
    });
  }, [modal]);

  const selectClass =
    'bg-newBgColor border border-newBorder rounded-[8px] h-[40px] px-[10px] text-[14px] text-textColor outline-none';

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex items-start gap-[12px]">
        <div className="flex-1">
          <h3 className="text-[20px] font-[600]">
            {t('content_library', 'Content Library')} ({filtered.length})
          </h3>
          <div className="text-textColor opacity-70 mt-[4px]">
            {t(
              'content_library_subtitle',
              'Reusable, ready-made posts. Pick one and add it to the schedule as a draft.'
            )}
          </div>
        </div>
        <div className="flex gap-[8px]">
          {isAdmin && (
            <button
              onClick={openManageClients}
              className="px-[16px] h-[44px] rounded-[8px] border border-newBorder text-[14px] font-[600]"
            >
              {t('manage_clients', 'Manage Clients')}
            </button>
          )}
          <Button onClick={openNewLibraryItem}>
            {t('new_library_item', 'New Library Item')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-[10px] items-center">
        <input
          className={selectClass}
          placeholder={t('search', 'Search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={selectClass}
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
        >
          <option value="">{t('all_clients', 'All clients')}</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={pillar}
          onChange={(e) => setPillar(e.target.value)}
        >
          <option value="">{t('all_pillars', 'All pillars')}</option>
          {pillars.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={postType}
          onChange={(e) => setPostType(e.target.value)}
        >
          <option value="">{t('all_post_types', 'All post types')}</option>
          {postTypes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        >
          <option value="">{t('all_tags', 'All tags')}</option>
          {allTags.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-newBgColorInner border border-newBorder rounded-[12px] p-[40px] text-center text-textColor opacity-70">
          {t(
            'library_empty',
            'No templates yet. Compose a post and use “Save to Library” to add one.'
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[16px]">
          {filtered.map((template: any) => (
            <div
              key={template.id}
              className="bg-newBgColorInner border border-newBorder rounded-[12px] p-[16px] flex flex-col gap-[12px]"
            >
              <div className="flex items-start gap-[8px]">
                <div className="flex-1 font-[600] text-[16px]">
                  {template.name}
                </div>
                <div className="text-[12px] opacity-70 whitespace-nowrap">
                  {channelCount(template)}{' '}
                  {t('channels_short', 'ch.')}
                </div>
              </div>

              <div className="flex flex-wrap gap-[6px]">
                {template.customer?.name && (
                  <span className="text-[11px] px-[8px] py-[2px] rounded-full bg-[#612BD3] text-white">
                    {template.customer.name}
                  </span>
                )}
                {template.pillar?.name && (
                  <span className="text-[11px] px-[8px] py-[2px] rounded-full bg-[#2a2f45] border border-newBorder">
                    {template.pillar.name}
                  </span>
                )}
                {template.postType && (
                  <span className="text-[11px] px-[8px] py-[2px] rounded-full bg-newBgColor border border-newBorder">
                    {template.postType}
                  </span>
                )}
                {(template.tags || []).map((tt: any) => (
                  <span
                    key={tt?.tag?.id || tt?.tagId}
                    className="text-[11px] px-[8px] py-[2px] rounded-full bg-newBgColor border border-newBorder"
                  >
                    #{tt?.tag?.name}
                  </span>
                ))}
              </div>

              <div className="text-[13px] opacity-80 line-clamp-3 min-h-[40px]">
                {previewText(template) ||
                  t('no_preview', 'No text preview')}
              </div>

              <div className="flex gap-[8px] mt-auto">
                <Button onClick={addToSchedule(template)} className="flex-1">
                  {t('add_to_schedule', 'Add to Schedule')}
                </Button>
                <button
                  onClick={remove(template)}
                  className="px-[12px] h-[44px] rounded-[8px] border border-newBorder text-[#FF3F3F] text-[14px] font-[600]"
                >
                  {t('delete', 'Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

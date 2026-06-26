'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { Button } from '@gitroom/react/form/button';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// Metadata prompt shown when saving the current composer content to the
// Content Library. The actual post payload (per-channel content/media/settings)
// is built by the composer and passed in via `posts`.
export interface LibraryDefaults {
  id?: string;
  name?: string;
  pillarId?: string;
  postType?: string;
  customerId?: string;
  tags?: { value: string; label: string }[];
}

export const SaveToLibraryModal: FC<{
  posts: any[];
  tags: { value: string; label: string }[];
  integrations: any[];
  defaults?: LibraryDefaults;
  onSaved?: () => void;
}> = ({ posts, tags, defaults, onSaved }) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const modal = useModals();
  const t = useT();

  const [name, setName] = useState(defaults?.name || '');
  const [postType, setPostType] = useState(defaults?.postType || '');
  const [customerId, setCustomerId] = useState(defaults?.customerId || '');
  const [pillarId, setPillarId] = useState(defaults?.pillarId || '');
  const [loading, setLoading] = useState(false);

  const effectiveTags =
    defaults?.tags && defaults.tags.length ? defaults.tags : tags;

  const loadClients = useCallback(
    async () => (await fetch('/customers')).json(),
    []
  );
  const { data: clients = [] } = useSWR('customers', loadClients, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    fallbackData: [],
  });

  const selectedClient = useMemo(
    () => clients.find((c: any) => c.id === customerId),
    [clients, customerId]
  );
  const clientPillars = selectedClient?.pillars || [];

  const inputClass =
    'bg-newBgColor border border-newBorder rounded-[8px] h-[44px] px-[12px] text-[14px] text-textColor outline-none';

  const save = useCallback(async () => {
    if (!name.trim()) {
      toaster.show(
        t('template_name_required', 'Please enter a template name'),
        'warning'
      );
      return;
    }
    if (customerId && !pillarId) {
      toaster.show(
        t('pillar_required', 'Please choose a pillar for this client'),
        'warning'
      );
      return;
    }

    setLoading(true);
    await fetch('/templates', {
      method: 'POST',
      body: JSON.stringify({
        ...(defaults?.id ? { id: defaults.id } : {}),
        name: name.trim(),
        pillarId: pillarId || undefined,
        postType: postType.trim() || undefined,
        customerId: customerId || undefined,
        tags: effectiveTags,
        payload: { posts },
      }),
    });
    setLoading(false);

    // Refresh the library list anywhere it's mounted (the composer lives in a
    // different component tree than the /library page).
    globalMutate('templates');

    toaster.show(t('saved_to_library', 'Saved to library'));
    onSaved?.();
    modal.closeAll();
  }, [name, pillarId, postType, customerId, effectiveTags, posts, onSaved]);

  return (
    <div className="flex flex-col gap-[16px] p-[20px] min-w-[440px] text-textColor">
      <div className="text-[20px] font-[600]">
        {t('save_to_library', 'Save to Library')}
      </div>

      <div className="flex flex-col gap-[6px]">
        <label className="text-[14px] font-[500]">{t('name', 'Name')}</label>
        <input
          className={inputClass}
          placeholder={t('template_name_placeholder', 'e.g. Monthly product tip')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[6px]">
        <label className="text-[14px] font-[500]">
          {t('client', 'Client')}
        </label>
        <select
          className={inputClass}
          value={customerId}
          onChange={(e) => {
            setCustomerId(e.target.value);
            setPillarId('');
          }}
        >
          <option value="">{t('shared_no_customer', 'Shared (no client)')}</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-[12px]">
        <div className="flex flex-1 flex-col gap-[6px]">
          <label className="text-[14px] font-[500]">
            {t('pillar', 'Pillar')}
          </label>
          <select
            className={inputClass}
            value={pillarId}
            onChange={(e) => setPillarId(e.target.value)}
            disabled={!customerId}
          >
            <option value="">
              {customerId
                ? t('select_pillar', 'Select a pillar')
                : t('pick_client_first', 'Pick a client first')}
            </option>
            {clientPillars.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-[6px]">
          <label className="text-[14px] font-[500]">
            {t('post_type', 'Post type')}
          </label>
          <input
            className={inputClass}
            placeholder={t('post_type_placeholder', 'e.g. carousel')}
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-[8px] pt-[4px]">
        <Button onClick={save} disabled={loading}>
          {loading ? t('saving', 'Saving...') : t('save', 'Save')}
        </Button>
      </div>
    </div>
  );
};

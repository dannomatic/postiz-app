'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import { mutate as globalMutate } from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { Button } from '@gitroom/react/form/button';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// Metadata prompt shown when saving the current composer content to the
// Content Library. The actual post payload (per-channel content/media/settings)
// is built by the composer and passed in via `posts`.
export interface LibraryDefaults {
  name?: string;
  category?: string;
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
}> = ({ posts, tags, integrations, defaults, onSaved }) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const modal = useModals();
  const t = useT();

  const [name, setName] = useState(defaults?.name || '');
  const [category, setCategory] = useState(defaults?.category || '');
  const [postType, setPostType] = useState(defaults?.postType || '');
  const [customerId, setCustomerId] = useState(defaults?.customerId || '');
  const [loading, setLoading] = useState(false);

  const effectiveTags =
    defaults?.tags && defaults.tags.length ? defaults.tags : tags;

  const customers = useMemo(() => {
    const map = new Map<string, string>();
    (integrations || []).forEach((i) => {
      if (i?.customer?.id) {
        map.set(i.customer.id, i.customer.name || i.customer.id);
      }
    });
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [integrations]);

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

    setLoading(true);
    await fetch('/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        category: category.trim() || undefined,
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
  }, [name, category, postType, customerId, tags, posts, onSaved]);

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

      <div className="flex gap-[12px]">
        <div className="flex flex-1 flex-col gap-[6px]">
          <label className="text-[14px] font-[500]">
            {t('category', 'Category')}
          </label>
          <input
            className={inputClass}
            placeholder={t('category_placeholder', 'e.g. Promotion')}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
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

      {customers.length > 0 && (
        <div className="flex flex-col gap-[6px]">
          <label className="text-[14px] font-[500]">
            {t('customer', 'Customer')}
          </label>
          <select
            className={inputClass}
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">{t('shared_no_customer', 'Shared (no customer)')}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-[8px] pt-[4px]">
        <Button onClick={save} disabled={loading}>
          {loading ? t('saving', 'Saving...') : t('save', 'Save')}
        </Button>
      </div>
    </div>
  );
};

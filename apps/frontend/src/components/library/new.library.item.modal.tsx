'use client';
import 'reflect-metadata';

import React, { FC, useCallback, useMemo, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import useSWR from 'swr';
import { Button } from '@gitroom/react/form/button';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const inputClass =
  'bg-newBgColor border border-newBorder rounded-[8px] h-[40px] px-[10px] text-[14px] text-textColor outline-none';

export interface NewLibraryLaunch {
  customerId: string;
  channelIds: string[];
  name: string;
  pillarId: string;
  postType: string;
  tags: { value: string; label: string }[];
}

export const NewLibraryItemModal: FC<{
  onLaunch: (payload: NewLibraryLaunch) => void;
}> = ({ onLaunch }) => {
  const fetch = useFetch();
  const t = useT();

  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState('');
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [pillarId, setPillarId] = useState('');
  const [postType, setPostType] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);

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

  const loadTags = useCallback(async () => {
    // /posts/tags returns { tags: [...] }, not a bare array.
    const res = await (await fetch('/posts/tags')).json();
    return res?.tags || [];
  }, []);
  const { data: tags = [] } = useSWR('/posts/tags', loadTags, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    fallbackData: [],
  });

  const selectedClient = useMemo(
    () => clients.find((c: any) => c.id === customerId),
    [clients, customerId]
  );
  const clientChannels = selectedClient?.integrations || [];
  const clientPillars = selectedClient?.pillars || [];

  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  const launch = useCallback(() => {
    onLaunch({
      customerId,
      channelIds,
      name: name.trim(),
      pillarId,
      postType: postType.trim(),
      tags: tags
        .filter((tg: any) => tagIds.includes(tg.id))
        .map((tg: any) => ({ value: tg.id, label: tg.name })),
    });
  }, [customerId, channelIds, name, pillarId, postType, tagIds, tags]);

  const canNext =
    (step === 1 && !!customerId) ||
    (step === 2 && channelIds.length > 0) ||
    step === 3;

  return (
    <div className="flex flex-col gap-[16px] p-[20px] min-w-[520px] max-w-[640px] text-textColor">
      <div className="text-[20px] font-[600]">
        {t('new_library_item', 'New Library Item')}
      </div>
      <div className="text-[12px] opacity-70">
        {t('step_of', 'Step')} {step} / 3
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-[10px]">
          <div className="text-[14px] font-[500]">
            {t('select_client', 'Select a client')}
          </div>
          {clients.length === 0 && (
            <div className="opacity-70 text-[13px]">
              {t(
                'no_clients_configure',
                'No clients yet — ask an admin to configure one in Manage Clients.'
              )}
            </div>
          )}
          <div className="flex flex-col gap-[8px] max-h-[320px] overflow-y-auto">
            {clients.map((c: any) => (
              <button
                key={c.id}
                onClick={() => {
                  setCustomerId(c.id);
                  setChannelIds([]);
                }}
                className={`text-left px-[12px] h-[44px] rounded-[8px] border ${
                  customerId === c.id
                    ? 'bg-[#612BD3] text-white border-transparent'
                    : 'bg-newBgColor border-newBorder'
                }`}
              >
                {c.name}{' '}
                <span className="opacity-70 text-[12px]">
                  ({(c.integrations || []).length} {t('channels_short', 'ch.')})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-[10px]">
          <div className="text-[14px] font-[500]">
            {t('select_networks', 'Select networks')}
          </div>
          {clientChannels.length === 0 && (
            <div className="opacity-70 text-[13px]">
              {t(
                'client_no_channels',
                'This client has no channels assigned. Assign some in Manage Clients first.'
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-[8px]">
            {clientChannels.map((i: any) => {
              const on = channelIds.includes(i.id);
              return (
                <button
                  key={i.id}
                  onClick={() => setChannelIds((p) => toggle(p, i.id))}
                  className={`flex items-center gap-[6px] px-[10px] h-[36px] rounded-full border text-[13px] ${
                    on
                      ? 'bg-[#612BD3] text-white border-transparent'
                      : 'bg-newBgColor border-newBorder'
                  }`}
                >
                  <img
                    src={`/icons/platforms/${i.providerIdentifier}.png`}
                    className="w-[16px] h-[16px] rounded-[3px]"
                    alt={i.providerIdentifier}
                  />
                  {i.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-[500]">{t('name', 'Name')}</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('template_name_placeholder', 'e.g. Monthly product tip')}
            />
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
              >
                <option value="">{t('select_pillar', 'Select a pillar')}</option>
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
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                placeholder={t('post_type_placeholder', 'e.g. carousel')}
              />
            </div>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-col gap-[6px]">
              <label className="text-[14px] font-[500]">{t('tags', 'Tags')}</label>
              <div className="flex flex-wrap gap-[8px]">
                {tags.map((tg: any) => {
                  const on = tagIds.includes(tg.id);
                  return (
                    <button
                      key={tg.id}
                      onClick={() => setTagIds((p) => toggle(p, tg.id))}
                      className={`px-[10px] h-[32px] rounded-full border text-[12px] ${
                        on
                          ? 'bg-[#612BD3] text-white border-transparent'
                          : 'bg-newBgColor border-newBorder'
                      }`}
                    >
                      #{tg.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-[4px]">
        <Button
          secondary
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          {t('back', 'Back')}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            {t('next', 'Next')}
          </Button>
        ) : (
          <Button onClick={launch} disabled={!name.trim() || !pillarId}>
            {t('open_composer', 'Open composer')}
          </Button>
        )}
      </div>
    </div>
  );
};

'use client';
import 'reflect-metadata';

import React, { FC, useCallback, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import useSWR from 'swr';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const inputClass =
  'bg-newBgColor border border-newBorder rounded-[8px] h-[40px] px-[10px] text-[14px] text-textColor outline-none';

const ClientRow: FC<{
  client: any;
  integrations: any[];
  onChanged: () => void;
}> = ({ client, integrations, onChanged }) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const [name, setName] = useState(client.name);
  const [pillarDraft, setPillarDraft] = useState('');

  const assigned = new Set((client.integrations || []).map((i: any) => i.id));
  const pillars = client.pillars || [];

  const addPillar = useCallback(async () => {
    if (!pillarDraft.trim()) return;
    await fetch(`/customers/${client.id}/pillars`, {
      method: 'POST',
      body: JSON.stringify({ name: pillarDraft.trim() }),
    });
    setPillarDraft('');
    onChanged();
  }, [pillarDraft, client]);

  const removePillar = useCallback(
    (pillarId: string) => async () => {
      await fetch(`/customers/${client.id}/pillars/${pillarId}`, {
        method: 'DELETE',
      });
      onChanged();
    },
    [client]
  );

  const rename = useCallback(async () => {
    if (!name.trim() || name.trim() === client.name) return;
    await fetch('/customers', {
      method: 'PUT',
      body: JSON.stringify({ id: client.id, name: name.trim() }),
    });
    toaster.show(t('client_renamed', 'Client renamed'), 'success');
    onChanged();
  }, [name, client]);

  const remove = useCallback(async () => {
    if (
      await deleteDialog(
        t(
          'delete_client_confirm',
          `Delete "${client.name}"? Its channels will be unassigned.`
        )
      )
    ) {
      await fetch(`/customers/${client.id}`, { method: 'DELETE' });
      toaster.show(t('client_deleted', 'Client deleted'), 'success');
      onChanged();
    }
  }, [client]);

  const toggleChannel = useCallback(
    (integrationId: string) => async () => {
      const next = new Set(assigned);
      if (next.has(integrationId)) next.delete(integrationId);
      else next.add(integrationId);
      await fetch(`/customers/${client.id}/channels`, {
        method: 'PUT',
        body: JSON.stringify({ integrationIds: Array.from(next) }),
      });
      onChanged();
    },
    [client, assigned]
  );

  return (
    <div className="bg-newBgColorInner border border-newBorder rounded-[12px] p-[14px] flex flex-col gap-[12px]">
      <div className="flex items-center gap-[8px]">
        <input
          className={`${inputClass} flex-1`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={rename}
        />
        <button
          onClick={remove}
          className="px-[12px] h-[40px] rounded-[8px] border border-newBorder text-[#FF3F3F] text-[13px] font-[600]"
        >
          {t('delete', 'Delete')}
        </button>
      </div>
      <div className="text-[12px] opacity-70">{t('pillars', 'Pillars')}</div>
      <div className="flex flex-wrap items-center gap-[8px]">
        {pillars.map((p: any) => (
          <span
            key={p.id}
            className="flex items-center gap-[6px] px-[10px] h-[30px] rounded-full bg-newBgColor border border-newBorder text-[12px]"
          >
            {p.name}
            <button
              onClick={removePillar(p.id)}
              className="text-[#FF3F3F] leading-none"
              title={t('remove', 'Remove')}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className={`${inputClass} w-[160px]`}
          placeholder={t('add_pillar', 'Add pillar')}
          value={pillarDraft}
          onChange={(e) => setPillarDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPillar()}
        />
      </div>

      <div className="text-[12px] opacity-70">
        {t('assign_channels', 'Assigned channels')}
      </div>
      <div className="flex flex-wrap gap-[8px]">
        {integrations.length === 0 && (
          <div className="text-[12px] opacity-60">
            {t('no_channels_connected', 'No channels connected yet.')}
          </div>
        )}
        {integrations.map((i: any) => {
          const on = assigned.has(i.id);
          return (
            <button
              key={i.id}
              onClick={toggleChannel(i.id)}
              className={`flex items-center gap-[6px] px-[10px] h-[34px] rounded-full border text-[12px] ${
                on
                  ? 'bg-[#612BD3] text-white border-transparent'
                  : 'bg-newBgColor border-newBorder text-textColor'
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
  );
};

export const ManageClientsModal: FC<{ page?: boolean }> = ({ page }) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const [newName, setNewName] = useState('');
  const [newPillars, setNewPillars] = useState<string[]>([]);
  const [pillarDraft, setPillarDraft] = useState('');

  const loadClients = useCallback(
    async () => (await fetch('/customers')).json(),
    []
  );
  const { data: clients = [], mutate } = useSWR('customers', loadClients, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    fallbackData: [],
  });

  const loadIntegrations = useCallback(
    async (path: string) => (await (await fetch(path)).json()).integrations,
    []
  );
  const { data: integrations = [] } = useSWR(
    '/integrations/list',
    loadIntegrations,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
      fallbackData: [],
    }
  );

  const addPillarDraft = useCallback(() => {
    const v = pillarDraft.trim();
    if (!v || newPillars.includes(v)) return;
    setNewPillars((p) => [...p, v]);
    setPillarDraft('');
  }, [pillarDraft, newPillars]);

  const addClient = useCallback(async () => {
    if (!newName.trim() || newPillars.length === 0) return;
    await fetch('/customers', {
      method: 'POST',
      body: JSON.stringify({ name: newName.trim(), pillars: newPillars }),
    });
    setNewName('');
    setNewPillars([]);
    setPillarDraft('');
    toaster.show(t('client_created', 'Client created'), 'success');
    mutate();
  }, [newName, newPillars]);

  return (
    <div
      className={`flex flex-col gap-[16px] p-[20px] text-textColor ${
        page ? 'w-full' : 'min-w-[560px] max-w-[680px]'
      }`}
    >
      <div className="text-[20px] font-[600]">
        {t('manage_clients', 'Manage Clients')}
      </div>

      <div className="bg-newBgColorInner border border-newBorder rounded-[12px] p-[14px] flex flex-col gap-[10px]">
        <input
          className={inputClass}
          placeholder={t('new_client_name', 'New client name')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <div className="text-[12px] opacity-70">
          {t('pillars_required_hint', 'Add at least one pillar (content theme)')}
        </div>
        <div className="flex flex-wrap items-center gap-[8px]">
          {newPillars.map((p) => (
            <span
              key={p}
              className="flex items-center gap-[6px] px-[10px] h-[30px] rounded-full bg-newBgColor border border-newBorder text-[12px]"
            >
              {p}
              <button
                onClick={() =>
                  setNewPillars((arr) => arr.filter((x) => x !== p))
                }
                className="text-[#FF3F3F] leading-none"
              >
                ×
              </button>
            </span>
          ))}
          <input
            className={`${inputClass} w-[180px]`}
            placeholder={t('add_pillar', 'Add pillar')}
            value={pillarDraft}
            onChange={(e) => setPillarDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPillarDraft()}
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={addClient}
            disabled={!newName.trim() || newPillars.length === 0}
          >
            {t('add_client', 'Add client')}
          </Button>
        </div>
      </div>

      <div
        className={`flex flex-col gap-[12px] overflow-y-auto ${
          page ? '' : 'max-h-[420px]'
        }`}
      >
        {clients.length === 0 ? (
          <div className="opacity-70 text-[14px]">
            {t('no_clients_yet', 'No clients yet. Add one above.')}
          </div>
        ) : (
          clients.map((c: any) => (
            <ClientRow
              key={c.id}
              client={c}
              integrations={integrations}
              onChanged={mutate}
            />
          ))
        )}
      </div>
    </div>
  );
};

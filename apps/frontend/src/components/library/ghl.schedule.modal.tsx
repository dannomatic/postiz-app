'use client';

import { FC, useCallback, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { Button } from '@gitroom/react/form/button';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// "Add to GHL Calendar" — pick a date/time, push the library item into the
// connected client's GoHighLevel sub-account as a scheduled post.
export const GhlScheduleModal: FC<{ template: any }> = ({ template }) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const modal = useModals();
  const t = useT();

  const [date, setDate] = useState('');
  const [draft, setDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const inputClass =
    'bg-newBgColor border border-newBorder rounded-[8px] h-[44px] px-[12px] text-[14px] text-textColor outline-none';

  const submit = useCallback(async () => {
    if (!draft && !date) {
      toaster.show(
        t('ghl_pick_date', 'Please choose a date and time'),
        'warning'
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/ghl/schedule/${template.id}`, {
        method: 'POST',
        body: JSON.stringify(
          draft ? { draft: true } : { date: new Date(date).toISOString() }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        toaster.show(
          data?.message || t('ghl_failed', 'GoHighLevel scheduling failed'),
          'warning'
        );
        setLoading(false);
        return;
      }
      setResult(data);
      setLoading(false);
      if (data.scheduled?.length) {
        toaster.show(t('ghl_scheduled', 'Scheduled to GoHighLevel'), 'success');
      }
    } catch (e: any) {
      toaster.show(e?.message || 'Error', 'warning');
      setLoading(false);
    }
  }, [date, template]);

  return (
    <div className="flex flex-col gap-[16px] p-[20px] min-w-[440px] text-textColor">
      <div className="text-[20px] font-[600]">
        {t('add_to_ghl_calendar', 'Add to GHL Calendar')}
      </div>
      <div className="text-[12px] opacity-70">{template.name}</div>

      {!result ? (
        <>
          <label className="flex items-center gap-[8px] text-[14px] cursor-pointer">
            <input
              type="checkbox"
              checked={draft}
              onChange={(e) => setDraft(e.target.checked)}
            />
            {t('send_as_draft', 'Send as Draft (no schedule)')}
          </label>
          <div className="flex flex-col gap-[6px]">
            <label
              className={`text-[14px] font-[500] ${draft ? 'opacity-40' : ''}`}
            >
              {t('schedule_datetime', 'Schedule date & time')}
            </label>
            <input
              type="datetime-local"
              className={`${inputClass} ${draft ? 'opacity-40' : ''}`}
              value={date}
              disabled={draft}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={loading}>
              {loading
                ? t('sending', 'Sending...')
                : draft
                ? t('send_draft_to_ghl', 'Send draft to GHL')
                : t('schedule_to_ghl', 'Schedule to GHL')}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-[12px] text-[14px]">
          {result.scheduled?.length > 0 && (
            <div>
              <div className="font-[600] mb-[4px]">
                ✅ {t('scheduled', 'Scheduled')}
              </div>
              <ul className="list-disc ps-[18px] opacity-90">
                {result.scheduled.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {result.skipped?.length > 0 && (
            <div>
              <div className="font-[600] mb-[4px]">
                ⚠️ {t('skipped', 'Skipped')}
              </div>
              <ul className="list-disc ps-[18px] opacity-70">
                {result.skipped.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {!result.scheduled?.length && (
            <div className="opacity-70">
              {t(
                'ghl_nothing_scheduled',
                'Nothing was sent — no channels were connected in this client’s GoHighLevel sub-account. Connect them in GHL, then try again.'
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => modal.closeAll()}>
              {t('done', 'Done')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

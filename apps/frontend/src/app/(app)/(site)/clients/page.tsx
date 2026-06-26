import { Metadata } from 'next';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';
import { ManageClientsModal } from '@gitroom/frontend/components/library/manage.clients.modal';

export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'Postiz' : 'Gitroom'} Clients`,
  description: '',
};

export default function Page() {
  return (
    <div className="w-full">
      <ManageClientsModal page />
    </div>
  );
}

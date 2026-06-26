import { LibraryComponent } from '@gitroom/frontend/components/library/library.component';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';

export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'Postiz' : 'Gitroom'} Library`,
  description: '',
};

export default async function Page() {
  return (
    <div className="p-[20px]">
      <LibraryComponent />
    </div>
  );
}

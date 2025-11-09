
import { PageHeader } from '@/components/shared/PageHeader';
import { UsersTable } from './_components/users-table';

export default function Page() {
  return (
    <>
      <PageHeader title="Usuarios" />
      <UsersTable />
    </>
  );
}

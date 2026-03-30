import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getOrgSettings } from '@/lib/data';
import AppShell from './AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { name: orgName } = await getOrgSettings(session.orgId);

  return (
    <AppShell orgName={orgName} email={session.email}>
      {children}
    </AppShell>
  );
}

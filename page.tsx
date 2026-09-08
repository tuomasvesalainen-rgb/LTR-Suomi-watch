import { redirect } from 'next/navigation';
import { getCurrentMember } from '@/lib/session';

export default async function Home() {
  const member = await getCurrentMember();
  redirect(member ? '/dashboard' : '/join');
}

import { redirect } from 'next/navigation';

/** La entrada del sidebar abre directamente la primera sección. */
export default function ProfileCenterPage() {
  redirect('/dashboard/player/profile-center/profile');
}

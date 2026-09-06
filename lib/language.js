import { cookies } from 'next/headers';

export async function getLanguage() {
  const store = await cookies();
  return store.get('kdkamato_language')?.value === 'en' ? 'en' : 'th';
}

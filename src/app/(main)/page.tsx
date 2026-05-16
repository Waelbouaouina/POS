import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically redirect from / to /caisse for the POS Frontend
  redirect('/caisse');
}


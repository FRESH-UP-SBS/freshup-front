'use client';

import { Calendar, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './BottomNav.module.css';

type BottomNavProps = {
  active: 'calendar' | 'mypage';
};

export default function BottomNav({ active }: BottomNavProps) {
  const router = useRouter();

  return (
    <nav className={styles.bottomNav}>
      <button
        type="button"
        className={`${styles.bottomNavButton} ${
          active === 'calendar' ? styles.active : ''
        }`}
        onClick={() => router.push('/calendar')}
      >
        <Calendar size={28} />
      </button>

      <button
        type="button"
        className={`${styles.bottomNavButton} ${
          active === 'mypage' ? styles.active : ''
        }`}
        onClick={() => router.push('/mypage')}
      >
        <User size={28} />
      </button>
    </nav>
  );
}
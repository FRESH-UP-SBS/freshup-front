'use client';

import { useRouter } from 'next/navigation';
import styles from './MyPage.module.css';
import BottomNav from '@/components/ui/BottomNav';

export default function MyPage() {
  const router = useRouter();

  return (
    <main className={styles.container}>
      <section className={styles.content}>
        <h1 className={styles.title}>My Page</h1>

        <div className={styles.infoList}>
          <p>
            <strong>이세빈</strong>
            <span>|</span>
            <span>ADMIN</span>
          </p>

          <p>
            <strong>금주 남은 청소 횟수 : 2회</strong>
          </p>

          <p>
            <strong>총 벌금 : 5000원</strong>
          </p>

          <p>
            <strong>미정산 벌금 : 5000원</strong>
          </p>
        </div>
      </section>
      <BottomNav active="mypage" />
    </main>
  );
}
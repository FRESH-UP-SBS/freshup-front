'use client';

import BottomNav from '@/components/ui/BottomNav';
import styles from './MyPage.module.css';

export default function MyPage() {
  return (
    <main className={styles.container}>
      <section className={styles.content}>
        <h1 className={styles.title}>My Page</h1>

        <section className={styles.card}>
          <div className={styles.profile}>
            <div className={styles.avatar}>이</div>

            <div>
              <p className={styles.name}>이세빈</p>
              <p className={styles.role}>ADMIN</p>
            </div>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span>금주 남은 청소 횟수</span>
              <strong>2회</strong>
            </div>

            <div className={styles.infoItem}>
              <span>총 벌금</span>
              <strong>5,000원</strong>
            </div>

            <div className={styles.infoItem}>
              <span>미정산 벌금</span>
              <strong className={styles.warning}>5,000원</strong>
            </div>
          </div>
        </section>
      </section>

      <BottomNav active="mypage" />
    </main>
  );
}
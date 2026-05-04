'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/ui/BottomNav';
import styles from './MyPage.module.css';

type MyPageStatsResponse = {
  userId: number;
  name: string;
  role: 'ADMIN' | 'USER';
  weeklyCleanCount: number;
  remainingCleanCount: number;
  totalPenaltyAmount: number;
  unpaidPenaltyAmount: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

// 임시 로그인 사용자 ID
// 현재 TB_USER 기준 이세빈 USER_SEQ = 1
const CURRENT_USER_ID = 1;

export default function MyPage() {
  const [stats, setStats] = useState<MyPageStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyStats = async () => {
    try {
      setIsLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/api/user-stats/${CURRENT_USER_ID}`,
        {
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error('마이페이지 정보 조회 실패');
      }

      const data: MyPageStatsResponse = await res.json();

      setStats(data);
    } catch (error) {
      console.error('마이페이지 정보 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyStats();
  }, []);

  const displayName = stats?.name ?? '';
  const displayRole = stats?.role ?? '';
  const avatarText = displayName ? displayName.charAt(0) : '?';

  return (
    <main className={styles.container}>
      <section className={styles.content}>
        <h1 className={styles.title}>My Page</h1>

        <section className={styles.card}>
          {isLoading ? (
            <p>마이페이지 정보를 불러오는 중입니다.</p>
          ) : stats ? (
            <>
              <div className={styles.profile}>
                <div className={styles.avatar}>{avatarText}</div>

                <div>
                  <p className={styles.name}>{displayName}</p>
                  <p className={styles.role}>{displayRole}</p>
                </div>
              </div>

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span>금주 남은 청소 횟수</span>
                  <strong>{stats.remainingCleanCount}회</strong>
                </div>

                <div className={styles.infoItem}>
                  <span>총 벌금</span>
                  <strong>{stats.totalPenaltyAmount.toLocaleString()}원</strong>
                </div>

                <div className={styles.infoItem}>
                  <span>미정산 벌금</span>
                  <strong className={styles.warning}>
                    {stats.unpaidPenaltyAmount.toLocaleString()}원
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <p>마이페이지 정보를 불러오지 못했습니다.</p>
          )}
        </section>
      </section>

      <BottomNav active="mypage" />
    </main>
  );
}
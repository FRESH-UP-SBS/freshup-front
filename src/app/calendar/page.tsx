'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import styles from '@/components/calendar/calendar.module.css';
import CleaningLogModal from '../../components/calendar/CleaningLogModal';
import { useRouter } from 'next/navigation';
import BottomNav from '../../components/ui/BottomNav';

type CleaningTask = {
  id: number;
  taskName: string;
  memberName: string;
};

const cleaningEvents = [
  {
    date: '2026-04-21',
    tasks: [
      { id: 1, taskName: '바닥', memberName: '이다슬' },
      { id: 2, taskName: '빨래', memberName: '이해슬' },
    ],
  },
  {
    date: '2026-04-23',
    tasks: [
      { id: 3, taskName: '설거지', memberName: '이보슬' },
      { id: 4, taskName: '빨래', memberName: '한현수' },
    ],
  },
  {
    date: '2026-04-24',
    tasks: [
      { id: 5, taskName: '화장실', memberName: '이세빈' },
    ],
  },
];

const penalties = [
  { id: 1, name: '이해슬', amount: 5000, status: '정산필요' },
  { id: 2, name: '한현수', amount: 5000, status: '정산필요' },
  { id: 3, name: '이다슬', amount: 5000, status: '정산필요' },
  { id: 4, name: '이보슬', amount: 5000, status: '정산필요' },
  { id: 5, name: '이세빈', amount: 5000, status: '정산필요' },
];

function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

function getSettlementDday() {
  const today = new Date();
  const day = today.getDay();

  const remainDays = day === 0 ? 0 : 7 - day;

  return remainDays === 0 ? 'D-DAY' : `D-${remainDays}`;
}

export default function CalendarPage() {
  const router = useRouter(); // ✅ 추가

  const [month, setMonth] = useState(new Date(2026, 3, 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const settlementDday = getSettlementDday();

  const getTasks = (date: Date): CleaningTask[] => {
    return cleaningEvents.find((event) => event.date === formatDate(date))?.tasks ?? [];
  };

  return (
    <main className={styles['calendar-page']}>
      <section className={styles['calendar-card']}>
        <div className={styles['calendar-title-row']}>
          <div className={styles['calendar-title-box']}>
            <p>FRESHUP</p>
            <h1>Cleaning Calendar</h1>
          </div>

          <div className={styles['settlement-dday-box']}>
            <strong>{settlementDday}</strong>
          </div>
        </div>

        <DayPicker
          month={month}
          onMonthChange={setMonth}
          showOutsideDays
          weekStartsOn={1}
          className={styles['fresh-calendar']}
          classNames={{
            root: styles['fresh-calendar-root'],
            months: styles['fresh-months'],
            month: styles['fresh-month'],
            month_caption: styles['fresh-caption'],
            caption_label: styles['fresh-caption-label'],
            nav: styles['fresh-nav'],
            button_previous: styles['fresh-nav-button'],
            button_next: styles['fresh-nav-button'],
            month_grid: styles['fresh-grid'],
            weekdays: styles['fresh-weekdays'],
            weekday: styles['fresh-weekday'],
            weeks: styles['fresh-weeks'],
            week: styles['fresh-week'],
            outside: styles['fresh-outside'],
            today: styles['fresh-today'],
          }}
          formatters={{
            formatCaption: (date) =>
              `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`,
            formatWeekdayName: (date) =>
              ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
          }}
          components={{
            Day: ({ day, ...props }) => {
              const tasks = getTasks(day.date);

              const isOutside =
                day.date.getFullYear() !== month.getFullYear() ||
                day.date.getMonth() !== month.getMonth();

              return (
                <td
                  {...props}
                  className={`${styles['fresh-day']} ${
                    isOutside ? styles['fresh-outside-day'] : ''
                  }`}
                >
                  <button
                    type="button"
                    className={styles['fresh-day-button']}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <span className={styles['fresh-day-number']}>
                      {String(day.date.getDate()).padStart(2, '0')}
                    </span>

                    <span className={styles['fresh-task-list']}>
                      {tasks.map((task) => (
                        <span key={task.id} className={styles['fresh-task']}>
                          {task.taskName}({task.memberName})
                        </span>
                      ))}
                    </span>
                  </button>
                </td>
              );
            },

            Chevron: ({ orientation }) =>
              orientation === 'left' ? (
                <span className={styles['nav-icon']}>‹</span>
              ) : (
                <span className={styles['nav-icon']}>›</span>
              ),
          }}
        />

        {selectedDate && (
          <CleaningLogModal
            date={selectedDate}
            logs={getTasks(selectedDate)}
            onClose={() => setSelectedDate(null)}
          />
        )}

        <section className={styles['penalty-section']}>
          <div className={styles['penalty-header']}>
            <h2>Penalty</h2>
            <button type="button" className={styles['penalty-more-btn']}>
              ›
            </button>
          </div>

          <div className={styles['penalty-list']}>
            {penalties.map((penalty) => (
              <label key={penalty.id} className={styles['penalty-row']}>
                <input type="checkbox" className={styles['penalty-checkbox']} />
                <span className={styles['penalty-name']}>{penalty.name}</span>
                <span className={styles['penalty-amount']}>
                  {penalty.amount.toLocaleString()}원
                </span>
                <span className={styles['penalty-status']}>{penalty.status}</span>
              </label>
            ))}
          </div>
        </section>
      </section>
      <BottomNav active="calendar" />
    </main>
  );
}
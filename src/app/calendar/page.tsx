'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { Calendar, User } from 'lucide-react';
import './calendar.css';
import CleaningLogModal from '../../components/calendar/CleaningLogModal';

const cleaningEvents = [
  { date: '2026-04-21', tasks: ['바닥(이다슬)', '빨래(이해슬)'] },
  { date: '2026-04-23', tasks: ['설거지(이보슬)', '빨래(한현수)'] },
  { date: '2026-04-24', tasks: ['화장실(이세빈)'] },
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

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date(2026, 3, 1));

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getTasks = (date: Date) => {
    return cleaningEvents.find((event) => event.date === formatDate(date))?.tasks ?? [];
  };

  return (
    <main className="calendar-page">
      <section className="calendar-card">
        <div className="calendar-title-box">
          <p>FRESHUP</p>
          <h1>Cleaning Calendar</h1>
        </div>

        <DayPicker
          month={month}
          onMonthChange={setMonth}
          showOutsideDays
          weekStartsOn={1}
          className="fresh-calendar"
          classNames={{
            root: 'fresh-calendar-root',
            months: 'fresh-months',
            month: 'fresh-month',
            month_caption: 'fresh-caption',
            caption_label: 'fresh-caption-label',
            nav: 'fresh-nav',
            button_previous: 'fresh-nav-button',
            button_next: 'fresh-nav-button',
            month_grid: 'fresh-grid',
            weekdays: 'fresh-weekdays',
            weekday: 'fresh-weekday',
            weeks: 'fresh-weeks',
            week: 'fresh-week',
            outside: 'fresh-outside',
            today: 'fresh-today',
          }}
          formatters={{
            formatCaption: (date) =>
              `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`,
            formatWeekdayName: (date) =>
              ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
          }}
          components={{
            Day: ({ day }) => {
              const tasks = getTasks(day.date);
            
              return (
                <td className="fresh-day">
                  <button
                    type="button"
                    className="fresh-day-button"
                    onClick={() => {
                      setSelectedDate(day.date);
                      setIsModalOpen(true);
                    }}
                  >
                    <span className="fresh-day-number">
                      {String(day.date.getDate()).padStart(2, '0')}
                    </span>
            
                    <span className="fresh-task-list">
                      {tasks.map((task) => (
                        <span key={task} className="fresh-task">
                          {task}
                        </span>
                      ))}
                    </span>
                  </button>
                </td>
              );
            },
          
            Chevron: ({ orientation }) =>
              orientation === 'left' ? (
                <span className="nav-icon">‹</span>
              ) : (
                <span className="nav-icon">›</span>
              ),

              DayButton: ({ day, ...props }) => {
                return (
                  <button
                    {...props}
                    type="button"
                    className="fresh-day-button"
                    onClick={() => {
                      setSelectedDate(day.date);   // 날짜 저장
                      setIsModalOpen(true);        // 모달 열기
                    }}
                  >
                    {day.date.getDate()}
                  </button>
                );
              }
          }}
        />

        {isModalOpen && selectedDate && (
          <CleaningLogModal
            date={selectedDate}
            logs={
              cleaningEvents.find(
                (e) => e.date === formatDate(selectedDate)
              )?.tasks.map((t, i) => ({
                id: i,
                taskName: t.split('(')[0],
                memberName: t.split('(')[1]?.replace(')', ''),
              })) ?? []
            }
            onClose={() => setIsModalOpen(false)}
          />
        )}

        <section className="penalty-section">
          <div className="penalty-header">
            <h2>Penalty</h2>
            <button className="penalty-more-btn">›</button>
          </div>

          <div className="penalty-list">
            {penalties.map((penalty) => (
              <label key={penalty.id} className="penalty-row">
                <input type="checkbox" className="penalty-checkbox" />
                <span className="penalty-name">{penalty.name}</span>
                <span className="penalty-amount">
                  {penalty.amount.toLocaleString()}원
                </span>
                <span className="penalty-status">{penalty.status}</span>
              </label>
            ))}
          </div>
        </section>
      </section>

      <nav className="bottom-nav">
        <button type="button" className="bottom-nav-button">
          <Calendar size={28} />
        </button>

        <button type="button" className="bottom-nav-button">
          <User size={28} />
        </button>
      </nav>
    </main>
  );
}
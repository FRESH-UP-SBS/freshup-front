'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { Calendar, User } from 'lucide-react';
import './calendar.css';

const cleaningEvents = [
  { date: '2026-04-09', tasks: ['바닥(이다솔)', '빨래(한현수)'] },
  { date: '2026-04-11', tasks: ['설거지(이세빈)', '빨래(이해솔)'] },
  { date: '2026-04-13', tasks: ['화장실(이보슬)'] },
];

function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date(2026, 3, 1));

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
            day: 'fresh-day',
            day_button: 'fresh-day-button',
            outside: 'fresh-outside',
            day_outside: 'fresh-outside',
            today: 'fresh-today',
          }}
          formatters={{
            formatCaption: (date) =>
              `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`,
            formatWeekdayName: (date) =>
              ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
          }}
          components={{
            Day: (props: any) => {
              const isOutside =
                props.day.date.getFullYear() !== month.getFullYear() ||
                props.day.date.getMonth() !== month.getMonth();
          
              return (
                <td
                  {...props}
                  className={`fresh-day ${isOutside ? 'is-outside-cell' : ''}`}
                />
              );
            },
          
            DayButton: ({ day, ...props }) => {
              const tasks = getTasks(day.date);
          
              return (
                <button {...props} type="button" className="fresh-day-button">
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
              );
            },
          
            Chevron: ({ orientation }) =>
              orientation === 'left' ? (
                <span className="nav-icon">‹</span>
              ) : (
                <span className="nav-icon">›</span>
              ),
          }}
        />
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
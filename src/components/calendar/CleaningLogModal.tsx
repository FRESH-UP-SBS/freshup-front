'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Pencil, Trash2, Plus, X, Check } from 'lucide-react';

type CleaningLog = {
  id: number;
  taskName: string;
  memberName: string;
};

type CleaningLogModalProps = {
  date: Date;
  logs: CleaningLog[];
  onClose: () => void;
};

const workOptions = ['바닥', '빨래', '설거지', '화장실'];

export default function CleaningLogModal({
  date,
  logs,
  onClose,
}: CleaningLogModalProps) {
  const [isAddMode, setIsAddMode] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState('');
  const [isWorkDropdownOpen, setIsWorkDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const month = date.getMonth() + 1;
  const day = date.getDate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsWorkDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="cleaning-modal-backdrop">
      <section className="cleaning-modal">
        <header className="cleaning-modal-header">
          <h2>
            {month}.{String(day).padStart(2, '0')}
          </h2>
        </header>

        <button type="button" className="cleaning-close-btn" onClick={onClose}>
          <X size={22} />
        </button>

        <div className="cleaning-modal-body">
          <div className="cleaning-log-list">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="cleaning-log-row">
                  <p>
                    {log.taskName}({log.memberName})
                  </p>

                  <div className="cleaning-log-actions">
                    <button type="button" className="cleaning-action-btn">
                      <Pencil size={18} />
                    </button>

                    <button type="button" className="cleaning-action-btn danger">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="cleaning-empty">등록된 청소 기록이 없습니다.</p>
            )}
          </div>

          {!isAddMode && (
            <button
                type="button"
                className="cleaning-inline-add-btn"
                onClick={() => {
                setIsAddMode(true);
                setIsWorkDropdownOpen(false);
                }}
            >
                <Plus size={24} />
            </button>
          )}

          {isAddMode && (
            <div className="cleaning-dropdown-row" ref={dropdownRef}>
              <div className="cleaning-dropdown-wrap">
                <button
                  type="button"
                  className="cleaning-dropdown-button"
                  onClick={() => setIsWorkDropdownOpen((prev) => !prev)}
                >
                  <span className={!selectedWork ? 'placeholder' : ''}>
                    {selectedWork || '업무를 선택하세요'}
                  </span>

                  <ChevronDown
                    size={22}
                    className={`cleaning-dropdown-icon ${
                      isWorkDropdownOpen ? 'open' : ''
                    }`}
                  />
                </button>

                {isWorkDropdownOpen && (
                  <ul className="cleaning-dropdown-list">
                    {workOptions.map((work) => (
                      <li key={work}>
                        <button
                          type="button"
                          className={`cleaning-dropdown-option ${
                            selectedWork === work ? 'selected' : ''
                          }`}
                          onClick={() => {
                            setSelectedWork(work);
                            setIsWorkDropdownOpen(false);
                          }}
                        >
                          {work}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <button type="button" className="cleaning-save-icon-btn">
                  <Check size={22} />
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="cleaning-modal-icon-btn"
          onClick={() => setIsAdminModalOpen(true)}
        >
          <Plus size={28} />
        </button>

        {isAdminModalOpen && (
          <div className="cleaning-admin-mini-modal">
            <div className="cleaning-admin-mini-box">
              <button
                type="button"
                className="cleaning-admin-close"
                onClick={() => setIsAdminModalOpen(false)}
              >
                <X size={18} />
              </button>
              <strong>청소 업무 관리</strong>
              <p>청소 업무 추가/수정/삭제 모달 자리입니다.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
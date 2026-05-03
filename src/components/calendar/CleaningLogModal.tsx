'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Pencil, Trash2, Plus, X, Check } from 'lucide-react';
import CleaningTaskAdminModal from './CleaningTaskAdminModal';
import styles from './calendar.module.css';

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
  const [modalMode, setModalMode] = useState<'log' | 'admin'>('log');
  const [localLogs, setLocalLogs] = useState<CleaningLog[]>(logs);

  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedWork, setSelectedWork] = useState('');
  const [isWorkDropdownOpen, setIsWorkDropdownOpen] = useState(false);

  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const month = date.getMonth() + 1;
  const day = date.getDate();

  useEffect(() => {
    setLocalLogs(logs);
  }, [logs]);

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

  const handleChangeAdminMode = () => {
    setModalMode('admin');
    setIsAddMode(false);
    setIsWorkDropdownOpen(false);
    setEditingLogId(null);
    setIsEditDropdownOpen(false);
  };

  const handleChangeLogMode = () => {
    setModalMode('log');
  };

  const handleStartEdit = (log: CleaningLog) => {
    setEditingLogId(log.id);
    setEditTaskName(log.taskName);

    setIsAddMode(false);
    setSelectedWork('');
    setIsWorkDropdownOpen(false);
    setIsEditDropdownOpen(false);
  };

  const handleSaveEdit = () => {
    if (editingLogId === null || !editTaskName.trim()) return;

    setLocalLogs((prev) =>
      prev.map((log) =>
        log.id === editingLogId ? { ...log, taskName: editTaskName } : log
      )
    );

    setEditingLogId(null);
    setEditTaskName('');
    setIsEditDropdownOpen(false);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteTargetId(id);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId === null) return;

    setLocalLogs((prev) => prev.filter((log) => log.id !== deleteTargetId));
    setDeleteTargetId(null);
    setIsAlertOpen(false);
  };

  const handleCancelDelete = () => {
    setDeleteTargetId(null);
    setIsAlertOpen(false);
  };

  return (
    <div className={styles['cleaning-modal-backdrop']} onClick={onClose}>
      <section
        className={styles['cleaning-modal']}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles['cleaning-modal-header']}>
          <h2>
            {modalMode === 'log'
              ? `${month}.${String(day).padStart(2, '0')}`
              : 'Work'}
          </h2>

          <div className={styles['cleaning-header-actions']}>
            {modalMode === 'log' && (
              <button
                type="button"
                className={styles['cleaning-admin-btn']}
                onClick={handleChangeAdminMode}
              >
                Admin Mode
              </button>
            )}

            {modalMode === 'admin' && (
              <button
                type="button"
                className={styles['cleaning-admin-btn']}
                onClick={handleChangeLogMode}
              >
                Schedule Mode
              </button>
            )}

            <button
              type="button"
              className={styles['cleaning-close-btn']}
              onClick={onClose}
            >
              <X size={22} />
            </button>
          </div>
        </header>

        <div className={styles['cleaning-modal-body']}>
          {modalMode === 'log' && (
            <>
              <div className={styles['cleaning-log-list']}>
                {localLogs.length > 0 ? (
                  localLogs.map((log) => (
                    <div key={log.id} className={styles['cleaning-log-row']}>
                      {editingLogId === log.id ? (
                        <div className={styles['cleaning-log-edit-wrap']}>
                          <button
                            type="button"
                            className={styles['cleaning-log-edit-button']}
                            onClick={() =>
                              setIsEditDropdownOpen((prev) => !prev)
                            }
                          >
                            <span>{editTaskName || '업무를 선택하세요'}</span>

                            <ChevronDown
                              size={22}
                              className={`${styles['cleaning-log-edit-icon']} ${
                                isEditDropdownOpen ? styles.open : ''
                              }`}
                            />
                          </button>

                          {isEditDropdownOpen && (
                            <ul className={styles['cleaning-log-edit-list']}>
                              {workOptions.map((work) => (
                                <li key={work}>
                                  <button
                                    type="button"
                                    className={`${styles['cleaning-log-edit-option']} ${
                                      editTaskName === work
                                        ? styles.selected
                                        : ''
                                    }`}
                                    onClick={() => {
                                      setEditTaskName(work);
                                      setIsEditDropdownOpen(false);
                                    }}
                                  >
                                    {work}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <p>
                          {log.taskName}({log.memberName})
                        </p>
                      )}

                      <div className={styles['cleaning-log-actions']}>
                        {editingLogId === log.id ? (
                          <button
                            type="button"
                            className={styles['cleaning-action-btn']}
                            onClick={handleSaveEdit}
                          >
                            <Check size={18} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles['cleaning-action-btn']}
                            onClick={() => handleStartEdit(log)}
                          >
                            <Pencil size={18} />
                          </button>
                        )}

                        <button
                          type="button"
                          className={`${styles['cleaning-action-btn']} ${styles.danger}`}
                          onClick={() => handleDeleteClick(log.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles['cleaning-empty']}>
                    등록된 청소 기록이 없습니다.
                  </p>
                )}
              </div>

              {isAddMode && (
                <div
                  className={styles['cleaning-dropdown-row']}
                  ref={dropdownRef}
                >
                  <div className={styles['cleaning-dropdown-wrap']}>
                    <button
                      type="button"
                      className={styles['cleaning-dropdown-button']}
                      onClick={() => setIsWorkDropdownOpen((prev) => !prev)}
                    >
                      <span className={!selectedWork ? styles.placeholder : ''}>
                        {selectedWork || '업무를 선택하세요'}
                      </span>

                      <ChevronDown
                        size={22}
                        className={`${styles['cleaning-dropdown-icon']} ${
                          isWorkDropdownOpen ? styles.open : ''
                        }`}
                      />
                    </button>

                    {isWorkDropdownOpen && (
                      <ul className={styles['cleaning-dropdown-list']}>
                        {workOptions.map((work) => (
                          <li key={work}>
                            <button
                              type="button"
                              className={`${styles['cleaning-dropdown-option']} ${
                                selectedWork === work ? styles.selected : ''
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
                  </div>

                  <button
                    type="button"
                    className={styles['cleaning-log-save-btn']}
                  >
                    <Check size={22} />
                  </button>
                </div>
              )}

              <button
                type="button"
                className={`${styles['cleaning-modal-icon-btn']} ${
                  isAddMode || editingLogId !== null
                    ? styles['close-mode']
                    : ''
                }`}
                onClick={() => {
                  if (isAddMode || editingLogId !== null) {
                    setIsAddMode(false);
                    setEditingLogId(null);
                    setEditTaskName('');
                    setSelectedWork('');
                    setIsWorkDropdownOpen(false);
                    setIsEditDropdownOpen(false);
                    return;
                  }

                  setIsAddMode(true);
                }}
              >
                <Plus size={28} />
              </button>
            </>
          )}

          {modalMode === 'admin' && <CleaningTaskAdminModal />}
        </div>

        {isAlertOpen && (
          <div className={styles['custom-alert-backdrop']}>
            <div className={styles['custom-alert']}>
              <p>해당 업무를 삭제하시겠습니까?</p>

              <div className={styles['custom-alert-actions']}>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={handleCancelDelete}
                >
                  취소
                </button>

                <button
                  type="button"
                  className={styles.confirm}
                  onClick={handleConfirmDelete}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
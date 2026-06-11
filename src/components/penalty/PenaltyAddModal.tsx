'use client';
import { useState } from 'react';
import { Button, SelectPicker } from 'rsuite';

type MemberOption = {
    value: number;
    label: string;
};

type Props = {
    mode?: 'add' | 'edit';
    initialUserId?: number;
    initialAmount?: number;
    members: MemberOption[];
    onClose: () => void;
    onSubmit: (userId: number, amount: number) => Promise<void>;
};

export default function PenaltyAddModal({
    mode = 'add',
    initialUserId,
    initialAmount,
    members,
    onClose,
    onSubmit,
}: Props) {
    const [selectedUserId, setSelectedUserId] = useState<number | null>(initialUserId ?? null);
    const [amount, setAmount] = useState<string>(initialAmount ? String(initialAmount) : '');
    const [loading, setLoading] = useState(false);

    const isEdit = mode === 'edit';

    const handleSubmit = async () => {
        if (selectedUserId === null || !amount || Number(amount) <= 0) {
            alert('회원과 금액을 올바르게 입력해주세요.');
            return;
        }
        setLoading(true);
        try {
            await onSubmit(selectedUserId, Number(amount));
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-lg p-6 w-80 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold text-gray-800">
                    {isEdit ? '벌금 수정' : '벌금 등록'}
                </h3>

                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">회원 선택</label>
                    <SelectPicker
                        data={members}
                        value={selectedUserId}
                        onChange={(value) => setSelectedUserId(value)}
                        searchable={false}
                        placeholder="회원을 선택하세요"
                        block
                        container={() => document.body}
                        style={{ zIndex: 9999 }}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">금액 (원)</label>
                    <input
                        type="number"
                        min={0}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="금액을 입력하세요"
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                <div className="flex justify-end gap-2 mt-2">
                    <Button onClick={onClose} disabled={loading}>취소</Button>
                    <Button
                        appearance="primary"
                        onClick={handleSubmit}
                        loading={loading}
                        style={{ backgroundColor: '#1B3A6B', border: 'none' }}
                    >
                        {isEdit ? '수정' : '등록'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

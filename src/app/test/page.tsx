'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [data, setData] = useState('');

  useEffect(() => {
    fetch('http://localhost:8080/api/test')
      .then(res => res.text())
      .then(setData)
      .catch(() => setData('연결 실패'));
  }, []);

  return (
    <div>
      <h1>프론트 → 백엔드 테스트</h1>
      <p>{data}</p>
    </div>
  );
}
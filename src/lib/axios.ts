import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true, // 🔥 쿠키 자동 전송
    headers: { 'Content-Type': 'application/json' },
});

export default api;
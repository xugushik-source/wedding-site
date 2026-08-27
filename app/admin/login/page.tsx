'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const data = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.get('email') || ''),
      password: String(data.get('password') || ''),
    });

    setLoading(false);
    if (error) {
      setError('Неверный email или пароль.');
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold mb-6">Вход в админку сайта</h1>
        <div>
          <label htmlFor="email" className="block text-sm mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm mb-1">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {loading ? 'Входим…' : 'Войти'}
        </button>
        <p className="text-xs text-gray-500 pt-2">
          Логин создаётся один раз в Supabase → Authentication → Users → Add user
          (см. README, раздел «Настройка под нового клиента»).
        </p>
      </form>
    </div>
  );
}

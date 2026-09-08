'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      setLoading(false);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className="join-screen">
      <div className="join-card">
        <p className="eyebrow">Suomi Watch</p>
        <h1>Join the pool</h1>
        <p className="subtitle">
          Pick your top 10 predicted Finnish points leaders for 2026-27 and see how you rank
          against everyone else.
        </p>
        <form onSubmit={handleJoin}>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Elina"
            required
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Joining…' : 'Join pool'}
          </button>
        </form>
      </div>
    </main>
  );
}

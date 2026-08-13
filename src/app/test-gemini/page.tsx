'use client';

import { useState, useEffect } from 'react';

export default function TestGeminiPage() {
  const [apiKey, setApiKey] = useState<string>('');
  const [inputKey, setInputKey] = useState<string>('');
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>('hello');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) {
      setApiKey(stored);
      setHasKey(true);
    }
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    localStorage.setItem('gemini_api_key', inputKey.trim());
    setApiKey(inputKey.trim());
    setHasKey(true);
    setInputKey('');
    setError('');
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setHasKey(false);
    setAiResponse('');
    setError('');
  };

  const handleTestAI = async () => {
    setLoading(true);
    setError('');
    setAiResponse('');

    try {
      const res = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKey }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to test Gemini API');
      }

      setAiResponse(data.response);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Gemini AI Test Page</h1>
          <p className="text-neutral-400">
            Verify your Google Gemini API key and test AI connectivity.
          </p>
        </div>

        {!hasKey ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-semibold">Enter Gemini API Key</h2>
            <p className="text-sm text-neutral-400">
              No Gemini API key found in local storage. Please enter your API key below to proceed.
            </p>
            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 font-medium py-3 rounded-lg transition-colors cursor-pointer"
              >
                Save API Key
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="font-medium text-emerald-400">API Key Configured</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">Stored securely in browser localStorage</p>
              </div>
              <button
                onClick={handleClearKey}
                className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Change Key
              </button>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-4">
              <h2 className="text-xl font-semibold">Test AI Prompt</h2>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Prompt message</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleTestAI}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-medium px-6 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {loading ? 'Sending...' : 'Send Hello'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-950/50 border border-red-900/50 text-red-300 p-4 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {aiResponse && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-neutral-400">AI Response:</h3>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-neutral-200 whitespace-pre-wrap leading-relaxed">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

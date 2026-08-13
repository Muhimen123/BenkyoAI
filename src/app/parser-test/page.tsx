'use client';

import React, { useEffect, useState } from 'react';
import { useVaultStore } from '../../store/useVaultStore';
import { VaultItem } from '../../lib/types';
import { parseMaterial, ParserType, ParseResult } from '../../lib/parsers';

function VaultFileSelectorItem({
  item,
  onSelect,
  selectedPath,
}: {
  item: VaultItem;
  onSelect: (path: string) => void;
  selectedPath: string | null;
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (item.kind === 'directory') {
    return (
      <div className="pl-2 my-1">
        <div
          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-sm font-medium"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{isOpen ? '📂' : '📁'}</span>
          <span>{item.name}</span>
        </div>
        {isOpen && item.children && (
          <div className="border-l border-zinc-200 dark:border-zinc-800 ml-2 pl-2">
            {item.children.map((child) => (
              <VaultFileSelectorItem
                key={child.path}
                item={child}
                onSelect={onSelect}
                selectedPath={selectedPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedPath === item.path;

  return (
    <div
      onClick={() => onSelect(item.path)}
      className={`flex items-center gap-2 py-1.5 px-2 my-0.5 rounded text-sm cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-900'
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
      }`}
    >
      <span>📄</span>
      <span className="truncate flex-1">{item.name}</span>
      {item.size && (
        <span className="text-xs text-zinc-400">
          {(item.size / 1024).toFixed(1)} KB
        </span>
      )}
    </div>
  );
}

export default function ParserTestPage() {
  const { items, loadVault } = useVaultStore();

  const [inputSourceMode, setInputSourceMode] = useState<'vault' | 'paste' | 'upload'>('vault');
  const [selectedVaultPath, setSelectedVaultPath] = useState<string | null>(null);
  const [pastedTextOrUrl, setPastedTextOrUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [parserType, setParserType] = useState<ParserType>('auto');
  const [useAiCleanup, setUseAiCleanup] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.5-flash-lite');

  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadVault();
    // Load API key from local storage if stored by onboarding
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, [loadVault]);

  const handleParse = async () => {
    setIsParsing(true);
    setError(null);
    setParseResult(null);

    try {
      let inputToParse: File | string = '';

      if (inputSourceMode === 'vault') {
        if (!selectedVaultPath) {
          throw new Error('Please select a file from the OPFS vault.');
        }
        // Read raw binary File object directly from OPFS vault to preserve binary files (e.g. PDFs)
        const { getVaultFile } = await import('../../lib/vault');
        inputToParse = await getVaultFile(selectedVaultPath);
      } else if (inputSourceMode === 'paste') {
        if (!pastedTextOrUrl.trim()) {
          throw new Error('Please enter text or a YouTube URL to parse.');
        }
        inputToParse = pastedTextOrUrl.trim();
      } else if (inputSourceMode === 'upload') {
        if (!uploadedFile) {
          throw new Error('Please select a local file to upload and parse.');
        }
        inputToParse = uploadedFile;
      }

      const result = await parseMaterial(inputToParse, {
        type: parserType,
        apiKey: apiKey.trim() || undefined,
        useAiCleanup,
        model,
      });

      setParseResult(result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setIsParsing(false);
    }
  };

  const handleCopy = () => {
    if (parseResult?.text) {
      navigator.clipboard.writeText(parseResult.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-bold font-serif">⚙️ Universal File & Material Parser Playground</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Test and inspect multimodal parsers (Text, YouTube, PDF, PPTX) linked with the OPFS Vault and Gemini AI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/vault-test"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            🗄️ Vault Explorer
          </a>
          <a
            href="/"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            ← Back to App
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Source & Parser Config */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Input Source Selector Card */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              1. Choose Input Source
            </h2>

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-sm font-medium">
              <button
                onClick={() => setInputSourceMode('vault')}
                className={`py-2 rounded-lg transition-colors ${
                  inputSourceMode === 'vault'
                    ? 'bg-white dark:bg-zinc-900 shadow-xs text-blue-600 dark:text-blue-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                🗄️ OPFS Vault
              </button>
              <button
                onClick={() => setInputSourceMode('paste')}
                className={`py-2 rounded-lg transition-colors ${
                  inputSourceMode === 'paste'
                    ? 'bg-white dark:bg-zinc-900 shadow-xs text-blue-600 dark:text-blue-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                📋 Paste / URL
              </button>
              <button
                onClick={() => setInputSourceMode('upload')}
                className={`py-2 rounded-lg transition-colors ${
                  inputSourceMode === 'upload'
                    ? 'bg-white dark:bg-zinc-900 shadow-xs text-blue-600 dark:text-blue-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                📤 Upload File
              </button>
            </div>

            {/* Mode Content */}
            {inputSourceMode === 'vault' && (
              <div className="flex flex-col gap-2">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select a file from your browser Origin Private File System (OPFS) vault:
                </div>
                <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 bg-zinc-50 dark:bg-zinc-950">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-xs text-zinc-400">
                      Vault is empty. Visit <a href="/vault-test" className="text-blue-600 underline">Vault Explorer</a> to add files.
                    </div>
                  ) : (
                    items.map((item) => (
                      <VaultFileSelectorItem
                        key={item.path}
                        item={item}
                        onSelect={setSelectedVaultPath}
                        selectedPath={selectedVaultPath}
                      />
                    ))
                  )}
                </div>
                {selectedVaultPath && (
                  <div className="text-xs font-mono bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 p-2 rounded-lg border border-blue-200 dark:border-blue-900 truncate">
                    Selected: {selectedVaultPath}
                  </div>
                )}
              </div>
            )}

            {inputSourceMode === 'paste' && (
              <div className="flex flex-col gap-2">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Paste raw study notes, article text, or a YouTube video URL/ID:
                </div>
                <textarea
                  value={pastedTextOrUrl}
                  onChange={(e) => setPastedTextOrUrl(e.target.value)}
                  placeholder="Paste text or YouTube URL (e.g. https://youtube.com/watch?v=...)"
                  rows={6}
                  className="p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm font-mono focus:outline-blue-600 resize-none"
                />
              </div>
            )}

            {inputSourceMode === 'upload' && (
              <div className="flex flex-col gap-2">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select a local file (Text, Markdown, PDF, PPTX):
                </div>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedFile(e.target.files[0]);
                    }
                  }}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300 text-sm text-zinc-500 border border-zinc-300 dark:border-zinc-700 rounded-xl p-2"
                />
                {uploadedFile && (
                  <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg">
                    Selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Parser Config Card */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              2. Parser & AI Settings
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Parser Engine</label>
              <select
                value={parserType}
                onChange={(e) => setParserType(e.target.value as ParserType)}
                className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-blue-600"
              >
                <option value="auto">Auto-Detect (Based on input)</option>
                <option value="text">Plain Text / Markdown / Code</option>
                <option value="youtube">YouTube Transcript (Stub)</option>
                <option value="pdf">PDF Document</option>
                <option value="pptx">PowerPoint Presentation (Stub)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <div>
                <div className="text-sm font-medium">✨ AI-Powered Cleanup / Synthesis</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">Use Gemini to generate comprehensive Markdown notes</div>
              </div>
              <input
                type="checkbox"
                checked={useAiCleanup}
                onChange={(e) => setUseAiCleanup(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            {useAiCleanup && (
              <div className="flex flex-col gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Gemini API Key (BYOK)</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm font-mono focus:outline-blue-600"
                  />
                  <span className="text-[11px] text-zinc-400">Falls back to server environment key if empty.</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-blue-600 font-mono"
                  >
                    <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite</option>
                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                    <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                    <option value="gemini-3.6-flash">gemini-3.6-flash</option>
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={isParsing}
              className="mt-2 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isParsing ? (
                <>
                  <span className="animate-spin">⏳</span> Parsing Material...
                </>
              ) : (
                <>
                  🚀 Parse Material Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Parse Output & Metadata */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-4 rounded-2xl text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} className="font-bold text-xs px-2 py-1 hover:bg-red-200 dark:hover:bg-red-900 rounded">
                Dismiss
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col flex-1 min-h-[600px]">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4">
              <div>
                <h2 className="font-bold text-lg">Parsed Output Result</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {parseResult ? `Title: ${parseResult.title}` : 'Run a parser to inspect output text and metadata'}
                </p>
              </div>
              {parseResult && (
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors"
                >
                  <span>{copied ? '✅' : '📋'}</span> {copied ? 'Copied!' : 'Copy Text'}
                </button>
              )}
            </div>

            {parseResult ? (
              <div className="flex flex-col gap-4 flex-1">
                {parseResult.warnings && parseResult.warnings.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex flex-col gap-1">
                    <span className="font-semibold">Notice:</span>
                    {parseResult.warnings.map((w, idx) => (
                      <span key={idx}>• {w}</span>
                    ))}
                  </div>
                )}

                {parseResult.metadata && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
                    <div>
                      <span className="text-zinc-400 block">Source Type</span>
                      <span className="font-semibold uppercase">{parseResult.metadata.sourceType}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Character Count</span>
                      <span className="font-semibold">{parseResult.text.length.toLocaleString()} chars</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Word Count</span>
                      <span className="font-semibold">{parseResult.text.split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Original Size</span>
                      <span className="font-semibold">
                        {parseResult.metadata.size ? `${(Number(parseResult.metadata.size) / 1024).toFixed(1)} KB` : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-medium text-zinc-500 mb-1">Extracted Text Content:</label>
                  <textarea
                    readOnly
                    value={parseResult.text}
                    className="flex-1 font-mono text-xs p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 resize-none min-h-[400px] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-zinc-400">
                <span className="text-4xl mb-2">📄</span>
                <p className="text-sm font-medium">No parsed content yet</p>
                <p className="text-xs text-zinc-400 mt-1">Select an OPFS file, paste text/URL, or upload a file and click Parse.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

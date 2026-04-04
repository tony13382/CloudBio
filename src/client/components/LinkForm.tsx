import { useState } from "react";

type Props = {
  onSubmit: (title: string, url: string) => Promise<void>;
  onCancel: () => void;
  initialTitle?: string;
  initialUrl?: string;
  submitLabel?: string;
};

export default function LinkForm({
  onSubmit,
  onCancel,
  initialTitle = "",
  initialUrl = "",
  submitLabel = "新增連結",
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit(title, url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-5 space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition text-sm"
          placeholder="我的網站"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">網址</label>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition text-sm"
          placeholder="https://example.com"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition"
        >
          {loading ? "處理中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

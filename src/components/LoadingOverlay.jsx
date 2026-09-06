export default function LoadingOverlay({ message }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="flex items-center gap-3 rounded-xl2 bg-surface px-6 py-5 shadow-card">
        <span className="h-5 w-5 flex-shrink-0 animate-spin rounded-full border-2 border-brand-100 border-t-brand-500" />
        <p className="text-sm font-medium text-ink">{message}</p>
      </div>
    </div>
  );
}

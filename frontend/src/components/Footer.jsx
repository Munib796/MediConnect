export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-light/20 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold text-ink">MediConnect</span>
          </div>
          <p>Finding the right doctor, without asking around.</p>
        </div>
        <p className="mt-6 text-xs text-slate-light">© {new Date().getFullYear()} MediConnect. All rights reserved.</p>
      </div>
    </footer>
  );
}

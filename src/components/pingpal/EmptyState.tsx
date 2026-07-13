type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-cyan-500/15 via-violet-500/15 to-fuchsia-500/15 shadow-[0_0_40px_rgba(139,92,246,0.2)] ring-1 ring-white/10"
        style={{ animation: "pp-float 4s ease-in-out infinite" }}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="pp-brand-text font-semibold text-lg">{title}</h3>
        <p className="max-w-70 text-slate-400 text-sm">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

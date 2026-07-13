type TypingIndicatorProps = {
  userIds: string[];
  isGroup?: boolean;
  userNames?: Record<string, string>;
};

export default function TypingIndicator({
  userIds,
  isGroup,
  userNames = {},
}: TypingIndicatorProps) {
  if (userIds.length === 0) return null;

  let label: string;
  if (!isGroup) {
    label = "typing…";
  } else if (userIds.length === 1) {
    const name = userNames[userIds[0]] ?? "Someone";
    label = `${name} is typing`;
  } else {
    label = `${userIds.length} people are typing`;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400"
            style={{ animation: `pp-orb 1s ease-in-out ${i * 0.15}s infinite` }}
          />
        ))}
      </div>
      <span className="text-slate-400 text-xs">{label}</span>
    </div>
  );
}

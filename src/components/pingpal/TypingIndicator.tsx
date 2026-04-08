type TypingIndicatorProps = {
  userIds: string[]; // list of userIds currently typing
};

export default function TypingIndicator({ userIds }: TypingIndicatorProps) {
  if (userIds.length === 0) return null;

  const label = userIds.length === 1 ? "Someone is typing" : `${userIds.length} people are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      {/* Animated dots */}
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
          />
        ))}
      </div>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}

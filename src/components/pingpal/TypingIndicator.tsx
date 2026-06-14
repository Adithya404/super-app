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

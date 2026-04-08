type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">{icon}</div>
      <div className="space-y-1">
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="max-w-70 text-muted-foreground text-sm">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

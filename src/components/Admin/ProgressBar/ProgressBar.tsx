type ProgressBarProps = {
  loading: boolean;
};

export function ProgressBar({loading}: ProgressBarProps) {
  if (!loading) return null;

  return (
    <div className="fixed top-0 left-64 right-0 h-1 z-50 overflow-hidden bg-primary/20">
      <div className="h-full bg-primary animate-progress-bar" />
    </div>
  );
}

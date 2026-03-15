export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Branding */}
      <div className="hidden items-center justify-center bg-muted p-10 lg:flex">
        <div className="max-w-md space-y-6 text-center">
          <h1 className="font-bold text-4xl">Super Portal</h1>

          <p className="text-muted-foreground">
            Access all internal applications from a single secure platform.
          </p>
        </div>
      </div>

      {/* Right Auth */}
      <div className="flex items-center justify-center p-6">{children}</div>
    </div>
  );
}

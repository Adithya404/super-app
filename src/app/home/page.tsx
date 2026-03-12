export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="font-bold text-xl">Super Portal</h1>

          <div className="space-x-4">
            <a href="/login" className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">
              Sign In
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h2 className="font-bold text-4xl tracking-tight">One Portal. Many Internal Tools.</h2>

        <p className="mt-6 text-gray-600 text-lg">
          Super Portal is a central platform that brings together internal apps, services, and tools
          into a single unified interface.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <a href="/login" className="rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800">
            Access Portal
          </a>

          <a href="#apps" className="rounded-md border px-6 py-3 hover:bg-gray-100">
            Explore Apps
          </a>
        </div>
      </section>

      {/* Apps Section */}
      <section id="apps" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h3 className="text-center font-semibold text-2xl">Available Services</h3>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border p-6">
              <h4 className="font-semibold">Analytics Dashboard</h4>
              <p className="mt-2 text-gray-600 text-sm">
                Access internal analytics and reporting tools.
              </p>
            </div>

            <div className="rounded-lg border p-6">
              <h4 className="font-semibold">Admin Tools</h4>
              <p className="mt-2 text-gray-600 text-sm">
                Manage system settings and internal configurations.
              </p>
            </div>

            <div className="rounded-lg border p-6">
              <h4 className="font-semibold">Service Hub</h4>
              <p className="mt-2 text-gray-600 text-sm">
                Discover and access all internal services from one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-6 text-gray-600 text-sm">
          © {new Date().getFullYear()} Super Portal
        </div>
      </footer>
    </main>
  );
}

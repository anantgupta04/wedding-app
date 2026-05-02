import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 px-4 text-center">
      <div className="max-w-lg space-y-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Shaadi Planner
          </h1>
          <p className="text-xl text-gray-600">
            Plan your perfect wedding. All in one place.
          </p>
        </div>
        <p className="text-gray-500 text-base leading-relaxed">
          Guest lists, RSVPs, tasks, vendors, budgets — and a beautiful digital invite your family can share on WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-full bg-purple-600 px-8 py-3 text-white font-medium hover:bg-purple-700 transition-colors"
          >
            Get started — it&apos;s free
          </Link>
        </div>
      </div>
    </div>
  )
}

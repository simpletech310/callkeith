import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Icons.care className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Onward.ai
            </span>
          </div>
          <nav className="flex items-center gap-6">

            <Link
              href="/login"
              className="group flex items-center gap-2 text-sm font-semibold leading-6 text-slate-600 transition-colors hover:text-emerald-600"
            >
              Sign In <span aria-hidden="true">&rarr;</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative isolate overflow-hidden pt-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl py-24 sm:py-32 lg:py-40">
              <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-slate-500 ring-1 ring-slate-900/10 hover:ring-slate-900/20">
                  Built <strong>Mobile First</strong>. Ready to help.
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-7xl">
                  Call Keith.
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                  Your neighborhood friend that gets you connected. No forms, no stress. Just help.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    href="/keith"
                    className="rounded-md bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  >
                    Call Keith
                  </Link>

                </div>
              </div>
            </div>
          </div>
        </div>



        {/* How It Works (Seeker Journey) */}
        <div className="bg-white py-24 sm:py-32 border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How it works for you</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Navigating social services can be overwhelming. Just tell Keith what you need like you're talking to a friend—no complex forms required. We verify valid programs from an unlimited list of resources to connect you to real help, fast.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-2xl">
                    1
                  </div>
                  <dt className="text-xl font-semibold leading-7 text-slate-900">Call Keith</dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">Just start talking. Explain your situation in your own words. Keith is like a friendly neighbor who knows all the right people.</p>
                  </dd>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-2xl">
                    2
                  </div>
                  <dt className="text-xl font-semibold leading-7 text-slate-900">Get Matches</dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">Our system instantly searches thousands of local programs (housing, job training, legal aid) to find the ones you actually qualify for.</p>
                  </dd>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-2xl">
                    3
                  </div>
                  <dt className="text-xl font-semibold leading-7 text-slate-900">Get Connected</dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">No more phone tag. You'll get a Dashboard to track every application, upload documents once, and see your status in real-time.</p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Become a Resource (Provider Journey) */}
        <div className="bg-slate-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Partner with purpose.</h2>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                Are you a nonprofit or government agency? Join our network to receive pre-screened, verified intake packets. Stop drowning in phone calls and start focusing on case management.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link
                  href="/organization/login"
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Become a Partner
                </Link>
                <a href="mailto:partners@onward.ai" className="text-sm font-semibold leading-6 text-white">
                  Contact Us <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-slate-500">
              &copy; {new Date().getFullYear()} Onward.ai. A Simpletech Solutions Initiative. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

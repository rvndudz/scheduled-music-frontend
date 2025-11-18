import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[90vh] max-w-5xl items-center justify-center px-6 py-10">
      <div className="w-full rounded-3xl border border-slate-200/80 bg-white/95 p-10 shadow-2xl shadow-slate-200 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
          Scheduled Music Console
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">
          Plan DJ events, upload full mixes, and keep metadata synchronized.
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Use the upload panel to push MP3 tracks to Cloudflare R2, preview
          extracted metadata, and store the finished event in{" "}
          <code className="rounded bg-slate-100 px-2 py-1 text-slate-900">
            data/events.json
          </code>
          .
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/upload-event"
            className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 text-center text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500"
          >
            Open the Upload Event form
          </Link>
          <a
            href="https://developers.cloudflare.com/r2/"
            className="flex-1 rounded-xl border border-slate-200 px-6 py-3 text-center text-lg font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            target="_blank"
            rel="noreferrer"
          >
            R2 setup guide
          </a>
        </div>
      </div>
    </main>
  );
}

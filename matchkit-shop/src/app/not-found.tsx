import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="eyebrow mb-4 text-stone">404</p>
      <h1 className="text-3xl font-light">That page is offside.</h1>
      <p className="mt-3 text-sm text-stone">The jersey or page you&apos;re looking for isn&apos;t here.</p>
      <Link href="/shop" className="btn-outline mt-8">
        Browse all jerseys
      </Link>
    </div>
  );
}

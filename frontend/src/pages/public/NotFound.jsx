import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "../../components/ui";
import { usePageTitle } from "../../lib/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-light text-teal-dark">
        <Compass size={28} />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-slate">
        The page you're looking for doesn't exist, or the link may be broken.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to homepage</Button>
      </Link>
    </div>
  );
}
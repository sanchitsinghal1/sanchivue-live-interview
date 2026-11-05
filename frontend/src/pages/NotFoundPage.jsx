import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import BrandLogo from '../components/common/BrandLogo.jsx';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <BrandLogo className="h-8" />
      <p className="mt-6 font-mono text-6xl font-bold text-slate-700">404</p>
      <h1 className="mt-4 text-xl font-bold text-slate-50">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-6 flex gap-2">
        <Link to="/" className="btn-secondary text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Link to="/" className="btn-primary text-sm">
          <Home className="h-4 w-4" /> Go home
        </Link>
      </div>
    </div>
  );
}

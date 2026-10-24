import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import InterviewReportPage from '../interviews/InterviewReportPage.jsx';

// ReportDetailPage — alias for the InterviewReportPage so the route
// /reports/:id renders the same report view under a different URL.
export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div>
      <div className="mb-2">
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to reports
        </button>
      </div>
      <InterviewReportPage key={id} />
    </div>
  );
}

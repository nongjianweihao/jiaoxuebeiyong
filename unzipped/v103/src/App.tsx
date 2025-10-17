import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';

const CampDashboardPage = lazy(() =>
  import('./pages/camp/CampDashboardPage').then((module) => ({
    default: module.CampDashboardPage,
  })),
);
const MissionLibraryPage = lazy(() =>
  import('./pages/missions/MissionLibraryPage').then((module) => ({
    default: module.MissionLibraryPage,
  })),
);
const TrainingLibraryPage = lazy(() =>
  import('./pages/training/TrainingLibraryPage').then((module) => ({
    default: module.TrainingLibraryPage,
  })),
);
const CoachCommandPage = lazy(() =>
  import('./pages/coach/CoachCommandPage').then((module) => ({
    default: module.CoachCommandPage,
  })),
);
const GrowthAlbumPage = lazy(() =>
  import('./pages/growth/GrowthAlbumPage').then((module) => ({
    default: module.GrowthAlbumPage,
  })),
);
const TrialArenaPage = lazy(() =>
  import('./pages/trials/TrialArenaPage').then((module) => ({
    default: module.TrialArenaPage,
  })),
);
const PuzzleTemplateDetailPage = lazy(() =>
  import('./pages/training/PuzzleTemplateDetailPage').then((module) => ({
    default: module.PuzzleTemplateDetailPage,
  })),
);
const SquadsPage = lazy(() =>
  import('./pages/squads/SquadsPage').then((module) => ({
    default: module.SquadsPage,
  })),
);
const GrowthMarketPage = lazy(() =>
  import('./pages/market/GrowthMarketPage').then((module) => ({
    default: module.GrowthMarketPage,
  })),
);
const CommandCenterPage = lazy(() =>
  import('./pages/command/CommandCenterPage').then((module) => ({
    default: module.CommandCenterPage,
  })),
);
const ClassesIndexPage = lazy(() =>
  import('./pages/classes/ClassesIndexPage').then((module) => ({
    default: module.ClassesIndexPage,
  })),
);
const ClassNewPage = lazy(() =>
  import('./pages/classes/ClassNewPage').then((module) => ({
    default: module.ClassNewPage,
  })),
);
const ClassEditPage = lazy(() =>
  import('./pages/classes/ClassEditPage').then((module) => ({
    default: module.ClassEditPage,
  })),
);
const ClassDetailPage = lazy(() =>
  import('./pages/classes/ClassDetailPage').then((module) => ({
    default: module.ClassDetailPage,
  })),
);
const StudentsIndexPage = lazy(() =>
  import('./pages/students/StudentsIndexPage').then((module) => ({
    default: module.StudentsIndexPage,
  })),
);
const StudentNewPage = lazy(() =>
  import('./pages/students/StudentNewPage').then((module) => ({
    default: module.StudentNewPage,
  })),
);
const StudentEditPage = lazy(() =>
  import('./pages/students/StudentEditPage').then((module) => ({
    default: module.StudentEditPage,
  })),
);
const StudentDetailPage = lazy(() =>
  import('./pages/students/StudentDetailPage').then((module) => ({
    default: module.StudentDetailPage,
  })),
);
const TemplatesIndexPage = lazy(() =>
  import('./pages/templates/TemplatesIndexPage').then((module) => ({
    default: module.TemplatesIndexPage,
  })),
);
const TemplateNewPage = lazy(() =>
  import('./pages/templates/TemplateNewPage').then((module) => ({
    default: module.TemplateNewPage,
  })),
);
const TemplateEditPage = lazy(() =>
  import('./pages/templates/TemplateEditPage').then((module) => ({
    default: module.TemplateEditPage,
  })),
);
const AssessmentsIndexPage = lazy(() =>
  import('./pages/assessments/AssessmentsIndexPage').then((module) => ({
    default: module.AssessmentsIndexPage,
  })),
);
const ReportPage = lazy(() =>
  import('./pages/reports/ReportPage').then((module) => ({
    default: module.ReportPage,
  })),
);
const RetrospectivesPage = lazy(() =>
  import('./pages/retrospectives/RetrospectivesPage').then((module) => ({
    default: module.RetrospectivesPage,
  })),
);
const FinanceDashboardPage = lazy(() =>
  import('./pages/finance/FinanceDashboardPage').then((module) => ({
    default: module.FinanceDashboardPage,
  })),
);
const DataHubPage = lazy(() =>
  import('./pages/settings/DataHubPage').then((module) => ({
    default: module.DataHubPage,
  })),
);
const PuzzleQuestPage = lazy(() =>
  import('./pages/puzzles/PuzzleQuestPage').then((module) => ({
    default: module.PuzzleQuestPage,
  })),
);

function PageLoadingFallback() {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-lg text-slate-500">
      页面加载中...
    </div>
  );
}


function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/camp" replace />} />
          <Route path="/camp" element={<CampDashboardPage />} />
          <Route path="/missions" element={<MissionLibraryPage />} />
          <Route path="/training-library" element={<TrainingLibraryPage />} />
          <Route path="/coach" element={<CoachCommandPage />} />
          <Route path="/growth" element={<GrowthAlbumPage />} />
          <Route path="/trials" element={<TrialArenaPage />} />


          <Route path="/training-library/puzzles/:templateId" element={<PuzzleTemplateDetailPage />} />
          <Route path="/puzzles" element={<PuzzleQuestPage />} />

          <Route path="/squads" element={<SquadsPage />} />
          <Route path="/market" element={<GrowthMarketPage />} />
          <Route path="/command" element={<CommandCenterPage />} />
          <Route path="/classes" element={<ClassesIndexPage />} />
          <Route path="/classes/new" element={<ClassNewPage />} />
          <Route path="/classes/:id/edit" element={<ClassEditPage />} />
          <Route path="/classes/:id" element={<ClassDetailPage />} />
          <Route path="/students" element={<StudentsIndexPage />} />
          <Route path="/students/new" element={<StudentNewPage />} />
          <Route path="/students/:id/edit" element={<StudentEditPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/templates" element={<TemplatesIndexPage />} />
          <Route path="/templates/new" element={<TemplateNewPage />} />
          <Route path="/templates/:id/edit" element={<TemplateEditPage />} />
          <Route path="/assessments" element={<AssessmentsIndexPage />} />
          <Route path="/reports/:studentId" element={<ReportPage />} />
          <Route path="/retrospectives" element={<RetrospectivesPage />} />
          <Route path="/finance" element={<FinanceDashboardPage />} />
          <Route path="/settings/data" element={<DataHubPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;

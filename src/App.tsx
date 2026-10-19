import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CourseList from './pages/CourseList';
import TestList from './pages/TestList';
import CourseDetail from './pages/CourseDetail';
import Lesson from './pages/Lesson';
import UserProfile from './pages/Dashboard/UserProfile';
import Storefront from './pages/Store/Storefront';
import RaidBoss from './pages/Dungeon/RaidBoss';
import ModuleView from './pages/Learn/ModuleView';
import Home from './pages/Home';
import TestRunner from './pages/TestRunner';
import Login from './pages/Login';
import Register from './pages/Register';
import CheatSheets from './pages/CheatSheets';
import CheatSheetPage from './pages/CheatSheetPage';
import Playground from './pages/Playground';
import Leaderboard from './pages/Leaderboard';
import PublicProfile from './pages/PublicProfile';
import DailyCalendar from './pages/DailyCalendar';
import DailyChallenge from './pages/DailyChallenge';
import Guilds from './pages/Guilds';
import Groups from './pages/Groups';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chapters" element={<CourseList />} />
          <Route path="courses/:courseId" element={<CourseDetail />} />
          <Route path="courses/:courseId/chapters/:chapterId/lessons/:lessonId" element={<Lesson />} />
          <Route path="dashboard" element={<UserProfile />} />
          <Route path="profile/:userId" element={<PublicProfile />} />
          <Route path="calendar" element={<DailyCalendar />} />
          <Route path="daily-challenge" element={<DailyChallenge />} />
          <Route path="store" element={<Storefront />} />
          <Route path="dungeon" element={<RaidBoss />} />
          <Route path="tests" element={<TestList />} />
          <Route path="tests/:testId" element={<TestRunner />} />
          <Route path="learn" element={<ModuleView />} />
          <Route path="resources/playground" element={<Playground />} />
          <Route path="resources/cheat-sheets" element={<CheatSheets />} />
          <Route path="resources/cheat-sheets/:topic" element={<CheatSheetPage />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="guilds" element={<Guilds />} />
          <Route path="groups" element={<Groups />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

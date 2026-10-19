import axios from 'axios';
import i18n from './i18n';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081', // Gateway URL
});

export const getAvatarUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
  return `${baseUrl}${url}`;
};

api.interceptors.request.use((config) => {
  config.params = config.params || {};
  config.params.lang = i18n.language;

  const token = localStorage.getItem('token');
  if (token) {
    if (config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      config.headers = { Authorization: `Bearer ${token}` } as any;
    }
  }

  return config;
});

export interface CourseListItem {
  id: string;
  title: string;
  description: string;
  language?: string;
  category?: string;
  difficulty?: string;
  chapters_count: number;
  tasks_count: number;
  lesson_ids: string[];
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  language?: string;
  category?: string;
  difficulty?: string;
  chapters: ChapterSummary[];
}

export interface ChapterSummary {
  id: string;
  order: number;
  title: string;
  lessons: LessonSummary[];
}

export interface LessonSummary {
  id: string;
  order: number;
  title: string;
  type: string;
}

export interface AnswerOption {
  id: string;
  text: string;
}

export interface LessonDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  options?: AnswerOption[];
  starter_code?: string;
  language?: string;
  document_url?: string;
}

export interface SubmitAnswerRequest {
  selected_option_id?: string;
  code?: string;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  feedback: string;
  console_output?: string;
}

export interface RunCodeRequest {
  code: string;
}

export interface RunCodeResponse {
  console_output: string;
  exit_code: number;
}

export const getCourses = async (lang: string = "hu"): Promise<CourseListItem[]> => {
  const res = await api.get(`/courses?lang=${lang}`);
  return res.data.data;
};

export const getLanguages = async (): Promise<string[]> => {
  const res = await api.get('/languages');
  return res.data.data;
};

export const getCourse = async (courseId: string): Promise<CourseDetail> => {
  const res = await api.get(`/courses/${courseId}`);
  return res.data.data;
};

export const getLesson = async (courseId: string, chapterId: string, lessonId: string): Promise<LessonDetail> => {
  const res = await api.get(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
  return res.data.data;
};

export const submitAnswer = async (
  courseId: string,
  chapterId: string,
  lessonId: string,
  data: SubmitAnswerRequest
): Promise<SubmitAnswerResponse> => {
  const res = await api.post(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/submit`, data);
  return res.data.data;
};

export interface RequestHelpResponse {
  hint: string;
  help_count: number;
}

export const requestLessonHelp = async (
  courseId: string,
  chapterId: string,
  lessonId: string
): Promise<RequestHelpResponse> => {
  const res = await api.post(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/help`);
  return res.data.data;
};

export const runCode = async (
  courseId: string,
  chapterId: string,
  lessonId: string,
  data: RunCodeRequest
): Promise<RunCodeResponse> => {
  const res = await api.post(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/run`, data);
  return res.data.data;
};

export interface CreateCourseRequest {
  title: string;
  description: string;
  language?: string;
  category?: string;
  difficulty?: string;
}

export const createCourse = async (data: CreateCourseRequest): Promise<CourseListItem> => {
  const res = await api.post('/courses', data);
  return res.data.data;
};

export interface CreateChapterRequest {
  title: string;
  order: number;
}

export const createChapter = async (courseId: string, data: CreateChapterRequest): Promise<ChapterSummary> => {
  const res = await api.post(`/courses/${courseId}/chapters`, data);
  return res.data.data;
};

export interface CreateLessonOption {
  text: string;
  is_correct: boolean;
}

export interface CreateLessonRequest {
  order: number;
  title: string;
  description: string;
  type: string;
  language?: string;
  starter_code?: string;
  solution_code?: string;
  test_code?: string;
  expected_output?: string;
  document_url?: string;
  options?: CreateLessonOption[];
}

export const createLesson = async (courseId: string, chapterId: string, data: CreateLessonRequest): Promise<LessonDetail> => {
  const res = await api.post(`/courses/${courseId}/chapters/${chapterId}/lessons`, data);
  return res.data.data;
};

export const uploadDocumentFile = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/courses/uploads/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.data;
};

export interface TestModel {
  id: string;
  course_id: string;
  group_id?: string;
  title: string;
  description: string;
  is_visible: boolean;
  status: string;
  open_date?: string;
  language?: string;
  starter_code?: string;
  solution_code?: string;
  test_code?: string;
  expected_output?: string;
}

export interface CreateTestRequest {
  course_id: string;
  group_id?: string;
  title: string;
  description: string;
  is_visible: boolean;
  status: string;
  open_date?: string;
  language?: string;
  starter_code?: string;
  solution_code?: string;
  test_code?: string;
  expected_output?: string;
}

export interface UpdateTestRequest {
  title: string;
  group_id?: string;
  description: string;
  is_visible: boolean;
  status: string;
  open_date?: string;
  language?: string;
  starter_code?: string;
  solution_code?: string;
  test_code?: string;
  expected_output?: string;
}

export const getTests = async (): Promise<TestModel[]> => {
  const res = await api.get('/tests');
  return res.data.data;
};

export const consumeHelper = async (lessonId: string): Promise<{message: string}> => {
  const res = await api.post('/auth/store/consume/helper', { lessonId });
  return res.data;
};

export const createTest = async (data: CreateTestRequest): Promise<TestModel> => {
  const res = await api.post('/tests', data);
  return res.data.data;
};

export const updateTest = async (id: string, data: UpdateTestRequest): Promise<void> => {
  await api.put(`/tests/${id}`, data);
};

export const deleteTest = async (id: string): Promise<void> => {
  await api.delete(`/tests/${id}`);
};

export const getTest = async (id: string): Promise<TestModel> => {
  const response = await api.get(`/tests/${id}`);
  return response.data.data;
};

export const submitTest = async (id: string, code: string, stdin?: string): Promise<SubmitAnswerResponse> => {
  const response = await api.post(`/tests/${id}/submit`, { code, stdin: stdin || "" });
  return response.data.data;
};

export interface RunTestResponse {
  console_output: string;
  exit_code: number;
}

export const runTest = async (id: string, code: string, stdin?: string): Promise<RunTestResponse> => {
  const response = await api.post(`/tests/${id}/run`, { code, stdin: stdin || "" });
  return response.data.data;
};

// Legacy synchronous points endpoint removed (now async via RabbitMQ)

export const resetProgress = async () => {
  const res = await api.delete('/auth/reset-progress');
  return res.data;
};

// --- Leaderboard & Stats ---
export interface DailyStats {
  daily_xp: number;
  daily_lessons: number;
}

export interface LeaderboardUser {
  id: string;
  nickname?: string;
  avatar_url?: string;
  points: number;
  rank: number;
  active_effects?: string[];
}

export const getDailyStats = async (): Promise<DailyStats> => {
  const res = await api.get('/auth/stats/daily');
  return res.data;
};

export interface AchievementStat {
  achievement_id: string;
  percentage: number;
}

export const getAchievementStats = async (): Promise<AchievementStat[]> => {
  const res = await api.get('/auth/achievements/stats');
  return res.data;
};

export const getLeaderboard = async (): Promise<LeaderboardUser[]> => {
  const res = await api.get('/auth/leaderboard');
  return res.data;
};

export interface UpdateProfileRequest {
  nickname?: string;
  bio?: string;
  avatar_url?: string;
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<any> => {
  const response = await api.put('/auth/profile', data);
  return response.data;
};

export const uploadAvatarFile = async (file: File): Promise<{ user: any; avatar_url: string }> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await api.post('/auth/avatar', formData);
  return response.data;
};

export const grantAchievement = async (achievementId: string): Promise<any> => {
  const response = await api.post('/auth/achievements', { achievement_id: achievementId });
  return response.data;
};

export interface PublicProfile {
  id: string;
  nickname?: string;
  avatar_url?: string;
  bio?: string;
  xp: number;
  points: number;
  created_at: string;
  achievements: { id: string; earned_at: string }[];
  active_effects?: string[];
}

export const getPublicProfile = async (userId: string): Promise<PublicProfile> => {
  const response = await api.get(`/auth/users/${userId}/profile`);
  return response.data;
};

export interface DailyLoginDay {
  date: string;
  streak_day: number;
  points_awarded: number;
}

export interface DailyLoginStatus {
  days: DailyLoginDay[];
  claimed_today: boolean;
  next_streak_day: number;
  next_points: number;
  total_this_month: number;
}

export interface DailyLoginResult {
  streak_day: number;
  points_awarded: number;
  total_points: number;
}

export const getDailyLoginStatus = async (): Promise<DailyLoginStatus> => {
  const response = await api.get('/auth/daily-login/status');
  return response.data;
};

export const claimDailyLogin = async (): Promise<DailyLoginResult> => {
  const response = await api.post('/auth/daily-login/claim');
  return response.data;
};

// --- Inventory & Wardrobe ---
export interface UserInventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  name: string;
  description: string;
  effect_type: string;
  duration_hours: number;
  rarity: string;
  purchased_at: string;
  expires_at?: string;
  is_used: boolean;
  is_equipped: boolean;
}

export interface ToggleEquipResponse {
  items: UserInventoryItem[];
  active_effects: string[];
}

export const getUserInventory = async (): Promise<UserInventoryItem[]> => {
  const response = await api.get('/auth/inventory');
  return response.data;
};

export const toggleEquipItem = async (itemId: string): Promise<ToggleEquipResponse> => {
  const response = await api.post(`/auth/inventory/${itemId}/toggle`);
  return response.data;
};

export const deleteInventoryItem = async (inventoryId: string): Promise<ToggleEquipResponse> => {
  const response = await api.delete(`/auth/inventory/${inventoryId}`);
  return response.data;
};

// --- Group Service ---
export interface GroupModel {
  id: string;
  name: string;
  description: string;
  teacher_id: string;
  invite_code: string;
  created_at: string;
}

export const createGroup = async (name: string, description: string): Promise<GroupModel> => {
  const res = await api.post('/groups', { name, description });
  return res.data.data;
}

export const joinGroup = async (inviteCode: string): Promise<GroupModel> => {
  const res = await api.post('/groups/join', { invite_code: inviteCode });
  return res.data.data;
}

export const getTeacherGroups = async (): Promise<GroupModel[]> => {
  const res = await api.get('/groups/teacher');
  return res.data.data;
}

export const getStudentGroups = async (): Promise<GroupModel[]> => {
  const res = await api.get('/groups/student');
  return res.data.data;
}

export const adminGetAllGroups = async (): Promise<GroupModel[]> => {
  const res = await api.get('/groups/admin/all');
  return res.data.data;
}

export const getGroup = async (id: string): Promise<GroupModel> => {
  const res = await api.get(`/groups/${id}`);
  return res.data.data;
}

export const getGroupMembers = async (id: string): Promise<string[]> => {
  const res = await api.get(`/groups/${id}/members`);
  return res.data.data;
}

export const removeGroupMember = async (groupId: string, memberId: string): Promise<void> => {
  await api.delete(`/groups/${groupId}/members/${memberId}`);
}

export const deleteGroup = async (groupId: string): Promise<void> => {
  await api.delete(`/groups/${groupId}`);
}

// --- Admin Service ---
export interface UserStats {
  id: string;
  email: string;
  nickname: string;
  roles: { id: string; name: string }[];
  points: number;
  is_banned: boolean;
  banned_at?: string;
}

export interface LessonTimeStat {
  lesson_id: string;
  time_spent_seconds: number;
}

export interface PlatformStats {
  total_users: number;
  active_users_today: number;
  total_lessons_completed: number;
  total_xp_earned: number;
  banned_users: number;
  total_time_spent_seconds?: number;
  total_code_challenges?: number;
}

export interface PublicStats {
  total_users: number;
  active_users_today: number;
  total_lessons_completed: number;
  total_xp_earned: number;
  banned_users: number;
  total_time_spent_seconds: number;
  total_code_challenges: number;
}

export const getPublicStats = async (): Promise<PublicStats> => {
  const res = await api.get('/auth/stats/public');
  return res.data;
};

export interface TrendData {
  date: string;
  count: number;
}

export const adminGetUsers = async (): Promise<UserStats[]> => {
  const response = await api.get('/auth/admin/users');
  return response.data.users || [];
};

// --- Store API ---

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect_type: string;
  duration_hours: number;
  rarity: string;
}

export const getStoreItems = async (): Promise<StoreItem[]> => {
  const response = await api.get('/auth/store');
  return response.data.data;
};

export const refreshStore = async (): Promise<StoreItem[]> => {
  const response = await api.post('/auth/store/refresh');
  return response.data.data;
};

export const buyStoreItem = async (id: string): Promise<void> => {
  await api.post(`/auth/store/buy/${id}`);
};

export const adminGetUserLessonTimes = async (userId: string): Promise<LessonTimeStat[]> => {
  const response = await api.get(`/auth/admin/users/${userId}/lessons/time`);
  return response.data;
};

export const recordLessonTime = async (lessonId: string, seconds: number): Promise<void> => {
  await api.post(`/auth/lessons/${lessonId}/time`, { seconds });
};

export const adminBanUser = async (userId: string): Promise<void> => {
  await api.post(`/auth/admin/users/${userId}/ban`);
}

export const adminUnbanUser = async (userId: string): Promise<void> => {
  await api.post(`/auth/admin/users/${userId}/unban`);
}

export const adminResetProgress = async (userId: string): Promise<void> => {
  await api.post(`/auth/admin/users/${userId}/reset-progress`);
}

export const adminSetUserRoles = async (userId: string, roles: string[]): Promise<void> => {
  await api.put(`/auth/admin/users/${userId}/roles`, { roles });
}

export const adminGetPlatformStats = async (): Promise<PlatformStats> => {
  const res = await api.get('/auth/admin/stats');
  return res.data;
}

export const adminGetRegistrationTrend = async (): Promise<TrendData[]> => {
  const res = await api.get('/auth/admin/stats/registrations');
  // Backend returns { points: [{date, count}...], period: "..." }
  return res.data.points || [];
}

export const adminGetCompletionTrend = async (): Promise<TrendData[]> => {
  const res = await api.get('/auth/admin/stats/completions');
  // Backend returns { points: [{date, count}...], period: "..." }
  return res.data.points || [];
}

export const adminUpdateCourse = async (courseId: string, data: CreateCourseRequest): Promise<void> => {
  await api.put(`/courses/${courseId}`, data);
}

export const adminDeleteCourse = async (courseId: string): Promise<void> => {
  await api.delete(`/courses/${courseId}`);
}

export const adminUpdateChapter = async (courseId: string, chapterId: string, data: CreateChapterRequest): Promise<void> => {
  await api.put(`/courses/${courseId}/chapters/${chapterId}`, data);
}

export const adminDeleteChapter = async (courseId: string, chapterId: string): Promise<void> => {
  await api.delete(`/courses/${courseId}/chapters/${chapterId}`);
}

export const adminUpdateLesson = async (courseId: string, chapterId: string, lessonId: string, data: CreateLessonRequest): Promise<void> => {
  await api.put(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`, data);
}

export const adminDeleteLesson = async (courseId: string, chapterId: string, lessonId: string): Promise<void> => {
  await api.delete(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
}

// Daily Challenge API interfaces and functions

export interface DailyChallengeTestCase {
  input: string;
  expected: string;
}

export interface DailyChallenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  explanation: string;
  difficulty: string;
  points_reward: number;
  xp_reward: number;
  starter_codes: Record<string, string>;
  test_cases: DailyChallengeTestCase[];
  created_at: string;
}

export interface DailyChallengeLeaderboardEntry {
  rank: number;
  user_id: string;
  nickname: string;
  avatar_url?: string;
  active_effects: string[];
  language: string;
  solve_time_seconds: number;
  completed_at: string;
  bonus_points: number;
}

export interface TodayChallengeResponse {
  challenge: DailyChallenge;
  started_at?: string;
  completed_at?: string;
  is_completed: boolean;
  solve_time_seconds?: number;
  current_streak: number;
  user_language: string;
  user_submitted_code?: string;
  seconds_until_reset: number;
  leaderboard: DailyChallengeLeaderboardEntry[];
}

export interface TestResultItem {
  index: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
}

export interface RunChallengeResponse {
  success: boolean;
  test_results: TestResultItem[];
  console_output: string;
  total_passed: number;
  total_tests: number;
  error?: string;
}

export interface SubmitChallengeResponse {
  success: boolean;
  test_results: TestResultItem[];
  console_output: string;
  solve_time_seconds: number;
  points_earned: number;
  xp_earned: number;
  streak: number;
  rank: number;
  leaderboard: DailyChallengeLeaderboardEntry[];
  error?: string;
}

export const getTodayChallenge = async (): Promise<TodayChallengeResponse> => {
  const res = await api.get('/auth/daily-challenge/today');
  return res.data;
};

export const startDailyChallenge = async (language: string): Promise<any> => {
  const res = await api.post('/auth/daily-challenge/start', { language });
  return res.data;
};

export const runDailyChallengeCode = async (language: string, code: string): Promise<RunChallengeResponse> => {
  const res = await api.post('/auth/daily-challenge/run', { language, code });
  return res.data;
};

export const submitDailyChallenge = async (language: string, code: string): Promise<SubmitChallengeResponse> => {
  const res = await api.post('/auth/daily-challenge/submit', { language, code });
  return res.data;
};

export const getDailyChallengeLeaderboard = async (): Promise<DailyChallengeLeaderboardEntry[]> => {
  const res = await api.get('/auth/daily-challenge/leaderboard');
  return res.data;
};

export default api;


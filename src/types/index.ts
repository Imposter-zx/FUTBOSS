import type {
  MATCH_STATUSES,
  EVENT_TYPES,
  POSITIONS,
  ROLES,
  NOTIFICATION_TYPES,
  COMPETITIONS,
  PAGINATION,
} from "@/constants";

// ==================== ENUMS ====================

export type MatchStatus = keyof typeof MATCH_STATUSES;
export type EventType = keyof typeof EVENT_TYPES;
export type PositionCode = keyof typeof POSITIONS;
export type Role = keyof typeof ROLES;
export type NotificationType = keyof typeof NOTIFICATION_TYPES;

// ==================== COMPETITION ====================

export interface Competition {
  id: string;
  name: string;
  shortName: string;
  type: "LEAGUE" | "CUP" | "CLUB" | "INTERNATIONAL";
  country: string;
  logo: string | null;
  banner: string | null;
  tier: number;
  season: string;
  currentMatchday: number | null;
  totalMatchdays: number | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  teams?: Team[];
  standings?: Standing[];
  matches?: Match[];
}

export interface CompetitionStanding {
  competition: Competition;
  standings: Standing[];
}

// ==================== TEAM ====================

export interface Team {
  id: string;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  logo: string;
  banner: string | null;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
  country: string;
  founded: number | null;
  venue: string | null;
  website: string | null;
  competitionId: string;
  competition?: Competition;
  players?: Player[];
  matches?: Match[];
  createdAt: string;
  updatedAt: string;
}

// ==================== PLAYER ====================

export interface Player {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  position: PositionCode;
  positions: PositionCode[];
  shirtNumber: number | null;
  height: number | null;
  weight: number | null;
  foot: "LEFT" | "RIGHT" | "BOTH" | null;
  image: string | null;
  marketValue: number | null;
  contractUntil: string | null;
  teamId: string;
  team?: Team;
  stats?: PlayerStats;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerStats {
  id: string;
  playerId: string;
  player?: Player;
  competitionId: string;
  competition?: Competition;
  appearances: number;
  starts: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  saves: number;
  shotsTotal: number;
  shotsOnTarget: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  fouls: number;
  offsides: number;
  dribbles: number;
  duelsWon: number;
  duelsTotal: number;
  rating: number;
  season: string;
}

// ==================== MATCH ====================

export interface Match {
  id: string;
  competitionId: string;
  competition?: Competition;
  homeTeamId: string;
  homeTeam?: Team;
  awayTeamId: string;
  awayTeam?: Team;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  status: MatchStatus;
  minute: number | null;
  stage: string | null;
  group: string | null;
  round: string | null;
  matchday: number | null;
  leg: "FIRST" | "SECOND" | null;
  venue: string | null;
  attendance: number | null;
  referee: string | null;
  date: string;
  kickoff: string;
  timezone: string;
  period: "FIRST_HALF" | "SECOND_HALF" | "HALF_TIME" | "EXTRA_FIRST" | "EXTRA_SECOND" | "PENALTIES" | null;
  events?: MatchEvent[];
  statistics?: MatchStatistics;
  createdAt: string;
  updatedAt: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  match?: Match;
  teamId: string;
  team?: Team;
  playerId: string | null;
  player?: Player | null;
  assistPlayerId: string | null;
  assistPlayer?: Player | null;
  type: EventType;
  minute: number;
  extraMinute: number | null;
  period: "FIRST_HALF" | "SECOND_HALF" | "EXTRA_TIME" | "PENALTIES";
  detail: string | null;
  comments: string | null;
  scoreHome: number | null;
  scoreAway: number | null;
  x: number | null;
  y: number | null;
  createdAt: string;
}

export interface MatchStatistics {
  id: string;
  matchId: string;
  match?: Match;
  ballPossession: { home: number; away: number };
  totalShots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  shotsOffTarget: { home: number; away: number };
  blockedShots: { home: number; away: number };
  corners: { home: number; away: number };
  offsides: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
  saves: { home: number; away: number };
  passes: { home: number; away: number };
  passAccuracy: { home: number; away: number };
  crosses: { home: number; away: number };
  tackles: { home: number; away: number };
  interceptions: { home: number; away: number };
  dribbles: { home: number; away: number };
  duelsWon: { home: number; away: number };
  duelsTotal: { home: number; away: number };
  freeKicks: { home: number; away: number };
  throwIns: { home: number; away: number };
  goalKicks: { home: number; away: number };
  possessionLost: { home: number; away: number };
  expectedGoals: { home: number; away: number };
}

// ==================== STANDING ====================

export interface Standing {
  id: string;
  competitionId: string;
  competition?: Competition;
  teamId: string;
  team?: Team;
  position: number;
  previousPosition: number | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ("W" | "D" | "L")[];
  streak: string | null;
  home: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  away: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  qualification: string | null;
  season: string;
  group: string | null;
  updatedAt: string;
}

// ==================== USER ====================

export interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  image: string | null;
  banner: string | null;
  bio: string | null;
  role: Role;
  isActive: boolean;
  emailVerified: Date | null;
  favoriteTeamId: string | null;
  favoriteTeam?: Team;
  favoriteCompetitions: string[];
  preferences?: UserPreference;
  subscription?: UserSubscription | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  theme: "dark" | "light" | "system";
  locale: string;
  notifications: boolean;
  matchReminders: boolean;
  goalAlerts: boolean;
  newsDigest: boolean;
  pushEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  favoriteLeagues: string[];
  favoriteTeams: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  plan: "FREE" | "PREMIUM" | "PRO";
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "TRIAL";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== NOTIFICATION ====================

export interface Notification {
  id: string;
  userId: string;
  user?: User;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

// ==================== API ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

// ==================== WEBSOCKET ====================

export type WebSocketEventType =
  | "MATCH_UPDATE"
  | "MATCH_EVENT"
  | "MATCH_START"
  | "MATCH_END"
  | "STANDING_UPDATE"
  | "NOTIFICATION"
  | "CONNECTION_ACK"
  | "ERROR"
  | "SUBSCRIBE"
  | "UNSUBSCRIBE";

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface WebSocketMatchUpdate {
  type: "MATCH_UPDATE";
  payload: {
    matchId: string;
    status: MatchStatus;
    homeScore: number;
    awayScore: number;
    minute: number;
    period: string | null;
  };
  timestamp: string;
}

export interface WebSocketMatchEvent {
  type: "MATCH_EVENT";
  payload: {
    matchId: string;
    event: MatchEvent;
  };
  timestamp: string;
}

export interface WebSocketSubscription {
  type: "SUBSCRIBE" | "UNSUBSCRIBE";
  payload: {
    channel: string;
    matchId?: string;
    competitionId?: string;
  };
  timestamp: string;
}

// ==================== STATISTICS ====================

export interface CompetitionStats {
  totalMatches: number;
  totalGoals: number;
  averageGoals: number;
  totalYellowCards: number;
  totalRedCards: number;
  averagePossession: number;
  topScorer: Player | null;
  topAssister: Player | null;
  mostCleanSheets: Player | null;
}

export interface HeadToHead {
  team1Id: string;
  team2Id: string;
  team1: Team;
  team2: Team;
  totalMatches: number;
  team1Wins: number;
  team2Wins: number;
  draws: number;
  team1Goals: number;
  team2Goals: number;
  recentMatches: Match[];
}

// ==================== FORM ====================

export type FormResult = "W" | "D" | "L";

export interface TeamForm {
  teamId: string;
  results: FormResult[];
  streak: string;
  homeRecord: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
  };
  awayRecord: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
  };
}

// ==================== NEWS ====================

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string | null;
  category: string;
  tags: string[];
  author: string;
  published: boolean;
  featured: boolean;
  relatedCompetitions: string[];
  relatedTeams: string[];
  relatedPlayers: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== LEAGUE TABLE ====================

export interface LeagueTableGroup {
  group: string;
  standings: Standing[];
}

export interface LeagueTable {
  competitionId: string;
  competition: Competition;
  type: "TOTAL" | "HOME" | "AWAY";
  season: string;
  groups: LeagueTableGroup[];
  updatedAt: string;
}

// ==================== LINEUP ====================

export interface Lineup {
  matchId: string;
  teamId: string;
  formation: string;
  startingXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coach: string | null;
}

export interface LineupPlayer {
  playerId: string;
  player: Player;
  shirtNumber: number;
  position: string;
  x: number;
  y: number;
  captain: boolean;
}

// ==================== TIMELINE ====================

export interface TimelineEntry {
  minute: number;
  extraMinute: number | null;
  type: EventType;
  teamId: string;
  playerId: string | null;
  playerName: string | null;
  assistPlayerId: string | null;
  assistPlayerName: string | null;
  scoreHome: number | null;
  scoreAway: number | null;
  detail: string | null;
}

export interface MatchTimeline {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  events: TimelineEntry[];
}

// ==================== SERVICE HELPERS ====================

export interface ServiceResult<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface LiveMatchUpdate {
  matchId: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  addedTime?: number;
  status?: string;
  event?: {
    type: string;
    playerId: string;
    teamId: string;
    minute: number;
    data?: Record<string, unknown>;
  };
}

export function successResult<T>(data: T, message?: string): ServiceResult<T> {
  return {
    success: true,
    data,
    message: message ?? "Success",
    timestamp: new Date().toISOString(),
  };
}

export function errorResult(message: string, code: string = "ERROR"): ServiceResult<null> {
  return {
    success: false,
    data: null,
    message,
    code,
    timestamp: new Date().toISOString(),
  };
}

export function buildPaginationQuery(params: PaginationParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 10));
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const orderBy: Record<string, "asc" | "desc">[] = [];
  if (params.sortBy) {
    orderBy.push({
      [params.sortBy]: params.sortOrder ?? "desc",
    });
  }

  return {
    skip,
    take,
    orderBy: orderBy.length > 0 ? orderBy : undefined,
  };
}

export function buildPaginatedResult<T>(
  items: T[],
  totalItems: number,
  params: PaginationParams
): PaginatedResult<T> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 10));
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}


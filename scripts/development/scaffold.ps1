# scaffold.ps1 — Genera archivos base del monorepo.
# Stubs de páginas, rutas API, archivos de tipos/config/validación y .gitkeep.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/development/scaffold.ps1
$root = Split-Path -Parent $PSScriptRoot | Split-Path -Parent

function Write-File {
  param([string]$RelativePath, [string]$Content)
  $path = Join-Path $root $RelativePath
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $path) | Out-Null
  # UTF-8 sin BOM (compatible con TS/TSX). Ejecutar el script con pwsh para acentos correctos.
  [System.IO.File]::WriteAllText($path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

# ─── packages/types/src ─────────────────────────────────────────
$userTs = @'
export const ROLES = ['PLAYER', 'PARENT', 'COACH', 'SCOUT', 'AGENT', 'CLUB', 'UNIVERSITY', 'ADMIN'] as const;

export type Role = (typeof ROLES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  image?: string | null;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
'@

$playerTs = @'
export type PlayerStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'AVAILABLE' | 'INACTIVE';

export interface Player {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date | null;
  nationality?: string | null;
  position?: string | null;
  foot?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  status: PlayerStatus;
  bio?: string | null;
  clubName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
'@

$parentTs = @'
export interface Parent {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
'@

$coachTs = @'
export interface Coach {
  id: string;
  userId: string;
  clubName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
'@

$scoutTs = @'
export interface Scout {
  id: string;
  userId: string;
  agency?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
'@


$agentTs = @'
export interface Agent {
  id: string;
  userId: string;
  agency?: string | null;
  license?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
'@

$clubTs = @'
export interface Club {
  id: string;
  userId?: string | null;
  email: string;
  name: string;
  country: string;
  city?: string | null;
  league?: string | null;
  logoUrl?: string | null;
  verified: boolean;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
'@

$academyTs = @'
export interface Academy {
  id: string;
  name: string;
  clubId?: string | null;
  country: string;
  city?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
'@

$universityTs = @'
export interface University {
  id: string;
  userId: string;
  name: string;
  country: string;
  city?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
'@

$trainingTs = @'
export type TrainingCategory = 'technical' | 'strength-conditioning' | 'psychology';

export interface TrainingContent {
  id: string;
  title: string;
  category: TrainingCategory;
  description?: string | null;
  videoUrl?: string | null;
  durationMinutes?: number | null;
  difficulty?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
'@

$opportunityTs = @'
export type OpportunityType = 'TRIAL' | 'SCOUTING' | 'CONTRACT' | 'SCHOLARSHIP' | 'ACADEMY';
export type OpportunityStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Opportunity {
  id: string;
  clubId: string;
  title: string;
  type: OpportunityType;
  status: OpportunityStatus;
  position?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  location?: string | null;
  description?: string | null;
  closesAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  playerId: string;
  opportunityId: string;
  status: ApplicationStatus;
  message?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
'@

$recruitmentTs = @'
export type RecruitmentStage = 'SUBMISSION' | 'TRIAL' | 'NEGOTIATION' | 'CONTRACT';

export interface Submission {
  id: string;
  playerId: string;
  clubId: string;
  stage: RecruitmentStage;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trial {
  id: string;
  submissionId?: string | null;
  clubId: string;
  playerId: string;
  startsAt: Date;
  endsAt?: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Negotiation {
  id: string;
  submissionId?: string | null;
  clubId: string;
  playerId: string;
  status: string;
  offerAmount?: number | null;
  currency?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  id: string;
  negotiationId?: string | null;
  clubId: string;
  playerId: string;
  startsAt: Date;
  endsAt?: Date | null;
  status: string;
  signedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
'@

$matchingTs = @'
export interface MatchCriteria {
  position?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  competitionLevel?: string | null;
  country?: string | null;
}

export interface MatchResult {
  playerId: string;
  clubId?: string | null;
  opportunityId?: string | null;
  score: number; // 0-100
  explanation: string;
  matchedAt: Date;
}
'@

$paymentTs = @'
export type MembershipTier = 'FREE' | 'PREMIUM' | 'SCOUT' | 'CLUB';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Membership {
  id: string;
  userId: string;
  tier: MembershipTier;
  startsAt: Date;
  endsAt?: Date | null;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
'@

Write-File 'packages/types/src/user.ts' $userTs
Write-File 'packages/types/src/player.ts' $playerTs
Write-File 'packages/types/src/parent.ts' $parentTs
Write-File 'packages/types/src/coach.ts' $coachTs
Write-File 'packages/types/src/scout.ts' $scoutTs
Write-File 'packages/types/src/agent.ts' $agentTs
Write-File 'packages/types/src/club.ts' $clubTs
Write-File 'packages/types/src/academy.ts' $academyTs
Write-File 'packages/types/src/university.ts' $universityTs
Write-File 'packages/types/src/training.ts' $trainingTs
Write-File 'packages/types/src/opportunity.ts' $opportunityTs
Write-File 'packages/types/src/recruitment.ts' $recruitmentTs
Write-File 'packages/types/src/matching.ts' $matchingTs
Write-File 'packages/types/src/payment.ts' $paymentTs

# ─── packages/config/src ────────────────────────────────────────
$countriesTs = @'
export const COUNTRIES = ['Spain', 'Mexico', 'Argentina', 'Colombia', 'Brasil', 'Estados Unidos', 'Reino Unido', 'Alemania', 'Francia', 'Italia', 'Portugal', 'Japan'] as const;

export type Country = (typeof COUNTRIES)[number];
'@

$currenciesTs = @'
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina' },
] as const;
'@

$languagesTs = @'
export const LANGUAGES = ['es', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  es: 'Spanish',
  en: 'English',
};
'@

$positionsTs = @'
export const POSITIONS = ['POR', 'DEF', 'LAT', 'CAR', 'MED', 'PIV', 'EXT', 'DEL'] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  POR: 'Portero',
  DEF: 'Defensa central',
  LAT: 'Lateral',
  CAR: 'Carrilero',
  MED: 'Mediocentro',
  PIV: 'Pivote',
  EXT: 'Extremo',
  DEL: 'Delantero',
};
'@

$leaguesTs = @'
export const LEAGUES = ['LaLiga', 'Premier League', 'Bundesliga', 'Serie A', 'Ligue 1', 'Liga MX', 'MLS'] as const;
'@

$competitionLevelsTs = @'
export const COMPETITION_LEVELS = ['amateur', 'regional', 'nacional', 'continental', 'internacional'] as const;
export type CompetitionLevel = (typeof COMPETITION_LEVELS)[number];
'@

$playerStatusTs = @'
export const PLAYER_STATUSES = ['PENDING_VERIFICATION', 'ACTIVE', 'AVAILABLE', 'INACTIVE'] as const;
export type PlayerStatus = (typeof PLAYER_STATUSES)[number];

export const PLAYER_STATUS_LABELS: Record<PlayerStatus, string> = {
  PENDING_VERIFICATION: 'Pending verification',
  ACTIVE: 'Activo',
  AVAILABLE: 'Disponible',
  INACTIVE: 'Inactivo',
};
'@

$opportunityTypesTs = @'
export const OPPORTUNITY_TYPES = ['TRIAL', 'SCOUTING', 'CONTRACT', 'SCHOLARSHIP', 'ACADEMY'] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  TRIAL: 'Prueba',
  SCOUTING: 'Scouting',
  CONTRACT: 'Contrato',
  SCHOLARSHIP: 'Beca',
  ACADEMY: 'Academia',
};
'@

$recruitmentStatusTs = @'
export const RECRUITMENT_STAGES = ['SUBMISSION', 'TRIAL', 'NEGOTIATION', 'CONTRACT'] as const;
export type RecruitmentStage = (typeof RECRUITMENT_STAGES)[number];

export const RECRUITMENT_STAGE_LABELS: Record<RecruitmentStage, string> = {
  SUBMISSION: 'Submission',
  TRIAL: 'Prueba',
  NEGOTIATION: 'Negotiation',
  CONTRACT: 'Contrato',
};
'@

Write-File 'packages/config/src/countries.ts' $countriesTs
Write-File 'packages/config/src/currencies.ts' $currenciesTs
Write-File 'packages/config/src/languages.ts' $languagesTs
Write-File 'packages/config/src/positions.ts' $positionsTs
Write-File 'packages/config/src/leagues.ts' $leaguesTs
Write-File 'packages/config/src/competition-levels.ts' $competitionLevelsTs
Write-File 'packages/config/src/player-status.ts' $playerStatusTs
Write-File 'packages/config/src/opportunity-types.ts' $opportunityTypesTs
Write-File 'packages/config/src/recruitment-status.ts' $recruitmentStatusTs

# ─── packages/validation/src ────────────────────────────────────
$userValTs = @'
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Email no válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
'@

$playerValTs = @'
import { z } from 'zod';

export const playerProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().datetime().optional().nullable(),
  nationality: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  foot: z.string().optional().nullable(),
  heightCm: z.number().int().positive().optional().nullable(),
  weightKg: z.number().int().positive().optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  clubName: z.string().optional().nullable(),
});

export type PlayerProfileInput = z.infer<typeof playerProfileSchema>;
'@

$clubValTs = @'
import { z } from 'zod';

export const clubProfileSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  city: z.string().optional().nullable(),
  league: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

export type ClubProfileInput = z.infer<typeof clubProfileSchema>;
'@

$opportunityValTs = @'
import { z } from 'zod';

export const opportunitySchema = z.object({
  title: z.string().min(3),
  type: z.enum(['TRIAL', 'SCOUTING', 'CONTRACT', 'SCHOLARSHIP', 'ACADEMY']),
  position: z.string().optional().nullable(),
  ageMin: z.number().int().min(6).max(40).optional().nullable(),
  ageMax: z.number().int().min(6).max(40).optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  closesAt: z.string().datetime().optional().nullable(),
});

export type OpportunityInput = z.infer<typeof opportunitySchema>;
'@

$recruitmentValTs = @'
import { z } from 'zod';

export const applicationSchema = z.object({
  opportunityId: z.string().cuid(),
  message: z.string().max(2000).optional().nullable(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
'@

Write-File 'packages/validation/src/user.ts' $userValTs
Write-File 'packages/validation/src/player.ts' $playerValTs
Write-File 'packages/validation/src/club.ts' $clubValTs
Write-File 'packages/validation/src/opportunity.ts' $opportunityValTs
Write-File 'packages/validation/src/recruitment.ts' $recruitmentValTs

# ─── Stubs page.tsx (apps/web/app) ──────────────────────────────
$appRoot = Join-Path $root 'apps/web/app'
$pageCount = 0
if (Test-Path -LiteralPath $appRoot) {
  foreach ($d in Get-ChildItem -LiteralPath $appRoot -Recurse -Directory) {
    $rel = $d.FullName.Substring($appRoot.Length).TrimStart('\', '/')
    if ($rel -like 'api*') { continue }
    $leaf = $d.Name
    if ($leaf.StartsWith('(')) { continue }
    $page = Join-Path $d.FullName 'page.tsx'
    if (Test-Path -LiteralPath $page) { continue }
    $words = ($leaf -replace '[\[\]]', '') -split '[-_ ]'
    $comp = ($words | ForEach-Object { if ($_) { $_.Substring(0, 1).ToUpper() + $_.Substring(1) } }) -join ''
    $title = ($words | ForEach-Object { if ($_) { $_.Substring(0, 1).ToUpper() + $_.Substring(1) } }) -join ' '
    $content = "export default function ${comp}Page() {`r`n  return (`r`n    <main className=`"mx-auto w-full max-w-7xl px-4 py-8`">`r`n      <h1 className=`"text-2xl font-bold`">$title</h1>`r`n    </main>`r`n  );`r`n}`r`n"
    Set-Content -LiteralPath $page -Value $content -Encoding UTF8
    $pageCount++
  }
}
Write-Host "Páginas generadas: $pageCount"

# ─── Stubs route.ts (apps/web/app/api/<dominio>) ─────────────────
$apiRoot = Join-Path $appRoot 'api'
$apiCount = 0
if (Test-Path -LiteralPath $apiRoot) {
  foreach ($d in Get-ChildItem -LiteralPath $apiRoot -Directory) {
    $route = Join-Path $d.FullName 'route.ts'
    if (Test-Path -LiteralPath $route) { continue }
    $domain = $d.Name
    $content = @"
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, domain: '$domain' });
}

export async function POST() {
  return NextResponse.json({ ok: true, domain: '$domain' }, { status: 201 });
}
"@
    Set-Content -LiteralPath $route -Value $content -Encoding UTF8
    $apiCount++
  }
}
Write-Host "Rutas API generadas: $apiCount"

# ─── .gitkeep en directorios vacíos ─────────────────────────────
$skip = @('node_modules', '.git', '.next', '.turbo', 'dist', 'coverage')
$gitkeepCount = 0
Get-ChildItem -LiteralPath $root -Recurse -Directory -Force | Where-Object {
  $skip -notcontains $_.Name -and
  -not $_.FullName.Contains('\node_modules\') -and
  -not $_.FullName.Contains('\.next\') -and
  -not $_.FullName.Contains('\.turbo\')
} | ForEach-Object {
  $files = Get-ChildItem -LiteralPath $_.FullName -Force
  if (-not $files) {
    New-Item -ItemType File -Force -Path (Join-Path $_.FullName '.gitkeep') | Out-Null
    $gitkeepCount++
  }
}
Write-Host ".gitkeep creados: $gitkeepCount"
Write-Host "Scaffold completado"





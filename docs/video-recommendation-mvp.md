# Video Recommendation MVP

## Goal

For the first version, the task is not to build a smart recommendation engine.
The task is to quickly map user answers to a small set of video tags and return 3-5 relevant warmups.

MVP principle:

- minimum questions
- minimum required tags
- transparent scoring
- no ML
- no heavy taxonomy

## Survey for v1

The survey should have 5 questions maximum. It needs to segment the user fast, not collect a full fitness profile.

### 1. Goal

Single choice.

- `pre_workout` - warm up before training
- `desk_reset` - loosen up after sitting
- `recovery` - gentle recovery
- `flexibility` - improve mobility and flexibility

This is the main intent signal.

### 2. Level

Single choice.

- `beginner`
- `intermediate`
- `advanced`

Three levels are enough for MVP.

### 3. Focus Areas

Multiple choice.

- `neck`
- `shoulders`
- `upper_back`
- `lower_back`
- `hips`
- `legs`
- `full_body`

This should stay compact. Avoid adding elbows, wrists, ankles, chest, core, glutes, and other micro-categories in v1 unless the library immediately requires them.

### 4. Available Time

Single choice.

- `3_5_min`
- `5_10_min`
- `10_plus_min`

For filtering, store the exact video duration in seconds and use this answer as a range preference.

### 5. Restrictions

Single choice for MVP.

- `none`
- `gentle_only`
- `pain_or_injury`

If you want to keep the flow even lighter, this question can be shown only after the user selects `recovery` or `beginner`.

## Video Tags for v1

Each video should have structured metadata. For the first version, keep the schema narrow and explicit.

### Required Fields

- `title`
- `description`
- `video_url`
- `thumbnail_url`
- `duration_sec`
- `level`
- `goal_tags`
- `focus_tags`
- `type`
- `intensity`
- `is_published`

### Canonical Tag Set

#### `level`

- `beginner`
- `intermediate`
- `advanced`

#### `type`

- `warmup`
- `mobility`
- `stretch`
- `recovery`

`type` is about format. `goal_tags` is about user intent. Do not merge them into one field.

#### `goal_tags`

- `pre_workout`
- `desk_reset`
- `recovery`
- `flexibility`

One video can have more than one goal tag.

#### `focus_tags`

- `neck`
- `shoulders`
- `upper_back`
- `lower_back`
- `hips`
- `legs`
- `full_body`

Use `full_body` only when the video genuinely fits a broad session. It should not replace specific focus tags.

#### `intensity`

- `low`
- `medium`
- `high`

#### `safety_tags`

- `gentle`
- `no_jump`
- `injury_caution`

This should be optional but strongly recommended. It is the first useful layer after the core tags.

#### `context_tags`

- `morning`
- `office`
- `pre_workout`
- `evening`

This is optional in v1. Add only if your content already naturally differs by context.

## What Not to Store in v1

Avoid these for the first release:

- calories
- difficulty scores from 1 to 10
- separate tags for every small joint or muscle
- detailed medical contraindications
- personalized history-based ranking
- many-to-many tag tables with complex admin tooling

All of that slows down launch and will not materially improve the first recommendation quality.

## Suggested Data Model

The current app already has `UserProfile` and `FitnessLevel`. For MVP, use that instead of introducing a complex recommendation subsystem.

### User profile additions

Recommended fields to add to `UserProfile`:

- `warmupGoal String?`
- `focusAreas String[]`
- `timeBudgetMinutes Int?`
- `restrictionLevel String?`

Keep `fitnessLevel` as the source of truth for level.

### Video model

For MVP, one table is enough. Use arrays instead of a normalized tag system.

```prisma
model Video {
  id             String   @id @default(cuid())
  slug           String   @unique
  title          String
  description    String?
  videoUrl       String
  thumbnailUrl   String?
  durationSec    Int
  level          FitnessLevel
  type           String
  goalTags       String[]
  focusTags      String[]
  safetyTags     String[] @default([])
  contextTags    String[] @default([])
  intensity      String
  isPublished    Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

This is intentionally denormalized. It is easier to seed, easier to inspect, and good enough for the first content library.

## Mapping Survey Answers to Filters

The survey should produce a compact recommendation profile.

Example:

```json
{
  "goal": "desk_reset",
  "level": "beginner",
  "focusAreas": ["neck", "upper_back"],
  "timeBudgetMinutes": 5,
  "restrictionLevel": "gentle_only"
}
```

Then use this profile in two steps:

### Step 1. Hard filters

Exclude videos that clearly do not fit:

- unpublished videos
- duration above the selected budget
- level too high for the user
- videos without required safety compatibility

### Step 2. Soft scoring

Rank the remaining videos with a simple points system:

- goal match: `+4`
- focus area match per tag: `+2`
- exact level match: `+2`
- easier-than-user level: `+1`
- duration within ideal band: `+1`
- safety match for `gentle_only` or `pain_or_injury`: `+3`
- context match: `+1`

Penalty examples:

- intensity too high for restricted user: `-4`
- advanced video for beginner: exclude

Return top 3-5 videos.

## Recommendation Rules

These rules will keep the first version predictable:

- never recommend `advanced` to `beginner`
- if the user selects `pain_or_injury`, only show videos with `gentle` and without high intensity
- if the user selects one focus area, allow `full_body` only as a fallback
- if fewer than 3 videos match, relax context first, then relax exact focus match, but do not relax safety

## Admin and Content Workflow

For launch, content operations should be simple:

1. Upload video URL and thumbnail
2. Enter title and short description
3. Fill duration
4. Choose one level
5. Choose one type
6. Choose 1-2 goal tags
7. Choose 1-3 focus tags
8. Set intensity
9. Add safety tags if needed
10. Publish

If tagging a video takes too long, the taxonomy is already too complex.

## Recommendation for This Codebase

For this repository specifically:

- keep the existing onboarding route and turn it into the survey entry point
- store user answers in `UserProfile`
- introduce a separate `Video` model instead of overloading `Ritual`
- keep recommendation logic in a plain server function in `src/lib`
- only after the library proves useful, decide whether `Video` should later merge with or replace `Ritual`

The current `Ritual` model is optimized for one guided daily ritual with exercises and audio. A tagged video library is a different content shape and should not be forced into the same table for v1.

## Final MVP Scope

Ship only this:

- 5-question onboarding survey
- 1 `Video` table with scalar fields and string arrays
- simple recommendation function with hard filters and scoring
- recommendation result page with top picks

Anything beyond that is phase 2.

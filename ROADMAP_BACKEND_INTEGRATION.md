# Roadmap Backend Integration Guide

## Current Architecture

The frontend now generates roadmaps **locally** without requiring the AI Engine. This works immediately and provides a personalized study plan based on:

1. **Subjects chosen** by the user
2. **Exam date** (calculates days until exam)
3. **Quiz results** (weak/strong topics identified)
4. **Time taken** in quizzes (adjusts allocated time)
5. **Daily study hours** (distributes tasks accordingly)

## Data Flow

```
User completes diagnostic quiz
         ↓
Frontend calculates:
  - Subject scores
  - Weak topics (< 50%)
  - Strong topics (≥ 80%)
  - Average time per question
         ↓
Frontend generates roadmap locally
         ↓
┌─────────────────┬──────────────────┐
│   CACHED        │   BACKEND        │
│   localStorage  │   (when ready)   │
└─────────────────┴──────────────────┘
```

## Frontend Service

**File:** `src/services/roadmapGenerator.service.ts`

### Input Parameters

```typescript
interface RoadmapInput {
  studentId: string;
  subjects: Subject[];           // User's chosen subjects
  examDate: Date;                // Target exam date
  dailyStudyHours: number;       // How many hours per day
  quizHistory: Quiz[];           // Previous quiz results
  weakTopics?: string[];         // Identified weak areas
  strongTopics?: string[];       // Identified strong areas
}
```

### Output Format

```typescript
interface GeneratedRoadmap {
  days: RoadmapDay[];            // Array of study days
  metadata: {
    generatedAt: string;         // ISO timestamp
    subjects: string[];          // Subject names
    totalDays: number;           // Number of study days
    examDate: string;            // ISO date
    weakTopics: string[];        // Areas needing focus
    strongTopics: string[];      // Areas of strength
    subjectScores: Record<string, number>; // Performance scores
  };
}
```

## Backend Endpoint Needed

### POST `/api/roadmap/save/`

Save the AI-generated roadmap to the database.

#### Request Body

```json
{
  "days": [
    {
      "day_number": 1,
      "date": "2025-03-15",
      "notes": "Day 1: Focus on Mathematics",
      "tasks": [
        {
          "title": "Strengthen: Algebra",
          "description": "Focus on Algebra - identified as an area needing improvement",
          "type": "study",
          "duration_minutes": 90,
          "subject_id": "mathematics",
          "topic_id": "math_1"
        },
        {
          "title": "Practice Quiz - Mathematics",
          "description": "Test your knowledge with practice questions",
          "type": "quiz",
          "duration_minutes": 20,
          "subject_id": "mathematics",
          "topic_id": "math_1"
        }
      ],
      "is_unlocked": true,
      "is_completed": false
    }
  ]
}
```

#### Response

```json
{
  "status": "success",
  "message": "Roadmap saved successfully",
  "roadmap_id": "uuid-here"
}
```

### GET `/api/roadmap/today/`

Retrieve today's roadmap (already exists, may need update).

#### Response

```json
{
  "id": "day_1",
  "day_number": 1,
  "date": "2025-03-15",
  "notes": "Day 1: Focus on Mathematics",
  "tasks": [
    {
      "id": "task_1_weak",
      "title": "Strengthen: Algebra",
      "description": "Focus on Algebra - identified as an area needing improvement",
      "type": "study",
      "duration": 90,
      "subject_id": "mathematics",
      "topic_id": "math_1",
      "status": "pending"
    }
  ],
  "quiz": {
    "id": "quiz_day_1",
    "title": "Daily Quiz - Day 1",
    "total_questions": 5
  },
  "progress": 0,
  "is_unlocked": true,
  "is_completed": false,
  "generation_status": "ready"
}
```

## Roadmap Algorithm

### 1. Subject Prioritization

Subjects are sorted by performance score (weakest first):

```javascript
const prioritizedSubjects = subjects.sort((a, b) => {
  const aScore = performance[a.id] || 50;
  const bScore = performance[b.id] || 50;
  return aScore - bScore; // Weaker subjects first
});
```

### 2. Daily Task Generation

Each day includes:
- **Weak topic study** (50% of time if weak areas exist)
- **Regular topic study** (30-60% of time)
- **Practice quiz** (20 minutes)
- **Revision** (15 minutes, days > 1)

### 3. Study Plan Duration

```javascript
const daysUntilExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
const leaveBufferDays = 3; // Final revision period
const actualStudyDays = daysUntilExam - leaveBufferDays;
```

### 4. Topic Rotation

```javascript
// Rotate through topics cyclically
const topic = subject.topics[dayNumber % subject.topics.length];

// Prioritize weak topics
if (weakTopics.length > 0 && dayNumber % 3 !== 0) {
  focusTopic = weakTopics[dayNumber % weakTopics.length];
}
```

## Database Schema Suggestion

```sql
-- User Roadmaps
CREATE TABLE user_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB -- stores weak_topics, strong_topics, subject_scores
);

-- Roadmap Days
CREATE TABLE roadmap_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID REFERENCES user_roadmaps(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    is_unlocked BOOLEAN DEFAULT false,
    is_completed BOOLEAN DEFAULT false,
    quiz_completed BOOLEAN DEFAULT false,
    quiz_score INTEGER,
    UNIQUE(roadmap_id, day_number)
);

-- Roadmap Tasks
CREATE TABLE roadmap_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID REFERENCES roadmap_days(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- study, quiz, revision, etc.
    duration_minutes INTEGER NOT NULL,
    subject_id VARCHAR(100) NOT NULL,
    topic_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    "order" INTEGER DEFAULT 0
);
```

## Frontend Code for Backend Integration

The frontend already has the code to call the backend - just uncomment this section in `src/api/roadmap.api.ts`:

```typescript
// Try to save to backend (when endpoint is available)
try {
  const backendFormat = roadmapGenerator.convertToBackendFormat(roadmap);
  console.log("[Roadmap] Saving to backend...", backendFormat);
  
  // UNCOMMENT WHEN BACKEND ENDPOINT IS READY:
  await apiClient.post("/api/roadmap/save/", backendFormat);
  
  console.log("[Roadmap] Saved to backend successfully");
} catch (error) {
  console.warn("[Roadmap] Failed to save to backend:", error);
}
```

## Testing

### With Current Setup (No Backend)

1. Complete onboarding (select subjects, exam date)
2. Complete diagnostic quiz
3. Roadmap is automatically generated and cached in localStorage
4. Check browser DevTools → Application → Local Storage

### With Backend

1. Implement the `POST /api/roadmap/save/` endpoint
2. Uncomment the save code in `roadmap.api.ts`
3. Roadmap will be persisted to database

## Migration Strategy

1. **Phase 1** (Current): Local generation only
   - Works immediately
   - Data persists in localStorage
   - User must regenerate if they clear browser data

2. **Phase 2** (Add Backend): Add save endpoint
   - Frontend saves to backend when available
   - Falls back to localStorage if backend fails
   - Seamless transition

3. **Phase 3** (Full Backend): Backend generates roadmap
   - Frontend sends quiz results to backend
   - Backend calls AI Engine or generates locally
   - Backend stores and serves roadmap
   - Supports multiple devices

## Benefits of Current Approach

1. ✅ **Works immediately** - no backend changes needed
2. ✅ **Personalized** - based on actual quiz performance
3. ✅ **Fast** - no API calls to AI Engine (which is failing)
4. ✅ **Offline capable** - works without internet after initial load
5. ✅ **Ready for backend** - easy to add persistence later

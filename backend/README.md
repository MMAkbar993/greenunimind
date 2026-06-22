# GreenUniMind Backend – Database Setup

MongoDB setup with Mongoose for **users**, **teachers**, **courses**, and **progress**. All required fields are enforced in the schemas.

## Collections (Models)

| Collection | Model   | Purpose |
|-----------|--------|---------|
| users     | User   | All users (students and teachers); auth and profile |
| teachers  | Teacher| Teacher profile and Stripe; references User |
| courses   | Course | Courses; creator = User (teacher) |
| lectures  | Lecture| Lectures per course; courseId references Course |
| progress  | Progress | Per-user, per-course progress and completed lectures |

## Required Fields

### User (`models/User.js`)
- `name.firstName` (string)
- `name.lastName` (string)
- `email` (string, unique)
- `password` (string, min 8, hashed)
- `role` (enum: `'student'` \| `'teacher'`)

### Teacher (`models/Teacher.js`)
- `user` (ObjectId ref User, unique)

### Course (`models/Course.js`)
- `title` (string)
- `description` (string)
- `category` (string)
- `courseLevel` (enum: `'Beginner'` \| `'Medium'` \| `'Advance'`)
- `coursePrice` (number, min 0)
- `creator` (ObjectId ref User)
- `isPublished` (boolean)
- `status` (enum: `'draft'` \| `'published'` \| `'archived'`)

### Lecture (`models/Lecture.js`)
- `lectureTitle` (string)
- `isPreviewFree` (boolean)
- `courseId` (ObjectId ref Course)
- `order` (number)

### Progress (`models/Progress.js`)
- `user` (ObjectId ref User)
- `course` (ObjectId ref Course)
- `completedLectures` (array of ObjectId ref Lecture)
- `progress` (number 0–100)
- `totalLectures` (number)

## Setup

1. Install dependencies:
   ```bash
   cd backend && npm install
   ```

2. Copy env example and set variables:
   ```bash
   cp .env.example .env
   ```
   Set `MONGODB_URI` (and optionally `PORT`, `JWT_*`, `CLIENT_URL`).

3. Connect DB (e.g. from your Express app):
   ```js
   const connectDB = require('./config/database');
   await connectDB();
   ```

4. Use models:
   ```js
   const { User, Teacher, Course, Lecture, Progress } = require('./models');
   ```

## Indexes

- **User:** `email` (unique), `role`
- **Teacher:** `user` (unique)
- **Course:** `creator`, `category`, `isPublished` + `status`
- **Lecture:** `(courseId, order)`
- **Progress:** `(user, course)` (unique), `user`, `course`

---

## Auth (Login / Signup with roles)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Body: `{ email, password }`. Returns `{ data: { user, accessToken, refreshToken } }`. |
| POST | `/api/auth/logout` | No body. Returns success (stateless JWT). |
| POST | `/api/users/create-student` | FormData: `data` (JSON string `{ password, student: { name, email, gender } }`), optional `file` (photo). Returns user + tokens. |
| POST | `/api/users/create-teacher` | FormData: `data` (JSON string `{ password, teacher: { name, email, gender } }`), optional `file`. Creates User (role teacher) + Teacher doc. Returns user + tokens. |
| GET | `/api/users/me` | Header: `Authorization: Bearer <accessToken>`. Returns current user. |

### Frontend

Set in frontend `.env`:

- `VITE_API_BASE_URL=http://localhost:5000/api` (for local backend)

Then login/signup use these endpoints. After login or signup, users are redirected by role: **teacher** → `/teacher/dashboard`, **student** → `/student/dashboard`.

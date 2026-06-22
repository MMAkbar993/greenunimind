# GreenUniMind Backend Documentation

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Authentication & Authorization](#authentication--authorization)
- [Database Models](#database-models)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Users](#users)
  - [Courses](#courses)
  - [Lectures](#lectures)
  - [Students](#students)
  - [Teachers](#teachers)
  - [Categories & Subcategories](#categories--subcategories)
  - [Payments](#payments)
  - [Stripe Connect](#stripe-connect)
  - [AI Content Enhancement](#ai-content-enhancement)
  - [Analytics](#analytics)
  - [Reviews](#reviews)
  - [Messaging](#messaging)
  - [Messages](#messages)
  - [Bookmarks](#bookmarks)
  - [Notes](#notes)
  - [Questions](#questions)
  - [Invoices](#invoices)
  - [Achievements](#achievements)
  - [Recommendations](#recommendations)
  - [Impact & Reports](#impact--reports)
  - [Revenue](#revenue)
  - [Search](#search)
  - [OAuth](#oauth)
  - [Miscellaneous](#miscellaneous)
- [Middleware](#middleware)
- [Utilities](#utilities)
- [Third-Party Integrations](#third-party-integrations)
- [Security](#security)
- [Notes & Limitations](#notes--limitations)

---

## Overview

GreenUniMind is a sustainability-focused e-learning platform. The backend is a RESTful API built with Node.js and Express that powers course creation, student enrollment, payments, AI-assisted content authoring, teacher analytics, and more.

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Runtime        | Node.js (ES Modules)                |
| Framework      | Express.js                          |
| Database       | MongoDB (via Mongoose)              |
| Authentication | JSON Web Tokens (access + refresh)  |
| Payments       | Stripe (Checkout, Connect)          |
| AI             | Google Gemini (`gemini-2.0-flash`)  |
| Email          | Nodemailer                          |
| File Uploads   | Multer (local storage)              |
| PDF Generation | PDFKit                              |

### Dependencies

`bcryptjs`, `cors`, `dotenv`, `express`, `express-mongo-sanitize`, `express-rate-limit`, `helmet`, `hpp`, `jsonwebtoken`, `mongoose`, `multer`, `nodemailer`, `pdfkit`, `stripe`

---

## Getting Started

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Copy the example env and fill in your values
cp .env.example .env

# 3. Start in development mode (uses --watch for auto-restart)
npm run dev

# 4. Start in production mode
npm start
```

The server listens on `PORT` (default **5000**).

---

## Environment Variables

| Variable                | Required | Description                              |
| ----------------------- | -------- | ---------------------------------------- |
| `PORT`                  | No       | Server port (default `5000`)             |
| `NODE_ENV`              | No       | `development` or `production`            |
| `MONGODB_URI`           | **Yes**  | MongoDB connection string                |
| `JWT_SECRET`            | **Yes**  | Secret for signing access tokens         |
| `JWT_EXPIRE`            | No       | Access token lifetime (e.g. `15m`)       |
| `JWT_REFRESH_SECRET`    | **Yes**  | Secret for signing refresh tokens        |
| `JWT_REFRESH_EXPIRE`    | No       | Refresh token lifetime (e.g. `7d`)       |
| `GEMINI_API_KEY`        | No       | Google Gemini API key for AI features    |
| `CLIENT_URL`            | No       | Frontend URL for CORS                    |
| `STRIPE_SECRET_KEY`     | No       | Stripe secret key for payments           |
| `STRIPE_WEBHOOK_SECRET` | No       | Stripe webhook signing secret            |
| `EMAIL_HOST`            | No       | SMTP host                                |
| `EMAIL_PORT`            | No       | SMTP port                                |
| `EMAIL_SECURE`          | No       | SMTP TLS (`true` / `false`)             |
| `EMAIL_USER`            | No       | SMTP username                            |
| `EMAIL_PASS`            | No       | SMTP password                            |
| `EMAIL_FROM`            | No       | Sender address                           |

> If email variables are not set, emails are logged to the console instead.

---

## Project Structure

```
backend/
├── config/
│   └── database.js              # MongoDB connection via Mongoose
├── controllers/
│   ├── achievementController.js  # Achievements CRUD & seeding
│   ├── aiController.js           # Gemini-powered content enhancement
│   ├── analyticsController.js    # Teacher analytics (stubs)
│   ├── authController.js         # Login, logout, OTP, password reset
│   ├── courseController.js       # Course CRUD, search, enrollment
│   ├── enrollmentController.js   # Course enrollment logic
│   ├── impactController.js       # Monthly impact reports
│   ├── lectureController.js      # Lecture CRUD, ordering, progress
│   ├── paymentController.js      # Stripe payments & teacher earnings
│   ├── progressController.js     # Student progress & certificates
│   ├── recommendationController.js # Course recommendations
│   ├── revenueController.js      # Revenue recording & summaries
│   ├── searchController.js       # Sustainability search
│   ├── teacherController.js      # Teacher-specific queries
│   └── userController.js         # User signup & profile
├── middleware/
│   ├── auth.js                   # JWT protect, restrictTo, optionalProtect
│   └── upload.js                 # Multer file upload (signup & courses)
├── models/
│   ├── Achievement.js
│   ├── Category.js
│   ├── Course.js
│   ├── Lecture.js
│   ├── Progress.js
│   ├── Revenue.js
│   ├── Subcategory.js
│   ├── Teacher.js
│   ├── Transaction.js
│   ├── User.js
│   ├── UserAchievement.js
│   └── index.js                  # Model barrel export
├── routes/
│   ├── achievementRoutes.js
│   ├── aiRoutes.js
│   ├── analyticsRoutes.js
│   ├── authRoutes.js
│   ├── bookmarkRoutes.js
│   ├── categoryRoutes.js
│   ├── courseRoutes.js
│   ├── impactRoutes.js
│   ├── invoiceRoutes.js
│   ├── lectureRoutes.js
│   ├── messageRoutes.js
│   ├── messagingRoutes.js
│   ├── oauthRoutes.js
│   ├── paymentRoutes.js
│   ├── recommendationRoutes.js
│   ├── reportsRoutes.js
│   ├── reviewRoutes.js
│   ├── revenueRoutes.js
│   ├── searchRoutes.js
│   ├── studentRoutes.js
│   ├── stripeConnectRoutes.js
│   ├── subCategoryRoutes.js
│   ├── teacherRoutes.js
│   └── userRoutes.js
├── utils/
│   ├── achievementService.js     # Achievement awarding logic
│   ├── certificateGenerator.js   # PDF certificate via PDFKit
│   ├── email.js                  # Nodemailer email helpers
│   └── jwt.js                    # Token generation & verification
├── uploads/                      # Local file storage
├── server.js                     # Entry point
├── package.json
└── .env.example
```

---

## Authentication & Authorization

### Flow

1. **Signup** — `POST /api/users/create-student` or `POST /api/users/create-teacher`
   - Accepts multipart form data (via Multer for profile image).
   - Creates the user, sends a 6-digit OTP via email.
   - Returns an access token and a refresh token immediately.

2. **Email Verification** — `POST /api/auth/verify-otp`
   - Verifies the OTP and marks the user's email as verified.

3. **Login** — `POST /api/auth/login`
   - Validates email + password.
   - Returns an access token and a refresh token.

4. **Protected Routes** — `Authorization: Bearer <access_token>`
   - The `protect` middleware verifies the JWT and attaches `req.user`.

5. **Role-Based Access** — `restrictTo('student')` / `restrictTo('teacher')`
   - Applied after `protect`; returns 403 if the user's role doesn't match.

6. **Optional Auth** — `optionalProtect`
   - Sets `req.user` if a valid token is present, but doesn't block unauthenticated requests.

7. **Token Refresh** — `POST /api/auth/refresh-token`
   - Accepts the refresh token (in body or `x-refresh-token` header).
   - Returns new access + refresh tokens.

8. **Password Reset** — `POST /api/auth/forget-password` → `POST /api/auth/reset-password`
   - Sends a reset token via email; the user resets with the token.

### Token Details

| Token          | Secret               | Default Lifetime |
| -------------- | --------------------- | ---------------- |
| Access Token   | `JWT_SECRET`          | `JWT_EXPIRE`     |
| Refresh Token  | `JWT_REFRESH_SECRET`  | `JWT_REFRESH_EXPIRE` |

---

## Database Models

### User

| Field                      | Type     | Description                         |
| -------------------------- | -------- | ----------------------------------- |
| `name.firstName`           | String   | First name (required)               |
| `name.middleName`          | String   | Middle name                         |
| `name.lastName`            | String   | Last name (required)                |
| `email`                    | String   | Unique, required                    |
| `password`                 | String   | Hashed with bcryptjs                |
| `role`                     | String   | `student` or `teacher`              |
| `gender`                   | String   | Optional                            |
| `profileImg`               | String   | Profile image URL                   |
| `isEmailVerified`          | Boolean  | Email verification status           |
| `isActive`                 | Boolean  | Account active flag                 |
| `emailVerificationOTP`     | String   | Hashed OTP for email verification   |
| `emailVerificationExpires` | Date     | OTP expiry                          |
| `passwordResetToken`       | String   | Hashed password reset token         |
| `passwordResetExpires`     | Date     | Reset token expiry                  |

### Teacher

| Field              | Type       | Description                      |
| ------------------ | ---------- | -------------------------------- |
| `user`             | ObjectId   | Reference to User                |
| `stripeAccountId`  | String     | Stripe Connect account ID        |
| `stripeEmail`      | String     | Stripe account email             |
| `bio`              | String     | Teacher biography                |
| `isVerified`       | Boolean    | Verification status              |

### Course

| Field                     | Type       | Description                          |
| ------------------------- | ---------- | ------------------------------------ |
| `title`                   | String     | Course title                         |
| `subtitle`                | String     | Course subtitle                      |
| `description`             | String     | Full description                     |
| `category`                | ObjectId   | Reference to Category                |
| `subcategory`             | ObjectId   | Reference to Subcategory             |
| `courseLevel`              | String     | `Beginner`, `Medium`, or `Advance`   |
| `coursePrice`              | Number     | Price in currency units              |
| `courseThumbnail`         | String     | Thumbnail URL                        |
| `courseThumbnailPublicId` | String     | Cloudinary-style public ID           |
| `enrolledStudents`        | [ObjectId] | Array of enrolled User IDs           |
| `totalEnrollment`         | Number     | Total enrollment count               |
| `creator`                 | ObjectId   | Reference to User (teacher)          |
| `isPublished`             | Boolean    | Published flag                       |
| `status`                  | String     | `draft`, `published`, or `archived`  |
| `isFree`                  | Boolean    | Whether the course is free           |

### Lecture

| Field              | Type       | Description                         |
| ------------------ | ---------- | ----------------------------------- |
| `lectureTitle`     | String     | Lecture title                       |
| `instruction`      | String     | Lecture instructions                |
| `videoUrl`         | String     | Video URL                           |
| `videoResolutions` | Mixed      | Available video resolutions         |
| `hlsUrl`           | String     | HLS streaming URL                   |
| `audioUrl`         | String     | Audio-only URL                      |
| `articleContent`   | String     | Text-based content                  |
| `pdfUrl`           | String     | PDF attachment URL                  |
| `duration`         | Number     | Duration in seconds                 |
| `isPreviewFree`    | Boolean    | Available as free preview           |
| `courseId`         | ObjectId   | Reference to Course                 |
| `order`            | Number     | Display order                       |
| `thumbnailUrl`     | String     | Thumbnail URL                       |
| `views`            | Number     | View count                          |

### Progress

| Field               | Type       | Description                                  |
| ------------------- | ---------- | -------------------------------------------- |
| `user`              | ObjectId   | Reference to User                            |
| `course`            | ObjectId   | Reference to Course                          |
| `completedLectures` | [ObjectId] | Array of completed Lecture IDs               |
| `progress`          | Number     | Overall progress percentage                  |
| `totalLectures`     | Number     | Total lectures in the course                 |
| `totalDuration`     | Number     | Total course duration                        |
| `watchedDuration`   | Number     | Total watched duration                       |
| `lastAccessed`      | Date       | Last access timestamp                        |
| `lectureProgress`   | [Subdoc]   | Per-lecture progress (currentTime, duration, completionPercentage, isCompleted, watchTime) |
| `certificateGenerated` | Boolean | Whether certificate has been generated       |
| `enrolledAt`        | Date       | Enrollment date                              |

### Transaction

| Field                    | Type       | Description                          |
| ------------------------ | ---------- | ------------------------------------ |
| `student`                | ObjectId   | Reference to User (student)          |
| `course`                 | ObjectId   | Reference to Course                  |
| `teacher`                | ObjectId   | Reference to User (teacher)          |
| `amount`                 | Number     | Transaction amount                   |
| `currency`               | String     | Currency code                        |
| `status`                 | String     | `pending`, `completed`, `failed`, `refunded` |
| `stripeSessionId`        | String     | Stripe Checkout session ID           |
| `stripePaymentIntentId`  | String     | Stripe PaymentIntent ID              |
| `paymentMethod`          | String     | `stripe` or `free`                   |
| `teacherEarnings`        | Number     | Teacher's share                      |
| `platformFee`            | Number     | Platform's share                     |
| `isPaidOut`              | Boolean    | Whether teacher has been paid        |
| `paidOutAt`              | Date       | Payout date                          |

### Category

| Field         | Type    | Description           |
| ------------- | ------- | --------------------- |
| `name`        | String  | Category name         |
| `slug`        | String  | URL-friendly slug     |
| `description` | String  | Description           |
| `icon`        | String  | Icon identifier       |
| `isActive`    | Boolean | Active flag           |

### Subcategory

| Field        | Type       | Description                |
| ------------ | ---------- | -------------------------- |
| `categoryId` | ObjectId   | Reference to Category      |
| `name`       | String     | Subcategory name           |
| `slug`       | String     | URL-friendly slug          |
| `description`| String     | Description                |
| `isActive`   | Boolean    | Active flag                |

### Revenue

| Field       | Type   | Description                                              |
| ----------- | ------ | -------------------------------------------------------- |
| `source`    | String | `ad`, `course`, or `donation`                            |
| `amount`    | Number | Revenue amount                                           |
| `currency`  | String | Currency code                                            |
| `description` | String | Description                                           |
| `metadata`  | Object | `courseId`, `userId`, `teacherId`, `stripePaymentId`     |

### Achievement

| Field         | Type   | Description                                                  |
| ------------- | ------ | ------------------------------------------------------------ |
| `code`        | String | Unique achievement code                                      |
| `name`        | String | Display name                                                 |
| `description` | String | Description                                                  |
| `icon`        | String | Icon identifier                                              |
| `category`    | String | `learning`, `completion`, `engagement`, `milestone`, `special` |
| `points`      | Number | Points value                                                 |
| `requirement` | Mixed  | Requirement criteria                                         |

### UserAchievement

| Field         | Type       | Description               |
| ------------- | ---------- | ------------------------- |
| `user`        | ObjectId   | Reference to User         |
| `achievement` | ObjectId   | Reference to Achievement  |
| `earnedAt`    | Date       | Date earned               |

---

## API Reference

Base URL: `/api`

### Auth

| Method | Endpoint                       | Auth     | Description                    |
| ------ | ------------------------------ | -------- | ------------------------------ |
| POST   | `/auth/login`                  | No       | Login with email & password    |
| POST   | `/auth/logout`                 | No       | Logout                         |
| POST   | `/auth/refresh-token`          | No       | Refresh access token           |
| POST   | `/auth/verify-otp`             | No       | Verify email OTP               |
| POST   | `/auth/resend-verification`    | No       | Resend verification email      |
| POST   | `/auth/forget-password`        | No       | Request password reset         |
| POST   | `/auth/reset-password`         | No       | Reset password with token      |
| POST   | `/auth/change-password`        | protect  | Change password (authenticated)|
| GET    | `/auth/rate-limit-status`      | No       | Check rate limit status        |

### Users

| Method | Endpoint                     | Auth     | Description                     |
| ------ | ---------------------------- | -------- | ------------------------------- |
| POST   | `/users/create-student`      | No       | Register as student             |
| POST   | `/users/create-teacher`      | No       | Register as teacher             |
| GET    | `/users/me`                  | protect  | Get current user profile        |
| PATCH  | `/users/edit-profile/:id`    | protect  | Update profile (name, gender, image) |

### Courses

| Method | Endpoint                            | Auth              | Description                |
| ------ | ----------------------------------- | ----------------- | -------------------------- |
| POST   | `/courses/create-course/:teacherId` | protect + teacher  | Create a new course        |
| GET    | `/courses/creator/:teacherId`       | protect            | Get teacher's courses      |
| GET    | `/courses/published-courses`        | No                 | List published courses (paginated) |
| GET    | `/courses/popular-courses`          | No                 | List popular courses       |
| GET    | `/courses/search`                   | No                 | Search courses             |
| POST   | `/courses/:courseId/enroll`          | protect + student  | Enroll in a course         |
| GET    | `/courses/:id`                      | optionalProtect    | Get course by ID           |
| PATCH  | `/courses/edit-course/:id`          | protect + teacher  | Update a course            |
| DELETE | `/courses/delete-course/:id`        | protect + teacher  | Delete a course            |

### Lectures

| Method | Endpoint                                          | Auth              | Description              |
| ------ | ------------------------------------------------- | ----------------- | ------------------------ |
| POST   | `/lectures/:id/create-lecture`                    | protect + teacher  | Create a lecture         |
| GET    | `/lectures/:id/get-lectures`                      | protect            | List lectures by course  |
| GET    | `/lectures/:id`                                   | protect            | Get lecture by ID        |
| GET    | `/lectures/:id/progress`                          | protect            | Get lecture progress     |
| PUT    | `/lectures/:id/progress`                          | protect            | Update lecture progress  |
| PATCH  | `/lectures/:id/update-order`                      | protect + teacher  | Reorder lectures         |
| PATCH  | `/lectures/:courseId/update-lecture/:lectureId`    | protect + teacher  | Update a lecture         |
| DELETE | `/lectures/:courseId/delete-lecture/:lectureId`    | protect + teacher  | Delete a lecture         |

### Students

| Method | Endpoint                                              | Auth    | Description                    |
| ------ | ----------------------------------------------------- | ------- | ------------------------------ |
| GET    | `/students/:studentId/enrolled-courses-progress`      | protect | Enrolled courses with progress |
| GET    | `/students/:studentId/course-progress/:courseId`       | protect | Progress for a specific course |
| POST   | `/students/:studentId/mark-lecture-complete`           | protect | Mark a lecture as complete     |
| POST   | `/students/:studentId/generate-certificate/:courseId`  | protect | Generate PDF certificate       |

### Teachers

| Method | Endpoint                                  | Auth              | Description            |
| ------ | ----------------------------------------- | ----------------- | ---------------------- |
| GET    | `/teachers/:teacherId/enrolled-students`  | protect + teacher  | List enrolled students |

### Categories & Subcategories

| Method | Endpoint                                     | Auth | Description                    |
| ------ | -------------------------------------------- | ---- | ------------------------------ |
| GET    | `/categories`                                | No   | List all categories            |
| GET    | `/categories/with-subcategories`             | No   | Categories with subcategories  |
| GET    | `/categories/:id`                            | No   | Get category by ID             |
| GET    | `/categories/:categoryId/courses`            | No   | Courses in a category          |
| POST   | `/categories/create-category`                | No   | Create a category              |
| PATCH  | `/categories/:id`                            | No   | Update a category              |
| DELETE | `/categories/:id`                            | No   | Delete a category              |
| GET    | `/sub-category/category/:categoryId`         | No   | Subcategories by category      |
| GET    | `/sub-category/:subcategoryId/courses`       | No   | Courses in a subcategory       |
| POST   | `/sub-category/create-subCategory`           | No   | Create a subcategory           |
| PATCH  | `/sub-category/:id`                          | No   | Update a subcategory           |
| DELETE | `/sub-category/:id`                          | No   | Delete a subcategory           |

### Payments

| Method | Endpoint                                     | Auth      | Description                      |
| ------ | -------------------------------------------- | --------- | -------------------------------- |
| POST   | `/payments/create-checkout-session`          | protect   | Create Stripe Checkout session   |
| POST   | `/payments/create-payment-intent`            | protect   | Create Stripe PaymentIntent      |
| GET    | `/payments/session/:sessionId`               | protect   | Get transaction by session ID    |
| POST   | `/payments/webhook`                          | raw body  | Stripe webhook handler           |
| GET    | `/payments/upcoming-payout/:teacherId`       | protect   | Upcoming payout amount           |
| GET    | `/payments/earnings/:teacherId`              | protect   | Teacher total earnings           |
| GET    | `/payments/payout-info/:teacherId`           | protect   | Payout info                      |
| GET    | `/payments/transactions/:teacherId`          | protect   | Teacher transactions list        |
| GET    | `/payments/payouts/:teacherId`               | protect   | Payout history                   |
| GET    | `/payments/payouts/preferences/:teacherId`   | protect   | Payout preferences               |
| PUT    | `/payments/payouts/preferences/:teacherId`   | protect   | Update payout preferences        |
| GET    | `/payments/earnings-growth/:teacherId`       | protect   | Earnings growth data             |
| GET    | `/payments/revenue-chart/:teacherId`         | protect   | Revenue chart data               |
| GET    | `/payments/financial-summary/:teacherId`     | protect   | Financial summary                |
| GET    | `/payments/top-courses/:teacherId`           | protect   | Top performing courses           |
| GET    | `/payments/transaction/:transactionId`       | protect   | Transaction by ID                |
| GET    | `/payments/student-transactions/:studentId`  | protect   | Student's transaction history    |
| GET    | `/payments/teacher-payouts/:teacherId`       | protect   | Teacher payouts                  |

### Stripe Connect

| Method | Endpoint                                     | Auth    | Description                         |
| ------ | -------------------------------------------- | ------- | ----------------------------------- |
| POST   | `/stripe-connect/create-account`             | protect | Create Stripe Connect account       |
| POST   | `/stripe-connect/create-account-link`        | protect | Generate onboarding link            |
| GET    | `/stripe-connect/account-status`             | protect | Get account status                  |
| GET    | `/stripe-connect/quick-status`               | protect | Quick account status check          |
| POST   | `/stripe-connect/proactive-verification`     | protect | Trigger proactive verification      |
| DELETE | `/stripe-connect/disconnect-account`         | protect | Disconnect Stripe account           |
| DELETE | `/stripe-connect/disconnect-enhanced`        | protect | Enhanced disconnect                 |

### AI Content Enhancement

All endpoints require authentication. Powered by **Google Gemini** (`gemini-2.0-flash`).

| Method | Endpoint                    | Auth    | Description                              |
| ------ | --------------------------- | ------- | ---------------------------------------- |
| POST   | `/ai/enhance-title`         | protect | Generate improved course title           |
| POST   | `/ai/enhance-subtitle`      | protect | Generate improved course subtitle        |
| POST   | `/ai/enhance-description`   | protect | Generate improved course description     |
| POST   | `/ai/suggest-category`      | protect | Suggest best category for a course       |
| POST   | `/ai/generate-outline`      | protect | Generate a full course outline           |

### Analytics

Teacher analytics dashboard. All endpoints require authentication and a `teacherId` parameter.

| Method | Endpoint                                                 | Auth    | Description                |
| ------ | -------------------------------------------------------- | ------- | -------------------------- |
| GET    | `/analytics/teachers/:teacherId/dashboard`               | protect | Dashboard overview         |
| GET    | `/analytics/teachers/:teacherId/activities`              | protect | Recent activities          |
| PATCH  | `/analytics/teachers/:teacherId/activities/bulk-read`    | protect | Mark activities as read    |
| GET    | `/analytics/teachers/:teacherId/insights`                | protect | Teaching insights          |
| GET    | `/analytics/teachers/:teacherId/enrollment-statistics`   | protect | Enrollment statistics      |
| GET    | `/analytics/teachers/:teacherId/performance-detailed`    | protect | Detailed performance       |
| GET    | `/analytics/teachers/:teacherId/realtime`                | protect | Realtime metrics           |
| GET    | `/analytics/teachers/:teacherId/engagement-metrics`      | protect | Engagement metrics         |
| GET    | `/analytics/teachers/:teacherId/revenue-detailed`        | protect | Revenue breakdown          |
| GET    | `/analytics/teachers/:teacherId/student-engagement`      | protect | Student engagement data    |
| GET    | `/analytics/teachers/:teacherId/course-details`          | protect | Course-level details       |
| GET    | `/analytics/teachers/:teacherId/geographic`              | protect | Geographic distribution    |
| GET    | `/analytics/teachers/:teacherId/time-based`              | protect | Time-based analytics       |
| GET    | `/analytics/teachers/:teacherId/predictive`              | protect | Predictive insights        |
| GET    | `/analytics/teachers/:teacherId/benchmark`               | protect | Benchmark comparisons      |
| POST   | `/analytics/teachers/:teacherId/export`                  | protect | Export analytics data      |

**Widgets & Alerts** — CRUD endpoints for custom dashboard widgets and alert rules are also available under the analytics namespace.

### Reviews

| Method | Endpoint                                        | Auth    | Description              |
| ------ | ----------------------------------------------- | ------- | ------------------------ |
| GET    | `/reviews/teacher/:teacherId`                   | protect | Teacher's reviews        |
| GET    | `/reviews/teacher/:teacherId/analytics`         | protect | Review analytics         |
| GET    | `/reviews/teacher/:teacherId/stats`             | protect | Review statistics        |
| GET    | `/reviews/teacher/:teacherId/dashboard`         | protect | Review dashboard         |
| GET    | `/reviews/teacher/:teacherId/insights`          | protect | Review insights          |
| GET    | `/reviews/teacher/:teacherId/trends`            | protect | Review trends            |
| GET    | `/reviews/course/:courseId`                      | No      | Course reviews           |
| POST   | `/reviews/:reviewId/respond`                    | protect | Respond to a review      |
| POST   | `/reviews/teacher/:teacherId/export`            | protect | Export reviews           |
| POST   | `/reviews/:reviewId/helpful`                    | protect | Mark review as helpful   |
| POST   | `/reviews/:reviewId/report`                     | protect | Report a review          |

### Messaging

| Method | Endpoint                                              | Auth    | Description             |
| ------ | ----------------------------------------------------- | ------- | ----------------------- |
| GET    | `/messaging/users/:userId/folders`                    | protect | Message folders         |
| GET    | `/messaging/users/:userId/threads`                    | protect | Message threads         |
| GET    | `/messaging/conversations/:threadId/messages`         | protect | Messages in a thread    |
| GET    | `/messaging/users/:userId/search`                     | protect | Search messages         |
| GET    | `/messaging/users/:userId/stats`                      | protect | Messaging statistics    |

### Messages

| Method | Endpoint                                      | Auth    | Description              |
| ------ | --------------------------------------------- | ------- | ------------------------ |
| POST   | `/messages/send`                              | protect | Send a message           |
| POST   | `/messages/threads/:threadId/reply`           | protect | Reply to a thread        |
| PATCH  | `/messages/mark-read`                         | protect | Mark messages as read    |
| PATCH  | `/messages/threads/:threadId/mark-read`       | protect | Mark thread as read      |
| PATCH  | `/messages/:messageId/star`                   | protect | Star/unstar a message    |
| PATCH  | `/messages/threads/:threadId/archive`         | protect | Archive a thread         |
| DELETE | `/messages/delete`                            | protect | Delete messages          |
| GET    | `/messages/users/:userId/notifications`       | protect | User notifications       |
| PATCH  | `/messages/notifications/mark-read`           | protect | Mark notifications read  |
| POST   | `/messages/drafts`                            | protect | Create a draft           |
| PUT    | `/messages/drafts/:draftId`                   | protect | Update a draft           |
| GET    | `/messages/users/:userId/drafts`              | protect | List user's drafts       |
| DELETE | `/messages/drafts/:draftId`                   | protect | Delete a draft           |

### Bookmarks

| Method | Endpoint                                          | Auth    | Description                  |
| ------ | ------------------------------------------------- | ------- | ---------------------------- |
| POST   | `/bookmarks/:studentId`                           | protect | Create a bookmark            |
| GET    | `/bookmarks/:lectureId/:studentId`                | protect | Bookmarks for a lecture      |
| PATCH  | `/bookmarks/:id`                                  | protect | Update a bookmark            |
| DELETE | `/bookmarks/:id`                                  | protect | Delete a bookmark            |
| GET    | `/bookmarks/shared/:lectureId`                    | protect | Shared bookmarks             |
| POST   | `/bookmarks/share/:bookmarkId`                    | protect | Share a bookmark             |
| GET    | `/bookmarks/category/:studentId/:category`        | protect | Bookmarks by category        |
| POST   | `/bookmarks/tags/:studentId`                      | protect | Add tags to bookmarks        |

### Notes

| Method | Endpoint                             | Auth    | Description           |
| ------ | ------------------------------------ | ------- | --------------------- |
| POST   | `/notes/:studentId`                  | protect | Create a note         |
| GET    | `/notes/:lectureId/:studentId`       | protect | Notes for a lecture   |
| DELETE | `/notes/:id`                         | protect | Delete a note         |
| GET    | `/notes/shared/:lectureId`           | protect | Shared notes          |
| POST   | `/notes/share/:noteId`              | protect | Share a note          |

### Questions

| Method | Endpoint                                | Auth    | Description             |
| ------ | --------------------------------------- | ------- | ----------------------- |
| POST   | `/questions/:studentId`                 | protect | Ask a question          |
| GET    | `/questions/:lectureId/:studentId`      | protect | Questions for a lecture |
| GET    | `/questions/lecture/:lectureId`         | protect | All lecture questions   |
| PATCH  | `/questions/answer/:id`                 | protect | Answer a question       |
| PATCH  | `/questions/:id`                        | protect | Update a question       |
| DELETE | `/questions/:id`                        | protect | Delete a question       |

### Invoices

| Method | Endpoint                                      | Auth    | Description                |
| ------ | --------------------------------------------- | ------- | -------------------------- |
| POST   | `/invoices/generate/:transactionId`           | protect | Generate an invoice        |
| GET    | `/invoices/transaction/:transactionId`        | protect | Invoice by transaction     |
| GET    | `/invoices/student/:studentId`                | protect | Student's invoices         |
| POST   | `/invoices/resend/:transactionId`             | protect | Resend invoice email       |
| GET    | `/invoices/stats/teacher/:teacherId`          | protect | Invoice statistics         |
| POST   | `/invoices/bulk-generate`                     | protect | Bulk generate invoices     |

### Achievements

| Method | Endpoint              | Auth    | Description              |
| ------ | --------------------- | ------- | ------------------------ |
| GET    | `/achievements`       | No      | List all achievements    |
| GET    | `/achievements/my`    | protect | Current user's achievements |

### Recommendations

| Method | Endpoint              | Auth            | Description              |
| ------ | --------------------- | --------------- | ------------------------ |
| GET    | `/recommendations`    | optionalProtect | Get course recommendations |

### Impact & Reports

| Method | Endpoint                    | Auth | Description                   |
| ------ | --------------------------- | ---- | ----------------------------- |
| GET    | `/impact/report`            | No   | Monthly sustainability report |
| GET    | `/impact/available-months`  | No   | Available report months       |
| GET    | `/reports/monthly`          | No   | Monthly report (docs format)  |

### Revenue

| Method | Endpoint             | Auth              | Description          |
| ------ | -------------------- | ----------------- | -------------------- |
| POST   | `/revenue`           | protect + teacher  | Record a revenue entry |
| GET    | `/revenue/summary`   | No                 | Revenue summary       |

### Search

| Method | Endpoint   | Auth | Description                      |
| ------ | ---------- | ---- | -------------------------------- |
| GET    | `/search`  | No   | Search sustainability courses    |

### OAuth

| Method | Endpoint        | Auth    | Description              |
| ------ | --------------- | ------- | ------------------------ |
| POST   | `/oauth/link`   | protect | Link OAuth provider      |
| POST   | `/oauth/unlink` | protect | Unlink OAuth provider    |

### Miscellaneous

| Method | Endpoint      | Auth | Description           |
| ------ | ------------- | ---- | --------------------- |
| POST   | `/errors`     | No   | Client error reporting |
| GET    | `/health`     | No   | API health check       |
| GET    | `/health` (root) | No | Root health check     |

---

## Middleware

| Middleware        | File        | Description                                                 |
| ----------------- | ----------- | ----------------------------------------------------------- |
| `protect`         | `auth.js`   | Verifies JWT access token. Sets `req.user`. Returns 401 if invalid. |
| `restrictTo`      | `auth.js`   | Checks user role. Returns 403 if the role doesn't match.    |
| `optionalProtect` | `auth.js`   | Verifies JWT if present; doesn't block unauthenticated requests. |
| `parseSignupForm` | `upload.js` | Multer middleware for signup forms. Handles profile image uploads (max 5MB). |
| `parseCourseForm` | `upload.js` | Multer middleware for course creation. Handles thumbnail uploads (max 10MB). |

### Global Middleware (applied in `server.js`)

- **Helmet** — Sets security-related HTTP headers
- **CORS** — Configured with allowed origins (localhost, Vercel deployments, `CLIENT_URL`)
- **express-mongo-sanitize** — Prevents NoSQL injection
- **hpp** — Protects against HTTP parameter pollution
- **Rate Limiting** — 200 requests/15 min for general API, 20 requests/15 min for auth endpoints

---

## Utilities

| File                      | Exports                                          | Description                                              |
| ------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| `jwt.js`                  | `generateAccessToken`, `generateRefreshToken`, `verifyAccessToken`, `verifyRefreshToken` | Token generation and verification helpers |
| `email.js`                | `sendVerificationEmail`, `sendPasswordResetEmail` | Email sending via Nodemailer (falls back to console.log) |
| `certificateGenerator.js` | `generateCertificatePDF`                         | Generates PDF certificates via PDFKit                    |
| `achievementService.js`   | `awardAchievement`, `checkAndAwardAchievements`  | Awards achievements based on enrollment, completion, etc. |

---

## Third-Party Integrations

### Google Gemini (AI)

Used in `aiController.js` for course content enhancement:
- **Model:** `gemini-2.0-flash`
- **Features:** Title enhancement, subtitle enhancement, description enhancement, category suggestion, course outline generation
- **Env:** `GEMINI_API_KEY`

### Stripe (Payments)

- **Checkout Sessions** — For course purchases
- **Payment Intents** — Alternative payment flow
- **Webhooks** — Handles `checkout.session.completed` and other events
- **Stripe Connect** — Teacher onboarding, account management, and payouts
- **Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### MongoDB (Database)

- Connected via Mongoose using `MONGODB_URI`
- Connection logic in `config/database.js`

### Nodemailer (Email)

- Sends verification emails (OTP) and password reset emails
- Configured via `EMAIL_*` environment variables
- Falls back to `console.log` if SMTP is not configured

---

## Security

| Feature                 | Implementation                                             |
| ----------------------- | ---------------------------------------------------------- |
| Password Hashing        | bcryptjs                                                   |
| JWT Authentication      | Access + Refresh token pattern                             |
| HTTP Security Headers   | Helmet                                                     |
| NoSQL Injection Prevention | express-mongo-sanitize                                  |
| Parameter Pollution     | hpp                                                        |
| Rate Limiting           | express-rate-limit (200/15min general, 20/15min auth)      |
| CORS                    | Whitelist-based origin validation                          |
| File Upload Limits      | Multer with size limits (5MB signup, 10MB courses)         |
| Input Sanitization      | OTP and reset tokens are hashed before storage             |

---

## Notes & Limitations

- **Stub Endpoints:** Messaging, reviews, notes, bookmarks, questions, invoices, and some analytics endpoints return mock/placeholder data and do not persist to dedicated database collections.
- **File Storage:** Course thumbnails and profile images are stored locally in the `uploads/` directory (no cloud storage integration).
- **2FA:** Two-factor authentication endpoints exist but are stub implementations.
- **OAuth:** Link/unlink endpoints exist but are placeholder implementations.
- **ES Modules:** The project uses `"type": "module"` in `package.json`. All imports/exports use ES module syntax.

# Unifyra
### AI-Powered Brand Governance & Intelligence Platform

**One Brand. One Voice. Everywhere.**

Unifyra is an AI-powered brand governance and intelligence platform designed to help organizations maintain consistent brand identity across their digital content. It analyzes content against brand guidelines, identifies visual and textual inconsistencies, tracks recurring brand drift, and enables collaborative review workflows.

<p align="center">
  <strong>Live Application:</strong>
  <a href="https://unifyra.vercel.app">unifyra.vercel.app</a>
</p>

<p align="center">
  <strong>Team:</strong> CoreSync
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Round 3 Improvements](#round-3-improvements)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Testing and Validation](#testing-and-validation)
- [Known Limitations](#known-limitations)
- [Future Roadmap](#future-roadmap)
- [Team](#team)
- [Project Links](#project-links)

---

## Overview

Maintaining a consistent brand identity across campaigns, documents, images, and communication channels can be challenging.

Unifyra addresses this problem through AI-assisted brand auditing and centralized governance.

The platform enables teams to:

1. Define and manage brand guidelines.
2. Analyze submitted content for brand compliance.
3. Audit visual assets using AI-powered image analysis.
4. Identify recurring violations and brand drift patterns.
5. Generate actionable guideline suggestions.
6. Review submissions collaboratively through comments and notifications.
7. Upload documents and extract their text for AI-powered analysis.

Unifyra aims to make brand governance more measurable, collaborative, and actionable.

---

## Key Features

### 1. Brand Guidelines Management
- Create and manage brand guidelines.
- Maintain rules for brand identity and communication.
- Review and enforce approved guideline suggestions.

### 2. AI-Powered Content Compliance
- Analyze submitted content against brand guidelines.
- Generate compliance scores and identify violations.
- Provide actionable recommendations to improve compliance.

### 3. Visual Brand Compliance Auditing
- Upload PNG, JPG, and JPEG assets.
- Analyze visual brand elements using Gemini multimodal AI.
- Identify potential logo, color palette, typography, and layout inconsistencies.
- Present visual audit findings for review.

### 4. Advanced Brand Drift Intelligence
- Track recurring brand violations.
- Identify patterns across content categories and channels.
- Analyze compliance trends over 7-day, 30-day, 90-day, and all-time periods.
- Generate AI-powered guideline suggestions based on recurring violations.
- Approve suggestions to convert them into active brand guidelines or dismiss them.

### 5. Document Ingestion and Analysis
- Upload PDF, DOCX, and TXT documents.
- Extract readable text from supported documents.
- Display extraction information such as word count and page count where available.
- Send extracted content for AI-powered brand compliance analysis.
- Download uploaded documents while their temporary file data remains available.

### 6. Collaboration and Notifications
- Add comments to submissions.
- Participate in threaded discussions with replies.
- Receive notifications for collaboration activity.
- Mark individual notifications as read.
- Mark all notifications as read.
- Collaborate across the review workflow.

### 7. Review Workflow
- Submit content for review.
- View submissions in the review queue.
- Review compliance findings.
- Discuss submissions through comments and replies.
- Track submission history and review activity.

---

## Round 3 Improvements

The following three improvements were implemented after Round 2.

| Improvement | Implementation |
|---|---|
| Visual Brand Compliance Auditing | Image uploads and Gemini multimodal analysis for visual brand elements |
| Advanced Brand Drift Intelligence | Recurring violation analytics, trend analysis, and AI-generated guideline suggestions |
| Document and Collaboration Integrations | PDF/DOCX/TXT ingestion, text extraction, comments, threaded replies, and notifications |

### Improvement 1: Visual Brand Compliance Auditing

Added image upload and AI-assisted visual auditing to identify potential inconsistencies in logos, colors, typography, and layouts.

### Improvement 2: Advanced Brand Drift Intelligence

Added analytics to identify repeated brand violations and trends, along with AI-generated guideline suggestions that can be approved or dismissed.

### Improvement 3: Document and Collaboration Integrations

Added document ingestion and text extraction, integrated extracted text into the compliance analysis workflow, and introduced comments, replies, and notifications.

---

## Technology Stack

### Frontend
- React 19
- Vite
- Tailwind CSS v4
- DaisyUI 5
- React Router DOM
- Axios
- Lucide React

### Backend
- Node.js
- Express.js
- Mongoose
- MongoDB
- Multer
- PDF Parse
- Mammoth

### AI
- Google Gemini API
- Gemini multimodal capabilities for visual auditing
- AI-assisted compliance analysis and guideline suggestions

### Deployment
- Vercel – Frontend hosting
- Render – Backend hosting
- MongoDB Atlas – Database hosting

---

## System Architecture

Unifyra follows a client-server architecture.

```text
                    USER
                      |
                      v
             React Frontend (Vite)
                      |
                      | HTTP / REST API
                      v
              Express.js Backend
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
       MongoDB      Gemini     File Processing
       Atlas         API       and Extraction
          |           |           |
          +-----------+-----------+
                      |
                      v
             Analysis & Governance
                      |
                      v
              Frontend Dashboard
```

### Architecture Overview

- **Frontend:** Provides the user interface for guidelines, submissions, audits, analytics, collaboration, and notifications.
- **Backend:** Handles API requests, business logic, document processing, AI integration, and database operations.
- **MongoDB Atlas:** Stores application data, guidelines, submissions, comments, notifications, and related records.
- **Gemini API:** Supports content analysis, visual auditing, and actionable guideline suggestions.
- **Document Processing:** Extracts readable text from supported document formats before analysis.

---

## Project Structure

```text
unifyra/
|
|-- client/
|   |-- public/
|   |-- src/
|   |-- package.json
|   |-- vite.config.js
|
|-- server/
|   |-- config/
|   |-- controllers/
|   |-- models/
|   |-- routes/
|   |-- services/
|   |-- middleware/
|   |-- package.json
|   |-- server.js
|   |-- app.js
|
|-- AI_EVALUATION_REPORT.md
|-- README.md
|-- .gitignore
```

The `client` directory contains the React frontend, while the `server` directory contains the Express backend.

---

## Getting Started

Follow these steps to run Unifyra locally.

### Prerequisites

- Node.js and npm
- MongoDB Atlas account or a MongoDB instance
- Google Gemini API key
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/shivanimxdi143/unifyra.git

cd unifyra
```

### 2. Set Up the Backend

Open a terminal:

```bash
cd server

npm install
```

Create a `.env` file inside the `server` directory.

Configure the required environment variables as described in the [Environment Configuration](#environment-configuration) section.

Start the backend in development mode:

```bash
npm run dev
```

Alternatively, start it using:

```bash
npm start
```

The backend uses port `5000` by default if no `PORT` environment variable is supplied.

The health-check endpoint is:

```text
http://localhost:5000/api/health
```

### 3. Set Up the Frontend

Open a second terminal from the project root:

```bash
cd client

npm install
```

Configure the frontend API base URL to point to your running backend.

Start the Vite development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

### 4. Build the Frontend

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

### 5. Run Both Services

Keep the backend and frontend terminals running simultaneously while using the application.

**Important:** Both services require their respective environment configurations. Database-backed and AI-powered features require valid service credentials.

---

## Environment Configuration

Unifyra requires environment variables for database connectivity, AI services, and frontend-backend communication.

### Backend Environment

Create a `.env` file inside the `server` directory.

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `PORT` | Backend server port; defaults to `5000` |
| `NODE_ENV` | Runtime environment |

Configure the Gemini API key using the exact variable name referenced in the backend AI service configuration.

### Frontend Environment

Configure the frontend API base URL using the environment variable expected by the frontend source code.

For local development, it should point to:

```text
http://localhost:5000
```

For production, the frontend connects to the deployed backend.

### Security Guidelines

- Never commit `.env` files or API keys to GitHub.
- Use your own MongoDB connection credentials.
- Generate your own Gemini API key.
- Configure production environment variables separately in Render and Vercel.
- Do not expose private credentials in frontend code.

**Note:** Refer to the source code for the exact Gemini and frontend API environment variable names.

---

## Testing and Validation

The following automated test results were recorded during Round 3 development:

| Test Suite | Result |
|---|---:|
| Document Ingestion | 76/76 passed |
| Visual Brand Audit | 27/27 passed |
| Collaboration & Notifications | 17/17 passed |

### Additional Validation

The following application workflows were also tested:

- Frontend production build verification.
- Image upload workflow testing.
- PDF document upload and text extraction.
- AI compliance analysis of extracted document content.
- Submission review queue testing.
- Comment and threaded reply testing.
- Notification display and read-status testing.
- Brand drift analytics and trend verification.
- Guideline suggestion generation and approval workflow testing.

Production deployments were verified on Vercel and Render.

### Available Development Commands

**Frontend:**

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Creates a production build |
| `npm run preview` | Previews the production build |
| `npm run lint` | Runs Oxlint |
| `npm run test:routes` | Runs the route test script |

**Backend:**

| Command | Description |
|---|---|
| `npm run dev` | Starts the backend with Nodemon |
| `npm start` | Starts the backend with Node.js |

---

## Known Limitations

- Gemini API availability can occasionally be affected by temporary high demand, which may cause analysis requests to time out or fail. The AI analysis workflows are implemented, but successful responses depend on provider availability.
- Document extraction currently supports PDF, DOCX, and TXT. Legacy DOC files are not supported.
- Scanned image-only PDFs may not produce readable text because OCR is not currently implemented.
- Uploaded document buffers are held in temporary in-memory storage. They may expire after a server restart or cache eviction.
- Demo roles simulate different user experiences on the frontend and should not be considered production-grade backend role-based authorization.

---

## Future Roadmap

### 1. Stronger Security and Access Control
- Implement secure backend role-based authorization.
- Introduce organization-level access control.
- Strengthen authentication and audit logging.

### 2. Scalable Document and Media Storage
- Integrate persistent object storage such as AWS S3 or Google Cloud Storage.
- Add OCR for scanned PDFs and image-based documents.
- Improve large-document processing.

### 3. Advanced AI Intelligence
- Improve brand drift prediction and detection.
- Add more detailed visual comparison capabilities.
- Introduce customizable AI audit rules.
- Improve analysis reliability and fallback handling.

### 4. Collaboration Enhancements
- Real-time collaboration.
- More advanced review and approval workflows.
- Team-level activity history and reporting.

### 5. Integrations and Analytics
- Integrate with popular content management and design platforms.
- Add exportable compliance reports.
- Expand analytics and organization-wide dashboards.

---

## Team

**Team Name: CoreSync**

| Contributor | GitHub |
|---|---|
| Shivani | [@shivanimxdi143](https://github.com/shivanimxdi143) |
| Sumit Dhiman | [@143sumit05](https://github.com/143sumit05) |

---

## Project Links

- **Live Application:** https://unifyra.vercel.app
- **Backend API:** https://unifyra-backend.onrender.com
- **Health Check:** https://unifyra-backend.onrender.com/api/health
- **GitHub Repository:** https://github.com/shivanimxdi143/unifyra

---

**Unifyra — One Brand. One Voice. Everywhere.**

# Salamti

> **Intelligent Vehicle Accident Response System**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: UNLICENSED](https://img.shields.io/badge/license-UNLICENSED-blue.svg)](LICENSE)
[![Maintained](https://img.shields.io/badge/maintained%3F-yes-green.svg)](https://github.com/AhmedRedaG/Salamti)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](https://github.com/AhmedRedaG/Salamti/pulls)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Credits & Acknowledgements](#credits--acknowledgements)

---

## Overview

**Salamti** is an intelligent, real-time vehicle accident response system designed to detect traffic accidents, confirm severity levels, and dispatch nearby paramedics to accident scenes with minimal latency. The system integrates IoT devices (OBU - On-Board Units) installed in vehicles to collect sensor data and communicate with a centralized backend server, enabling rapid emergency response coordination.

### Key Selling Points

**Real-time Accident Detection** – MQTT-based OBU devices detect collisions via accelerometer and gyroscope data  
**Intelligent Dispatch** – WebSocket-powered live dispatch system matches accidents with nearest available paramedics  
**Multi-role Platform** – Separate dashboards for drivers, paramedics, and administrators  
**Push Notifications** – Firebase Cloud Messaging for instant alerts to all stakeholders  
**Geographic Awareness** – PostGIS integration for proximity-based paramedic assignment  
**Scalable Architecture** – Message queue (BullMQ/Redis) for asynchronous processing  
**Comprehensive Security** – JWT authentication, role-based access control, rate limiting, and password hashing

---

## Key Features

### User Management & Authentication

- **Multi-role authentication** (Admin, Driver, Paramedic)
- **JWT-based access control** with refresh token rotation
- **Google OAuth 2.0 integration** for social login
- **OTP verification** with configurable expiration and cooldowns
- **Password reset** with secure token-based flow
- **Session management** with device tracking and revocation

### Vehicle & OBU Management

- **Vehicle registration** and lifecycle management
- **On-Board Unit (OBU) provisioning** with status tracking (active, ready, outdated, broken)
- **Device activation** with SIM card and installation number verification
- **OBU firmware versioning** and update tracking

### Accident Detection & Management

- **Automatic accident detection** via OBU sensor data (G-force, gyroscope readings)
- **Accident level classification** (HIGH, MEDIUM, LOW, UNKNOWN)
- **Manual accident confirmation** with adjustable confirmation delays
- **Sensor data logging** (latitude, longitude, peak G, gyro readings)
- **Accident status lifecycle** (RECORDED → CONFIRMED → IN_PROGRESS → COMPLETED/CANCELED)
- **Manual accident cancellation** by administrators

### Real-time Dispatch System

- **WebSocket-based dispatch gateway** for live paramedic coordination
- **Intelligent paramedic assignment** to nearest available responders (configurable radius)
- **Paramedic status tracking** (AVAILABLE, UNAVAILABLE, ON_MISSION)
- **Geographic location tracking** using PostGIS for proximity calculations
- **Automated retry mechanism** with configurable retry limits
- **Response timeline tracking** (dispatched, arrived, completed, canceled)

### Emergency Response Management

- **Paramedic availability and authorization** management
- **Emergency contact management** for drivers (family, friends, colleagues)
- **Patient status tracking** (stable, guarded, serious, urgent, critical, unknown)
- **Response notes and observations** from paramedics
- **Hospital transport information** logging

### Notification System

- **Real-time in-app notifications** with priority levels (LOW, NORMAL, HIGH, URGENT)
- **Push notifications** via Firebase Cloud Messaging
- **Notification templates** for different event types:
  - Authentication events (new login, password change)
  - Accident events (detected, confirmed, completed, canceled)
  - Paramedic dispatch events (dispatched, arrived)
  - OBU device events (connected, disconnected, activated, deactivated, updated, claimed)
  - Vehicle events (created, updated, deleted)
- **Read/unread tracking** with timestamps

### Email Integration

- **Brevo (formerly Sendinblue) email service** integration
- **Transactional email** templates for password reset, OTP, notifications
- **Configurable sender and support email addresses**

### Image Upload & CDN

- **Cloudinary integration** for image storage and optimization
- **User profile pictures** and vehicle documentation
- **Automatic image resizing** and format optimization
- **5MB file size limit** with support for JPG, JPEG, PNG, WebP

### Task Scheduling & Background Jobs

- **NestJS Schedule module** for cron-based tasks
- **BullMQ message queue** for asynchronous processing (powered by Redis)
- **Job persistence** and retry mechanisms
- **Task monitoring** and analytics

### Security & Rate Limiting

- **Helmet** for HTTP security headers
- **CORS** protection with configurable origins
- **Rate limiting** with tiered thresholds (short, medium, long)
- **Password brute-force protection** with attempt tracking
- **Bcrypt password hashing** with configurable salt rounds
- **Token-based refresh mechanism** for enhanced security

### Comprehensive Logging

- **Pino logger** with structured logging and request ID tracking
- **Security redaction** for sensitive fields (passwords, tokens, cookies)
- **Environment-aware logging levels** (debug for development, info for production)
- **Automatic request/response logging** (excluding health checks and metrics)
- **Custom metadata** (userId, role, deviceId, response status)

---

## Tech Stack

### Backend Framework & Runtime

- **[NestJS](https://nestjs.com/) v11.1.18** – Progressive Node.js framework for scalable server-side applications
- **Node.js** – Runtime environment
- **TypeScript v6.0.2** – Strongly typed JavaScript

### Database & ORM

- **PostgreSQL** – Primary relational database
- **[Prisma](https://www.prisma.io/) v7.7.0** – Modern ORM with migration support
- **PostGIS extension** – Geographic data support for location-based queries
- **pg_trgm extension** – PostgreSQL trigram matching for full-text search
- **Neon** – Serverless PostgreSQL database hosting

### Real-time Communication

- **[Socket.io](https://socket.io/) v4.8.3** – WebSocket library for real-time, bidirectional communication
- **[MQTT](http://mqtt.org/) v5.15.1** – Lightweight protocol for IoT devices
- **HiveMQ** – Public MQTT broker for OBU communication

### Authentication & Authorization

- **[JWT (JSON Web Tokens)](https://jwt.io/)** – Stateless token-based authentication
- **[Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)** – Social authentication
- **[Bcrypt v6.0.0](https://www.npmjs.com/package/bcrypt)** – Password hashing library
- **@nestjs/jwt** – NestJS JWT module

### External Services

- **[Firebase Cloud Messaging (FCM)](https://firebase.google.com/docs/cloud-messaging)** – Push notifications
- **[Cloudinary v2.9.0](https://cloudinary.com/)** – Image upload and CDN
- **[Brevo v5.0.4](https://www.brevo.com/)** – Transactional email service (formerly Sendinblue)

### Message Queue & Caching

- **[BullMQ v5.73.5](https://docs.bullmq.io/)** – Job queue library
- **[Redis](https://redis.io/)** – In-memory data store for queues and caching
- **@nestjs/bullmq** – NestJS BullMQ integration

### Middleware & Security

- **[Helmet v8.1.0](https://helmetjs.github.io/)** – HTTP security headers
- **[Compression v1.8.1](https://www.npmjs.com/package/compression)** – Response compression middleware
- **[Cookie Parser v1.4.7](https://www.npmjs.com/package/cookie-parser)** – Cookie parsing
- **@nestjs/throttler** – Rate limiting and throttling
- **Dotenv v17.4.2** – Environment variable management

### Data Validation & Transformation

- **[Class Validator v0.15.1](https://github.com/typestack/class-validator)** – Decorator-based validation
- **[Class Transformer v0.5.1](https://github.com/typestack/class-transformer)** – Object transformation
- **@nestjs/mapped-types** – DTOs and type mapping utilities

### Logging & Monitoring

- **[Pino v10.3.1](https://getpino.io/)** – Fast and low-overhead logger
- **[Pino HTTP v11.0.0](https://github.com/pinojs/pino-http)** – HTTP logger for NestJS
- **[Pino Pretty v13.1.3](https://www.npmjs.com/package/pino-pretty)** – Pretty printer for development
- **nestjs-pino** – NestJS Pino integration

### Task Scheduling

- **@nestjs/schedule** – Cron and interval-based scheduling
- **@nestjs/microservices** – MQTT microservice support

### File Uploads

- **[Multer v2.1.1](https://www.npmjs.com/package/multer)** – File upload middleware
- **[Streamifier v0.1.1](https://www.npmjs.com/package/streamifier)** – Stream utilities for uploads

### Template Rendering

- **[EJS v5.0.2](https://ejs.co/)** – Embedded JavaScript templating

### Development Tools

- **[ESLint v10.2.0](https://eslint.org/)** – Code linting
- **[Prettier v3.8.2](https://prettier.io/)** – Code formatting
- **[TS-Node v10.9.2](https://typestrong.org/ts-node/)** – TypeScript execution for Node.js
- **[TSX v4.21.0](https://tsx.is/)** – TypeScript executor
- **[TypeScript ESLint](https://typescript-eslint.io/)** – TypeScript linting

---

## Architecture

### System Overview

```mermaid
graph TB
    subgraph IoT["IoT Layer"]
        OBU1["OBU Device 1<br/>Accelerometer + Gyroscope"]
        OBU2["OBU Device N<br/>Accelerometer + Gyroscope"]
    end

    subgraph Transport["Transport Layer"]
        MQTT["MQTT Broker<br/>(HiveMQ)"]
    end

    subgraph Backend["SALAMTI Backend<br/>(NestJS)"]
        Auth["Auth Module<br/>(JWT + OAuth)"]
        Accident["Accident Module<br/>(Detection & Scoring)"]
        Dispatch["Dispatch Gateway<br/>(WebSocket)"]
        ObuMQTT["OBU-MQTT Module<br/>(Sensor Processing)"]
        Notification["Notification Module<br/>(In-app & FCM)"]
    end

    subgraph Services["External Services"]
        Firebase["Firebase<br/>(Push Notifications)"]
        Cloudinary["Cloudinary<br/>(Image CDN)"]
        Brevo["Brevo<br/>(Email)"]
    end

    subgraph DataLayer["Data & Cache Layer"]
        PostgreSQL["PostgreSQL<br/>(w/ PostGIS)"]
        Redis["Redis<br/>(Cache & Queue)"]
        BullMQ["BullMQ<br/>(Job Queue)"]
    end

    subgraph Clients["Client Applications"]
        DriverApp["Driver App<br/>(React Native)"]
        ParamedicApp["Paramedic App<br/>(React Native)"]
        AdminDash["Admin Dashboard<br/>(Web)"]
    end

    OBU1 -->|MQTT Publish| MQTT
    OBU2 -->|MQTT Publish| MQTT

    MQTT -->|Subscribe| ObuMQTT
    ObuMQTT -->|Process Data| Accident
    Accident -->|Create Record| PostgreSQL

    Dispatch -->|Real-time Coords| Redis
    Dispatch -->|Assign Tasks| ParamedicApp
    ParamedicApp -->|Location Updates| Dispatch

    Auth -->|User Session| PostgreSQL
    Notification -->|Queue Tasks| BullMQ
    BullMQ -->|Process Jobs| Redis
    Notification -->|Send Push| Firebase
    Notification -->|Send Email| Brevo
    Notification -->|Store| PostgreSQL

    Accident -->|Upload Images| Cloudinary
    DriverApp -->|API Requests| Auth
    DriverApp -->|View Data| Accident
    AdminDash -->|Manage| Auth
    AdminDash -->|Monitor| Accident

    PostgreSQL -.->|Query| Dispatch
    Redis -.->|Cache| Backend
```

### Core Components

#### 1. **OBU MQTT Module** (`src/modules/obu-mqtt/`)

- **Responsibility**: Receive and process sensor data from IoT devices
- **Data Flow**: OBU → MQTT Broker → NestJS Microservice → Database
- **Sensor Data**: G-force, gyroscope readings, GPS coordinates
- **Auto-Detection**: Configurable thresholds for accident scoring

#### 2. **Accident Detection & Processing** (`src/modules/accidents/`)

- **Automatic Detection**: Accident scoring algorithm based on sensor data
- **Confirmation Flow**: Initial recording → Configurable delay → Manual/auto confirmation
- **Status Tracking**: RECORDED → CONFIRMED → IN_PROGRESS → COMPLETED/CANCELED

#### 3. **Real-time Dispatch** (`src/modules/dispatch/`)

- **WebSocket Gateway**: Bi-directional communication with paramedics
- **Live Coordination**: Location updates, status changes, task assignments
- **Intelligent Matching**: Proximity-based paramedic selection using PostGIS
- **Retry Logic**: Automated fallback to next nearest paramedic if first doesn't respond

#### 4. **Authentication & Authorization** (`src/modules/auth/`)

- **Multi-method Auth**: Password, Google OAuth, OTP
- **JWT Tokens**: Access (60 days) and Refresh (7 days) tokens
- **Session Management**: Device tracking, IP logging, token revocation
- **Rate Limiting**: Brute-force protection on login and reset endpoints

#### 5. **User Roles** (`src/modules/roles/`)

- **ADMIN**: Full system access, user management, accident overview
- **DRIVER**: Vehicle management, accident history, emergency contacts
- **PARAMEDIC**: Real-time dispatch, location tracking, patient assessment

#### 6. **Notification System** (`src/modules/notification/`)

- **In-app Notifications**: Real-time delivery via Socket.io
- **Push Notifications**: Firebase Cloud Messaging integration
- **Templates**: Dynamic content with snapshot storage
- **Priority Levels**: LOW, NORMAL, HIGH, URGENT

#### 7. **Task Scheduling** (`src/jobs/task-scheduler/`)

- **Cron Jobs**: Scheduled cleanup, notifications, maintenance tasks
- **Background Jobs**: BullMQ for async processing
- **Retry Mechanism**: Automatic retries with exponential backoff

#### 8. **Email Integration** (`src/integrations/brevo-email/`)

- **Transactional Email**: Password reset, OTP, notifications
- **Template System**: Pre-defined email templates
- **Async Delivery**: Queue-based processing

#### 9. **File Storage** (`src/integrations/cloudinary-upload/`)

- **Image Management**: User avatars, vehicle documentation
- **Optimization**: Automatic resizing, format conversion
- **CDN**: Global content delivery

---

## Installation

### Prerequisites

Ensure you have the following installed:

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **PNPM** v8+ ([Installation Guide](https://pnpm.io/installation))
- **PostgreSQL** v14+ ([Download](https://www.postgresql.org/))
- **Redis** ([Download](https://redis.io/) or use cloud service)

### Step 1: Clone the Repository

```bash
git clone https://github.com/AhmedRedaG/Salamti.git
cd Salamti
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) section below).

### Step 4: Setup Database

Generate Prisma client:

```bash
pnpm run db:gen
```

Push schema to database:

```bash
pnpm run db:push
```

Seed initial data (optional):

```bash
pnpm run db:seed
```

### Step 5: Start Development Server

```bash
pnpm run start:dev
```

The API will be available at `http://localhost:3000`

### Step 6: (Optional) Run Database Migrations

If you need to create and apply migrations:

```bash
# Create a new migration (specify changes)
pnpm run db:meg --name "add_new_feature"

# Apply migrations in development
pnpm run db:megdev

# Apply migrations in production
pnpm run db:megprod
```

### Build for Production

```bash
pnpm run build
pnpm run start:prod
```

---

## Configuration

### Application Configuration

Key configuration files:

- **[src/config/app.config.ts](src/config/app.config.ts)** – Main application settings
- **[src/config/cloudinary.config.ts](src/config/cloudinary.config.ts)** – Cloudinary setup
- **[src/config/multer.config.ts](src/config/multer.config.ts)** – File upload settings
- **[nest-cli.json](nest-cli.json)** – NestJS CLI configuration
- **[tsconfig.json](tsconfig.json)** – TypeScript compiler options
- **[eslint.config.mjs](eslint.config.mjs)** – ESLint rules
- **[.prettierrc](.prettierrc)** – Code formatting rules

### Database Connection

The application uses **Neon** (serverless PostgreSQL) by default. To use a local PostgreSQL database, update `DATABASE_URL` in `.env`:

```
DATABASE_URL=postgresql://username:password@localhost:5432/salamti?schema=public
```

### MQTT Broker Configuration

By default, the app connects to **HiveMQ** public broker. For production, configure a private MQTT broker:

```env
MQTT_HOST=your-mqtt-broker.com
MQTT_PORT=1883
```

**Note**: Current implementation doesn't use TLS due to OBU hardware limitations. In production, use a private network or add TLS support.

---

## API Documentation

Full API documentation is available on **Postman**:

**[Salamti API Collection](https://www.postman.com/ahmedreda-1513276/workspace/salamti/collection/44840624-c8acf988-2156-49eb-81fe-04456ecd1cd0?action=share&source=copy-link&creator=44840624)**

### API Base URLs

- **Development**: `http://localhost:3000/api/v1`
- **Production (Render)**: `https://salamti.onrender.com/api/v1`
- **Dispatch WebSocket**: `/dispatch` namespace (relative to API base)

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

**Token Expiration**:

- Access Token: 15 minutes
- Refresh Token: 7 days

Refresh tokens can be used to obtain new access tokens:

```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

### Core Settings

```env
# Application
NODE_ENV=development                    # Environment: development, production, staging
PORT=3000                               # Server port
CLIENT_BASE_URL=http://localhost:8000   # Frontend URL
API_BASE_URL=http://localhost:3000      # Backend URL (for production)

# Database
DATABASE_URL=postgresql://user:password@host:5432/salamti  # PostgreSQL connection string
```

### Authentication & Security

```env
# JWT Tokens
ACCESS_TOKEN_SECRET=your-secret-key-here                      # Secret for access tokens
ACCESS_TOKEN_EXPIRES_IN=15m                                    # Access token expiration
REFRESH_TOKEN_SECRET=your-refresh-secret-here                  # Secret for refresh tokens
REFRESH_TOKEN_EXPIRES_IN=7d                                    # Refresh token expiration
REFRESH_TOKEN_EXPIRES_IN_MS=604800000                           # Refresh token expiration in milliseconds
VERIFICATION_TOKEN_SECRET=your-verification-secret-here        # Secret for email verification
VERIFICATION_TOKEN_EXPIRES_IN=15m                              # Email verification token expiration
RESET_TOKEN_SECRET=your-reset-secret-here                      # Secret for password reset tokens
RESET_TOKEN_EXPIRES_IN=5m                                      # Password reset token expiration

# Password Security
BCRYPT_ROUNDS=12                                                # Bcrypt salt rounds (higher = slower, more secure)

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Email Service (Brevo)

```env
BREVO_API_KEY=your-brevo-api-key              # Brevo (Sendinblue) API key
SENDER_MAIL=noreply@salamti.app               # Email sender address
SUPPORT_MAIL=support@salamti.app              # Support email address
```

### Firebase (Push Notifications)

```env
FIREBASE_PROJECT_ID=your-firebase-project-id                      # Firebase project ID
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Image Upload (Cloudinary)

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name       # Cloudinary account name
CLOUDINARY_API_KEY=your-api-key              # Cloudinary API key
CLOUDINARY_API_SECRET=your-api-secret        # Cloudinary API secret
```

### Cache & Queue (Redis)

```env
REDIS_USERNAME=default                                    # Redis username (if using auth)
REDIS_PASSWORD=your-redis-password                        # Redis password
REDIS_HOST=redis-host.redislabs.com                       # Redis host
REDIS_PORT=12305                                          # Redis port
```

### IoT & Real-time (MQTT)

```env
MQTT_HOST=broker.hivemq.com                 # MQTT broker host
MQTT_PORT=1883                              # MQTT broker port (1883 for plain, 8883 for TLS)
```

### Example `.env.example` File

Create this file as a template for developers:

```env
# Core Settings
NODE_ENV=development
PORT=3000
CLIENT_BASE_URL=http://localhost:8000
API_BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/salamti

# JWT Tokens
ACCESS_TOKEN_SECRET=generate-a-secure-random-string-here
ACCESS_TOKEN_EXPIRES_IN=60d
REFRESH_TOKEN_SECRET=generate-another-secure-random-string
REFRESH_TOKEN_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN_MS=604800000
VERIFICATION_TOKEN_SECRET=another-random-secret
VERIFICATION_TOKEN_EXPIRES_IN=15m
RESET_TOKEN_SECRET=yet-another-random-secret
RESET_TOKEN_EXPIRES_IN=5m

# Security
BCRYPT_ROUNDS=12
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

# Email (Brevo)
BREVO_API_KEY=your-brevo-api-key
SENDER_MAIL=noreply@salamti.app
SUPPORT_MAIL=support@salamti.app

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
REDIS_HOST=redis-host.redislabs.com
REDIS_PORT=12305

# MQTT
MQTT_HOST=broker.hivemq.com
MQTT_PORT=1883
```

---

## Deployment

### Deploying to Render

1. **Create Render Account** – Sign up at [Render.com](https://render.com)

2. **Connect GitHub Repository**
   - Create new Web Service
   - Select GitHub repository
   - Authorize Render access

3. **Configure Build Settings**

   ```
   Build Command: pnpm install && pnpm run build
   Start Command: pnpm run start:prod
   ```

4. **Set Environment Variables**
   - Add all `.env` variables in Render dashboard
   - Ensure `DATABASE_URL` points to production PostgreSQL (Neon)

5. **Deploy**
   - Render automatically deploys on push to `main` branch
   - Production URL: `https://salamti.onrender.com`

### Deploying to Vercel (Optional - Frontend)

If you have a separate frontend repository:

1. Push frontend code to separate GitHub repository
2. Connect to Vercel
3. Set `API_BASE_URL` environment variable to Render backend URL
4. Deploy (auto-deploys on push)
5. Frontend URL: `https://salamti.vercel.app`

### Database Setup

#### Option 1: Neon (Recommended for Serverless)

```bash
1. Create account at neon.tech
2. Create new project
3. Copy DATABASE_URL
4. Paste in Render environment variables
```

#### Option 2: Self-hosted PostgreSQL

```bash
1. Install PostgreSQL on server
2. Create database: CREATE DATABASE salamti;
3. Create user: CREATE USER salamti_user WITH PASSWORD 'secure_password';
4. Grant permissions: GRANT ALL PRIVILEGES ON DATABASE salamti TO salamti_user;
5. Set DATABASE_URL=postgresql://salamti_user:password@host:5432/salamti
```

### Running Database Migrations in Production

```bash
# Via Render shell
pnpm run db:megprod

# Or manually
DATABASE_URL=<production_url> pnpm prisma migrate deploy
```

### Health Checks

Render can monitor application health:

- Health Check URL: `/health`
- Check Interval: 30 seconds
- Timeout: 10 seconds

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Reporting Issues

1. **Search existing issues** before creating a new one
2. **Provide detailed information**:
   - Steps to reproduce
   - Expected vs. actual behavior
   - Environment (OS, Node version, etc.)
3. **Use clear titles** – "Fix: OBU MQTT connection timeout" (not "It's broken")

### Submitting Pull Requests

1. **Fork the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/Salamti.git
   cd Salamti
   git checkout -b feature/your-feature-name
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Use TypeScript with strict mode
   - Add comments for complex logic

4. **Write/update tests** (if applicable)

5. **Commit with clear messages** (follow conventional commits)

   ```bash
   git commit -m "feat: add emergency contact auto-notification"
   git commit -m "fix: resolve paramedic dispatch timeout issue"
   ```

6. **Push and create a Pull Request**

   ```bash
   git push origin feature/amazing-feature
   ```

7. **PR Guidelines**:
   - Link related issues
   - Describe changes clearly
   - Request review from maintainers
   - Address feedback promptly

### Code Style

- **Format**: Prettier (configured in `.prettierrc`)
- **Linting**: ESLint
- **Language**: TypeScript (strict mode)

Run before committing:

```bash
pnpm run format
pnpm run lint
```

### Development Workflow

```bash
# Start development server with hot reload
pnpm run start:dev

# Run linter
pnpm run lint

# Format code
pnpm run format

# Generate Prisma types
pnpm run db:gen

# Create migration
pnpm run db:meg --name "feature_name"
```

---

## License

This project is **UNLICENSED** – all rights reserved by Ahmed Reda.

For licensing inquiries or permissions, please contact the author.

---

## Credits & Acknowledgements

### Author

- **[Ahmed Reda](https://github.com/AhmedRedaG)** – Lead developer and architect

### Key Technologies & Libraries

- **[NestJS](https://nestjs.com/)** – Progressive Node.js framework
- **[Prisma](https://www.prisma.io/)** – Next-generation ORM
- **[Socket.io](https://socket.io/)** – Real-time communication
- **[PostgreSQL](https://www.postgresql.org/)** & **[PostGIS](https://postgis.net/)** – Spatial database
- **[Firebase](https://firebase.google.com/)** – Push notifications
- **[Cloudinary](https://cloudinary.com/)** – Image management
- **[Brevo](https://www.brevo.com/)** – Email service
- **[Pino](https://getpino.io/)** – Structured logging
- **[BullMQ](https://docs.bullmq.io/)** – Job queue

### External References

- **Database Schema**: [DBDiagram](https://dbdiagram.io/d/Salamti-6917f35d6735e11170ec8ff3)
- **API Documentation**: [Postman Collection](https://www.postman.com/ahmedreda-1513276/workspace/salamti/collection/44840624-c8acf988-2156-49eb-81fe-04456ecd1cd0)
- **GitHub Repository**: [AhmedRedaG/Salamti](https://github.com/AhmedRedaG/Salamti)

---

## Support

For questions, issues, or feature requests:

- **Open an Issue** on [GitHub](https://github.com/AhmedRedaG/Salamti/issues)
- **Check existing issues** first to avoid duplicates
- **Provide detailed information** for faster resolution

---

**Last Updated**: May 21, 2026  
**Status**: Active Development....

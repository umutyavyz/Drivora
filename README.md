<div align="center">
  <img src="frontend/app/resources/icon.svg" width="120" alt="Drivora Logo" />
  <h1>Drivora</h1>
  <p>A comprehensive car rental application built with Ionic Angular and Node.js.</p>
  
  [![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
  [![Ionic](https://img.shields.io/badge/Ionic-3880FF?style=for-the-badge&logo=ionic&logoColor=white)](https://ionicframework.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
</div>

<hr/>

## 🚗 Overview

**Drivora** is a modern, cross-platform (Web, Android, iOS) car rental platform. It allows users to browse available vehicles, manage their favorite cars, complete secure payments, and handle their rental processes seamlessly.

## ✨ Features

- **User Authentication:** Registration, login, password recovery, and email verification.
- **Car Catalog & Map:** Browse available cars with detailed descriptions, images, and map views.
- **Rental Management:** Real-time rental availability, checklists, and summary management.
- **Favorites & Reviews:** Save favorite vehicles and leave reviews/ratings.
- **Secure Payments:** Payment integration and saved card management.
- **Cross-Platform:** Built as a Progressive Web App (PWA) with native Android and iOS support using Capacitor.

## 🛠️ Tech Stack

### Frontend (Mobile & Web)
- **Framework:** [Angular](https://angular.io/) & [Ionic Framework](https://ionicframework.com/)
- **Language:** TypeScript, SCSS
- **Native Runtime:** [Capacitor](https://capacitorjs.com/) (iOS & Android)

### Backend (API)
- **Runtime:** [Node.js](https://nodejs.org/)
- **Language:** TypeScript
- **Database:** Relational Database (SQL migrations included)

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/) (v16+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Ionic CLI](https://ionicframework.com/docs/cli) (`npm install -g @ionic/cli`)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/drivora.git
cd drivora
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and configure environment variables.

```bash
cd backend
npm install

# Copy the example env file and configure your database/secrets
cp .env.example .env

# Run database migrations (if applicable via your scripts)
# Start the backend server
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend app directory, and install dependencies.

```bash
cd frontend/app
npm install

# Serve the app in the browser
ionic serve
```

### 4. Build for Mobile (Android & iOS)
To build the application for native platforms using Capacitor:

```bash
cd frontend/app
ionic build

# Sync web assets to native projects
npx cap sync

# Open Android Studio
npx cap open android

# Open Xcode
npx cap open ios
```

## 📁 Project Structure

```text
Drivora/
├── backend/                  # Node.js API server
│   ├── migrations/           # SQL database migrations
│   └── src/                  # Controllers, routes, and services
│
└── frontend/app/             # Ionic Angular application
    ├── android/              # Native Android project
    ├── ios/                  # Native iOS project
    └── src/                  # Angular components, services, and assets
```

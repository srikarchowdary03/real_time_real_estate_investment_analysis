# Real Estate Investment Calculator

A comprehensive web application for analyzing real estate investment properties with automated rent estimates, financial calculations, and 5-year projections.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies

```bash
npm install
```

Or if you use yarn:

```bash
yarn install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following environment variables to `.env`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# RentCast API
VITE_RENTCAST_API_KEY=your_rentcast_api_key

# RapidAPI (Realty-in-US)
VITE_RAPIDAPI_KEY=your_rapidapi_key
```

#### Where to Get API Keys:

**Firebase:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to Project Settings → General
4. Under "Your apps", click the web icon (</>)
5. Copy the configuration values

**RentCast API:**
1. Sign up at [RentCast.io](https://rentcast.io/)
2. Go to Dashboard → API Keys
3. Copy your API key

**RapidAPI (Realty-in-US):**
1. Sign up at [RapidAPI](https://rapidapi.com/)
2. Subscribe to [Realty-in-US API](https://rapidapi.com/apidojo/api/realty-in-us)
3. Copy your API key from the endpoint page

### 4. Firebase Setup (Required)

1. In Firebase Console, enable **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Email/Password and Google providers

2. Enable **Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in test mode (change rules later)

3. Set Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Saved properties - flat structure with userId_propertyId
    match /savedProperties/{docId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Investor profiles
    match /investorProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## ▶️ Running the Application

### Development Mode

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **APIs**: RentCast API, Realty-in-US API (RapidAPI)
- **Icons**: Lucide React
- **Routing**: React Router v6


## 📚 Documentation

- [API Documentation](https://srikarchowdary03.github.io/real_time_real_estate_investment_analysis/) - JSDoc generated docs
- [PDF Documentation](Code_documentation.pdf) - Complete technical guide
- [User Documentation](user_manual.pdf) - Complete technical guide


## 🚦 Rate Limits

| API | Free Tier Limit | Notes |
|-----|----------------|-------|
| RentCast | 50 requests/month | Cache results to conserve |
| RapidAPI | 500 requests/month | Varies by subscription |
| Firebase | 50K reads/day | Generous for development |

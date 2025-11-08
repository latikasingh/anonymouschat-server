# Backend Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd anonymouschat-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Copy `.env` file and configure:
   ```bash
   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/anonymouschat
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   DEV_PUBLIC_IP=your_public_ip
   
   # Mail Configuration
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USER=your_email@gmail.com
   MAIL_PASS=your_app_password
   
   # API Keys
   GROQ_API_KEY=your_groq_api_key
   GOOGLE_API_KEY=your_google_api_key
   IPINFO_TOKEN=your_ipinfo_token
   ```

4. **Database Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGO_URI` in `.env` file

5. **API Keys Setup**
   - **IPInfo Token**: Get from [ipinfo.io](https://ipinfo.io)
   - **GROQ API Key**: Get from [groq.com](https://groq.com)
   - **Google API Key**: Get from [Google Cloud Console](https://console.cloud.google.com)

## Running the Application

### Development Mode
```bash
npm run dev
```
Server runs on `http://localhost:5000`

### Production Mode
```bash
npm run build
npm start
```

## Troubleshooting

- **MongoDB Connection**: Ensure MongoDB is running and URI is correct
- **Port Conflicts**: Change PORT in `.env` if 5000 is occupied
- **API Keys**: Verify all required API keys are properly configured
- **CORS Issues**: Frontend URL is whitelisted in CORS configuration
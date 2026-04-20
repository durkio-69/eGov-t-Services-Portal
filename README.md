# e-Gov't Services Portal

A centralized, citizen-centric portal for government digital services, identity management, and secure document storage.

## Features
- **Real-time Government Dashboards**: Integrated with Firebase for tracking applications.
- **Digital Vault**: Secure storage for official documents (NIRA, URA, DCIC, etc.).
- **Google Authentication**: Citizen-level access control.
- **Assisted Registration**: Direct contact options for professional guidance via WhatsApp, Phone, and Email.

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Motion (Animations)
- **Backend/Database**: Firebase (Authentication & Cloud Firestore)
- **Deployment**: Vite, Cloud Run / GitHub Pages

## Deployment Instructions

### 1. Export to GitHub
- In AI Studio, go to the **Settings** menu.
- Click **"Export to GitHub"**.
- Follow the prompts to create a new repository.

### 2. Custom Domain Setup (via GitHub Pages/Netlify/Vercel)
Once the code is in GitHub, you can deploy it to several platforms:

#### Option A: Vercel (Recommended for custom domains)
1. Go to [Vercel.com](https://vercel.com).
2. Create a new project and import your GitHub repository.
3. Vercel will automatically detect the Vite setup.
4. Go to **Project Settings > Domains** to add your custom government domain.

#### Option B: Netlify
1. Go to [Netlify.com](https://netlify.com).
2. "Import from Git" and select your new repository.
3. Use the following build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add your domain in the **Domain settings** tab.

## Firebase Configuration
The application uses the configuration stored in `firebase-applet-config.json`. If you move this project to a new Firebase project:
1. Update `firebase-applet-config.json` with your new project keys.
2. Ensure **Google Sign-In** is enabled in the Firebase Auth console.
3. Deploy the `firestore.rules` using the Firebase CLI: `firebase deploy --only firestore:rules`.

## Support
For technical assistance or manual registration processes, contact the administrator at **+256 757808474**.

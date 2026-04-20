/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Search, 
  User as UserIcon, 
  HelpCircle, 
  Languages, 
  Home, 
  Grid, 
  Fingerprint, 
  CreditCard, 
  Briefcase, 
  HeartPulse, 
  Monitor,
  Palette,
  LayoutDashboard, 
  FileText, 
  History, 
  Bell,
  ArrowRight,
  Globe,
  ShieldCheck,
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Clock,
  Mail,
  Phone,
  X,
  ExternalLink,
  Settings,
  ToggleLeft,
  ToggleRight,
  Check,
  Edit3,
  Save,
  CheckCircle,
  Hash,
  Sun,
  Moon,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Target,
  Eye,
  Award,
  AlertCircle,
  FilePlus,
  ClipboardCheck,
  UserPlus,
  QrCode,
  BookOpen,
  Book,
  FileSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  getDocFromServer
} from 'firebase/firestore';

type Tab = 'home' | 'services' | 'help' | 'dashboard' | 'about' | 'forms' | 'marriage' | 'fees' | 'news' | 'contact';

interface AppService {
  id?: string;
  name: string;
  agency: string;
  status: string;
  createdAt: any;
  currentStep?: number;
  totalSteps?: number;
}

interface AppDocument {
  id?: string;
  name: string;
  date: string;
  status: string;
  size: string;
}

interface NotificationPrefs {
  appStatus: boolean;
  newDocs: boolean;
  paymentReminders: boolean;
  securityAlerts: boolean;
}

interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: any[];
  }
}

function handleFirestoreError(error: any, operation: FirestoreErrorInfo['operationType'], path: string | null, user: User | null) {
  if (error.code === 'permission-denied') {
    const info: FirestoreErrorInfo = {
      error: error.message,
      operationType: operation,
      path: path,
      authInfo: {
        userId: user?.uid || 'none',
        email: user?.email || 'none',
        emailVerified: user?.emailVerified || false,
        isAnonymous: user?.isAnonymous || false,
        providerInfo: user?.providerData || []
      }
    };
    throw new Error(JSON.stringify(info));
  }
  throw error;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<{ name: string; info: string; agency: string; steps: string[] } | null>(null);
  const [applications, setApplications] = useState<AppService[]>([]);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    appStatus: true,
    newDocs: true,
    paymentReminders: false,
    securityAlerts: true
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [feeCategory, setFeeCategory] = useState<'Identity' | 'Travel' | 'Business'>('Identity');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [selectedKeyService, setSelectedKeyService] = useState<{ title: string; desc: string; icon: any } | null>(null);
  const [showContactInKeyService, setShowContactInKeyService] = useState(false);
  const [showHowToApply, setShowHowToApply] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  // Theme Sync
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Key Services Data
  const keyServices = [
    { title: 'Issuance Of Documents', desc: 'National ID Cards, NIN Certificates, Birth & Death Certificates, Adoption Orders.', icon: FilePlus },
    { title: 'Confirmation of Information', desc: 'Use a Paid PRN to submit a request for confirmation of information in the Register.', icon: ClipboardCheck },
    { title: 'Registrations', desc: 'Procedure for citizen registration (Adults), official forms for enrollment, and registration guidelines.', icon: UserPlus },
    { title: 'Verify Our Documents', desc: "Use a Document's Tracking Number to confirm if it was issued by our offices.", icon: QrCode }
  ];

  // State for slides
  const slides = [
    { 
      title: "Birth & Death Registration", 
      agency: "Identity", 
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Flag_of_Uganda.svg/1200px-Flag_of_Uganda.svg.png",
      color: "bg-gov-maroon-dark",
      docName: "Official Certificates"
    },
    { 
      title: "Official NIRA Forms Registry", 
      agency: "Documentation", 
      type: "forms",
      forms: [
        { id: "f3", name: "Form 3", desc: "Citizen Enrollment" },
        { id: "f10", name: "Form 10", desc: "Change of Details" },
        { id: "f13", name: "Form 13", desc: "Card Replacement" }
      ],
      image: "https://images.unsplash.com/photo-1621252179027-94459d278660?q=80&w=2070&auto=format&fit=crop", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Flag_of_Uganda.svg/1200px-Flag_of_Uganda.svg.png",
      color: "bg-gov-maroon",
      docName: "Forms 3, 10 & 13"
    },
    { 
      title: "My Digital Workspace", 
      agency: "Self-Service", 
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026&auto=format&fit=crop", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Flag_of_Uganda.svg/1200px-Flag_of_Uganda.svg.png",
      color: "bg-gov-maroon-dark",
      docName: "Personal Dashboard"
    },
    { 
      title: "Confirm Your Information", 
      agency: "Identity", 
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2111&auto=format&fit=crop", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Flag_of_Uganda.svg/1200px-Flag_of_Uganda.svg.png",
      color: "bg-gov-maroon",
      docName: "National ID (Form 3)"
    }
  ];

  // Auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      
      if (user) {
        // Sync user profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDocFromServer(userRef).catch(() => null);
        
        if (!userSnap || !userSnap.exists()) {
          await setDoc(userRef, {
            userId: user.uid,
            email: user.email,
            fullName: user.displayName,
            preferences: {
              appStatus: true,
              newDocs: true,
              paymentReminders: false,
              securityAlerts: true
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }).catch(err => handleFirestoreError(err, 'create', `users/${user.uid}`, user));
        } else {
          const data = userSnap.data();
          if (data?.preferences) {
            setNotificationPrefs(data.preferences);
          }
          if (data?.fullName) setProfileName(data.fullName);
          if (data?.citizenId) setCitizenId(data.citizenId);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!currentUser) {
      setApplications([]);
      setDocuments([]);
      return;
    }

    const qApps = query(collection(db, 'applications'), where('userId', '==', currentUser.uid));
    const unsubApps = onSnapshot(qApps, (snapshot) => {
      const appsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppService));
      setApplications(appsData);
    });

    const qDocs = query(collection(db, 'documents'), where('userId', '==', currentUser.uid));
    const unsubDocs = onSnapshot(qDocs, (snapshot) => {
      const docsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          name: data.name, 
          date: data.createdAt?.toDate().toLocaleDateString() || 'N/A', 
          status: data.status, 
          size: data.size || '0 MB' 
        } as AppDocument;
      });
      setDocuments(docsData);
    });

    return () => {
      unsubApps();
      unsubDocs();
    };
  }, [currentUser]);

  const handleServiceInitiation = async () => {
    if (!selectedService || !currentUser) return;
    
    try {
      await addDoc(collection(db, 'applications'), {
        userId: currentUser.uid,
        serviceName: selectedService.name,
        agency: selectedService.agency,
        status: 'Draft',
        currentStep: 1,
        totalSteps: selectedService.steps.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, 'create', 'applications', currentUser));
      
      // Notify backend about new application
      await sendCommand('INITIATE_SERVICE', { service: selectedService.name, user: currentUser.uid });

      // Automatic Redirection to Official Support Channel as requested
      const supportLink = "https://wa.me/256757808474";
      window.open(supportLink, '_blank');
      
      setSelectedService(null);
      setActiveTab('dashboard');
    } catch (error) {
      console.error("Error initiating service:", error);
    }
  };

  const sendCommand = async (command: string, payload: any) => {
    try {
      const response = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, payload })
      });
      const data = await response.json();
      console.log("Backend response:", data);
      return data;
    } catch (error) {
      console.error("Backend communication error:", error);
    }
  };

  const togglePreference = async (key: keyof NotificationPrefs) => {
    if (!currentUser) return;
    
    const newPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(newPrefs);
    setIsSavingPrefs(true);
    
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        preferences: newPrefs,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(err => handleFirestoreError(err, 'update', `users/${currentUser.uid}`, currentUser));
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      // Revert on error
      setNotificationPrefs(notificationPrefs);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    // Validation
    setProfileError(null);
    if (!profileName.trim() || profileName.trim().length < 3) {
      setProfileError("Please enter your full legal name (minimum 3 characters).");
      return;
    }
    
    const nicRegex = /^[A-Z0-9-]{6,20}$/;
    if (!citizenId.trim() || !nicRegex.test(citizenId.trim().toUpperCase())) {
      setProfileError("Please enter a valid Citizen ID (6-20 alphanumeric characters).");
      return;
    }

    setIsSavingProfile(true);
    
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        fullName: profileName.trim(),
        citizenId: citizenId.trim().toUpperCase(),
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(err => handleFirestoreError(err, 'update', `users/${currentUser.uid}`, currentUser));
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      setProfileError("An error occurred while saving. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const serviceCategories = [
    { 
      id: 'identity', 
      title: 'Identity & Citizenship Bureau', 
      icon: Fingerprint, 
      agency: 'Identity Bureau',
      items: [
        { name: 'National ID Registration', info: 'Apply for your first National Identification Card.', steps: ['Fill Form 3', 'Attach Birth Certificate', 'Biometric Enrollment'] },
        { name: 'Birth Certificate', info: 'Register and obtain an official birth certificate.', steps: ['Birth Notification', 'Verification', 'Fee Payment'] },
        { name: 'ID Replacement', info: 'Request a new card for lost or damaged IDs.', steps: ['Police Report', 'Fee Payment', 'Card Collection'] },
        { name: 'ID Renewal', info: 'Update your National ID after 10 years of validity.', steps: ['Form Submission', 'Photoshoot', 'Verification'] }
      ], 
      color: 'text-gov-maroon' 
    },
    { 
      id: 'finance', 
      title: 'Finance & Taxes (URA)', 
      icon: CreditCard, 
      agency: 'URA',
      items: [
        { name: 'TIN Registration', info: 'Obtain your unique Tax Identification Number.', steps: ['Online Application', 'Approval', 'TIN Certificate'] },
        { name: 'Income Tax Filing', info: 'Submit your periodic income tax returns.', steps: ['Login to E-Tax', 'Upload Return', 'Acknowledgment'] },
        { name: 'E-Payments (Taxes)', info: 'Pay all government taxes electronically.', steps: ['Generate PRN', 'Bank/Phone Payment', 'Receipt Verification'] },
        { name: 'Customs Services', info: 'Import and Export trade documentation.', steps: ['Clearance', 'Duty Payment', 'Inspection'] }
      ], 
      color: 'text-emerald-600' 
    },
    { 
      id: 'business', 
      title: 'Business & Trade (URSB)', 
      icon: Briefcase, 
      agency: 'URSB',
      items: [
        { name: 'Company Incorporation', info: 'Officially register a new company.', steps: ['Memorandum of Association', 'Fee Payment', 'Certificate of Incorporation'] },
        { name: 'Business Name Search', info: 'Check and reserve your business name.', steps: ['Availability Check', 'Reservation Fee', 'Approval'] },
        { name: 'Trademark Registration', info: 'Protect your brand identity legally.', steps: ['Application Submission', 'Publication', 'Registration'] },
        { name: 'Marriage Registration', info: 'Apply for and obtain marriage certificates.', steps: ['Notice Period', 'Ceremony', 'Certificate Issuance'] }
      ], 
      color: 'text-orange-600' 
    },
    { 
      id: 'health', 
      title: 'Health & Social Care (NSSF)', 
      icon: HeartPulse, 
      agency: 'NSSF',
      items: [
        { name: 'NSSF Contributions', info: 'Pay monthly social security contributions.', steps: ['Portal Login', 'Schedule Upload', 'Payment'] },
        { name: 'Member Statements', info: 'Check your total saved social security funds.', steps: ['Identity Verification', 'Statement Generation', 'Download'] },
        { name: 'Benefits Claims', info: 'Request withdrawal of your NSSF savings.', steps: ['Eligibility Check', 'Form Submission', 'Payment Processing'] },
        { name: 'Voluntary Savings', info: 'Save extra funds for your future goals.', steps: ['Opt-in', 'Payment Setup', 'Investment Tracking'] }
      ], 
      color: 'text-rose-600' 
    },
    { 
      id: 'immigration', 
      title: 'Immigration (DCIC)', 
      icon: ShieldCheck, 
      agency: 'DCIC',
      items: [
        { name: 'New Passport', info: 'Apply for a new East African Electronic Passport.', steps: ['Online Payment', 'Interview Appointment', 'Collection'] },
        { name: 'Passport Renewal', info: 'Renew an expired or filled passport.', steps: ['Current Passport Submission', 'Interview', 'Approval'] },
        { name: 'E-Visa Application', info: 'Apply for tourist or work visas.', steps: ['Document Upload', 'Fee Payment', 'Visa Issuance'] },
        { name: 'Work Permits', info: 'Legal authorization to work in the country.', steps: ['Application', 'Review', 'Endorsement'] }
      ], 
      color: 'text-blue-600' 
    },
    { 
      id: 'interpol', 
      title: 'Interpol & Security', 
      icon: ShieldCheck, 
      agency: 'Interpol',
      items: [
        { name: 'Police Clearance', info: 'Obtain a certificate of good conduct for international use.', steps: ['Fingerprint Capture', 'Background Check', 'Certificate Issuance'] },
        { name: 'Vehicle Clearance', info: 'Verify the status of a motor vehicle with international databases.', steps: ['VIN Verification', 'Database Search', 'Clearance Report'] },
        { name: 'Missing Persons', info: 'Report or follow up on missing person cases globally.', steps: ['Initial Report', 'Inter-agency Alert', 'Investigation'] },
        { name: 'Stolen Property', info: 'Register details of high-value stolen property.', steps: ['Evidence Submission', 'Database Entry', 'Global Alert'] }
      ], 
      color: 'text-indigo-600' 
    },
  ];

  const dashboardStats = [
    { title: 'My Applications', icon: LayoutDashboard, count: applications.length, status: `${applications.filter(a => a.status === 'Pending').length} Pending, ${applications.filter(a => a.status === 'Approved').length} Approved` },
    { title: 'My Documents', icon: FileText, count: documents.length, status: 'Safe in Digital Vault' },
    { title: 'Payment History', icon: History, count: 0, status: 'No recent payments' },
  ];

  return (
    <div className="min-h-screen bg-app-bg flex flex-col font-sans relative overflow-x-hidden">
      {/* 1. Universal Background Decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] opacity-80"></div>
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* 2. Header (Official Government Theme) */}
      <div className="flex flex-col flex-shrink-0 sticky top-0 z-50">
        {/* Top Info Bar */}
        <div className="bg-[#1a1a1a] h-10 flex items-center justify-between px-6 md:px-10 text-[11px] text-white overflow-hidden relative">
          <div className="flex items-center gap-6 relative z-10">
            <a href="tel:+256757808474" className="flex items-center gap-1.5 opacity-90 transition-all hover:text-gov-maroon cursor-pointer group">
              <Phone className="w-3 h-3 text-gov-maroon group-hover:scale-110 transition-transform" />
              <span className="font-bold underline decoration-white/20 underline-offset-2">+256757808474</span>
            </a>
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <a 
              href="https://www.google.com/maps/search/?api=1&query=Identity+Bureau+Headquarters+Robert+Mugabe+Road+Mbuya+Kampala+Uganda"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 opacity-90 transition-all hover:text-gov-maroon cursor-pointer group"
            >
              <MapPin className="w-3 h-3 text-gov-maroon group-hover:scale-110 transition-transform" />
              <span className="font-bold underline decoration-white/20 underline-offset-2">Mbuya, Kampala</span>
            </a>
            <button 
              onClick={() => setShowHowToApply(true)}
              className="flex items-center gap-1.5 hover:text-gov-maroon transition-colors cursor-pointer"
            >
              <BookOpen className="w-3 h-3" />
              <span className="font-bold border-b border-white/20 hover:border-gov-maroon">How to Apply</span>
            </button>
            <a href="https://facebook.com/durkio.69" target="_blank" rel="noopener noreferrer">
              <Facebook className="w-3.5 h-3.5 hover:text-gov-maroon cursor-pointer transition-colors" />
            </a>
            <a href="https://x.com/durkio_69" target="_blank" rel="noopener noreferrer">
              <Twitter className="w-3.5 h-3.5 hover:text-gov-maroon cursor-pointer transition-colors" />
            </a>
          </div>
          {/* Slanted Maroon Slice */}
          <div 
            className="absolute left-0 top-0 bottom-0 bg-gov-maroon w-1/3 -translate-x-12 skew-x-[30deg] border-r-4 border-white/20 hidden lg:block"
          ></div>
        </div>

        {/* Main Navigation */}
        <header className="h-[80px] bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-10 shadow-sm transition-all overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="logo flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
              <div className="w-14 h-14 bg-gov-maroon rounded-full flex items-center justify-center p-1 shadow-lg shadow-gov-maroon/20">
                <div className="w-full h-full border-2 border-white/40 rounded-full flex items-center justify-center relative overflow-hidden">
                   <Globe className="w-8 h-8 text-white opacity-80" />
                   <div className="absolute inset-0 bg-gov-gold/10 mix-blend-overlay"></div>
                </div>
              </div>
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-gov-maroon tracking-tighter uppercase italic">e-Gov't</span>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-100 shadow-sm">
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                    <span className="text-[7px] font-black text-emerald-700 uppercase tracking-widest">Verified Official</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.05em] max-w-[140px]">National Services & Registration Portal</span>
              </div>
            </div>
          </div>

          <nav className="hidden xl:flex items-center gap-1 h-full ml-10">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About' },
              { id: 'forms', label: 'Forms' },
              { id: 'marriage', label: 'Marriage' },
              { id: 'fees', label: 'Fees' },
              { id: 'news', label: 'News' },
              { id: 'contact', label: 'Contact Us' }
            ].map((link) => (
              <button 
                key={link.id}
                onClick={() => setActiveTab(link.id as Tab)}
                className={`px-4 h-full text-[13px] font-black uppercase tracking-widest transition-all relative group flex items-center ${
                  activeTab === link.id
                  ? 'bg-gov-maroon text-white' 
                  : 'text-secondary-blue hover:text-gov-maroon'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <a href="tel:+256757808474" className="hidden sm:flex flex-col items-end mr-4 group transition-all">
               <span className="text-[10px] font-black text-gov-maroon uppercase tracking-widest group-hover:opacity-80">Call Center</span>
               <span className="text-sm font-black text-secondary-blue group-hover:text-gov-maroon">+256757808474</span>
            </a>
            
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 transition-all hover:shadow-md"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-gov-gold" />}
            </button>

            {currentUser ? (
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-3 pl-2 pr-4 py-2 hover:bg-slate-50 rounded-full transition-all border border-transparent hover:border-slate-200"
              >
                <div className="w-9 h-9 rounded-full bg-gov-maroon text-white flex items-center justify-center font-black shadow-lg">
                  {currentUser.displayName?.charAt(0)}
                </div>
              </button>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="bg-gov-maroon text-white px-6 py-3 rounded-xl text-[13px] font-black uppercase tracking-widest hover:bg-gov-maroon-dark transition-all shadow-xl shadow-gov-maroon/20 active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </header>
      </div>

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4"
            >
              {/* 2. Hero Section (Official Public Theme) */}
              <section className="bg-white border-b border-slate-100 overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
                  {/* Left: Dynamic Slider Card */}
                  <div className="p-6 md:p-10 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={currentSlide}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        className="relative rounded-3xl overflow-hidden aspect-[16/10] shadow-2xl group border-4 border-gov-maroon/5"
                      >
                        {slides[currentSlide].type === 'forms' ? (
                          <>
                            <img 
                              src={slides[currentSlide].image} 
                              alt="Background" 
                              className="w-full h-full object-cover blur-[2px] opacity-60 scale-110"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center p-6 md:p-8">
                              <div className="grid grid-cols-3 gap-4 w-full max-w-xl">
                                {slides[currentSlide].forms?.map((form: any, fidx: number) => (
                                  <motion.div 
                                    key={form.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 * fidx + 0.3 }}
                                    className="bg-white rounded-2xl p-4 shadow-2xl border-b-4 border-slate-200 flex flex-col items-center text-center gap-3 group/form hover:border-gov-maroon transition-all"
                                  >
                                    <div className="w-12 h-12 bg-gov-maroon/5 rounded-full flex items-center justify-center text-gov-maroon group-hover/form:bg-gov-maroon group-hover/form:text-white transition-colors">
                                      <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <h4 className="font-black text-secondary-blue text-[11px] uppercase tracking-tighter leading-none mb-1">{form.name}</h4>
                                      <p className="text-[10px] text-slate-500 font-bold leading-tight">{form.desc}</p>
                                    </div>
                                    <div className="text-[9px] font-black text-gov-gold uppercase tracking-widest mt-auto">Official Doc</div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <img 
                            src={slides[currentSlide].image || `https://picsum.photos/seed/${slides[currentSlide].title}/1200/800`} 
                            alt="Government Focus" 
                            className="w-full h-full object-cover transition-transform duration-[20s] scale-110 group-hover:scale-100"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                          <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                             <div className="flex items-center gap-2 mb-4">
                              <span className="bg-gov-maroon text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest inline-block">Official Registry Announcement</span>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 backdrop-blur-md rounded border border-emerald-500/30">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest">Verified Portal</span>
                              </div>
                            </div>
                             <h2 className="text-3xl md:text-4xl font-black text-white leading-tight uppercase tracking-tighter mb-4">
                               {slides[currentSlide].title}
                             </h2>
                             <div className="h-1 w-20 bg-gov-gold mb-6"></div>
                             <p className="text-white/80 font-medium text-sm md:text-base max-w-lg">
                               Access the latest forms and verification protocols directly from the National Citizens Database.
                             </p>
                          </motion.div>
                        </div>
                        {/* Slider Nav */}
                        <div className="absolute bottom-6 right-6 flex gap-2">
                           <button 
                            onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
                            className="w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded flex items-center justify-center hover:bg-gov-maroon transition-colors"
                           >
                             <ChevronLeft className="w-5 h-5" />
                           </button>
                           <button 
                            onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
                            className="w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded flex items-center justify-center hover:bg-gov-maroon transition-colors"
                           >
                             <ChevronRight className="w-5 h-5" />
                           </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Right: Key Administrative Services Grid */}
                  <div className="bg-slate-50/50 p-6 md:p-10 flex flex-col justify-center gap-8">
                     <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-secondary-blue tracking-tight flex items-center gap-3">
                          Key Services
                          <div className="flex gap-1">
                             <div className="w-8 h-1 bg-gov-maroon rounded-full"></div>
                             <div className="w-3 h-1 bg-gov-gold rounded-full"></div>
                          </div>
                        </h3>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => setShowHowToApply(true)}
                             className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-lg border-2 border-gov-maroon/20 text-gov-maroon font-black text-[10px] uppercase tracking-widest hover:bg-gov-maroon hover:text-white transition-all mr-2"
                           >
                             <BookOpen className="w-3 h-3" />
                             How to Apply
                           </button>
                           <button className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:text-gov-maroon hover:border-gov-maroon transition-all">
                             <ChevronLeft className="w-4 h-4" />
                           </button>
                           <button className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:text-gov-maroon hover:border-gov-maroon transition-all">
                             <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                     </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {keyServices
                          .filter(service => 
                            service.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            service.desc.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((service, idx) => (
                            <motion.div 
                              key={idx}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ y: -5 }}
                              onClick={() => {
                                setSelectedKeyService(service);
                                setShowContactInKeyService(false);
                              }}
                              className="bg-white p-5 rounded-2xl border-b-4 border-slate-200 shadow-sm hover:shadow-xl hover:border-gov-maroon transition-all group overflow-hidden relative cursor-pointer"
                            >
                               <div className="flex items-start justify-between mb-4 relative z-10">
                                  <h4 className="font-black text-[13px] text-secondary-blue uppercase tracking-tight leading-tight w-2/3">
                                    {service.title}
                                  </h4>
                                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-gov-maroon transition-colors overflow-hidden">
                                     <service.icon className="w-6 h-6 text-slate-400 group-hover:text-white" />
                                     <div className="absolute inset-0 bg-gov-gold/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  </div>
                               </div>
                               <p className="text-[11px] font-medium text-slate-500 leading-relaxed pr-4 line-clamp-3">
                                  {service.desc}
                               </p>
                            </motion.div>
                          ))}

                        {searchQuery && keyServices.filter(s => 
                          s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.desc.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length === 0 && (
                          <div className="col-span-full py-10 text-center">
                             <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                               <Search className="w-8 h-8 text-slate-300" />
                             </div>
                             <h4 className="text-sm font-black text-secondary-blue dark:text-blue-200 uppercase">No matching services</h4>
                             <p className="text-[11px] text-slate-500 mt-1">Try a different keyword or check the spelling.</p>
                             <button 
                               onClick={() => setSearchQuery('')}
                               className="mt-4 px-6 py-2 bg-gov-maroon text-white text-[10px] font-black uppercase tracking-widest rounded-lg"
                             >
                               Reset Search
                             </button>
                          </div>
                        )}
                     </div>
                  </div>
                </div>

                {/* Mission, Vision, Values Banner */}
                <div className="bg-card-bg py-16 px-10 border-t border-slate-100 dark:border-slate-800">
                   <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                      <div className="relative">
                         <div className="flex items-center gap-3 mb-6">
                            <Target className="w-6 h-6 text-gov-maroon" />
                            <h4 className="text-xl font-black text-secondary-blue dark:text-blue-200 uppercase tracking-tighter">Mission</h4>
                         </div>
                         <div className="h-0.5 w-16 bg-gov-maroon mb-6"></div>
                         <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400 leading-loose italic">
                           "To facilitate efficient government service delivery by providing a centralized digital gateway for all citizen registration and document processing."
                         </p>
                      </div>
                      <div className="relative">
                         <div className="flex items-center gap-3 mb-6">
                            <Eye className="w-6 h-6 text-gov-maroon" />
                            <h4 className="text-xl font-black text-secondary-blue dark:text-blue-200 uppercase tracking-tighter">Vision</h4>
                         </div>
                         <div className="h-0.5 w-16 bg-gov-maroon mb-6"></div>
                         <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400 leading-loose">
                           A seamlessly connected nation where every citizen has instant, secure access to essential digital infrastructure and services.
                         </p>
                      </div>
                      <div className="relative">
                         <div className="flex items-center gap-3 mb-6">
                            <Award className="w-6 h-6 text-gov-maroon" />
                            <h4 className="text-xl font-black text-secondary-blue dark:text-blue-200 uppercase tracking-tighter">Our Values</h4>
                         </div>
                         <div className="h-0.5 w-16 bg-gov-maroon mb-6"></div>
                         <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
                            {['Integrity', 'Transparency', 'Efficiency', 'Excellence', 'Accountability', 'Accessibility'].map(v => (
                              <li key={v} className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-slate-300">
                                <div className="w-1.5 h-1.5 bg-gov-maroon rounded-full"></div>
                                {v}
                              </li>
                            ))}
                         </ul>
                      </div>
                   </div>
                </div>

                {/* Search Bar in Hero */}
                <div className="bg-slate-50 dark:bg-slate-900 shadow-inner py-12 px-6 border-t border-slate-100 dark:border-slate-800">
                   <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
                      <h3 className="text-2xl font-black text-secondary-blue dark:text-white uppercase tracking-tighter">Quick Search</h3>
                      <div className="search-bar w-full bg-white dark:bg-slate-800 rounded-full flex p-1.5 shadow-xl border border-slate-200 dark:border-slate-700 relative z-10 hover:shadow-2xl transition-all group">
                        <div className="flex items-center pl-5 pr-2">
                          <Search className="w-5 h-5 text-slate-400 group-hover:text-gov-maroon transition-colors" />
                        </div>
                        <input 
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search for forms, fees, TIN, ID status..."
                          className="flex-1 border-none px-4 py-3.5 text-[15px] outline-none text-text-main bg-transparent font-black placeholder:text-slate-400 uppercase tracking-tight"
                        />
                        <button className="bg-gov-maroon text-white px-10 rounded-full font-black text-sm uppercase tracking-widest hover:bg-gov-maroon-dark transition-all shadow-md active:scale-95">
                          Search
                        </button>
                      </div>
                   </div>
                </div>
              </section>

              {/* 3. Main Service Categories & Dashboard Blend */}
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 p-6 md:px-10">
                <section className="services-section">
                  <h3 className="text-xs font-bold text-text-muted mb-4 uppercase tracking-[0.05em]">
                    Browse Categories
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {serviceCategories
                      .filter(cat => 
                        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        cat.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((cat, i) => (
                      <motion.div 
                        key={cat.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="geometric-card p-5 group flex flex-col gap-3"
                      >
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-accent-blue font-bold text-lg group-hover:bg-accent-blue group-hover:text-white transition-colors">
                          <cat.icon className="w-5 h-5" />
                        </div>
                        <h4 className="text-[15px] font-bold text-text-main">{cat.title}</h4>
                        <div className="flex flex-wrap gap-2">
                          {cat.items.map((item) => (
                            <span 
                              key={item.name} 
                              onClick={() => setSelectedService({ 
                                name: item.name, 
                                info: item.info, 
                                agency: cat.agency,
                                steps: item.steps
                              })}
                              className="text-[11px] font-bold px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-border-slate rounded-md text-text-muted hover:bg-accent-blue hover:text-white hover:border-accent-blue transition-all cursor-pointer whitespace-nowrap"
                            >
                              {item.name}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-text-muted mt-auto pt-2 italic">
                          Official {cat.agency} Services
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </section>

                <aside className="dashboard geometric-card p-6 flex flex-col h-fit">
                  <div className="dash-header flex justify-between items-center mb-5">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.05em]">My Workspace</h3>
                  </div>
                  
                  <div className="space-y-1">
                    {applications.slice(0, 3).map((app, idx) => (
                      <div key={app.id || idx} className="status-item py-3 border-b border-border-slate">
                        <div className="text-[12px] text-text-muted mb-1">Application: {app.agency}</div>
                        <div className="text-[14px] font-semibold flex justify-between items-center text-text-main line-clamp-1">
                          {app.serviceName} 
                          <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${
                            app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 
                            app.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <p className="text-xs text-text-muted py-4 text-center">No active applications found.</p>
                    )}
                  </div>

                  <button 
                    onClick={() => { if(!currentUser) signInWithGoogle(); setActiveTab('dashboard'); }}
                    className="mt-4 w-full py-2 bg-primary-blue text-white rounded-md text-[13px] font-bold hover:bg-accent-blue transition-colors"
                  >
                    Enter Workspace
                  </button>
                </aside>
              </div>

              {/* Added Contact Support Section for Home Tab */}
              <div className="mt-20 glass-card p-12 bg-white dark:bg-slate-900 shadow-2xl border-b-8 border-gov-maroon relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gov-maroon/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-3xl font-black text-secondary-blue dark:text-white uppercase tracking-tighter mb-4">Official Citizen <span className="text-gov-maroon italic">Support</span>.</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed max-w-md">Our bureau is committed to transparent service delivery. If you encounter any technical blockers or need procedural guidance, our officers are ready to assist you on the following channels.</p>
                    <div className="flex flex-wrap gap-4">
                      <a href="tel:+256757808474" className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-gov-maroon transition-all group">
                         <Phone className="w-5 h-5 text-gov-maroon group-hover:scale-110 transition-transform" />
                         <span className="font-black text-sm text-secondary-blue dark:text-white">+256 757808474</span>
                      </a>
                      <a href="https://wa.me/256757808474" className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition-all group">
                         <MessageSquare className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                         <span className="font-black text-sm text-secondary-blue dark:text-white">Active WhatsApp</span>
                      </a>
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col items-center text-center">
                    <Mail className="w-10 h-10 text-gov-gold mb-4" />
                    <h4 className="text-xl font-black uppercase tracking-tight mb-2">Support Headquarters</h4>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-6">Verified Electronic Mailbox</p>
                    <p className="text-lg font-black text-gov-gold break-all mb-8 lowercase">azontocrewza@gmail.com</p>
                    <a href="mailto:azontocrewza@gmail.com" className="w-full py-4 bg-gov-maroon text-white font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-gov-maroon transition-all">Send Official Inquiry</a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div 
              key="about" 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="max-w-7xl mx-auto px-6 py-16"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <span className="text-gov-maroon font-black uppercase tracking-widest text-xs mb-4 block">Official Portal Information</span>
                  <h2 className="text-4xl md:text-5xl font-black text-secondary-blue uppercase tracking-tighter leading-none mb-8">
                    Modernizing <span className="text-gov-maroon">Service</span> Delivery for All Citizens.
                  </h2>
                  <p className="text-slate-600 font-medium text-lg leading-relaxed mb-8 italic">
                    The National Services & Registration Portal is a unified digital gateway designed to reduce bureaucracy, eliminate long queues, and bring essential government services directly to your screen.
                  </p>
                  <div className="space-y-6">
                    {[
                      { t: 'Unified Access', d: 'One account for all agencies including NIRA, URSB, URA, and DCIC.' },
                      { t: 'Secure Vault', d: 'Your official documents are stored in a high-security digital vault accessible 24/7.' },
                      { t: 'Transparency', d: 'Real-time tracking of application status and clear fee guidelines.' }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-6 h-6 bg-gov-maroon/10 rounded flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-gov-maroon" />
                        </div>
                        <div>
                          <h4 className="font-black text-secondary-blue uppercase text-sm mb-1">{item.t}</h4>
                          <p className="text-sm text-slate-500 font-medium">{item.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gov-maroon/5 rounded-3xl -rotate-3 scale-105"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?q=80&w=2070&auto=format&fit=crop" 
                    className="relative rounded-3xl shadow-2xl border-4 border-white" 
                    alt="Bureau Office"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'forms' && (
            <motion.div 
              key="forms" 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-6 py-16"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black text-secondary-blue uppercase tracking-tighter mb-2">Government Forms Registry</h2>
                <p className="text-slate-500 font-medium">Download and fill official forms for submission at any bureau center.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                      { n: 'NIRA Form 3', d: 'Registration of Citizens', agency: 'NIRA', cat: 'Identity', url: 'https://www.nira.go.ug/wp-content/uploads/2021/04/FORM-3-REGISTRATION-OF-CITIZENS.pdf' },
                      { n: 'NIRA Form 10', d: 'Change of Details', agency: 'NIRA', cat: 'Amendment', url: 'https://www.nira.go.ug/wp-content/uploads/2021/04/FORM-10-CHANGE-OF-PARTICULARS.pdf' },
                      { n: 'NIRA Form 13', d: 'Card Replacement', agency: 'NIRA', cat: 'Replacement', url: 'https://www.nira.go.ug/wp-content/uploads/2021/04/FORM-13-REPLACEMENT-OF-ID-CARD.pdf' },
                      { n: 'Passport Form A', d: 'New Passport Application', agency: 'DCIC', cat: 'Travel', url: 'https://www.immigration.go.ug/sites/default/files/forms/Passport%20Application%20Form%20A.pdf' },
                      { n: 'TIN Application', d: 'Individual Tax ID Registration', agency: 'URA', cat: 'Tax', url: 'https://www.ura.go.ug/resources/forms/Registration/TIN_Application_Form.pdf' },
                      { n: 'Marriage Notice', d: 'Notice of Marriage Intent', agency: 'URSB', cat: 'Legal', url: 'https://ursb.go.ug/wp-content/uploads/2021/04/Notice-of-Marriage.pdf' },
                      { n: 'NSSF Form 1', d: 'New Member Registration', agency: 'NSSF', cat: 'Social', url: 'https://www.nssfug.org/wp-content/uploads/2021/04/NSSF-Form-1.pdf' },
                      { n: 'Company Form 18', d: 'Director Particulars Update', agency: 'URSB', cat: 'Business', url: 'https://ursb.go.ug/wp-content/uploads/2021/04/Form-18.pdf' }
                    ].map((form, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl border-b-4 border-slate-200 hover:border-gov-maroon transition-all group shadow-sm flex flex-col">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gov-maroon group-hover:text-white transition-colors relative">
                          <FilePlus className="w-6 h-6" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-gov-maroon uppercase tracking-widest">{form.agency}</span>
                            <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Verified Official</span>
                          </div>
                          <h4 className="font-black text-secondary-blue uppercase text-sm mb-2">{form.n}</h4>
                          <p className="text-[11px] text-slate-500 font-medium mb-4">{form.d}</p>
                        </div>
                        <a 
                          href={form.url} 
                          download 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 bg-slate-50 rounded-lg text-[10px] font-black uppercase text-secondary-blue hover:bg-gov-maroon hover:text-white transition-all text-center"
                        >
                          Download Official PDF
                        </a>
                      </div>
                    ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'marriage' && (
            <motion.div 
              key="marriage" 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="max-w-7xl mx-auto px-6 py-16"
            >
              <div className="max-w-3xl">
                <span className="text-rose-600 font-black uppercase tracking-widest text-xs mb-4 block">URSB Registry</span>
                <h2 className="text-4xl font-black text-secondary-blue uppercase tracking-tighter mb-8 leading-none">Marriage Registration <span className="text-rose-600">& Certification</span>.</h2>
                <div className="prose max-w-none text-slate-600 font-medium leading-loose mb-10">
                  <p>In accordance with the laws of the Republic, all marriages must be registered with the Uganda Registration Services Bureau (URSB). This section provides the legal framework and procedure for both civil and faith-based marriages.</p>
                </div>
                
                <div className="space-y-8">
                  {[
                    { s: 'Phase 1: Notice', d: 'Submit a 21-day notice of marriage to the Registrar of Marriages at URSB or the District Commissioner office.' },
                    { s: 'Phase 2: Publication', d: 'The notice is published on the notice board for 21 days to allow for any objections.' },
                    { s: 'Phase 3: Ceremony', d: 'Upon expiration of notice, a registrar or authorized minister conducts the ceremony.' },
                    { s: 'Phase 4: Registration', d: 'The marriage is officially recorded in the National Marriage Register and a certificate is issued.' }
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6 items-start">
                      <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-black flex-shrink-0 shadow-lg shadow-rose-600/20">{i+1}</div>
                      <div>
                        <h4 className="text-secondary-blue font-black uppercase text-sm mb-1">{step.s}</h4>
                        <p className="text-sm text-slate-500 font-medium">{step.d}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-8 bg-rose-50 rounded-3xl border border-rose-100">
                  <h4 className="font-black text-rose-800 uppercase text-xs mb-4">Required Documents</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-medium text-rose-900/70">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Valid IDs for both parties</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Proof of single status</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Passport photos</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> IDs for two witnesses</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'fees' && (
            <motion.div 
              key="fees" 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              className="max-w-7xl mx-auto px-6 py-16"
            >
              <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                <div>
                  <h2 className="text-3xl font-black text-secondary-blue uppercase tracking-tighter mb-2">Service Fees & PRN Guide</h2>
                  <p className="text-slate-500 font-medium italic">Official government fee structure. Contact support for real-time PRN generation and exact fee verification.</p>
                </div>
                <div className="bg-slate-100 p-2 rounded-xl flex gap-1">
                  {(['Identity', 'Travel', 'Business'] as const).map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setFeeCategory(cat)}
                      className={`px-4 py-2 rounded-lg shadow-sm font-black text-[10px] uppercase transition-all ${
                        feeCategory === cat ? 'bg-gov-maroon text-white animate-pulse-slow' : 'bg-white text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <table className="w-full text-left font-black">
                   <thead className="bg-[#1a1a1a] text-white">
                      <tr>
                        <th className="px-8 py-5 text-[10px] uppercase tracking-widest">Service Item</th>
                        <th className="px-8 py-5 text-[10px] uppercase tracking-widest">Pricing Inquiry</th>
                        <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 italic">
                      {(
                        feeCategory === 'Identity' ? [
                          { s: 'New National ID (Form 3)', a: 'NIRA' },
                          { s: 'National ID Replacement', a: 'NIRA' },
                          { s: 'Birth Certificate Entry', a: 'NIRA' },
                          { s: 'NIN Confirmation Slip', a: 'NIRA' }
                        ] : feeCategory === 'Travel' ? [
                          { s: 'Standard Passport (48 Pages)', a: 'DCIC' },
                          { s: 'Express Passport Processing', a: 'DCIC' },
                          { s: 'Official/Diplomatic Passport', a: 'DCIC' },
                          { s: 'Emergency Travel Document', a: 'DCIC' }
                        ] : [
                          { s: 'Company Registration (LLC)', a: 'URSB' },
                          { s: 'Business Name Reservation', a: 'URSB' },
                          { s: 'Sole Proprietorship Entry', a: 'URSB' },
                          { s: 'Trademark Filing & Search', a: 'URSB' }
                        ]
                      ).map((fee, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black text-gov-maroon uppercase tracking-widest block mb-1 opacity-60">Official {fee.a}</span>
                            <span className="text-sm text-secondary-blue uppercase leading-tight">{fee.s}</span>
                          </td>
                          <td className="px-8 py-6">
                            <a 
                              href="https://wa.me/256757808474" 
                              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span className="text-[12px] uppercase">Ask via WhatsApp</span>
                            </a>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <a 
                              href="tel:+256757808474" 
                              className="bg-gov-maroon text-white px-4 py-2 rounded text-[10px] uppercase hover:bg-gov-maroon-dark transition-all shadow-lg shadow-gov-maroon/20"
                            >
                              Consult Officer
                            </a>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'news' && (
            <motion.div 
              key="news" 
              initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-7xl mx-auto px-6 py-16"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="col-span-1 lg:col-span-2 space-y-8">
                  {[
                    { 
                      t: 'New E-Passport Centers Opened in Gulu and Mbarara', 
                      d: 'Citizens in the Northern and Western regions can now apply for and collect East African Electronic Passports without traveling to Kampala.', 
                      date: 'April 15, 2026', 
                      cat: 'Immigration',
                      url: 'https://www.immigration.go.ug/news'
                    },
                    { 
                      t: 'System Upgrade: Sunday 2:00 AM - 4:00 AM', 
                      d: 'Scheduled maintenance for the National Identity Database. All NIN verification services will be temporarily offline during this period.', 
                      date: 'April 12, 2026', 
                      cat: 'Announcement',
                      url: 'https://www.nira.go.ug/news'
                    },
                    { 
                      t: 'Portal Surpasses 2 Million Registered Users', 
                      d: 'The National Service Portal reaches a milestone in digital transformation, with over 1.2M ID applications processed this year.', 
                      date: 'April 10, 2026', 
                      cat: 'Milestone',
                      url: 'https://www.nira.go.ug/about-us'
                    }
                  ].map((news, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl border-l-[6px] border-gov-maroon shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-black uppercase text-gov-maroon tracking-widest">{news.cat}</span>
                        <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-400">{news.date}</span>
                      </div>
                      <a href={news.url} target="_blank" rel="noopener noreferrer" className="block">
                        <h3 className="text-xl font-black text-secondary-blue uppercase tracking-tighter mb-4 leading-tight group-hover:text-gov-maroon transition-colors">{news.t}</h3>
                      </a>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6">{news.d}</p>
                      <a 
                        href={news.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2 text-gov-maroon font-black text-xs uppercase tracking-widest hover:gap-4 transition-all"
                      >
                        Official Source <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
                <div className="space-y-6">
                  <div className="bg-[#1a1a1a] p-8 rounded-3xl text-white">
                    <h4 className="font-black uppercase tracking-widest text-xs text-gov-gold mb-6">Portal Stats</h4>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-[10px] font-black uppercase mb-1"><span>Daily Logins</span><span>84k</span></div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gov-gold w-[85%]"></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-black uppercase mb-1"><span>Service Uptime</span><span>99.9%</span></div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 w-[99%]"></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-black uppercase mb-1"><span>Forms Downloaded</span><span>12.4k</span></div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gov-maroon w-[45%]"></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'contact' && (
            <motion.div 
              key="contact" 
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
              className="max-w-7xl mx-auto px-6 py-16"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div>
                   <h2 className="text-4xl font-black text-secondary-blue uppercase tracking-tighter mb-8 transform -rotate-1 origin-left">Get In <span className="p-2 bg-gov-maroon text-white">Touch</span> With Our Bureau Experts.</h2>
                   <p className="text-slate-500 font-medium mb-12 italic leading-relaxed">Our support teams are available across multiple channels to assist with your applications, technical issues, or general inquiries.</p>
                   
                   <div className="space-y-8">
                     {[
                       { i: Phone, t: 'Call Center', v: '+256757808474', l: 'tel:+256757808474' },
                       { i: MessageSquare, t: 'WhatsApp Dispatch', v: 'Message Now', l: 'https://wa.me/256757808474' },
                       { i: Mail, t: 'Support Email', v: 'azontocrewza@gmail.com', l: 'mailto:azontocrewza@gmail.com' },
                       { i: Twitter, t: 'Official Twitter', v: '@durkio_69', l: 'https://x.com/durkio_69' }
                     ].map((c, i) => (
                       <a key={i} href={c.l} target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 group">
                         <div className="w-14 h-14 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center group-hover:bg-gov-maroon group-hover:text-white transition-all overflow-hidden relative">
                           <c.i className="w-6 h-6 transition-colors" />
                           <div className="absolute inset-0 bg-gov-gold/5 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         </div>
                         <div>
                           <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{c.t}</h4>
                           <p className="text-[15px] font-black text-secondary-blue group-hover:text-gov-maroon transition-colors">{c.v}</p>
                         </div>
                       </a>
                     ))}
                   </div>
                </div>
                <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-gov-maroon/20 blur-[80px] rounded-full"></div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 relative z-10">Visit Our <span className="text-gov-gold italic">HQ</span>.</h3>
                   <div className="space-y-8 relative z-10">
                      <a 
                        href="https://www.google.com/maps/search/?api=1&query=Identity+Bureau+Headquarters+Robert+Mugabe+Road+Mbuya+Kampala+Uganda"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-4 group cursor-pointer hover:bg-white/5 p-4 rounded-2xl -ml-4 transition-all"
                      >
                        <MapPin className="w-6 h-6 text-gov-gold flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <div>
                          <h4 className="font-black tracking-widest text-[10px] uppercase text-white/50 mb-2">Main Bureau Address (Click to Map)</h4>
                          <p className="font-bold text-lg leading-relaxed group-hover:text-gov-gold transition-colors">Identity Bureau Headquarters,<br />Robert Mugabe Road, Mbuya,<br />Kampala, Uganda</p>
                        </div>
                      </a>
                      <div className="h-px bg-white/10 w-full"></div>
                      <div className="flex gap-4">
                        <Monitor className="w-6 h-6 text-gov-gold flex-shrink-0" />
                        <div>
                          <h4 className="font-black tracking-widest text-[10px] uppercase text-white/50 mb-2">Office Hours</h4>
                          <p className="font-bold text-lg leading-relaxed">Mon - Fri: 08:00 - 17:00<br />Sat: Closed<br />Sun: Closed</p>
                        </div>
                      </div>
                   </div>
                   <a 
                      href="https://www.google.com/maps/search/?api=1&query=Identity+Bureau+Headquarters+Robert+Mugabe+Road+Mbuya+Kampala+Uganda"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-12 group cursor-pointer relative z-10 block"
                   >
                      <div className="w-full h-48 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors shadow-inner">
                        <div className="flex flex-col items-center gap-3 text-white/30 group-hover:text-gov-gold transition-colors">
                           <Globe className="w-8 h-8 animate-spin-slow" />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">View HQ on Maps</span>
                        </div>
                      </div>
                   </a>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && currentUser && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="max-w-7xl mx-auto px-4 py-12"
            >
              {/* 4. My Workspace Dashboard */}
              <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-64 space-y-2">
                  <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Workspace</h3>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-gov-blue text-white rounded-xl font-semibold shadow-lg">
                    <LayoutDashboard className="w-5 h-5" />
                    Overview
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors">
                    <FileText className="w-5 h-5" />
                    Applications
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors">
                    <History className="w-5 h-5" />
                    Transactions
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </button>
                  
                  <div className="pt-8 px-4 text-xs">
                     <button onClick={() => { auth.signOut(); setActiveTab('home'); }} className="text-rose-600 font-bold hover:underline mb-8 block">
                        Sign Out
                     </button>

                     <div className="mt-10 p-4 geometric-card bg-slate-50">
                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Support & Help</h4>
                        <div className="space-y-3">
                           <div className="flex items-center gap-2 text-text-main group cursor-pointer">
                              <div className="p-1.5 bg-white rounded-md border border-border-slate group-hover:border-accent-blue transition-colors">
                                 <Phone className="w-3 h-3 text-secondary-blue" />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[9px] text-text-muted font-bold uppercase">Call Us</span>
                                 <span className="text-[11px] font-bold">+256757808474</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 text-text-main group cursor-pointer">
                              <div className="p-1.5 bg-white rounded-md border border-border-slate group-hover:border-accent-blue transition-colors">
                                 <img 
                                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                                  alt="WhatsApp" 
                                  className="w-4 h-4"
                                  referrerPolicy="no-referrer"
                                 />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[9px] text-text-muted font-bold uppercase">WhatsApp</span>
                                 <span className="text-[11px] font-bold">+256757808474</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 text-text-main group cursor-pointer">
                              <div className="p-1.5 bg-white rounded-md border border-border-slate group-hover:border-accent-blue transition-colors">
                                 <Mail className="w-3 h-3 text-orange-600" />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[9px] text-text-muted font-bold uppercase">Email</span>
                                 <span className="text-[10px] font-bold break-all lowercase">azontocrewza@gmail.com</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </aside>

                <div className="flex-grow space-y-8 relative">
                  {/* Content Graphics - Framed such that text remains clear */}
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

                  <div className="flex items-center justify-between border-b border-border-slate/50 pb-6">
                    <div>
                      <h2 className="text-3xl font-black text-primary-blue tracking-tight">Welcome back, {profileName.split(' ')[0] || currentUser.displayName?.split(' ')[0]}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">Citizen ID</span>
                        <span className="text-sm font-mono text-text-main font-semibold">
                          {citizenId || `${currentUser.uid.slice(0, 4).toUpperCase()} •••• ${currentUser.uid.slice(-4).toUpperCase()}`}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex gap-3">
                      <button 
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm shadow-lg ${
                          isEditingProfile ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100' : 'bg-white border border-border-slate text-primary-blue hover:bg-slate-50'
                        }`}
                      >
                        {isEditingProfile ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                      </button>
                      <button 
                        onClick={() => setActiveTab('services')}
                        className="bg-primary-blue text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-blue/20 hover:scale-[1.02] transition-all text-sm active:scale-95"
                      >
                        New Application
                      </button>
                    </div>
                  </div>

                  {/* Profile Editing Panel */}
                  <AnimatePresence>
                    {isEditingProfile && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="glass-card p-8 border-l-4 border-l-rose-500 bg-rose-50/20 mb-8 relative">
                           {profileError && (
                             <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-rose-100 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm font-bold shadow-sm"
                             >
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {profileError}
                             </motion.div>
                           )}

                           <div className="flex flex-col md:flex-row gap-8">
                              <div className="flex-grow space-y-4">
                                 <div>
                                    <label className="text-[10px] font-black uppercase text-text-muted mb-1 block tracking-widest">Full Legal Name</label>
                                    <div className="relative">
                                       <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                       <input 
                                          type="text" 
                                          value={profileName}
                                          onChange={(e) => setProfileName(e.target.value)}
                                          className="w-full pl-11 pr-4 py-3 bg-white border border-border-slate rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-primary-blue"
                                          placeholder="Enter your full legal name"
                                       />
                                    </div>
                                 </div>
                                 <div>
                                    <label className="text-[10px] font-black uppercase text-text-muted mb-1 block tracking-widest">National Citizen ID (NIC)</label>
                                    <div className="relative">
                                       <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                       <input 
                                          type="text" 
                                          value={citizenId}
                                          onChange={(e) => setCitizenId(e.target.value)}
                                          className="w-full pl-11 pr-4 py-3 bg-white border border-border-slate rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-primary-blue"
                                          placeholder="e.g. CM82025103GT4A"
                                       />
                                    </div>
                                 </div>
                              </div>
                              <div className="md:w-64 space-y-4">
                                 <div className="p-4 bg-white border border-border-slate rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2 text-rose-600 mb-2">
                                       <ShieldCheck className="w-4 h-4" />
                                       <span className="text-[11px] font-black uppercase tracking-widest">Verficiation</span>
                                    </div>
                                    <p className="text-[12px] text-text-muted leading-tight font-medium">Changes to your legal name or ID require administrative approval before permanent synchronization.</p>
                                 </div>
                                 <button 
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile}
                                    className="w-full bg-rose-600 text-white py-4 rounded-xl font-black shadow-xl shadow-rose-600/20 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
                                 >
                                    {isSavingProfile ? (
                                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                       <Save className="w-5 h-5" />
                                    )}
                                    {isSavingProfile ? 'Synchronizing...' : 'Save Official Profile'}
                                 </button>
                              </div>
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {dashboardStats.map((stat) => (
                      <div key={stat.title} className="glass-card p-6 flex flex-col gap-4 border-l-4 border-l-accent-blue">
                        <div className="p-3 bg-blue-50 rounded-xl w-fit">
                          <stat.icon className="w-6 h-6 text-primary-blue" />
                        </div>
                        <div>
                          <div className="text-4xl font-black text-primary-blue mb-1">{stat.count}</div>
                          <div className="font-bold text-text-main">{stat.title}</div>
                          <div className="text-xs text-text-muted mt-1 uppercase font-bold tracking-tight">{stat.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-bold text-lg">Active Applications</h4>
                      <button className="text-xs font-bold text-gov-blue uppercase tracking-wider">View all</button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {applications.map((app) => {
                        const getStatusConfig = (status: string) => {
                          switch (status) {
                            case 'Approved': return { color: 'bg-emerald-500', bar: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30' };
                            case 'Processing': return { color: 'bg-blue-500', bar: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30' };
                            case 'Pending': return { color: 'bg-amber-500', bar: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30' };
                            case 'Rejected': return { color: 'bg-rose-500', bar: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/30' };
                            default: return { color: 'bg-slate-400', bar: 'bg-primary-blue', bg: 'bg-slate-100 dark:bg-slate-800' };
                          }
                        };
                        const config = getStatusConfig(app.status);
                        
                        return (
                          <div key={app.id} className="p-6 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${config.color}`} />
                            <div className="flex-grow">
                              <div className="flex justify-between">
                                <p className="font-bold text-slate-900 dark:text-white">{app.serviceName}</p>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest ${config.bg} ${config.color.replace('bg-', 'text-')}`}>
                                  {app.status}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-text-muted mt-1 uppercase tracking-tight">{app.agency} Official Gateway</p>
                              
                              <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5">
                                 <span>Application Progress</span>
                                 <span>Step {app.currentStep} of {app.totalSteps}</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                 <motion.div 
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${(app.currentStep || 0) / (app.totalSteps || 1) * 100}%` }}
                                  className={`${config.bar} h-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                                 />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {applications.length === 0 && (
                        <div className="p-12 text-center text-text-muted italic">
                          No active applications in your workspace yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-bold text-lg">My Documents</h4>
                      <button className="text-xs font-bold text-gov-blue uppercase tracking-wider">Upload New</button>
                    </div>
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 border border-border-slate rounded-xl hover:border-accent-blue transition-all cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-border-slate group-hover:bg-blue-50 transition-colors">
                              <FileText className="w-5 h-5 text-secondary-blue" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-text-main">{doc.name}</p>
                              <p className="text-[11px] text-text-muted">Modified: {doc.date} • {doc.size}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                               doc.status === 'Verified' ? 'bg-green-100 text-green-700' :
                               doc.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-700' :
                               'bg-red-100 text-red-700'
                             }`}>
                               {doc.status}
                             </span>
                          </div>
                        </div>
                      ))}
                      {documents.length === 0 && (
                        <div className="text-center py-10 opacity-50">
                          <FileText className="w-12 h-12 mx-auto mb-4" />
                          <p className="font-bold text-sm">Your Digital Vault is empty.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notification Preferences Section */}
                  <div className="glass-card p-8 border-t-4 border-t-gov-blue">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary-blue">
                          <Settings className="w-6 h-6" />
                       </div>
                       <div>
                          <h4 className="text-xl font-black text-primary-blue tracking-tight">Notification Preferences</h4>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Workspace Alert Configuration</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {[
                         { id: 'appStatus' as const, label: 'Application Status Changes', desc: 'Real-time updates when your submission moves between departments.', icon: LayoutDashboard },
                         { id: 'newDocs' as const, label: 'New Document Alerts', desc: 'Instant notification when a verified certificate is added to your vault.', icon: FileText },
                         { id: 'paymentReminders' as const, label: 'Payment Reminders', desc: 'Gentle nudges for pending PRNs and statutory fee deadlines.', icon: CreditCard },
                         { id: 'securityAlerts' as const, label: 'Account Security', desc: 'Crucial alerts regarding login attempts and profile changes.', icon: ShieldCheck },
                       ].map((pref) => (
                  <button 
                    key={pref.id}
                    onClick={() => togglePreference(pref.id)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      notificationPrefs[pref.id] ? 'bg-primary-blue/5 border-primary-blue/20' : 'bg-card-bg border-slate-100 hover:border-slate-300 dark:border-slate-800'
                    }`}
                  >
                     <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          notificationPrefs[pref.id] ? 'bg-primary-blue text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700'
                        }`}>
                           <pref.icon className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="font-black text-[15px] group-hover:text-primary-blue transition-colors text-text-main">{pref.label}</p>
                           <p className="text-[11px] text-text-muted mt-0.5 max-w-[200px] leading-tight font-medium">{pref.desc}</p>
                        </div>
                     </div>
                            <div className="flex items-center">
                               {notificationPrefs[pref.id] ? (
                                 <ToggleRight className="w-8 h-8 text-primary-blue" />
                               ) : (
                                 <ToggleLeft className="w-8 h-8 text-slate-300" />
                               )}
                            </div>
                          </button>
                        ))}
                    </div>

                    <div className="mt-8 flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                       <div className={`w-2 h-2 rounded-full animate-pulse ${isSavingPrefs ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                       <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                          {isSavingPrefs ? 'Writing changes to national secure database...' : 'Preferences are synchronized and active'}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'services' && (
            <motion.div 
              key="services"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 py-12"
            >
              <div className="text-center mb-16 px-4">
                <h2 className="text-4xl font-black text-primary-blue mb-4 tracking-tight">Service Directory</h2>
                <p className="text-text-muted max-w-2xl mx-auto font-medium">Access every digital gateway from Identity, Taxes, Business, and more. All services are categorized by department for your convenience.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {serviceCategories.map((cat, i) => (
                  <motion.div 
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="geometric-card p-5 flex flex-col gap-3 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-accent-blue font-bold group-hover:bg-accent-blue group-hover:text-white transition-all shadow-sm">
                        <cat.icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-black text-[16px] text-primary-blue dark:text-blue-200 tracking-tight">{cat.title}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {cat.items.map((item) => (
                        <span 
                          key={item.name} 
                          onClick={() => setSelectedService({ 
                            name: item.name, 
                            info: item.info, 
                            agency: cat.agency,
                            steps: item.steps
                          })}
                          className="text-[12px] font-bold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-border-slate rounded-lg text-text-muted hover:bg-accent-blue hover:text-white hover:border-accent-blue transition-all cursor-pointer whitespace-nowrap shadow-sm active:scale-95"
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official {cat.agency} Gateway</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-blue transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'help' && (
            <motion.div 
              key="help"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto px-4 py-20 relative z-10"
            >
              <div className="text-center mb-20">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-black uppercase tracking-widest mb-6 border border-blue-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Official 24/7 Citizen Support
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-primary-blue mb-4 tracking-tight">How can we support you?</h2>
                <p className="text-text-muted max-w-xl mx-auto font-medium text-lg leading-relaxed">Access procedural guidance, technical support, and direct contact with government officers.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-blue-200"></div>
                    Common Procedures & FAQs
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { q: 'How do I reset my portal password?', a: 'You can use the "Forgot Password" link on the sign-in page. You will need access to your registered email or phone number.' },
                      { q: 'What happens if my application is rejected?', a: 'You will receive a detailed notification explaining the reason. You can usually amend and resubmit through the "My Applications" tab.' },
                      { q: 'Is my digital vault data secure?', a: 'Yes, we use the highest level of government encryption. Your data is protected by multi-factor authentication and law.' },
                      { q: 'How long does passport processing take?', a: 'Standard processing takes 10-14 working days. Express processing (via DCIC Gateway) can take 2-4 working days.' },
                      { q: 'Can I pay taxes via Mobile Money?', a: 'Yes, generate a PRN (Payment Reference Number) through the URA gateway on this portal, then pay via MTN or Airtel.' },
                    ].map((faq, idx) => (
                      <details key={idx} className="group glass-card overflow-hidden border border-slate-100 hover:border-blue-200">
                        <summary className="p-6 cursor-pointer flex items-center justify-between font-bold text-slate-800 list-none select-none">
                          <span className="flex items-center gap-4">
                            <span className="text-blue-300 font-mono text-xs">0{idx + 1}</span>
                            {faq.q}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center transition-transform group-open:rotate-180 group-open:bg-blue-50">
                            <ArrowRight className="w-4 h-4 text-slate-400 group-open:text-blue-600 rotate-90" />
                          </div>
                        </summary>
                        <div className="px-16 pb-6 text-text-muted leading-relaxed font-medium">
                          {faq.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-blue-200"></div>
                    Direct Contact
                  </h3>
                  <div className="space-y-4">
                    <div className="p-8 bg-gov-blue text-white rounded-3xl flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <MessageSquare className="w-10 h-10 mb-4 text-blue-300" />
                        <h4 className="text-xl font-bold mb-2">Live Support</h4>
                        <p className="text-blue-100 text-sm mb-6 opacity-80">Connected to national agency helpdesks ready to help you now.</p>
                        <button className="bg-white text-gov-blue w-full py-3 rounded-xl font-black text-sm hover:scale-[1.02] transition-all active:scale-95 shadow-lg">Start Live Chat</button>
                    </div>

                    <div className="p-8 bg-white border border-border-slate rounded-3xl flex flex-col items-center text-center group hover:border-blue-200 transition-colors">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
                          <Phone className="w-8 h-8 text-gov-blue" />
                        </div>
                        <h4 className="text-xl font-black text-primary-blue mb-1">Call Center</h4>
                        <p className="text-[10px] font-black uppercase tracking-tighter text-text-muted mb-4 italic">Available 8 AM - 6 PM</p>
                        <p className="text-2xl font-black text-gov-blue">+256 757808474</p>
                        <span className="text-[11px] font-bold text-text-muted mt-2">Toll-free from any local network</span>
                    </div>

                    <div className="p-6 glass-card bg-emerald-50/50 border-emerald-100">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-6 h-6" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <h5 className="font-black text-emerald-900 leading-tight">Fast Assist</h5>
                            <p className="text-[10px] font-bold text-emerald-700 uppercase">WhatsApp Response</p>
                          </div>
                        </div>
                        <a 
                          href="https://wa.me/256757808474" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block w-full text-center bg-emerald-500 text-white font-black py-2.5 rounded-xl hover:bg-emerald-600 transition-colors text-sm"
                        >
                          Message on WhatsApp
                        </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 5. Footer (Administrative & Legal) */}
      <footer className="bg-card-bg border-t border-border-slate flex-shrink-0">
        {/* Partner Agencies Custom Badges */}
        <div className="max-w-7xl mx-auto px-10 py-12 border-b border-border-slate/50">
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            {[
              { id: 'identity', name: 'NIRA Authority', sub: 'Identity', icon: Fingerprint, color: 'text-gov-maroon' },
              { id: 'ursb', name: 'URSB Registry', sub: 'Business', icon: Briefcase, color: 'text-orange-600' },
              { id: 'nssf', name: 'NSSF Social', sub: 'Social Security', icon: HeartPulse, color: 'text-emerald-600' },
              { id: 'ura', name: 'URA Revenue', sub: 'Taxation', icon: CreditCard, color: 'text-blue-600' },
              { id: 'passport', name: 'DCIC Passports', sub: 'Immigration', icon: Globe, color: 'text-indigo-600' },
              { id: 'interpol', name: 'Interpol Police', sub: 'Security', icon: ShieldCheck, color: 'text-gov-maroon' }
            ].map((badge) => (
              <div key={badge.id} className="flex flex-col items-center group cursor-pointer">
                <div className="h-16 w-16 rounded-[1.25rem] bg-white border-2 border-slate-100 flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm relative overflow-hidden group-hover:border-gov-maroon group-hover:shadow-xl">
                  <div className={`absolute inset-0 bg-current opacity-0 group-hover:opacity-5 ${badge.color}`}></div>
                  <badge.icon className={`w-7 h-7 ${badge.color} transition-transform group-hover:scale-110`} />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gov-maroon opacity-0 group-hover:opacity-100 transition-opacity rounded-tl-lg flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div className="text-center mt-3">
                  <span className="text-[10px] font-black text-secondary-blue uppercase tracking-tighter block leading-none">{badge.name}</span>
                  <span className="text-[8px] uppercase font-bold text-slate-400 tracking-[0.2em] mt-1 block">{badge.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Social Connectivity Section */}
        <div className="bg-slate-50 dark:bg-slate-900 shadow-inner px-10 py-10 border-b border-border-slate/30">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h4 className="text-sm font-black text-secondary-blue dark:text-white uppercase tracking-widest mb-1">Stay Connected With The Bureau</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Official Social Media & Citizen Support Channels</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { i: Facebook, l: 'https://facebook.com/durkio.69', c: 'bg-blue-600', n: 'FB' },
                { i: Twitter, l: 'https://x.com/durkio_69', c: 'bg-slate-900', n: 'TW' },
                { i: Instagram, l: 'https://instagram.com/', c: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600', n: 'IG' },
                { i: Linkedin, l: 'https://linkedin.com/', c: 'bg-blue-700', n: 'LI' },
                { i: Youtube, l: 'https://youtube.com/', c: 'bg-red-600', n: 'YT' },
                { i: MessageSquare, l: 'https://wa.me/256757808474', c: 'bg-emerald-600', n: 'WA' }
              ].map((soc, i) => (
                <a 
                  key={i} 
                  href={soc.l} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`w-12 h-12 ${soc.c} rounded-2xl flex flex-col items-center justify-center text-white shadow-lg transition-all hover:-translate-y-1 hover:brightness-110 active:scale-95 group relative`}
                >
                  <soc.i className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-2 -right-2 bg-white text-black text-[7px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity uppercase">{soc.n}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-gov-maroon rounded-full animate-pulse"></div>
             <span>© 2026 National Services & Registration Bureau Framework</span>
          </div>
          <div className="footer-links flex flex-wrap justify-center gap-8">
            <span className="cursor-pointer hover:text-gov-maroon transition-colors hover:underline decoration-gov-maroon underline-offset-4">Privacy Protocols</span>
            <span className="cursor-pointer hover:text-gov-maroon transition-colors hover:underline decoration-gov-maroon underline-offset-4">Terms of Ordinance</span>
            <span className="cursor-pointer hover:text-gov-maroon transition-colors hover:underline decoration-gov-maroon underline-offset-4">System Report</span>
            <span className="cursor-pointer hover:text-gov-maroon transition-colors hover:underline decoration-gov-maroon underline-offset-4" onClick={() => setActiveTab('contact')}>Reach Experts</span>
          </div>
        </div>
      </footer>

      {/* 6. Service Portal Modal (Full Functionality) */}
      <AnimatePresence>
        {selectedService && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10 bg-primary-blue/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full h-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="bg-slate-50 px-8 py-4 border-b border-border-slate flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary-blue text-white rounded-lg">
                    <Grid className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-primary-blue tracking-tight">{selectedService.name}</h3>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{selectedService.agency} Official Content Portal</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedService(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-text-muted" />
                </button>
              </div>

              <div className="flex-grow bg-app-bg overflow-auto p-6 md:p-10">
                <div className="max-w-4xl mx-auto space-y-8">
                  {/* Service Overview */}
                  <div className="glass-card p-8 border-l-8 border-primary-blue">
                    <h4 className="text-2xl font-black text-primary-blue mb-4">About this Service</h4>
                    <p className="text-lg text-text-main leading-relaxed mb-6 font-medium">
                      {selectedService.info}
                    </p>
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-4 text-primary-blue">
                      <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                      <p className="text-sm font-bold">This is an internal citizen processing view. Use the secure steps below to proceed with your application autonomously.</p>
                    </div>
                  </div>

                  {/* Application Roadmap */}
                  <div className="space-y-6">
                    <h4 className="text-xl font-bold text-text-main px-2">Official Procedural Roadmap</h4>
                    <div className="relative">
                       {/* Connection Line */}
                       <div className="absolute left-[27px] top-0 bottom-0 w-1 bg-slate-200 rounded-full"></div>
                       
                       <div className="space-y-8 relative z-10">
                         {selectedService.steps.map((step, idx) => (
                           <div key={idx} className="flex gap-6 group">
                             <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center font-black text-xl text-primary-blue group-hover:border-primary-blue group-hover:bg-primary-blue group-hover:text-white transition-all shrink-0">
                               {idx + 1}
                             </div>
                             <div className="glass-card flex-grow p-6 group-hover:-translate-y-1 transition-transform">
                               <h5 className="font-black text-primary-blue mb-2 text-lg uppercase tracking-tight">{step}</h5>
                               <p className="text-text-muted text-sm leading-relaxed">Official internal process verified for the 2026/2027 national digital framework. All documentation must be submitted through your Digital Vault.</p>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-8 pt-10">
                    <button 
                      onClick={handleServiceInitiation}
                      className="bg-primary-blue text-white px-12 py-4 rounded-2xl font-black text-lg shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-3"
                    >
                      <ArrowRight className="w-6 h-6" />
                      Initiate Process in Workspace
                    </button>

                    <div className="w-full max-w-2xl border-t border-slate-200 mt-4 pt-10 text-center">
                       <h4 className="text-xl font-black text-primary-blue mb-4">Need Expert Assistance?</h4>
                       <p className="text-text-muted mb-8 font-medium">If you need help finishing the other registration processes, our dedicated officers are ready to assist you manually. Connect with us through any of the channels below:</p>
                       
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <a href="tel:+256757808474" className="glass-card p-6 flex flex-col items-center gap-3 hover:border-accent-blue transition-all group">
                             <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary-blue group-hover:bg-primary-blue group-hover:text-white transition-all">
                                <Phone className="w-6 h-6" />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Call Officer</span>
                             <span className="text-[13px] font-black">+256 757808474</span>
                          </a>
                          <a href="https://wa.me/256757808474" target="_blank" rel="noopener noreferrer" className="glass-card p-6 flex flex-col items-center gap-3 hover:border-emerald-500 transition-all group">
                             <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 transition-all">
                                <img 
                                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                                  alt="WhatsApp" 
                                  className="w-7 h-7"
                                  referrerPolicy="no-referrer"
                                />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">WhatsApp</span>
                             <span className="text-[13px] font-black">+256 757808474</span>
                          </a>
                          <a href="mailto:azontocrewza@gmail.com" className="glass-card p-6 flex flex-col items-center gap-3 hover:border-orange-500 transition-all group">
                             <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                <Mail className="w-6 h-6" />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Email Support</span>
                             <span className="text-[13px] font-black break-all lowercase">azontocrewza@gmail.com</span>
                          </a>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-border-slate flex justify-center text-[11px] text-text-muted font-bold uppercase tracking-[0.2em]">
                Secure Citizen Tunnel • 256-BIT ENCRYPTION • VERIFIED BY {selectedService.agency}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Key Service Requirements Modal */}
      <AnimatePresence>
        {selectedKeyService && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="bg-gov-maroon px-8 py-5 flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <selectedKeyService.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">{selectedKeyService.title}</h3>
                    <p className="text-[10px] font-bold opacity-70 tracking-widest uppercase">Service Information Portal</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedKeyService(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-10">
                <AnimatePresence mode="wait">
                  {!showContactInKeyService ? (
                    <motion.div 
                      key="requirements"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <h4 className="text-xl font-black text-secondary-blue dark:text-blue-200 uppercase tracking-tighter flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gov-maroon" />
                        Required Documentation
                      </h4>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 italic">Please ensure you have the following documents ready before proceeding with your application:</p>
                      
                      <ul className="space-y-4">
                        {(
                          selectedKeyService.title === 'Issuance Of Documents' ? [
                            'Original copy of the recommendation letter from local authorities.',
                            'Copy of parent(s) National ID or Death Certificate if deceased.',
                            'Proof of citizenship (e.g., Birth Certificate, Passport).',
                            'Completed Application Form 3.'
                          ] : selectedKeyService.title === 'Confirmation of Information' ? [
                            'Evidence of payment of the prescribed confirmation fee (PRN).',
                            'Letter clearly stating the purpose for the request.',
                            'Copy of your National ID or NIN notification slip.',
                            'Authorization letter (if applying for someone else).'
                          ] : selectedKeyService.title === 'Registrations' ? [
                            'Physical presence of the applicant for biometric capture.',
                            'Signed and stamped Form 3 by the Sub-county, District, and Village authorities.',
                            'Evidence of age (Birth certificate or Baptism card).',
                            'Proof of Ugandan parentage.'
                          ] : [
                            'Scan of the QR Code or Tracking Number on the document.',
                            'Serial Number of the ID or Certificate.',
                            'Access to an internet-enabled device.',
                            'PRN for third-party verification (if applicable).'
                          ]
                        ).map((req, i) => (
                          <li key={i} className="flex gap-4 items-start bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                             <div className="w-6 h-6 rounded-full bg-gov-maroon/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3.5 h-3.5 text-gov-maroon" />
                             </div>
                             <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-snug">{req}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button 
                          onClick={() => setShowContactInKeyService(true)}
                          className="bg-gov-maroon text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-gov-maroon/20 hover:bg-gov-maroon-dark transition-all active:scale-95 flex items-center gap-3"
                        >
                          Continue
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="contact"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-gov-maroon/10 rounded-full flex items-center justify-center mx-auto mb-6">
                           <Phone className="w-10 h-10 text-gov-maroon" />
                        </div>
                        <h4 className="text-2xl font-black text-secondary-blue dark:text-white uppercase tracking-tighter">Contact Our Bureau</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">For further assistance or to submit your physical documents, please use the following coordinates:</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <a 
                           href="https://wa.me/256757808474" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center text-center gap-3 transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95"
                         >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">WhatsApp Assist</span>
                            <span className="text-sm font-black text-emerald-900 dark:text-emerald-100 leading-tight">+256 757808474</span>
                         </a>
                         <a 
                           href="tel:+256757808474"
                           className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-3 transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95"
                         >
                            <Phone className="w-6 h-6 text-gov-maroon" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Support</span>
                            <span className="text-sm font-black text-secondary-blue dark:text-white">+256 757808474</span>
                         </a>
                         <a 
                           href="mailto:azontocrewza@gmail.com"
                           className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-3 transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95"
                         >
                            <Mail className="w-6 h-6 text-gov-maroon" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Portal</span>
                            <span className="text-sm font-black text-secondary-blue dark:text-white break-all lowercase">azontocrewza@gmail.com</span>
                         </a>
                         <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-3">
                            <Clock className="w-6 h-6 text-gov-maroon" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Support Hours</span>
                            <span className="text-sm font-black text-secondary-blue dark:text-white leading-tight">Mon - Fri: 8AM - 5PM</span>
                         </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                        <button 
                          onClick={() => setSelectedKeyService(null)}
                          className="bg-secondary-blue text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                        >
                          Finish Session
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 8. How to Apply Guide Modal */}
      <AnimatePresence>
        {showHowToApply && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#0a0a0a]/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-white/10"
            >
              <div className="bg-gov-maroon p-8 flex items-center justify-between text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 -rotate-45 translate-x-32 -translate-y-32"></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                    <Book className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">How to Apply</h3>
                    <p className="text-xs font-bold text-white/60 tracking-[0.2em] uppercase mt-1">Official Citizen Guidance Framework</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHowToApply(false)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all group relative z-10"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="flex-grow overflow-auto p-8 md:p-12 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gov-maroon rounded-lg flex items-center justify-center text-white">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <h4 className="text-xl font-black text-secondary-blue dark:text-white uppercase tracking-tight">1. General Registration</h4>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                        {[
                          "Visit our website or local bureau office to obtain Form 3.",
                          "Ensure you have valid proof of biological citizenship (Birth certificate).",
                          "Get your form stamped by local village and sub-county authorities.",
                          "Submit the completed form at any enrollment center for biometric capture."
                        ].map((step, i) => (
                          <div key={i} className="flex gap-4 group">
                             <span className="w-6 h-6 rounded-full bg-gov-maroon/10 text-gov-maroon flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-gov-maroon group-hover:text-white transition-colors">{i+1}</span>
                             <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-snug">{step}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gov-maroon rounded-lg flex items-center justify-center text-white">
                          <FileSearch className="w-4 h-4" />
                        </div>
                        <h4 className="text-xl font-black text-secondary-blue dark:text-white uppercase tracking-tight">2. Document Renewal</h4>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                        {[
                          "Generate a Payment Reference Number (PRN) via the URA portal.",
                          "Pay the renewal fee at any designated commercial bank.",
                          "Bring your expired document and payment evidence to the bureau.",
                          "Update your biometrics and receive a claim slip for your new document."
                        ].map((step, i) => (
                          <div key={i} className="flex gap-4 group">
                             <span className="w-6 h-6 rounded-full bg-gov-maroon/10 text-gov-maroon flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-gov-maroon group-hover:text-white transition-colors">{i+1}</span>
                             <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-snug">{step}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-8">
                    <section className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gov-maroon rounded-lg flex items-center justify-center text-white">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <h4 className="text-xl font-black text-secondary-blue dark:text-white uppercase tracking-tight">3. Replacement of Lost Card</h4>
                      </div>
                      <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-2xl border border-rose-100 dark:border-rose-900/30 space-y-4">
                        {[
                          "Report the loss to the nearest Police Station and obtain a Police Letter.",
                          "Proceed to the bank and pay the replacement fee (NIN search fee inclusive).",
                          "Fill out the replacement application form at our regional office.",
                          "Wait for 14-30 working days for your new card to be processed."
                        ].map((step, i) => (
                          <div key={i} className="flex gap-4 group">
                             <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">{i+1}</span>
                             <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-snug">{step}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="p-8 bg-gov-maroon rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                       <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                       <h5 className="text-2xl font-black uppercase tracking-tighter mb-4 italic italic">Pro-Tip for Fast Processing</h5>
                       <p className="text-[13px] font-bold text-white/80 leading-relaxed mb-6 italic">
                         "Always ensure your PRN is paid before visiting the bureau. You can track your payment status in your Digital Workspace to avoid long queues at the verification desk."
                       </p>
                       <button 
                        onClick={() => { setShowHowToApply(false); setActiveTab('workspace'); }}
                        className="w-full py-4 bg-white text-gov-maroon rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gov-gold hover:text-black transition-all shadow-xl active:scale-95"
                       >
                         Manage Applications
                       </button>
                    </div>
                  </div>
                </div>

                <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50 dark:bg-slate-800/80 rounded-[2rem] p-8 md:p-10 border border-slate-100 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                      <div className="text-center md:text-left">
                        <h4 className="text-2xl font-black text-secondary-blue dark:text-white uppercase tracking-tighter mb-2">Still Need <span className="text-gov-maroon italic">Assistance?</span></h4>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">Our official bureau officers are available on standby to guide you through any complex application steps.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a href="tel:+256757808474" className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-gov-maroon transition-all group active:scale-95">
                           <Phone className="w-5 h-5 text-gov-maroon group-hover:scale-110 transition-transform" />
                           <span className="font-black text-sm text-secondary-blue dark:text-white uppercase tracking-tight">+256 757808474</span>
                        </a>
                        <a href="https://wa.me/256757808474" className="flex items-center gap-3 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95">
                           <MessageSquare className="w-5 h-5" />
                           <span className="font-black text-sm uppercase tracking-tight">Message Agent</span>
                        </a>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-center pt-8 border-t border-white/50 dark:border-slate-700">
                      <a href="mailto:azontocrewza@gmail.com" className="flex items-center gap-3 text-gov-maroon font-black uppercase text-xs tracking-widest hover:text-secondary-blue dark:hover:text-gov-gold transition-colors">
                        <Mail className="w-4 h-4" />
                        Inquiry HeadBox: <span className="lowercase">azontocrewza@gmail.com</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                   <ShieldCheck className="w-3 h-3 text-gov-maroon" />
                   Verified Official Guidance Framework • 2026 Edition
                 </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppStep, CartoonStyle } from './types';
import StyleCard from './components/StyleCard';
import Button from './components/Button';
import Logo from './components/Logo';
import { generateCartoonImage } from './services/geminiService';
import { Upload, Image as ImageIcon, RefreshCw, ChevronLeft, X, Zap, Loader2, Lock, LogOut, Plus, MessageCircle, ImagePlus, Camera, Maximize2, Eraser, Mail, CheckCircle } from 'lucide-react';
import { auth, googleProvider } from './services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, sendEmailVerification } from 'firebase/auth';

const PREVIEW_IMAGES: Record<string, string[]> = {
  'cartoonizer': ['https://storage.googleapis.com/cartoonizer-01.firebasestorage.app/cartoonizer_assets/ASSETS/Jennie%20Photo%20(1).png'],
  'aesthetic': ['https://storage.googleapis.com/cartoonizer-01.firebasestorage.app/cartoonizer_assets/ASSETS/Jennie%20Photo%20(2).png'],
  'sketsa': ['https://storage.googleapis.com/cartoonizer-01.firebasestorage.app/cartoonizer_assets/ASSETS/cartoonizer-1764689487950.png'],
  'disney-style': ['https://storage.googleapis.com/cartoonizer-01.firebasestorage.app/cartoonizer_assets/ASSETS/Jennie%20Photo%20(4).png']
};

const STYLES: CartoonStyle[] = [
  {
    id: 'cartoonizer',
    title: 'Cartoon',
    description: 'Vector Art & Thick Outlines',
    color: 'bg-[#86EFAC]',
    textColor: 'text-green-900',
    illustrationType: 'person',
    promptModifier: `TRANSFORM THE IMAGE INTO A VECTOR ART STYLE ILLUSTRATION. Step 1: Analyze the image and identify ALL people (group). Step 2: Draw the image using these STRICT VISUAL RULES: 1. **VECTOR ART STYLE**: The image must look like it was created in Adobe Illustrator. Precise, clean geometry. 2. **THICK BLACK OUTLINES**: This is the most important rule. EVERY object, character, face, limb, and clothing item MUST have a bold, uniform, and distinct black outline. 3. **FLAT CEL-SHADING**: Use SOLID colors only. NO GRADIENTS. Shadows must be drawn as distinct solid shapes of darker color with hard edges. Highlights are solid shapes of lighter color. No brush textures. 4. **CHARACTER DESIGN**: Simplified semi-realistic faces. Uniform facial structure and coloring. Clear, friendly expressions. 5. **COMPOSITION**: Full clarity. NO BLUR. Background and foreground elements must be equally sharp and outlined. LIGHTING ADJUSTMENT: If the source photo is poorly lit, dark, or has heavy shadows: artificially BRIGHTEN the subject. Remove harsh shadows on the face. Ensure skin tones are vibrant and clear, not muddy.`
  },
  {
    id: 'aesthetic',
    title: 'Avatars',
    description: 'Subject only, Sticker style',
    color: 'bg-[#FBCFE8]',
    textColor: 'text-pink-900',
    illustrationType: 'aesthetic',
    promptModifier: `TRANSFORM THIS IMAGE INTO A CLEAN AVATAR STICKER. **CORE INSTRUCTION:** GENERATE THE SUBJECT ONLY. **VISUAL RULES:** 1. **Subject**: Create a high-quality, stylized 2D avatar of the person in the photo. Preserve identity and expression. 2. **Isolation**: The subject MUST be isolated from the original scene. 3. **Background**: Use a SOLID, FLAT background color that matches the DOMINANT color of the subject's clothing or features (e.g. if wearing blue, use soft blue background). Do NOT use white background. 4. **Sticker Style**: Add a clean WHITE BORDER (die-cut stroke) around the subject's silhouette to make it look like a sticker on top of the colored background. NO drop shadows. 5. **Art Style**: Modern, flat, vector-like illustration. Soft shading, pleasing colors, and clean lines.`
  },
  {
    id: 'sketsa',
    title: 'Sketch',
    description: 'Expressive pencil art',
    color: 'bg-[#FDE047]',
    textColor: 'text-yellow-900',
    illustrationType: 'minimal',
    promptModifier: `Tugas utama Anda adalah menghasilkan gambar dengan meniru gaya visual seorang maestro sketsa. Medium yang wajib digunakan adalah pensil grafit monokromatik (hitam, putih, dan skala abu-abu) yang diterapkan di atas kertas bertekstur. Terapkan teknik spesifik yang mencakup cross-hatching (arsiran silang) untuk struktur, shading pensil yang lembut untuk bayangan, serta garis luar (linework) yang tegas namun tetap mempertahankan karakteristik sketsa tangan yang natural. Hasil akhir harus secara jelas menampilkan tekstur serat kertas dan ketidaksempurnaan alami dari goresan pensil.
    Dalam memproses input pengguna, analisis semua subjek manusia dan transformasikan mereka menjadi karakter bergaya anime/manga, mengadopsi estetika wajah dengan fokus pada mata yang sedikit besar dan ekspresif, serta detail rambut yang digambar dengan goresan pensil dinamis. Sangat penting untuk tetap mempertahankan kemiripan fitur wajah dasar, pose, pakaian, dan komposisi asli dari foto input, namun merender seluruh elemen tersebut menggunakan teknik sketsa pensil anime yang telah ditentukan di atas.
    Jangan menghapus latar belakang dari gambar input. Sebaliknya, gambar ulang seluruh elemen latar belakang (termasuk bangunan, pohon, atau objek lainnya) menggunakan teknik sketsa pensil grafit yang sama persis agar terlihat kohesif dan menyatu dengan subjek, seolah-olah semuanya digambar di atas lembaran kertas yang sama oleh seniman yang sama. Jika terdapat teks pada latar belakang (misalnya pada spanduk), teks tersebut harus tetap terbaca namun dirender agar terlihat seperti ditulis atau diarsir menggunakan pensil. Pastikan pencahayaan dan bayangan melalui teknik arsiran diterapkan secara konsisten di seluruh bagian gambar untuk menciptakan kesatuan visual.
    Sebagai batasan mutlak (constraints), output akhir HANYA boleh berupa gambar sketsa pensil monokrom tanpa warna sama sekali. Selain itu, Anda dilarang mengganti subjek dalam foto input dengan karakter lain untuk menggambar orang-orang yang sebenarnya ada di dalam foto input pengguna.`
  },
  {
    id: 'disney-style',
    title: 'Disney',
    description: 'Pixar-inspired 2D magic',
    color: 'bg-[#93C5FD]',
    textColor: 'text-blue-900',
    illustrationType: '3d',
    promptModifier: 'Style: Whimsical Disney/Pixar Concept Art & Storybook Illustration. Instructions: Transform this photo into a charming, high-quality digital painting similar to Pixar visual development art (e.g., Luca) or modern children\'s book illustrations. Key Visual Features: 1. **Technique**: Use a "painterly" style with soft, visible brush textures (gouache or digital chalk feel). NOT flat vector, NOT photorealistic 3D. 2. **Atmosphere**: Warm, sunny, and nostalgic. Evoke the the feeling of childhood summer adventures and wonder. 3. **Characters**: Stylized, expressive, and appealing (rounded shapes, big warm eyes, friendly proportions). 4. **Colors**: Saturated pastels, azure blue skies, golden sunlight, and fresh greens.'
  }
];

// --- UTILS FOR USER QUOTA ---
const DEFAULT_DAILY_LIMIT = 5;

const getUserQuota = (uid: string): number => {
  const storageKey = `cartoonizer_usage_${uid}`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const { date, count } = JSON.parse(stored);
      const today = new Date().toISOString().split('T')[0];
      if (date !== today) return 0;
      return count;
    }
  } catch (e) { console.error(e); }
  return 0;
};

const incrementUserQuota = (uid: string): number => {
  const storageKey = `cartoonizer_usage_${uid}`;
  const currentCount = getUserQuota(uid);
  const today = new Date().toISOString().split('T')[0];
  const newCount = currentCount + 1;
  localStorage.setItem(storageKey, JSON.stringify({ date: today, count: newCount }));
  return newCount;
};

// --- SUB-COMPONENT FOR ZOOMABLE IMAGE WITH PINCH & PAN (OPTIMIZED) ---
const ZoomableImage: React.FC<{ src: string; onClick: () => void; }> = ({ src, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Use refs for all mutable state to avoid re-renders during gestures
  const state = useRef({
    scale: 1,
    x: 0,
    y: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    startDist: 0,
    startScale: 1,
    mode: 'none' as 'none' | 'pan' | 'pinch'
  });

  const updateTransform = () => {
    if (imgRef.current) {
      const { x, y, scale } = state.current;
      imgRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      imgRef.current.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
    }
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      state.current.mode = 'pinch';
      state.current.startDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      state.current.startScale = state.current.scale;
    } else if (e.touches.length === 1 && state.current.scale > 1) {
      state.current.mode = 'pan';
      state.current.startX = e.touches[0].clientX;
      state.current.startY = e.touches[0].clientY;
      state.current.startPanX = state.current.x;
      state.current.startPanY = state.current.y;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (state.current.mode === 'pinch' && e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (state.current.startDist > 0) {
        const scaleFactor = dist / state.current.startDist;
        state.current.scale = Math.max(1, Math.min(state.current.startScale * scaleFactor, 5));
        requestAnimationFrame(updateTransform);
      }
    } else if (state.current.mode === 'pan' && e.touches.length === 1) {
      e.preventDefault();
      const dx = e.touches[0].clientX - state.current.startX;
      const dy = e.touches[0].clientY - state.current.startY;
      state.current.x = state.current.startPanX + dx;
      state.current.y = state.current.startPanY + dy;
      requestAnimationFrame(updateTransform);
    }
  };

  const handleTouchEnd = () => {
    state.current.mode = 'none';
    if (state.current.scale < 1) {
      state.current.scale = 1;
      state.current.x = 0;
      state.current.y = 0;
      requestAnimationFrame(updateTransform);
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.current.scale > 1) {
      e.preventDefault();
      state.current.mode = 'pan';
      state.current.startX = e.clientX;
      state.current.startY = e.clientY;
      state.current.startPanX = state.current.x;
      state.current.startPanY = state.current.y;
      if (imgRef.current) imgRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (state.current.mode === 'pan') {
      e.preventDefault();
      const dx = e.clientX - state.current.startX;
      const dy = e.clientY - state.current.startY;
      state.current.x = state.current.startPanX + dx;
      state.current.y = state.current.startPanY + dy;
      requestAnimationFrame(updateTransform);
    }
  };

  const handleMouseUp = () => {
    state.current.mode = 'none';
    if (imgRef.current) imgRef.current.style.cursor = state.current.scale > 1 ? 'grab' : 'zoom-in';
  };

  const lastTap = useRef<number>(0);
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (state.current.scale > 1) {
        state.current.scale = 1;
        state.current.x = 0;
        state.current.y = 0;
      } else {
        state.current.scale = 2.5;
        state.current.x = 0;
        state.current.y = 0;
      }
      requestAnimationFrame(updateTransform);
    }
    lastTap.current = now;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <img 
        ref={imgRef}
        src={src} 
        alt="Full Result" 
        className="max-w-full max-h-full object-contain transition-transform duration-75 ease-linear will-change-transform"
        style={{ transform: 'translate(0px, 0px) scale(1)', cursor: 'zoom-in' }}
        onClick={handleDoubleTap}
        draggable={false}
      />
    </div>
  );
};

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [step, setStep] = useState<AppStep>(AppStep.VOUCHER);
  const [selectedStyle, setSelectedStyle] = useState<CartoonStyle>(STYLES[0]);
  const [image, setImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  
  // Email Verification State
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // UI States
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Auth & Init Logic ---
  const checkAuth = useCallback(async () => {
    // 1. Check if we have a stored manual key
    const storedKey = localStorage.getItem('cartoonizer_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    } else if (process.env.API_KEY) {
      setApiKey(process.env.API_KEY);
    }
  }, []);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Logic: Only let them in if verification is strictly required for email/password but maybe not for Google
      // or just check emailVerified property for all.
      // Google Sign-In usually provides a verified email automatically.
      
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
        setDailyCount(getUserQuota(currentUser.uid));
        setStep(AppStep.STYLE_SELECTION);
        checkAuth();
      } else {
        // If logged in but not verified (could happen if persistence is on or just after register before signout), 
        // we essentially treat them as logged out for the app flow, but we might want to ensure they are signed out in firebase to prevent confusion.
        // However, handleEmailAuth manages the specific "Verify Email" screen state.
        setUser(null);
        setStep(AppStep.VOUCHER);
      }
    });
    return () => unsubscribe();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      setDailyCount(getUserQuota(user.uid));
    }
  }, [user]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === AppStep.PROCESSING) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? prev : prev + (Math.random() * 8)));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Handle Hardware Back Button for Expanded Result
  useEffect(() => {
    if (expandedResult) {
      window.history.pushState({ modalOpen: true }, '', window.location.href);
      const handlePopState = () => setExpandedResult(null);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [expandedResult]);

  const currentLimit = DEFAULT_DAILY_LIMIT;
  const remainingCredits = Math.max(0, currentLimit - dailyCount);

  // --- Auth Actions ---
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Send Verification Email
        await sendEmailVerification(userCredential.user);
        // Important: Do not sign them in automatically. Sign out immediately.
        await signOut(auth);
        
        setVerificationEmail(email);
        setIsVerificationSent(true);
        // Reset registration mode so "Login" button works naturally later
        setIsRegistering(false); 
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
           // If not verified, sign out and show verification screen
           await signOut(auth);
           setVerificationEmail(email);
           setIsVerificationSent(true);
           return;
        }
        // If verified, onAuthStateChanged will handle the redirect
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('cartoonizer_api_key');
      setApiKey('');
      setShowAddCredit(false);
    } catch (err) {
      console.error(err);
    }
  };

  const processImage = useCallback(async (base64Img: string) => {
    if (!user) {
      setError("Session invalid.");
      return setStep(AppStep.VOUCHER);
    }
    if (getUserQuota(user.uid) >= DEFAULT_DAILY_LIMIT) {
      setError("Daily limit reached.");
      return setStep(AppStep.STYLE_SELECTION);
    }
    setIsLoading(true);
    setError(null);
    
    if (expandedResult) setExpandedResult(null);

    try {
      const cartoon = await generateCartoonImage(base64Img, selectedStyle.promptModifier, apiKey);
      setDailyCount(incrementUserQuota(user.uid));
      setProgress(100);
      setTimeout(() => {
         setResultImage(cartoon);
         setStep(AppStep.RESULT);
         setExpandedResult(null);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Transformation failed");
      // If API key issue, usually handled by dev/admin, user can't fix it easily without manual entry
      // For now stay on Style Selection
      setStep(AppStep.STYLE_SELECTION);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStyle, user, expandedResult, apiKey]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    
    let fileToProcess = file;

    // HEIC/HEIF Detection
    if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      try {
        setIsLoading(true);
        // Dynamically import heic2any based on importmap
        const heic2any = (await import('heic2any')).default;
        
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });

        const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        
        fileToProcess = new File([finalBlob], file.name.replace(/\.heic$/i, ".jpg"), {
          type: "image/jpeg",
        });
      } catch (err) {
        console.error("HEIC Conversion error", err);
        setError("Gagal memproses gambar HEIC/HEIF.");
        setIsLoading(false);
        e.target.value = '';
        return;
      } finally {
        setIsLoading(false);
      }
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setError(null);
    };
    reader.onerror = () => {
      setError("Gagal membaca file gambar.");
    };
    reader.readAsDataURL(fileToProcess);
    
    e.target.value = '';
  };

  const handleBackToEditor = () => {
    setResultImage(null);
    setStep(AppStep.STYLE_SELECTION);
  };

  const handleRemoveBackground = async () => {
    if (!resultImage) return;
    setIsRemovingBg(true);
    try {
      const newImage = await generateCartoonImage(
        resultImage, 
        "EDIT INSTRUCTION: Remove the background completely. Replace it with a solid WHITE background. IMPORTANT: Keep the subject, their clothing, and ANY objects/props they are holding, touching, or working with EXACTLY as they are. Do not redraw or change the style of the subject, just the background.",
        apiKey
      );
      setResultImage(newImage);
    } catch (e: any) {
      console.error(e);
      setError("Gagal menghapus background.");
    } finally {
      setIsRemovingBg(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-gray-50/50 sm:p-6 lg:p-8 overflow-hidden touch-none">
      {/* Main App Container */}
      <div className="w-full h-full sm:h-[850px] sm:max-w-[430px] bg-[#FDFCF6] sm:rounded-[48px] shadow-none sm:shadow-2xl sm:shadow-gray-200/50 relative flex flex-col overflow-hidden ring-1 ring-black/5">
        
        {/* --- STEP: AUTH / LOGIN --- */}
        {step === AppStep.VOUCHER && (
          isVerificationSent ? (
            // --- VERIFICATION SCREEN ---
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center bg-[#FDFCF6] animate-fadeIn">
                <div className="w-20 h-20 mb-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-sm animate-pulse-subtle">
                    <Mail size={36} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Check your email</h2>
                <p className="text-gray-600 text-sm mb-8 leading-relaxed max-w-[280px]">
                    We have sent you a verification email to <span className="font-semibold text-gray-800">{verificationEmail}</span>.
                    <br/><br/>
                    Please verify it and log in.
                </p>
                
                <button
                    onClick={() => { setIsVerificationSent(false); setError(null); }}
                    className="w-full max-w-xs py-3.5 rounded-xl bg-[#9D6B53] text-white font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-wider"
                >
                    Login
                </button>
            </div>
          ) : (
            // --- LOGIN / REGISTER SCREEN ---
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center bg-[#FDFCF6] animate-fadeIn">
              <div className="w-24 h-24 mb-6 shadow-xl rounded-[28%] transform -rotate-6 transition-transform hover:rotate-0 duration-300">
                 <Logo className="w-full h-full" />
              </div>
              <img src="https://storage.googleapis.com/cartoonizer-01.firebasestorage.app/cartoonizer_assets/ASSETS/CARTOONIZER%20text.png" alt="CARTOONIZER" className="h-9 w-auto mb-4 object-contain" />
              <p className="text-gray-500 text-sm mb-8 max-w-[260px] leading-relaxed">Sign in to start creating.</p>
              
              <div className="w-full max-w-xs space-y-4">
                <button onClick={handleGoogleLogin} className="w-full py-3.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold shadow-sm hover:bg-gray-50 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                   <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                   <span>Sign in with Google</span>
                </button>
                
                <div className="flex items-center gap-3 my-4">
                   <div className="h-px bg-gray-200 flex-1"></div>
                   <span className="text-gray-400 text-xs font-semibold uppercase">OR EMAIL</span>
                   <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Mail size={18} /></div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-[#9D6B53] focus:outline-none transition-colors shadow-sm text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-[#9D6B53] focus:outline-none transition-colors shadow-sm text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                  <button type="submit" disabled={isLoggingIn} className="w-full py-3.5 rounded-xl bg-[#9D6B53] text-white font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-wider flex items-center justify-center gap-2">
                     {isLoggingIn && <Loader2 className="animate-spin" size={18} />}
                     {isRegistering ? 'Register' : 'Sign In'}
                  </button>
                </form>
                
                <button onClick={() => { setIsRegistering(!isRegistering); setError(null); }} className="text-xs text-[#9D6B53] font-semibold hover:underline mt-4">
                   {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Register"}
                </button>

                {error && <div className="p-3 bg-red-50 rounded-lg text-red-600 text-xs font-medium">{error}</div>}
              </div>
            </div>
          )
        )}

        {/* --- STEP: STYLE SELECTION --- */}
        {step === AppStep.STYLE_SELECTION && (
          <div className="flex flex-col h-full animate-fadeIn relative">
            <div className="flex-none px-8 pt-10 pb-3 bg-[#FDFCF6] z-30 relative">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 shadow-md rounded-[28%] shrink-0"><Logo className="w-full h-full" /></div>
                   <img src="https://storage.googleapis.com/cartoonizer-01.firebasestorage.app/cartoonizer_assets/ASSETS/CARTOONIZER%20text.png" alt="Cartoonizer" className="h-7 w-auto object-contain" />
                </div>
                <div className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full border bg-gray-50 border-gray-200">
                    <Zap size={14} className={remainingCredits > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                    <span className="text-xs font-bold mr-1 text-gray-600">
                      {remainingCredits}/{currentLimit}
                    </span>
                    <button onClick={() => { setShowAddCredit(true); }} className="w-6 h-6 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-md active:scale-90"><Plus size={14} strokeWidth={3} /></button>
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium truncate max-w-[280px]">Logged in as <span className="font-mono text-gray-700 bg-gray-100 px-1 rounded">{user?.email || user?.displayName || 'User'}</span></p>
              {error && <div className="mt-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100">{error}</div>}
              <div className={`absolute top-full left-0 w-full h-12 bg-gradient-to-b from-[#FDFCF6] to-transparent pointer-events-none transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}></div>
            </div>
            
            <div 
              className="flex-1 overflow-y-auto no-scrollbar px-6 pt-0 pb-6 relative z-10 min-h-0"
              onScroll={(e) => {
                const target = e.currentTarget;
                setIsScrolled(target.scrollTop > 10);
                setIsAtBottom(Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 10);
              }}
            >
              <div className="space-y-4">
                {STYLES.map((style) => (
                  <StyleCard 
                    key={style.id} 
                    style={style} 
                    isSelected={selectedStyle.id === style.id}
                    onClick={() => setSelectedStyle(style)}
                    isLocked={false}
                    previewImage={PREVIEW_IMAGES[style.id]?.[0]}
                  />
                ))}
              </div>
            </div>

            <div className="flex-none bg-[#FDFCF6] z-40 relative">
               <div className={`absolute bottom-full left-0 w-full h-12 bg-gradient-to-t from-[#FDFCF6] to-transparent pointer-events-none transition-opacity duration-300 ${isAtBottom ? 'opacity-0' : 'opacity-100'}`}></div>
               <div className="px-6 pt-0 pb-10 flex flex-col gap-6">
                 {!image ? (
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-40 bg-white border-2 border-dashed border-gray-300 rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-black hover:bg-gray-50 transition-all shadow-xl active:scale-[0.98] group">
                      <div className="w-14 h-14 bg-[#9D6B53] text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg"><Upload size={24} /></div>
                      <p className="font-bold text-gray-900 text-xl">Upload Photo</p>
                    </div>
                 ) : (
                    <div className="flex flex-col gap-6 animate-fadeIn">
                      <div 
                        onClick={() => { if(image) setExpandedResult(image) }} 
                        className="w-full bg-white p-5 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-stretch gap-6 cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] relative group"
                      >
                        <div className="relative w-32 h-40 shrink-0 rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100">
                            <img src={image} alt="Selected" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                                  <Maximize2 size={24} className="text-white drop-shadow-md" />
                               </div>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                            <div>
                              <div className="flex items-center gap-2 mb-2"><div className={`w-2.5 h-2.5 rounded-full ${selectedStyle.color}`}></div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Style Selected</span></div>
                              <p className="text-xl font-black text-gray-800 truncate leading-tight mb-3">{selectedStyle.title}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="w-full py-4 px-4 rounded-2xl bg-[#F5F0EB] border border-[#E6DCD5] text-[#9D6B53] text-sm font-bold uppercase tracking-wider hover:bg-[#E6DCD5] transition-colors flex items-center justify-center gap-2"><Camera size={16} /><span>Ganti Foto</span></button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setImage(null); }} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center border border-gray-100"><X size={16} /></button>
                      </div>
                      <Button onClick={() => { if(image) { setStep(AppStep.PROCESSING); processImage(image); } }} label={remainingCredits > 0 ? "Go Create" : "Limit Reached"} type="full" disabled={remainingCredits <= 0} />
                    </div>
                 )}
               </div>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.heic,.heif" onChange={handleFileUpload} />
            </div>
          </div>
        )}

        {/* --- STEP: PROCESSING --- */}
        {step === AppStep.PROCESSING && (
           <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fadeIn bg-[#FDFCF6] z-50">
              <div className="relative w-64 h-64 mb-8">
                <div className={`absolute inset-0 rounded-[2rem] opacity-20 animate-ping ${selectedStyle.color}`}></div>
                <div className={`absolute inset-4 rounded-[2rem] opacity-40 animate-pulse ${selectedStyle.color}`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    {image && <img src={image} alt="Preview" className="w-56 h-56 rounded-[2rem] object-cover border-4 border-white shadow-2xl" />}
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Creating Magic...</h2>
              <p className="text-gray-500 text-center mb-6">Applying {selectedStyle.title} style.</p>
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 overflow-hidden"><div className="bg-[#9D6B53] h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div></div>
           </div>
        )}

        {/* --- STEP: RESULT --- */}
        {step === AppStep.RESULT && (
          <div className="flex flex-col h-full px-6 pt-10 pb-12 animate-fadeIn bg-[#FDFCF6]">
             <div className="text-center mb-6"><h1 className="text-3xl font-extrabold text-gray-900">Result</h1></div>
             
             <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-2 min-h-0">
               {/* Result Card */}
               <div className="w-full bg-white p-3 rounded-[36px] shadow-md shadow-gray-200/50 shrink-0">
                 <div className="relative w-full overflow-hidden rounded-[28px] bg-gray-50 cursor-zoom-in group" onClick={() => resultImage && setExpandedResult(resultImage)}>
                    {resultImage ? (
                      <>
                        <img src={resultImage} alt="Result" className="w-full h-auto" />
                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={12} className="text-white" /><span className="text-[10px] text-white font-bold uppercase">Expand</span></div>
                      </>
                    ) : <div className="w-full aspect-[4/5] flex items-center justify-center text-gray-400">Error</div>}
                 </div>
               </div>
               
               {/* Original Card (Added Click to Expand) */}
               <div className="flex-1 w-full bg-white p-3 rounded-[36px] shadow-md shadow-gray-200/50 min-h-[320px]">
                   <div 
                     className="relative w-full h-full overflow-hidden rounded-[28px] bg-gray-50 cursor-zoom-in group"
                     onClick={() => image && setExpandedResult(image)}
                   >
                       {image && <img src={image} alt="Original" className="w-full h-full object-cover opacity-90" />}
                       <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white uppercase tracking-wider">Original</div>
                       <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={12} className="text-white" /><span className="text-[10px] text-white font-bold uppercase">Expand</span></div>
                   </div>
               </div>
             </div>
             
             <div className="mt-4 flex flex-col gap-4 flex-none">
                <Button onClick={() => { if(resultImage) { const l = document.createElement('a'); l.href = resultImage; l.download = `cartoonizer-${Date.now()}.png`; l.click(); }}} type="full" label="DOWNLOAD" />
                
                {selectedStyle.id === 'cartoonizer' && (
                  <button 
                    onClick={handleRemoveBackground}
                    disabled={isRemovingBg}
                    className="w-full py-4 rounded-2xl bg-white border border-gray-100 text-gray-700 font-bold text-lg shadow-sm hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    {isRemovingBg ? <Loader2 className="animate-spin text-gray-400" size={20} /> : <Eraser size={20} />}
                    <span>Hapus Background</span>
                  </button>
                )}

                <div className="flex items-center gap-4">
                    <button onClick={handleBackToEditor} className="flex-1 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-[#9D6B53]/20 flex items-center justify-center group"><ChevronLeft size={28} className="text-[#9D6B53] group-hover:scale-110 transition-transform" /></button>
                    <button onClick={() => image && (setStep(AppStep.PROCESSING), processImage(image))} disabled={remainingCredits<=0} className={`flex-1 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-[#9D6B53]/20 flex items-center justify-center group ${remainingCredits<=0 ? 'opacity-50' : ''}`}><RefreshCw size={26} className="text-[#9D6B53] group-hover:rotate-180 transition-transform duration-500" /></button>
                    <button onClick={() => { setImage(null); setResultImage(null); setStep(AppStep.STYLE_SELECTION); }} className="flex-1 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-[#9D6B53]/20 flex items-center justify-center group"><ImagePlus size={26} className="text-[#9D6B53] group-hover:scale-110 transition-transform" /></button>
                </div>
             </div>
          </div>
        )}

        {/* --- ADD CREDIT / SETTINGS MODAL --- */}
        {showAddCredit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={() => setShowAddCredit(false)}>
             <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <div className="text-center mb-6">
                   <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wide">More Credits</h3>
                   <p className="text-sm text-gray-500 mt-1">Contact Mintoon to top up</p>
                </div>
                
                <a href={`https://wa.me/6285126413799?text=${encodeURIComponent("Hai Mintoon saya mau nambah kredit Cartoonizer [Jumlah :10/20/40]")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-[#25D366] text-white font-bold shadow-lg shadow-green-200 uppercase tracking-wider mb-6 hover:scale-[1.02] transition-transform"><MessageCircle size={24} fill="white" className="text-white" /><span>WhatsApp Mintoon</span></a>
                
                <div className="w-full pt-4 border-t border-gray-100"><button onClick={handleLogout} className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold border border-red-100 flex items-center justify-center gap-2 uppercase tracking-wider hover:bg-red-100 transition-colors"><LogOut size={18} />Log Out</button></div>
             </div>
          </div>
        )}

        {/* Global Footer */}
        <div className="absolute bottom-3 right-6 z-[55] pointer-events-none mix-blend-multiply opacity-60"><span className="text-[10px] font-bold text-[#9D6B53] uppercase tracking-widest">©2025Akarya</span></div>
      
        {/* --- GLOBAL EXPANDED MODAL --- */}
        {expandedResult && (
           <div 
             className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fadeIn overflow-hidden touch-none"
           >
             <button 
               className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center text-white z-50 hover:bg-white/30 transition-colors"
               onClick={(e) => { 
                  e.stopPropagation(); 
                  window.history.back(); 
               }}
             >
               <X size={28} />
             </button>
             
             <ZoomableImage 
                src={expandedResult} 
                onClick={() => {}} 
             />

             <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
                <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white px-5 py-2 rounded-full text-sm font-bold tracking-widest uppercase shadow-lg">
                  {selectedStyle.title}
                </span>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default App;

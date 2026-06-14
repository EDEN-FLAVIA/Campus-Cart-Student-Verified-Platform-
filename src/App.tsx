import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  ShoppingBag, 
  MessageSquare, 
  PlusCircle, 
  User, 
  ChevronRight, 
  CheckCircle, 
  Star, 
  Upload, 
  Trash2, 
  Edit3, 
  KeyRound, 
  ArrowLeft, 
  Search, 
  Tag, 
  ExternalLink,
  ShieldAlert,
  Loader2,
  ThumbsUp,
  Briefcase,
  AlertCircle,
  Clock,
  Phone,
  Bookmark,
  Send,
  X,
  Sparkles,
  Database
} from 'lucide-react';
import { insforge } from './lib/insforge';
import type { Profile, Product, Message, Rating } from './types';

// Categories for listing used products
const CATEGORIES = [
  'Books', 'Electronics', 'Lab Equipment', 'Sports', 'Fashion', 'Stationery', 'Bicycle', 'Others'
];

function getProductImageUrl(product: any) {
  if (product && product.image_url && product.image_url.trim()) {
    return product.image_url;
  }
  return '';
}

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up' | 'forgot-password' | 'verify-email' | 'reset-password'>('sign-in');
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Form states
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');

  // Profile setup & edit states
  const [profileName, setProfileName] = useState<string>('');
  const [profileMobile, setProfileMobile] = useState<string>('');
  const [profileCollege, setProfileCollege] = useState<string>('');
  const [profileCollegeAddress, setProfileCollegeAddress] = useState<string>('');
  const [studentCategory, setStudentCategory] = useState<'Engineering / College' | 'PUC / 11th-12th' | 'School'>('Engineering / College');
  const [isScanningId, setIsScanningId] = useState<boolean>(false);
  const [scanStatusStep, setScanStatusStep] = useState<string>('');
  const [profileBranch, setProfileBranch] = useState<string>('');
  const [profileSemester, setProfileSemester] = useState<string>('');
  const [profileIdCardUrl, setProfileIdCardUrl] = useState<string>('');
  const [profileIdCardBackUrl, setProfileIdCardBackUrl] = useState<string>('');
  const [profileValidity, setProfileValidity] = useState<string>('');
  const [idCardUploading, setIdCardUploading] = useState<boolean>(false);
  const [idCardBackUploading, setIdCardBackUploading] = useState<boolean>(false);
  const [isDraggingFront, setIsDraggingFront] = useState<boolean>(false);
  const [isDraggingBack, setIsDraggingBack] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  // Helper function to check if the student ID validity is finished
  function checkIDValidity(validityStr: string) {
    if (!validityStr || !validityStr.trim()) {
      return { isValid: true, reason: null };
    }
    const str = validityStr.toLowerCase().trim();
    const currentYear = 2026;

    if (str.includes("expired") || str.includes("invalid")) {
      return { isValid: false, reason: "ID is explicitly marked as expired or invalid." };
    }

    // 1. Match 4-digit to 4-digit pair like "2023-2024" or "2025/2026"
    const fourDigitPair = str.match(/\b(20\d{2})[-/](20\d{2})\b/);
    if (fourDigitPair) {
      const year2 = parseInt(fourDigitPair[2], 10);
      if (year2 < currentYear) {
        return {
          isValid: false,
          reason: `ID academic period ends in ${year2}, which is earlier than present year (${currentYear}).`
        };
      }
      return { isValid: true, reason: null };
    }

    // 2. Match 4-digit to 2-digit pair like "2023-24" or "2025/26"
    const fourToTwoDigitPair = str.match(/\b(20\d{2})[-/](\d{2})\b/);
    if (fourToTwoDigitPair) {
      const year2 = parseInt(fourToTwoDigitPair[2], 10);
      const fullEndYear = 2000 + year2;
      if (fullEndYear < currentYear) {
        return {
          isValid: false,
          reason: `ID academic period ends in ${fullEndYear} (20${year2}), which is earlier than present year (${currentYear}).`
        };
      }
      return { isValid: true, reason: null };
    }

    // 3. Match 2-digit to 2-digit pair like "23-24" or "25-26"
    const twoToTwoDigitPair = str.match(/\b(\d{2})[-/](\d{2})\b/);
    if (twoToTwoDigitPair) {
      const year1 = parseInt(twoToTwoDigitPair[1], 10);
      const year2 = parseInt(twoToTwoDigitPair[2], 10);
      // Exclude simple matches that are not realistic years (i.e. standard months etc)
      if (year1 > 10 && year1 < 99 && year2 > 10 && year2 < 99) {
        const fullEndYear = 2000 + year2;
        if (fullEndYear < currentYear) {
          return {
            isValid: false,
            reason: `ID academic period ends in ${fullEndYear}, which is earlier than present year (${currentYear}).`
          };
        }
        return { isValid: true, reason: null };
      }
    }

    // 4. Default to single 4-digit year check
    const years4digit = str.match(/\b(20\d{2})\b/g);
    if (years4digit && years4digit.length > 0) {
      const yearNums = years4digit.map(y => parseInt(y, 10));
      const maxYear = Math.max(...yearNums);
      if (maxYear < currentYear) {
        return { 
          isValid: false, 
          reason: `ID validity year (${maxYear}) is earlier than present year (${currentYear}).` 
        };
      }
      return { isValid: true, reason: null };
    }

    // 5. Default to single 2-digit year check (e.g. "till 24")
    const shortYearMatch = str.match(/\b(?:till|exp|expiry|until|to|yr|year|'|valid|\D)\s*(2[056789]|1[56789])\b/);
    if (shortYearMatch) {
      const year = parseInt(shortYearMatch[1], 10);
      const fullYear = 2000 + year;
      if (fullYear < currentYear) {
        return {
          isValid: false,
          reason: `ID expiration/validity year (20${year}) is earlier than present year (${currentYear}).`
        };
      }
    }
    return { isValid: true, reason: null };
  }

  // Table (list) for storing ID scan records, sorted by date.
  const [scanHistory, setScanHistory] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('campuscart_ocr_scans');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [showDeleteProfileConfirm, setShowDeleteProfileConfirm] = useState<boolean>(false);
  const [isDeletingProfileState, setIsDeletingProfileState] = useState<boolean>(false);

  // Main application views
  const [navState, setNavState] = useState<'marketplace' | 'chats' | 'list-item' | 'dashboard'>('marketplace');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'sale' | 'rent'>('all');

  // Product Listings states
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Books');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newType, setNewType] = useState<'sale' | 'rent'>('sale');
  const [newRentPeriod, setNewRentPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [newProductImgUrl, setNewProductImgUrl] = useState<string>('');
  const [productUploading, setProductUploading] = useState<boolean>(false);
  const [listingLoading, setListingLoading] = useState<boolean>(false);

  // Selected product details
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSellerRatings, setSelectedSellerRatings] = useState<Rating[]>([]);
  const [sellerAverageRating, setSellerAverageRating] = useState<{
    avgOverall: number;
    avgProduct: number;
    avgAttitude: number;
    avgBehavior: number;
    total: number;
  }>({ avgOverall: 0, avgProduct: 0, avgAttitude: 0, avgBehavior: 0, total: 0 });

  // Chat/Messaging system state
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<Message[]>([]);
  const [chatMessageContent, setChatMessageContent] = useState<string>('');
  const [chatMessagesLoading, setChatMessagesLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Ratings overlay / feedback state
  const [ratingProduct, setRatingProduct] = useState<Product | null>(null);
  const [starsProduct, setStarsProduct] = useState<number>(5);
  const [starsAttitude, setStarsAttitude] = useState<number>(5);
  const [starsBehavior, setStarsBehavior] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [ratingLoading, setRatingLoading] = useState<boolean>(false);

  // List removal confirmation modal helper
  const [productToRemove, setProductToRemove] = useState<{ id: string; title: string } | null>(null);

  // Toast notifications helper
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  function triggerToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // 1. App Startup: Check authentication
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    setAuthLoading(true);
    const { data, error } = await insforge.auth.getCurrentUser();
    if (data?.user) {
      setCurrentUser(data.user);
      await fetchOrCreateProfile(data.user);
    }
    setAuthLoading(false);
  }

  // Fetch or setup Profile matching current user
  async function fetchOrCreateProfile(user: any) {
    const { data, error } = await insforge.database
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setCurrentProfile(data);
      setProfileName(data.name || '');
      setProfileMobile(data.mobile_number || '');
      
      // Smart extraction of college name, address, and validity
      const colName = data.college_name || '';
      if (colName.includes('; Address: ')) {
        const parts = colName.split('; Address: ');
        setProfileCollege(parts[0]);
        if (parts[1].includes('; Validity: ')) {
          const subparts = parts[1].split('; Validity: ');
          setProfileCollegeAddress(subparts[0]);
          setProfileValidity(subparts[1]);
        } else {
          setProfileCollegeAddress(parts[1]);
          setProfileValidity('');
        }
      } else if (colName.includes(', ')) {
        const idx = colName.indexOf(', ');
        setProfileCollege(colName.substring(0, idx));
        setProfileCollegeAddress(colName.substring(idx + 2));
        setProfileValidity('');
      } else {
        setProfileCollege(colName);
        setProfileCollegeAddress('');
        setProfileValidity('');
      }

      // Smart extraction of student category
      if (data.branch === 'School Student') {
        setStudentCategory('School');
      } else if (data.semester === '1st Year' || data.semester === '2nd Year') {
        setStudentCategory('PUC / 11th-12th');
      } else {
        setStudentCategory('Engineering / College');
      }

      setProfileBranch(data.branch || '');
      setProfileSemester(data.semester || '');
      const urls = (data.id_card_url || '').split('|');
      setProfileIdCardUrl(urls[0] || '');
      setProfileIdCardBackUrl(urls[1] || '');
    } else {
      // Prompt user to complete profile initialization
      setCurrentProfile(null);
      
      // If we have previous ID scans stored in the Client-Side Table, populate using the latest sorted scans!
      const storedItem = localStorage.getItem('campuscart_ocr_scans_' + user.id);
      let localScans: any[] = [];
      try {
        localScans = storedItem ? JSON.parse(storedItem) : [];
      } catch {}

      if (localScans && localScans.length > 0) {
        // Sorted latest scan on top
        const latestScan = localScans[0];
        setProfileName(latestScan.name || user.name || '');
        setProfileCollege(latestScan.college || '');
        setProfileCollegeAddress(latestScan.collegeAddress || '');
        setStudentCategory(latestScan.category || 'Engineering / College');
        setProfileBranch(latestScan.branch || '');
        setProfileSemester(latestScan.semester || '');
        setProfileValidity(latestScan.validity || '');
        setProfileIdCardUrl(latestScan.frontUrl || '');
        setProfileIdCardBackUrl(latestScan.backUrl || '');
      } else {
        setProfileName(user.name || '');
        setProfileIdCardUrl('');
        setProfileIdCardBackUrl('');
        setProfileCollegeAddress('');
        setProfileValidity('');
        setStudentCategory('Engineering / College');
      }
    }
  }

  // Load user-scoped ID scan history whenever the active authenticated user session changes
  useEffect(() => {
    if (currentUser) {
      try {
        const stored = localStorage.getItem('campuscart_ocr_scans_' + currentUser.id);
        setScanHistory(stored ? JSON.parse(stored) : []);
      } catch (e) {
        setScanHistory([]);
      }
    } else {
      setScanHistory([]);
    }
  }, [currentUser]);

  // 2. Fetch all products on navigation to marketplace or when filters search parameters change
  useEffect(() => {
    if (currentUser) {
      fetchProducts();
    }
  }, [currentUser, navState, searchQuery, selectedCategory, selectedType]);

  // Set up real-time subscription once we have an active user session
  useEffect(() => {
    if (currentUser) {
      setupRealtimeChat();
    }
  }, [currentUser]);

  async function fetchProductsWithSellers(category?: string, type?: string): Promise<Product[]> {
    // Try relational join first
    try {
      let query = insforge.database
        .from('products')
        .select('*, seller:profiles(*)');

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data && data.length > 0 && data[0] && typeof data[0] === 'object' && 'seller' in data[0]) {
        return data as Product[];
      }
      if (error) {
        console.warn("Relational join query failed, using manual client fallback join:", error.message);
      }
    } catch (err: any) {
      console.warn("Catch exception in relational join, using manual client fallback join:", err);
    }

    // Manual fallback client join
    try {
      let query = insforge.database
        .from('products')
        .select('*');

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      const { data: productsData, error: productsError } = await query.order('created_at', { ascending: false });
      if (productsError || !productsData) {
        console.error("Manual fallback fetch products list failed:", productsError);
        return [];
      }

      const sellerIds = Array.from(new Set(productsData.map((p: any) => p.seller_id).filter(Boolean)));
      const profilesMap: { [id: string]: Profile } = {};

      if (sellerIds.length > 0) {
        const { data: profilesData, error: profilesError } = await insforge.database
          .from('profiles')
          .select('*')
          .in('id', sellerIds);

        if (!profilesError && profilesData) {
          profilesData.forEach((prof: any) => {
            profilesMap[prof.id] = prof;
          });
        }
      }

      const joined: Product[] = productsData.map((p: any) => ({
        ...p,
        seller: profilesMap[p.seller_id] || undefined
      }));

      return joined;
    } catch (err: any) {
      console.error("Relational join manual fallback failed completely:", err);
      return [];
    }
  }

  async function fetchProducts() {
    setProductsLoading(true);
    const data = await fetchProductsWithSellers(selectedCategory, selectedType);
    
    // Further filter with browser matching client side to solve complex ILIKE patterns safely
    let filtered = data;
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(queryLower) || 
        p.description.toLowerCase().includes(queryLower)
      );
    }
    setProducts(filtered);
    setProductsLoading(false);
  }

  // Handle active selected product details and compute ratings
  useEffect(() => {
    if (selectedProduct) {
      fetchSellerRatings(selectedProduct.seller_id);
    }
  }, [selectedProduct]);

  async function fetchSellerRatings(sellerId: string) {
    const { data, error } = await insforge.database
      .from('ratings')
      .select('*')
      .eq('seller_id', sellerId);

    if (!error && data) {
      setSelectedSellerRatings(data);
      if (data.length > 0) {
        const sumProduct = data.reduce((acc, curr) => acc + (curr.product_rating || 5), 0);
        const sumAttitude = data.reduce((acc, curr) => acc + (curr.attitude_rating || 5), 0);
        const sumBehavior = data.reduce((acc, curr) => acc + (curr.behavior_rating || 5), 0);
        const total = data.length;

        const avgProduct = sumProduct / total;
        const avgAttitude = sumAttitude / total;
        const avgBehavior = sumBehavior / total;
        const avgOverall = (avgProduct + avgAttitude + avgBehavior) / 3;

        setSellerAverageRating({
          avgOverall,
          avgProduct,
          avgAttitude,
          avgBehavior,
          total
        });
      } else {
        setSellerAverageRating({ avgOverall: 0, avgProduct: 0, avgAttitude: 0, avgBehavior: 0, total: 0 });
      }
    }
  }

  // Real-time Chat Subscription & Initialization
  async function setupRealtimeChat() {
    if (!currentUser) return;

    // Connect to the Socket Realtime room
    await insforge.realtime.connect();
    const channelName = `chat:user:${currentUser.id}`;
    
    const subRes = await insforge.realtime.subscribe(channelName);
    if (!subRes.ok) {
      console.error("Realtime subscription failed:", (subRes as any).error);
    }

    // Set up message arrival listener
    insforge.realtime.on('new-message', (payload: any) => {
      // Trigger instant refreshing of messages if the current tab is open
      if (activeThread && (
        (payload.sender_id === activeThread.otherProfile.id && payload.product_id === activeThread.product.id) || 
        (payload.receiver_id === activeThread.otherProfile.id && payload.product_id === activeThread.product.id)
      )) {
        setActiveChatMessages(prev => [...prev, payload]);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      // Re-trigger threads list load
      loadChatThreads();
      triggerToast(`New message from student regarding product "${payload.product_title || 'Campus Item'}"!`, 'info');
    });

    loadChatThreads();
  }

  // Load chat threads with product context
  async function loadChatThreads() {
    if (!currentUser) return;

    // Fetch all messages involving current user
    const { data: messagesData, error } = await insforge.database
      .from('messages')
      .select('*, sender:profiles(*)')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: true });

    if (error || !messagesData) return;

    // We also need all the products to correlate with threads
    const productsData = await fetchProductsWithSellers();

    if (!productsData || productsData.length === 0) {
      // Don't early-return blank if productsData is empty but items exist in database
      // Just keep going or back off
    }

    // Group messages by product_id + participant_id
    const groupedThreads: { [key: string]: {
      product: Product;
      otherProfile: Profile;
      messages: Message[];
      lastMessage: Message;
    } } = {};

    messagesData.forEach((msg: any) => {
      const isSender = msg.sender_id === currentUser.id;
      const otherId = isSender ? msg.receiver_id : msg.sender_id;
      const key = `${msg.product_id}:${otherId}`;

      const matchedProduct = (productsData as Product[]).find(p => p.id === msg.product_id);
      if (!matchedProduct) return; // ignore orphaned messages

      // Fetch other student's profile 
      const otherProf = isSender 
        ? matchedProduct.seller_id === otherId ? matchedProduct.seller : msg.sender // fallback
        : msg.sender; // Since sender is fetched in messages join

      // Ensure other profile is defined
      if (!otherProf) return;

      if (!groupedThreads[key]) {
        groupedThreads[key] = {
          product: matchedProduct,
          otherProfile: {
            id: otherProf.id,
            name: otherProf.name || 'Campus Peer',
            email: otherProf.email || '',
            mobile_number: otherProf.mobile_number || '',
            college_name: otherProf.college_name || '',
            branch: otherProf.branch || '',
            semester: otherProf.semester || '',
            id_card_url: otherProf.id_card_url || '',
            created_at: otherProf.created_at || '',
          },
          messages: [],
          lastMessage: msg
        };
      }

      groupedThreads[key].messages.push(msg);
      // Keep last message updated
      if (new Date(msg.created_at) > new Date(groupedThreads[key].lastMessage.created_at)) {
        groupedThreads[key].lastMessage = msg;
      }
    });

    const threadList = Object.values(groupedThreads).sort((a: any, b: any) => 
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );

    setThreads(threadList);

    // Maintain focus on active thread if open
    if (activeThread) {
      const updatedActive = threadList.find(t => 
        t.product.id === activeThread.product.id && 
        t.otherProfile.id === activeThread.otherProfile.id
      );
      if (updatedActive) {
        setActiveChatMessages(updatedActive.messages);
      }
    }
  }

  // Start new chat with product context
  function startProductChat(product: Product) {
    if (product.seller_id === currentUser.id) {
      triggerToast("You cannot start a chat with yourself!", "error");
      return;
    }

    const threadKey = `${product.id}:${product.seller_id}`;
    const existingThread = threads.find(t => t.product.id === product.id && t.otherProfile.id === product.seller_id);

    if (existingThread) {
      setActiveThread(existingThread);
      setActiveChatMessages(existingThread.messages);
    } else {
      // Create local temporary empty thread to start chatting
      const tempThread = {
        product,
        otherProfile: product.seller as Profile,
        messages: []
      };
      setActiveThread(tempThread);
      setActiveChatMessages([]);
    }
    
    setNavState('chats');
    setSelectedProduct(null); // close detail drawer
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
  }

  // Send Chat message
  async function sendChatMessage(e: FormEvent) {
    e.preventDefault();
    if (!chatMessageContent.trim() || !activeThread || !currentUser) return;

    const messageContent = chatMessageContent.trim();
    setChatMessageContent('');

    const targetReceiverId = activeThread.otherProfile.id;
    const targetProductId = activeThread.product.id;

    // 1. Persist message in postgres
    const { data, error } = await insforge.database
      .from('messages')
      .insert([
        {
          sender_id: currentUser.id,
          receiver_id: targetReceiverId,
          product_id: targetProductId,
          content: messageContent
        }
      ])
      .select();

    if (error) {
      triggerToast("Failed to send message: " + error.message, "error");
      return;
    }

    const savedMessage = data[0];

    // Append to active chat immediately for the sender
    setActiveChatMessages(prev => [...prev, savedMessage]);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    // 2. Publish via Realtime network so the receiver gets it instantly if online
    try {
      await insforge.realtime.publish(`chat:user:${targetReceiverId}`, 'new-message', {
        ...savedMessage,
        product_title: activeThread.product.title,
        sender_name: currentProfile?.name || 'Campus Peer'
      });
    } catch (err) {
      console.error("Realtime publish error:", err);
    }

    // Refresh threads list locally
    loadChatThreads();
  }

  // Image Upload helper for ID cards (Front side)
  async function handleIdCardFrontUpload(file: File) {
    if (!file) return;
    setIdCardUploading(true);
    const { data, error } = await insforge.storage.from('id-cards').uploadAuto(file);
    if (!error && data?.url) {
      setProfileIdCardUrl(data.url);
      triggerToast("College ID (Front Side) uploaded successfully!", "success");
      
      // Auto-trigger Gemini verification & OCR parser with the new front and current back (if any)
      await analyzeIdCardWithAI(data.url, profileIdCardBackUrl);
    } else {
      triggerToast("Front ID upload failed: " + (error?.message || "Unknown error"), "error");
    }
    setIdCardUploading(false);
  }

  // Image Upload helper for ID cards (Back side)
  async function handleIdCardBackUpload(file: File) {
    if (!file) return;
    setIdCardBackUploading(true);
    const { data, error } = await insforge.storage.from('id-cards').uploadAuto(file);
    if (!error && data?.url) {
      setProfileIdCardBackUrl(data.url);
      triggerToast("College ID (Back Side) uploaded successfully!", "success");
      
      // Auto-trigger Gemini verification & OCR parser with current front (if any) and the new back
      await analyzeIdCardWithAI(profileIdCardUrl, data.url);
    } else {
      triggerToast("Back ID upload failed: " + (error?.message || "Unknown error"), "error");
    }
    setIdCardBackUploading(false);
  }

  // Gemini secure ID Card OCR parsing for Front and Back sides
  async function analyzeIdCardWithAI(customFrontUrl?: string, customBackUrl?: string) {
    const activeFront = customFrontUrl || profileIdCardUrl;
    const activeBack = customBackUrl || profileIdCardBackUrl;

    if (!activeFront && !activeBack) {
      triggerToast("Please upload at least one side of your student ID card to run the AI scan.", "info");
      return;
    }

    setIsScanningId(true);
    setScanStatusStep("Extracting text from ID Card side(s)...");
    try {
      // Simulate real and organic scan steps for a tactile and reassuring feeling
      const timer1 = setTimeout(() => setScanStatusStep("Decrypting academic year and standard/grade qualification..."), 1200);
      const timer2 = setTimeout(() => setScanStatusStep("Locating Name, College credentials, and Campus Address details..."), 2600);

      const response = await fetch("/api/analyze-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontImageUrl: activeFront || undefined,
          backImageUrl: activeBack || undefined,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Server scan error");
      }

      const parsedResult = await response.json();
      
      if (parsedResult.detectedName) {
        setProfileName(parsedResult.detectedName);
      }
      if (parsedResult.collegeName) {
        setProfileCollege(parsedResult.collegeName);
      }
      if (parsedResult.collegeAddress) {
        setProfileCollegeAddress(parsedResult.collegeAddress);
      }
      if (parsedResult.studentCategory) {
        setStudentCategory(parsedResult.studentCategory as any);
      }
      if (parsedResult.branch) {
        setProfileBranch(parsedResult.branch);
      }
      if (parsedResult.semesterOrClass) {
        setProfileSemester(parsedResult.semesterOrClass);
      }
      if (parsedResult.validity) {
        setProfileValidity(parsedResult.validity);
      }

      // Check if ID card is finished and valid for current year
      const validityStatus = checkIDValidity(parsedResult.validity || '');
      if (!validityStatus.isValid) {
        triggerToast("⚠️ Student ID Validity Check: STUDENT ID NOT VALID for the present year (2026)!", "error");
      }

      // Store in scan history table
      const newScanRow = {
        id: "scan_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        scannedAt: new Date().toISOString(),
        name: parsedResult.detectedName || "",
        college: parsedResult.collegeName || "",
        collegeAddress: parsedResult.collegeAddress || "",
        category: parsedResult.studentCategory || "Engineering / College",
        branch: parsedResult.branch || "",
        semester: parsedResult.semesterOrClass || "",
        validity: parsedResult.validity || "",
        frontUrl: activeFront || "",
        backUrl: activeBack || "",
      };

      setScanHistory((prev) => {
        const updated = [newScanRow, ...prev].sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
        if (currentUser) {
          localStorage.setItem('campuscart_ocr_scans_' + currentUser.id, JSON.stringify(updated));
        } else {
          localStorage.setItem('campuscart_ocr_scans', JSON.stringify(updated));
        }
        return updated;
      });

      triggerToast("Verified! ID analyzed and all academic details auto-filled successfully.", "success");

    } catch (err: any) {
      console.error("AI Analysis error:", err);
      // Fallback message encouraging user to enter manually
      triggerToast("AI Scanner couldn't auto-read. Please feel free to fill in your academic details manually!", "info");
    } finally {
      setIsScanningId(false);
      setScanStatusStep("");
    }
  }

  // Image Upload helper for products
  async function handleProductImageUpload(file: File) {
    if (!file) return;
    setProductUploading(true);
    const { data, error } = await insforge.storage.from('products').uploadAuto(file);
    if (!error && data?.url) {
      setNewProductImgUrl(data.url);
      triggerToast("Product photo uploaded successfully!", "success");
    } else {
      triggerToast("Photo upload failed: " + (error?.message || "Unknown error"), "error");
    }
    setProductUploading(false);
  }

  // Creation/Updates profiles in postgres
  async function saveProfileData(e: FormEvent) {
    e.preventDefault();
    
    // Validate fields dynamically depending on selected category
    if (!profileName.trim()) {
      triggerToast("Please enter your official student name", "error");
      return;
    }
    if (!profileMobile.trim()) {
      triggerToast("Please enter your mobile contact number", "error");
      return;
    }
    if (!profileCollege.trim()) {
      triggerToast("Please enter your college or institution name", "error");
      return;
    }
    if (!profileIdCardUrl) {
      triggerToast("College ID picture is mandatory for registration", "error");
      return;
    }

    if (profileValidity.trim()) {
      const validityStatus = checkIDValidity(profileValidity);
      if (!validityStatus.isValid) {
        triggerToast("❌ STUDENT ID NOT VALID: This ID is expired/invalid for the present year (2026). Please upload a valid, active Student ID card!", "error");
        return;
      }
    }

    let finalBranch = "";
    let finalSemester = "";

    if (studentCategory === 'School') {
      if (!profileSemester.trim()) {
        triggerToast("Please enter your standard or class", "error");
        return;
      }
      finalBranch = "School Student";
      finalSemester = profileSemester.trim();
    } else if (studentCategory === 'PUC / 11th-12th') {
      if (!profileSemester.trim()) {
        triggerToast("Please state your PUC student year (1st or 2nd Year)", "error");
        return;
      }
      if (!profileBranch.trim()) {
        triggerToast("Please enter your combination/stream", "error");
        return;
      }
      finalBranch = profileBranch.trim();
      finalSemester = profileSemester.trim();
    } else {
      // Engineering / College
      if (!profileBranch.trim()) {
        triggerToast("Please enter your department or engineering branch", "error");
        return;
      }
      if (!profileSemester.trim()) {
        triggerToast("Please enter your current semester", "error");
        return;
      }
      finalBranch = profileBranch.trim();
      finalSemester = profileSemester.trim();
    }

    // Build compound college_name field containing both Name, Location and Validity
    let compositeCollegeName = profileCollege.trim();
    if (profileCollegeAddress.trim() || profileValidity.trim()) {
      compositeCollegeName += `; Address: ${profileCollegeAddress.trim()}`;
      if (profileValidity.trim()) {
        compositeCollegeName += `; Validity: ${profileValidity.trim()}`;
      }
    }

    // Compound front and back ID Card photo URLs
    const compositeIdCardUrl = profileIdCardBackUrl.trim()
      ? `${profileIdCardUrl.trim()}|${profileIdCardBackUrl.trim()}`
      : profileIdCardUrl.trim();

    const payload = {
      id: currentUser.id,
      name: profileName.trim(),
      email: currentUser.email,
      mobile_number: profileMobile.trim(),
      college_name: compositeCollegeName,
      branch: finalBranch,
      semester: finalSemester,
      id_card_url: compositeIdCardUrl
    };

    // Upsert into postgres public.profiles
    const { data, error } = await insforge.database
      .from('profiles')
      .upsert(payload)
      .select();

    if (!error && data) {
      setCurrentProfile(data[0]);
      setIsEditingProfile(false);
      triggerToast("Your college student profile is updated and active!", "success");
    } else {
      triggerToast("Failed to save profile: " + (error?.message || "Unknown error"), "error");
    }
  }

  // Creation of products listing
  async function handleCreateListing(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newPrice.trim()) {
      triggerToast("Please specify title, description and price", "error");
      return;
    }
    if (!newProductImgUrl) {
      triggerToast("Please upload a product listing picture", "error");
      return;
    }

    setListingLoading(true);

    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      triggerToast("Please specify a valid price details", "error");
      setListingLoading(false);
      return;
    }

    const payload = {
      seller_id: currentUser.id,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      type: newType,
      price: priceNum,
      rent_period: newType === 'rent' ? newRentPeriod : null,
      status: 'available',
      image_url: newProductImgUrl
    };

    const { data, error } = await insforge.database
      .from('products')
      .insert([payload])
      .select();

    if (!error && data) {
      triggerToast(`Product "${newTitle}" listed successfully for ${newType}!`, "success");
      // Reset listing form fields
      setNewTitle('');
      setNewDescription('');
      setNewCategory('Books');
      setNewPrice('');
      setNewType('sale');
      setNewProductImgUrl('');
      // Navigate back to marketplace
      setNavState('marketplace');
      fetchProducts();
    } else {
      triggerToast("Failed to list item: " + (error?.message || "Unknown error"), "error");
    }
    setListingLoading(false);
  }

  // Change product status (e.g. mark as sold or rent out)
  async function updateProductStatus(productId: string, newStatus: 'available' | 'sold' | 'rented') {
    const { data, error } = await insforge.database
      .from('products')
      .update({ status: newStatus })
      .eq('id', productId)
      .select();

    if (!error && data) {
      triggerToast(`Item status successfully listed as ${newStatus}!`, "success");
      fetchProducts();
      // Update selected project view if open
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct({ ...selectedProduct, status: newStatus });
      }
    } else {
      triggerToast("Status update failed: " + (error?.message || "Unknown error"), "error");
    }
  }

  // Simulation of purchasing/renting an item
  async function handleBuyOrRent(product: Product) {
    if (product.seller_id === currentUser.id) {
      triggerToast("You already own this item!", "error");
      return;
    }

    const targetStatus = product.type === 'sale' ? 'sold' : 'rented';

    // 1. Update status and save buyer_id in products table
    const { data, error } = await insforge.database
      .from('products')
      .update({ status: targetStatus, buyer_id: currentUser.id })
      .eq('id', product.id)
      .select();

    if (!error && data) {
      triggerToast(`Congratulations! You have successfully requested ${product.title} to ${product.type}.`, "success");
      fetchProducts();
      setSelectedProduct(null); // Close drawer
      // Open the Ratings popup modal for the user to leave transparent review on the seller and product
      setRatingProduct(product);
      setStarsProduct(5);
      setStarsAttitude(5);
      setStarsBehavior(5);
      setRatingComment('');
    } else {
      triggerToast("Transaction failed: " + (error?.message || "Unknown error"), "error");
    }
  }

  // Submitting detailed ratings for the seller
  async function submitSellerRating(e: FormEvent) {
    e.preventDefault();
    if (!ratingProduct) return;

    setRatingLoading(true);

    const payload = {
      buyer_id: currentUser.id,
      seller_id: ratingProduct.seller_id,
      product_id: ratingProduct.id,
      product_rating: starsProduct,
      attitude_rating: starsAttitude,
      behavior_rating: starsBehavior,
      comment: ratingComment.trim()
    };

    const { data, error } = await insforge.database
      .from('ratings')
      .insert([payload])
      .select();

    if (!error && data) {
      triggerToast("Thank you for your rating. This increases security on CampusCart!", "success");
      setRatingProduct(null);
      fetchProducts();
    } else {
      triggerToast("Failed to save rating: " + (error?.message || "Unknown error"), "error");
    }
    setRatingLoading(false);
  }

  // Remove listed items
  function handleRemoveProduct(productId: string, productTitle?: string) {
    const title = productTitle || products.find(p => p.id === productId)?.title || "this product";
    setProductToRemove({ id: productId, title });
  }

  async function handleRemoveProductConfirmed() {
    if (!productToRemove) return;
    const { data, error } = await insforge.database
      .from('products')
      .delete()
      .eq('id', productToRemove.id)
      .select();

    if (!error) {
      triggerToast(`"${productToRemove.title}" removed successfully`, "success");
      setSelectedProduct(null);
      setProductToRemove(null);
      fetchProducts();
    } else {
      triggerToast("Operation failed: " + (error?.message || "Unknown error"), "error");
    }
  }

  // Auth Functions

  // Sign up
  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    if (!emailInput || !passwordInput || !nameInput) {
      setAuthError("Email, password and name are required");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    const { data, error } = await insforge.auth.signUp({
      email: emailInput,
      password: passwordInput,
      name: nameInput
    });

    if (!error) {
      setAuthSuccess("Sign up successful! An authentication code was dispatched on your email address.");
      setAuthMode('verify-email');
    } else {
      setAuthError(error.message || "An unexpected issue occurred during sign up");
    }
    setAuthLoading(false);
  }

  // Sign in
  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setAuthError("Email and password are required");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    const { data, error } = await insforge.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput,
    });

    if (!error && data?.user) {
      if (data.user.emailVerified) {
        setCurrentUser(data.user);
        await fetchOrCreateProfile(data.user);
        triggerToast("Welcome back to CampusCart!", "success");
      } else {
        // Need verification
        setAuthSuccess("Your email address is pending verification. Enter the activation code sent to your inbox.");
        setAuthMode('verify-email');
      }
    } else {
      setAuthError(error?.message || "Invalid credentials");
    }
    setAuthLoading(false);
  }

  // Email verification with OTP code
  async function handleVerifyEmail(e: FormEvent) {
    e.preventDefault();
    if (!emailInput || !otpInput) {
      setAuthError("Email and 6-digit confirmation code are required");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    const { data, error } = await insforge.auth.verifyEmail({
      email: emailInput,
      otp: otpInput
    });

    if (!error && data?.user) {
      setCurrentUser(data.user);
      await fetchOrCreateProfile(data.user);
      setAuthSuccess(null);
      triggerToast("Email verified successfully! Welcome to the student community.", "success");
    } else {
      setAuthError(error?.message || "Verification code failed. Try resending code.");
    }
    setAuthLoading(false);
  }

  // Resend verification code
  async function handleResendVerification() {
    if (!emailInput) {
      setAuthError("Enter your email address first");
      return;
    }
    setAuthLoading(true);
    const { data, error } = await insforge.auth.resendVerificationEmail({
      email: emailInput
    });
    if (!error) {
      setAuthSuccess("New verification code dispatched to your student email.");
    } else {
      setAuthError(error.message || "Failed to resend code");
    }
    setAuthLoading(false);
  }

  // Send Reset Password code
  async function handleSendResetEmail(e: FormEvent) {
    e.preventDefault();
    if (!emailInput) {
      setAuthError("Email address is required");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    const { data, error } = await insforge.auth.sendResetPasswordEmail({
      email: emailInput
    });

    if (!error) {
      setAuthSuccess("Reset token sent to your email inbox!");
      setAuthMode('reset-password');
    } else {
      setAuthError(error.message || "Failed to request password reset code");
    }
    setAuthLoading(false);
  }

  // Reset password verification & setting new one
  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!emailInput || !otpInput || !passwordInput) {
      setAuthError("Email, 6-digit verification code, and new password are required");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    // 1. Exchange the code for server reset token
    const { data: exchangeData, error: exchangeError } = await insforge.auth.exchangeResetPasswordToken({
      email: emailInput,
      code: otpInput
    });

    if (exchangeError || !exchangeData?.token) {
      setAuthError(exchangeError?.message || "Invalid verification code");
      setAuthLoading(false);
      return;
    }

    // 2. Submit new password
    const { data, error } = await insforge.auth.resetPassword({
      newPassword: passwordInput,
      otp: exchangeData.token
    });

    if (!error) {
      setAuthSuccess("Your password has been successfully reset! Access your account below.");
      setAuthMode('sign-in');
      setPasswordInput('');
    } else {
      setAuthError(error.message || "Failed to update security credentials.");
    }
    setAuthLoading(false);
  }

  // Log out
  async function handleSignOut() {
    await insforge.auth.signOut();
    setCurrentUser(null);
    setCurrentProfile(null);
    setNavState('marketplace');
    
    // Clear all profile and form states to ensure clean slate for subsequent users
    setProfileIdCardUrl('');
    setProfileIdCardBackUrl('');
    setProfileName('');
    setProfileCollege('');
    setProfileCollegeAddress('');
    setProfileBranch('');
    setProfileSemester('');
    setProfileMobile('');
    setScanHistory([]);
    
    triggerToast("Signed out. See you soon around campus!", "info");
  }


  // RENDER LOADING SPINNER FOR BOOTSTRAP CHECK
  if (authLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center items-center">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mb-4" />
        <h1 className="text-xl font-bold font-sans text-stone-800">CampusCart Loading...</h1>
        <p className="text-stone-500 text-sm mt-1">Connecting to authenticated student node</p>
      </div>
    );
  }

  // RENDER ONBOARDING SYSTEM FOR NON-AUTHENTICATED STUDENTS
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-4 md:p-8 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200/60 p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
          
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-2 shadow-inner">
              <ShoppingBag className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 id="campuscart-logo" className="text-2xl font-extrabold tracking-tight text-stone-900 flex items-center gap-1.5">
              CampusCart <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">Premium</span>
            </h1>
            <p className="text-stone-500 text-xs mt-1 text-center font-medium max-w-[280px]">
              Secure Student P2P Buy, Sell & Rent marketplace
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5 text-xs animate-pulse">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-xl flex items-start gap-2.5 text-xs">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* SIGN IN VIEW */}
          {authMode === 'sign-in' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Student Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@university.edu" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">Secret Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setAuthError(null); setAuthSuccess(null); setAuthMode('forgot-password'); }}
                    className="text-xs text-emerald-600 font-bold hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="Enter secure password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-500 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {authLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Access Marketplace"}
              </button>

              <div className="pt-4 border-t border-stone-100 text-center">
                <span className="text-stone-500 text-xs font-medium">New student to CampusCart?</span>{' '}
                <button 
                  type="button" 
                  onClick={() => { setAuthError(null); setAuthSuccess(null); setAuthMode('sign-up'); }}
                  className="text-xs text-emerald-600 font-bold hover:underline"
                >
                  Create Student Account
                </button>
              </div>
            </form>
          )}

          {/* SIGN UP VIEW */}
          {authMode === 'sign-up' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Your Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rachel Green" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Student Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@university.edu" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Secret Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Minimum 6 characters" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-500 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {authLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Register Student Credentials"}
              </button>

              <div className="pt-4 border-t border-stone-100 text-center">
                <span className="text-stone-500 text-xs font-medium">Already have an account?</span>{' '}
                <button 
                  type="button" 
                  onClick={() => { setAuthError(null); setAuthSuccess(null); setAuthMode('sign-in'); }}
                  className="text-xs text-emerald-600 font-bold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {authMode === 'forgot-password' && (
            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div className="flex items-center gap-1.5 text-stone-600 font-bold mb-4">
                <button 
                  type="button" 
                  onClick={() => { setAuthError(null); setAuthSuccess(null); setAuthMode('sign-in'); }}
                  className="hover:text-stone-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-sm">Back to Login</span>
              </div>

              <h2 className="text-lg font-bold text-stone-900 leading-tight">Password Reset Verification</h2>
              <p className="text-stone-500 text-xs leading-relaxed">
                Provide your student email below. We'll dispatch a 6-digit verification code to reset custody of your password.
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Registered Student Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@university.edu" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-500 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {authLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Send Reset Verification Code"}
              </button>
            </form>
          )}

          {/* RESET PASSWORD SETTING VIEW */}
          {authMode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <h2 className="text-lg font-bold text-stone-900 leading-tight">Define Your New Password</h2>
              <p className="text-stone-500 text-xs leading-relaxed">
                Check your inbox for the reset code and declare your updated marketplace password.
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Verify Student Email</label>
                <input 
                  type="email" 
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">6-Digit Reset Token Code</label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  placeholder="e.g. 123456" 
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-900 text-sm text-center font-mono font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">New Secure Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Min 6 characters" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-500 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {authLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Save New Password"}
              </button>
            </form>
          )}

          {/* EMAIL VERIFICATION REQUIRED OTP SCREEN */}
          {authMode === 'verify-email' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="flex flex-col items-center py-2">
                <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center animate-bounce mb-3">
                  <ShieldAlert className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-stone-900 text-center">Verify Student Domain</h2>
                <p className="text-center text-stone-500 text-xs mt-1 leading-relaxed max-w-xs">
                  We sent a 6-digit activation code to <br/>
                  <strong className="text-stone-800 font-semibold">{emailInput}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider text-center mb-2">Instant Authentication Code</label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  placeholder="0 0 0 0 0 0" 
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-900 text-xl font-bold tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner bg-stone-50"
                />
              </div>

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-500 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {authLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Verify & Activate Account"}
              </button>

              <div className="pt-2 flex justify-between items-center text-xs text-stone-500 font-medium">
                <span>Didn't get the email?</span>
                <button 
                  type="button" 
                  onClick={handleResendVerification}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  Resend Code
                </button>
              </div>

              <div className="pt-2 border-t border-stone-100 text-center">
                <button 
                  type="button" 
                  onClick={() => { setAuthError(null); setAuthSuccess(null); setAuthMode('sign-in'); }}
                  className="text-xs text-stone-500 font-bold hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    );
  }

  const profile_colName = currentProfile?.college_name || '';
  let legacyValidity = '';
  if (profile_colName.includes('; Validity: ')) {
    legacyValidity = profile_colName.split('; Validity: ')[1] || '';
  }
  const isProfileValid = currentProfile ? checkIDValidity(legacyValidity).isValid : true;

  // RENDER INTERACTION: MANDATORY ONE-TIME PROFILE SETUP
  if (!currentProfile || !currentProfile.id_card_url || !isProfileValid || isEditingProfile) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-emerald-150 selection:text-emerald-950">
        <div className="w-full max-w-2xl bg-white rounded-3xl border border-stone-200/60 p-6 md:p-8 shadow-xl relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-3xl" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-stone-900 leading-tight">
                {(!isProfileValid) ? "Renew Expired Student ID" : (isEditingProfile ? "Update Campus Info" : "Complete Verified Profile")}
              </h1>
              <p className="text-stone-500 text-xs mt-0.5">
                {(!isProfileValid) ? "Your registered ID is expired or not valid for the present year (2026)" : (isEditingProfile ? "Keep your student listings linked accurately" : "Mandatory student authorization before listing & chatting")}
              </p>
            </div>
          </div>

          {/* WARNING FOR EXPIRED/INVALID ID ACCESS BLOCK */}
          {!isProfileValid && (
            <div className="mb-6 rounded-2xl bg-rose-50 border-2 border-rose-200 p-5 flex items-start gap-3.5 shadow-xs">
              <div className="h-10 w-10 shrink-0 bg-rose-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm">
                ⚠️
              </div>
              <div className="space-y-1">
                <h4 className="text-rose-950 font-black text-xs uppercase tracking-wider">STUDENT ID NOT VALID</h4>
                <p className="text-[11.5px] text-rose-700 leading-normal font-medium">
                  Your current registered Student ID Card ({legacyValidity}) has expired and is not valid for the present academic period. To reactivate access and continue using CampusCart services, you must upload a valid, active Student ID card.
                </p>
              </div>
            </div>
          )}

          {/* APP INTRODUCTION INTRO */}
          <div className="bg-gradient-to-br from-stone-905 to-stone-900 text-white rounded-2xl p-5 md:p-6 mb-6 border border-stone-800 shadow-sm relative overflow-hidden bg-stone-900">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-black tracking-tight flex items-center gap-2">
                  <span>Welcome to CampusCart</span>
                  <span className="text-[9px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">Verified Gated Access</span>
                </h2>
                <p className="text-[11px] text-stone-300 leading-relaxed font-sans">
                  CampusCart is an exclusive, safe marketplace for your institution. Trade, buy, or rent pre-loved textbooks, lab calculators, sports items, dorm gears, and cycles with verified campus students. 
                </p>
                <p className="text-xs text-emerald-400 font-bold bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20 mt-2">
                  ⚡ AI Instant Scanner: Attach your Student ID Card first! Our server-side AI model will automatically read the card, verifying your student status and auto-filling your name, college, and address instantly!
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={saveProfileData} className="space-y-6">

            {/* MANDATORY ID CARD IMAGE UPLOADER WITH BOTH FRONT AND BACK COVERAGE AND AI SCANNING */}
            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-5 md:p-6 relative overflow-hidden transition-all duration-300">
              
              {isScanningId && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-25 flex flex-col items-center justify-center p-4 text-center">
                  <div className="relative mb-4 flex items-center justify-center animate-bounce">
                    <div className="h-14 w-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                    <Sparkles className="h-6 w-6 text-emerald-600 absolute" />
                  </div>
                  <h4 className="text-stone-900 font-extrabold text-xs uppercase tracking-widest">Running AI OCR Smart Multi-Side Scanner</h4>
                  <p className="text-[11px] text-emerald-800 font-semibold tracking-wide mt-2 bg-emerald-50 border border-emerald-250 px-4 py-2 rounded-xl max-w-md shadow-xs">{scanStatusStep}</p>
                  <p className="text-[9px] text-stone-400 mt-2">Integrating and reading both front and back of your ID card for full qualification mapping...</p>
                </div>
              )}

              <div className="text-center mb-4">
                <div className="inline-flex h-9 w-9 bg-emerald-500/10 text-emerald-600 rounded-full items-center justify-center mb-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-xs font-black text-stone-800 uppercase tracking-widest">Step 1: Upload Student ID Card Photos (Front & Back)</h3>
                <p className="text-stone-500 text-[11px] mt-1 max-w-md mx-auto leading-normal">
                  Upload both sides for the most accurate extraction. Our server-side AI model will parse and auto-fill your Name, College, Address, and Academic Qualification!
                </p>
              </div>

              {/* TWO COLUMN GRID FOR FRONT & BACK UPLOAD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* FRONT SIDE */}
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFront(true);
                  }}
                  onDragLeave={() => {
                    setIsDraggingFront(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFront(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      if (file.type.startsWith("image/")) {
                        handleIdCardFrontUpload(file);
                      } else {
                        triggerToast("Please drop a valid image file for the Front Side.", "error");
                      }
                    }
                  }}
                  className={`bg-white border rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                    isDraggingFront 
                      ? 'border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-500/10 scale-[1.02]' 
                      : 'border-stone-200/60 hover:border-emerald-500/40'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full mb-2">Front Side image</span>
                  
                  {profileIdCardUrl ? (
                    <div className="space-y-2 flex flex-col items-center">
                      <img 
                        src={profileIdCardUrl} 
                        alt="ID Card Front" 
                        referrerPolicy="no-referrer"
                        className="h-24 w-auto rounded-lg object-contain border border-stone-100 shadow-sm"
                      />
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-extrabold">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Front Side Uploaded</span>
                      </div>
                      <label className="text-[10px] font-bold text-stone-500 py-1 px-2.5 bg-stone-100 rounded-md hover:bg-stone-200 transition-all cursor-pointer">
                        Replace Front
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => e.target.files?.[0] && handleIdCardFrontUpload(e.target.files[0])} 
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="py-2 flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center border mb-2 transition-all ${isDraggingFront ? 'bg-emerald-100 border-emerald-300' : 'bg-stone-50 border-stone-100'}`}>
                        <Upload className={`h-4 w-4 ${isDraggingFront ? 'text-emerald-600' : 'text-stone-400'}`} />
                      </div>
                      <p className="text-[11px] text-stone-400 font-medium mb-3">Upload or Drop Front Side of ID</p>
                      
                      <label className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[11px] font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
                        {idCardUploading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        <span>{idCardUploading ? "Uploading..." : "Choose Front Image"}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          disabled={idCardUploading}
                          onChange={(e) => e.target.files?.[0] && handleIdCardFrontUpload(e.target.files[0])} 
                        />
                      </label>
                    </div>
                  )}
                </div>
 
                {/* BACK SIDE */}
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingBack(true);
                  }}
                  onDragLeave={() => {
                    setIsDraggingBack(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingBack(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      if (file.type.startsWith("image/")) {
                        handleIdCardBackUpload(file);
                      } else {
                        triggerToast("Please drop a valid image file for the Back Side.", "error");
                      }
                    }
                  }}
                  className={`bg-white border rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                    isDraggingBack 
                      ? 'border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-500/10 scale-[1.02]' 
                      : 'border-stone-200/60 hover:border-emerald-500/40'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full mb-2">Back Side image</span>
                  
                  {profileIdCardBackUrl ? (
                    <div className="space-y-2 flex flex-col items-center">
                      <img 
                        src={profileIdCardBackUrl} 
                        alt="ID Card Back" 
                        referrerPolicy="no-referrer"
                        className="h-24 w-auto rounded-lg object-contain border border-stone-100 shadow-sm"
                      />
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-extrabold">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Back Side Uploaded</span>
                      </div>
                      <label className="text-[10px] font-bold text-stone-500 py-1 px-2.5 bg-stone-100 rounded-md hover:bg-stone-200 transition-all cursor-pointer">
                        Replace Back
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => e.target.files?.[0] && handleIdCardBackUpload(e.target.files[0])} 
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="py-2 flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center border mb-2 transition-all ${isDraggingBack ? 'bg-emerald-100 border-emerald-300' : 'bg-stone-50 border-stone-100'}`}>
                        <Upload className={`h-4 w-4 ${isDraggingBack ? 'text-emerald-600' : 'text-stone-400'}`} />
                      </div>
                      <p className="text-[11px] text-stone-400 font-medium mb-3">Upload or Drop Back Side of ID</p>
                      
                      <label className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[11px] font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
                        {idCardBackUploading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        <span>{idCardBackUploading ? "Uploading..." : "Choose Back Image"}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          disabled={idCardBackUploading}
                          onChange={(e) => e.target.files?.[0] && handleIdCardBackUpload(e.target.files[0])} 
                        />
                      </label>
                    </div>
                  )}
                </div>

              </div>

              {/* DYNAMIC SCAN ACTION TRIGGER AND STATUS ACCENT */}
              {(profileIdCardUrl || profileIdCardBackUrl) && (
                <div className="mt-4 pt-4 border-t border-stone-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/40 -mx-5 -mb-5 p-4 rounded-b-3xl">
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                      <span>AI Student Scanner is authorized</span>
                    </p>
                    <p className="text-[10px] text-stone-500">Provide both sides to extract Address & precise Academic levels accurately.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => analyzeIdCardWithAI()}
                    disabled={isScanningId}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] tracking-wide uppercase rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:bg-stone-400"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-100" />
                    <span>⚡ Run AI Scan & Autofill</span>
                  </button>
                </div>
              )}

            </div>

            {/* REGISTERED SCAN HISTORY & AUTOHISTORY TABLE */}
            {scanHistory && scanHistory.length > 0 && (
              <div className="bg-white border border-stone-200/60 rounded-3xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                    <span>College ID Auto-Fill Scan History ({scanHistory.length})</span>
                  </h4>
                  <span className="text-[10px] text-stone-400 font-semibold italic">Sorted: Latest scans first</span>
                </div>
                
                <div className="overflow-x-auto rounded-xl border border-stone-150 max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-stone-50 border-b border-stone-200 sticky top-0 text-[9px] font-bold text-stone-500 uppercase tracking-widest">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-16">Action</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">College / University</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Stream / Branch</th>
                        <th className="py-2.5 px-3">Semester</th>
                        <th className="py-2.5 px-3">Campus Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {scanHistory.map((scan) => (
                        <tr 
                          key={scan.id} 
                          onClick={() => {
                            setProfileName(scan.name);
                            if (scan.college) {
                              setProfileCollege(scan.college);
                            }
                            if (scan.collegeAddress) {
                              setProfileCollegeAddress(scan.collegeAddress);
                            }
                            if (scan.category) {
                              setStudentCategory(scan.category);
                            }
                            if (scan.branch) {
                              setProfileBranch(scan.branch);
                            }
                            if (scan.semester) {
                              setProfileSemester(scan.semester);
                            }
                            if (scan.frontUrl) {
                              setProfileIdCardUrl(scan.frontUrl);
                            }
                            if (scan.backUrl) {
                              setProfileIdCardBackUrl(scan.backUrl);
                            }
                            triggerToast(`Autofilled with "${scan.name}" scan record!`, "success");
                          }}
                          className="hover:bg-emerald-50/40 cursor-pointer transition-all border-b border-stone-150/60 text-stone-800"
                        >
                          <td className="py-2 px-3 text-center">
                            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-250 px-1.5 py-0.5 rounded shadow-2xs hover:bg-emerald-100 transition-all">
                              Autofill
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-stone-900 whitespace-nowrap">{scan.name || "N/A"}</td>
                          <td className="py-2 px-3 text-stone-700 font-semibold truncate max-w-[140px]">{scan.college || "N/A"}</td>
                          <td className="py-2 px-3 text-stone-500 font-medium whitespace-nowrap">{scan.category || "N/A"}</td>
                          <td className="py-2 px-3 text-stone-600 whitespace-nowrap">{scan.branch || "N/A"}</td>
                          <td className="py-2 px-3 text-stone-600 whitespace-nowrap">{scan.semester || "N/A"}</td>
                          <td className="py-2 px-3 text-stone-500 truncate max-w-[120px]">{scan.collegeAddress || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-stone-400 font-medium text-center bg-stone-50 py-1.5 rounded-lg border border-stone-150">
                  💡 <b>Pro-Tip:</b> Clicking any scanned row in the table above instantly populates and normalizes all text fields automatically.
                </p>
              </div>
            )}

            {/* STEP 2: CHOOSE PHASE CATEGORY */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider text-center">Step 2: Choose Your Current Academic Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['School', 'PUC / 11th-12th', 'Engineering / College'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setStudentCategory(cat);
                    }}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      studentCategory === cat
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold shadow-sm'
                        : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300 font-bold'
                    }`}
                  >
                    <div className="text-[11px] tracking-tight">{cat}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 3: FORMS AND DETECTED DETAILS */}
            <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-5 md:p-6 space-y-4">
              <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-2 border-b border-stone-200 pb-2 mb-2">
                <User className="h-4 w-4 text-emerald-600" />
                <span>Step 3: Confirm Details & Verify Academic Stage</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">Official Student Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="Auto-filled via AI on ID scan"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">Primary Student Email address</label>
                  <input 
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-400 text-sm font-medium focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">Mobile Contact Number</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={profileMobile}
                    onChange={(e) => setProfileMobile(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">College / Institution Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="Auto-filled via AI on ID scan"
                    value={profileCollege}
                    onChange={(e) => setProfileCollege(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5 font-sans">College / School Address</label>
                  <input 
                    type="text"
                    placeholder="Auto-filled address / city of campus"
                    value={profileCollegeAddress}
                    onChange={(e) => setProfileCollegeAddress(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                    <span>ID Card Validity / Expiry / Year Range</span>
                    {profileValidity.trim() && (
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${checkIDValidity(profileValidity).isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {checkIDValidity(profileValidity).isValid ? 'Valid ID Active' : 'Invalid Date'}
                      </span>
                    )}
                  </label>
                  <input 
                    type="text"
                    readOnly
                    placeholder="Auto-filled dynamically on ID Card scan"
                    value={profileValidity}
                    className={`w-full px-4 py-2.5 border rounded-xl text-stone-900 text-sm focus:outline-none bg-stone-100 cursor-not-allowed transition-all ${
                      profileValidity.trim() && !checkIDValidity(profileValidity).isValid 
                        ? 'border-rose-300' 
                        : 'border-stone-200'
                    }`}
                  />
                  
                  {/* DISPLAY THE EXACT USER MANDATE ALERT SCREEN IF EXPIRED OR NOT VALID FOR PRESENT YEAR */}
                  {profileValidity.trim() && !checkIDValidity(profileValidity).isValid && (
                    <div className="mt-3 rounded-xl bg-rose-50 border-2 border-rose-200 p-4 animate-pulse flex items-start gap-3">
                      <div className="h-8 w-8 shrink-0 bg-rose-500 text-white rounded-lg flex items-center justify-center font-black text-sm">
                        ⚠️
                      </div>
                      <div>
                        <h4 className="text-rose-900 font-extrabold text-[13px] tracking-wide uppercase">STUDENT ID NOT VALID</h4>
                        <p className="text-[11px] text-rose-700 font-semibold mt-1">
                          {checkIDValidity(profileValidity).reason || "This student ID card is expired/finished and is not valid for the present year (2026)."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* DYNAMIC SCHOOL QUESTIONS */}
                {studentCategory === 'School' && (
                  <div className="md:col-span-2 transition-all duration-300">
                    <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1.5 bg-emerald-50 inline-block px-2.5 py-1 rounded">Required: Standard or Class</label>
                    <input 
                      type="text"
                      required
                      placeholder="Enter standard or particular class (e.g. 9th Standard, Class 7-A)"
                      value={profileSemester}
                      onChange={(e) => setProfileSemester(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-emerald-500/30 rounded-xl text-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                )}

                {/* DYNAMIC PUC QUESTIONS */}
                {studentCategory === 'PUC / 11th-12th' && (
                  <>
                    <div className="transition-all duration-300">
                      <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1.5 bg-emerald-50 inline-block px-2.5 py-1 rounded">Required: PUC Year</label>
                      <select
                        required
                        value={profileSemester}
                        onChange={(e) => setProfileSemester(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-emerald-500/30 rounded-xl text-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="">-- Choose PUC Year --</option>
                        <option value="1st Year">1st Year (11th Grade)</option>
                        <option value="2nd Year">2nd Year (12th Grade)</option>
                      </select>
                    </div>

                    <div className="transition-all duration-300">
                      <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1.5 bg-emerald-50 inline-block px-2.5 py-1 rounded">Combinations & Branch</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. PCMC, HEBA, Commerce"
                        value={profileBranch}
                        onChange={(e) => setProfileBranch(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-emerald-500/30 rounded-xl text-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </>
                )}

                {/* DYNAMIC ENGINEERING / COLLEGE QUESTIONS */}
                {studentCategory === 'Engineering / College' && (
                  <>
                    <div className="transition-all duration-300">
                      <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1.5 bg-emerald-50 inline-block px-2.5 py-1 rounded">Engineering Branch / Dept</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Computer Science & Eng, Mechanical"
                        value={profileBranch}
                        onChange={(e) => setProfileBranch(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-emerald-500/30 rounded-xl text-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>

                    <div className="transition-all duration-300">
                      <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1.5 bg-emerald-50 inline-block px-2.5 py-1 rounded">Current Semester</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. 5th Semester, 1st Semester"
                        value={profileSemester}
                        onChange={(e) => setProfileSemester(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-emerald-500/30 rounded-xl text-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </>
                )}

              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {isEditingProfile && (
                <button 
                  type="button" 
                  onClick={() => setIsEditingProfile(false)}
                  className="px-5 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit"
                disabled={idCardUploading || isScanningId}
                className="px-6 py-2.5 bg-stone-950 hover:bg-stone-900 disabled:bg-stone-400 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {isEditingProfile ? "Update Student Profile" : "Activate Verified Access"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // CORE APPLICATION INTERFACE (VERIFIED STUDENTS ONLY)
  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Toast Notification Box */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold max-w-sm border transition-all animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
            : toast.type === 'error' 
              ? 'bg-rose-50 border-rose-200 text-rose-950' 
              : 'bg-indigo-50 border-indigo-200 text-indigo-950'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
          {toast.type === 'info' && <MessageSquare className="h-5 w-5 text-indigo-600 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200/50 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            
            {/* Logo Brand */}
            <button 
              onClick={() => { setNavState('marketplace'); setSelectedProduct(null); }}
              className="flex items-center gap-2 text-stone-950 font-sans cursor-pointer focus:outline-none"
            >
              <div className="h-9 w-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-stone-900">
                CampusCart
              </span>
            </button>

            {/* Global Search Bar (Only visible in marketplace) */}
            {navState === 'marketplace' && (
              <div className="flex-1 max-w-md relative hidden sm:block">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center">
                  <Search className="h-4 w-4 text-stone-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search textbook name, lab coats, bicycle..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-semibold py-2.5 pl-10 pr-4 bg-stone-50 hover:bg-stone-100 focus:bg-white border border-stone-200 focus:border-stone-400 rounded-xl text-stone-900 focus:ring-0 focus:outline-none transition-all duration-150"
                />
              </div>
            )}

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => { setNavState('marketplace'); setSelectedProduct(null); }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  navState === 'marketplace' 
                    ? 'bg-stone-950 text-white shadow-sm' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden md:inline">Buy & Rent</span>
              </button>

              <button 
                onClick={() => { setNavState('chats'); setSelectedProduct(null); }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  navState === 'chats' 
                    ? 'bg-stone-950 text-white shadow-sm' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden md:inline">My Chats</span>
                {threads.length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </button>

              <button 
                onClick={() => { setNavState('list-item'); setSelectedProduct(null); }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  navState === 'list-item' 
                    ? 'bg-stone-950 text-white shadow-sm' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                <span>List Item</span>
              </button>

              {/* Profile Icon / Settings dropdown */}
              <button 
                onClick={() => { setNavState('dashboard'); setSelectedProduct(null); }}
                className={`p-1.5 rounded-xl transition-all border flex items-center gap-1.5 cursor-pointer ${
                  navState === 'dashboard' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                    : 'border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <div className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {currentProfile?.name?.charAt(0) || <User className="h-3 w-3" />}
                </div>
                <span className="text-xs font-bold pr-1 hidden sm:inline">{currentProfile?.name || "Profile"}</span>
              </button>
            </nav>

          </div>
        </div>
      </header>

      {/* MAIN BODY LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        
        {/* VIEW 1: MARKETPLACE */}
        {navState === 'marketplace' && (
          <div className="space-y-6">
            
            {/* Mobile Filter & Search Bar */}
            <div className="space-y-3 sm:hidden">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search className="h-4 w-4 text-stone-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search listings..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs py-2.5 pl-9 pr-4 bg-white border border-stone-200 focus:border-stone-400 rounded-xl text-stone-950 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Filter Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200/55 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    selectedType === 'all' 
                      ? 'bg-stone-900 text-white' 
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setSelectedType('sale')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    selectedType === 'sale' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  For Sale
                </button>
                <button
                  onClick={() => setSelectedType('rent')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    selectedType === 'rent' 
                      ? 'bg-sky-50 text-sky-800 border border-sky-100' 
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  For Rent
                </button>
              </div>

              {/* Categorization scroll box */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    selectedCategory === 'all' 
                      ? 'bg-stone-900 text-white' 
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  All Categories
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedCategory !== 'all' || selectedType !== 'all' || searchQuery) && (
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold bg-stone-100 py-2 px-4 rounded-xl">
                <span>
                  Filter active: {selectedType !== 'all' ? `[Type: ${selectedType}]` : ''} {selectedCategory !== 'all' ? `[Category: ${selectedCategory}]` : ''} {searchQuery ? `[Query: "${searchQuery}"]` : ''}
                </span>
                <button 
                  onClick={() => { setSelectedCategory('all'); setSelectedType('all'); setSearchQuery(''); }}
                  className="text-stone-800 font-bold hover:underline"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Grid of Product Cards */}
            {productsLoading ? (
              <div className="min-h-[300px] flex justify-center items-center">
                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="min-h-[350px] bg-white rounded-3xl border border-stone-200/50 flex flex-col justify-center items-center p-8 text-center shadow-inner">
                <ShoppingBag className="h-12 w-12 text-stone-300 mb-3" />
                <h3 className="text-lg font-bold text-stone-900">No used student listings found</h3>
                <p className="text-stone-500 text-sm max-w-sm mt-1 leading-relaxed">
                  Be the first one surrounding this category to offer high quality used textbooks, lab instruments, or bicycle rentals!
                </p>
                <button 
                  onClick={() => setNavState('list-item')}
                  className="mt-4 px-4 py-2 bg-stone-950 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-stone-900 transition-all"
                >
                  Add First Listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => {
                  const isAvailable = product.status === 'available';
                  return (
                    <div 
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`group bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer relative ${
                        isAvailable ? 'border-stone-200/60' : 'border-stone-200/40 opacity-80'
                      }`}
                    >
                      {/* Product Status Badges */}
                      <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm bg-stone-900 text-white">
                        {product.category}
                      </span>

                      {currentUser && product.seller_id === currentUser.id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveProduct(product.id, product.title);
                          }}
                          className="absolute top-3 right-3 z-30 p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer border border-rose-100/50 shadow-md transition-all flex items-center justify-center gap-1.5"
                          title="Remove Listing"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {!isAvailable && (
                        <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs z-20 flex items-center justify-center">
                          <span className="bg-rose-600 border border-rose-300 text-white px-4 py-2 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg ring-4 ring-rose-600/25">
                            {product.status === 'sold' ? "SOLD OUT" : "RENTED OUT"}
                          </span>
                        </div>
                      )}

                      {/* Product Image Stage */}
                      <div className="aspect-[4/3] bg-stone-50 overflow-hidden relative border-b border-stone-100 flex items-center justify-center">
                        {getProductImageUrl(product) ? (
                          <img 
                            src={getProductImageUrl(product)} 
                            alt={product.title} 
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const placeholderEl = e.currentTarget.parentElement?.querySelector('.fallback-placeholder-span');
                              if (placeholderEl) {
                                placeholderEl.classList.remove('hidden');
                              }
                            }}
                          />
                        ) : null}
                        
                        <div className={`fallback-placeholder-span absolute inset-0 flex flex-col items-center justify-center bg-stone-100 text-stone-400 ${getProductImageUrl(product) ? 'hidden' : ''}`}>
                          <ShoppingBag className="h-10 w-10 text-stone-300 mb-1" />
                          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">No Image Uploaded</span>
                        </div>
                        
                        {/* Transaction Type Marker */}
                        <div className="absolute bottom-2.5 right-2.5 z-10">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider leading-none shadow-md ${
                            product.type === 'rent'
                              ? 'bg-sky-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {product.type === 'rent' ? 'For Rent' : 'For Sale'}
                          </span>
                        </div>
                      </div>

                      {/* Info Panel */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-lg font-black text-emerald-700 tracking-tight">
                              ₹{product.price}
                              {product.type === 'rent' && (
                                <span className="text-xs font-bold text-stone-500 capitalize">
                                  /{product.rent_period}
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-bold text-stone-900 mt-1.5 tracking-tight line-clamp-1 group-hover:text-emerald-700 transition-colors">
                            {product.title}
                          </h4>
                          
                          <p className="text-stone-500 text-xs mt-1 leading-relaxed line-clamp-2">
                            {product.description}
                          </p>
                        </div>

                        {/* Seller detailed signature bar */}
                        <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-extrabold text-[10px] uppercase">
                              {product.seller?.name?.charAt(0) || <User className="h-3 w-3" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold text-stone-800 truncate leading-tight">
                                {product.seller?.name || 'Campus Student'}
                              </span>
                              <span className="text-[9px] text-stone-500 truncate leading-none mt-0.5">
                                {product.seller?.branch || 'N/A'} • Sem {product.seller?.semester || 'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Seller rating score representation */}
                          {product.seller && (
                            <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              <span className="text-[10px] font-black text-stone-700">
                                {product.seller_id === currentUser.id ? "Me" : "Verified"}
                              </span>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ACTIVE MESSAGING SYSTEM */}
        {navState === 'chats' && (
          <div className="bg-white border border-stone-200/70 rounded-3xl shadow-md overflow-hidden min-h-[580px] grid grid-cols-1 md:grid-cols-12">
            
            {/* Conversation Threads (Left Rail) - 4 Cols */}
            <div className={`md:col-span-4 border-r border-stone-200/60 flex flex-col max-h-[580px] ${
              activeThread ? 'hidden md:flex' : 'flex'
            }`}>
              <div className="p-4 border-b border-stone-100">
                <h2 className="text-base font-black text-stone-900 tracking-tight">Gated In-App Messages</h2>
                <p className="text-stone-500 text-[10px] leading-relaxed">Direct connection with verified sellers & buyers</p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-stone-150">
                {threads.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 flex flex-col items-center justify-center h-full">
                    <MessageSquare className="h-10 w-10 text-stone-200 mb-2" />
                    <span className="text-xs font-semibold text-stone-500">No student negotiations yet</span>
                    <p className="text-[10px] text-stone-400 mt-1 max-w-[180px] leading-relaxed">
                      Find an item in the marketplace and click "Contact Seller" to start.
                    </p>
                  </div>
                ) : (
                  threads.map((thread) => {
                    const isSelected = activeThread && 
                      thread.product.id === activeThread.product.id && 
                      thread.otherProfile.id === activeThread.otherProfile.id;
                    const lastMsg = thread.lastMessage;
                    const isSentByMe = lastMsg.sender_id === currentUser.id;

                    return (
                      <button
                        key={`${thread.product.id}:${thread.otherProfile.id}`}
                        onClick={() => {
                          setActiveThread(thread);
                          setActiveChatMessages(thread.messages);
                          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
                        }}
                        className={`w-full text-left p-4 flex gap-3 transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-50/75 border-l-4 border-emerald-600' : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-stone-100 overflow-hidden border relative flex items-center justify-center">
                          {getProductImageUrl(thread.product) ? (
                            <img 
                              src={getProductImageUrl(thread.product)} 
                              alt={thread.product.title} 
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const placeholderEl = e.currentTarget.parentElement?.querySelector('.fallback-placeholder-span');
                                if (placeholderEl) {
                                  placeholderEl.classList.remove('hidden');
                                }
                              }}
                            />
                          ) : null}
                          <div className={`fallback-placeholder-span absolute inset-0 flex items-center justify-center bg-stone-150 text-stone-400 text-[8px] font-black uppercase text-center ${getProductImageUrl(thread.product) ? 'hidden' : ''}`}>
                            No Image
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-xs font-black text-stone-900 truncate">
                              {thread.otherProfile.name}
                            </span>
                            <span className="text-[9px] text-stone-400 font-bold shrink-0">
                              {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <span className="text-[10px] font-bold text-emerald-800 line-clamp-1 mt-0.5">
                            {thread.product.title}
                          </span>

                          <p className="text-[11px] text-stone-500 line-clamp-1 mt-1 leading-tight font-medium">
                            <strong className="text-stone-700 font-semibold">{isSentByMe ? "You: " : ""}</strong>
                            {lastMsg.content}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Conversation Active Room Workspace (Right Rail) - 8 Cols */}
            <div className={`md:col-span-8 flex flex-col justify-between max-h-[580px] bg-stone-50/30 ${
              !activeThread ? 'hidden md:flex items-center justify-center p-8' : 'flex'
            }`}>
              {activeThread ? (
                <>
                  {/* Chat Header inside Workspace */}
                  <div className="p-4 bg-white border-b border-stone-200/50 flex items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Back button on mobile */}
                      <button 
                        onClick={() => setActiveThread(null)}
                        className="md:hidden p-1.5 hover:bg-stone-100 rounded-lg text-stone-600"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>

                      {/* Product contextual anchor bar */}
                      <div className="h-9 w-9 bg-stone-100 rounded-lg overflow-hidden shrink-0 border flex items-center justify-center relative">
                        {getProductImageUrl(activeThread.product) ? (
                          <img 
                            src={getProductImageUrl(activeThread.product)} 
                            alt={activeThread.product.title} 
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const placeholderEl = e.currentTarget.parentElement?.querySelector('.fallback-placeholder-span');
                              if (placeholderEl) {
                                placeholderEl.classList.remove('hidden');
                              }
                            }}
                          />
                        ) : null}
                        <div className={`fallback-placeholder-span absolute inset-0 flex items-center justify-center bg-stone-150 text-stone-400 text-[8px] font-black uppercase text-center ${getProductImageUrl(activeThread.product) ? 'hidden' : ''}`}>
                          N/A
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-stone-900 leading-tight flex items-center gap-1.5">
                          {activeThread.otherProfile.name}
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </h3>
                        <p className="text-[10px] text-stone-500 truncate mt-0.5 leading-none">
                          Item: <strong className="text-emerald-805 font-bold">{activeThread.product.title}</strong> (₹{activeThread.product.price})
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      {activeThread.otherProfile?.id_card_url && (
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] text-stone-550 font-black tracking-wider uppercase mb-0.5">Verified ID Card</span>
                          <img 
                            src={activeThread.otherProfile.id_card_url} 
                            alt={`${activeThread.otherProfile.name} Student ID`} 
                            referrerPolicy="no-referrer"
                            className="h-9 w-14 object-contain rounded border border-stone-250 cursor-pointer shadow-sm hover:scale-110 transition-transform duration-200"
                            onClick={() => window.open(activeThread.otherProfile.id_card_url, '_blank')}
                            title="Click to inspect college ID card"
                          />
                        </div>
                      )}
                      <span className="text-[10px] uppercase font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl">
                        {activeThread.otherProfile.branch || 'Student'}
                      </span>
                    </div>
                  </div>

                  {/* Messaging History Container */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    
                    {/* Security campus reminder notification */}
                    <div className="bg-emerald-50 border border-emerald-100/60 text-emerald-950 p-3 rounded-2xl flex gap-2.5 text-xs font-semibold leading-relaxed">
                      <ShieldAlert className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span>Campus Gated Safety Protocol Verified</span>
                        <p className="text-[10px] text-emerald-800 font-medium">
                          Negotiating on-campus? Review credentials, contact matching numbers, and transact in public campus squares.
                        </p>
                      </div>
                    </div>

                    {activeChatMessages.map((msg, idx) => {
                      const isMe = msg.sender_id === currentUser.id;
                      return (
                        <div 
                          key={msg.id || idx}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative leading-relaxed ${
                            isMe 
                              ? 'bg-stone-900 text-white rounded-tr-none' 
                              : 'bg-white text-stone-900 border border-stone-200/60 rounded-tl-none'
                          }`}>
                            <p>{msg.content}</p>
                            <span className={`block text-[8px] mt-1 text-right font-medium tracking-wide ${
                              isMe ? 'text-stone-300' : 'text-stone-400'
                            }`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Message Form submission box */}
                  <form onSubmit={sendChatMessage} className="p-4 bg-white border-t border-stone-200/50 flex gap-2">
                    <input 
                      type="text"
                      required
                      placeholder={`Draft message to ${activeThread.otherProfile.name}...`}
                      value={chatMessageContent}
                      onChange={(e) => setChatMessageContent(e.target.value)}
                      className="flex-1 text-xs px-4 py-2.5 border border-stone-200 hover:border-stone-300 focus:border-stone-400 rounded-xl text-stone-900 focus:outline-none bg-stone-50/50"
                    />
                    <button 
                      type="submit"
                      className="px-4 bg-stone-950 hover:bg-stone-800 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="p-8 text-center text-stone-400 flex flex-col items-center justify-center h-full">
                  <MessageSquare className="h-14 w-14 text-stone-200 mb-3 animate-pulse" />
                  <h3 className="text-md font-bold text-stone-900">Workspace Isolated</h3>
                  <p className="text-stone-500 text-xs mt-1 max-w-xs leading-relaxed font-semibold">
                    Select any conversation thread from the left rail to resume real-time verified university chat!
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 3: PRODUCT LISTING CREATOR */}
        {navState === 'list-item' && (
          <div className="max-w-2xl mx-auto bg-white border border-stone-200/70 rounded-3xl p-6 md:p-8 shadow-md">
            <div className="flex items-center gap-2 mb-6">
              <PlusCircle className="h-6 w-6 text-emerald-600" />
              <div>
                <h2 className="text-lg font-black text-stone-900">List Your Campus Item</h2>
                <p className="text-stone-500 text-xs">Instantly connect with student buyers or potential renting inquiries</p>
              </div>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Product Title / Heading</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Engineering Mathematics Volume 2 (Excellent Condition)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-950 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Detailed Description</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Provide details about condition, usage time, semester relevancy, or ideal meeting spots for exchange."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-950 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Category Select</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-950 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Listing Transaction Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewType('sale')}
                      className={`py-2.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                        newType === 'sale'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'border-stone-200 text-stone-600 bg-white hover:bg-stone-50'
                      }`}
                    >
                      Sell Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('rent')}
                      className={`py-2.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                        newType === 'rent'
                          ? 'bg-sky-50 border-sky-500 text-sky-850'
                          : 'border-stone-200 text-stone-600 bg-white hover:bg-stone-50'
                      }`}
                    >
                      Rent Item
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                    {newType === 'sale' ? "Selling Price (₹)" : "Base Rental Price (₹)"}
                  </label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    placeholder="e.g. 500"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-950 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {newType === 'rent' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Rent Period Frequency</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['day', 'week', 'month'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewRentPeriod(p)}
                          className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                            newRentPeriod === p
                              ? 'bg-sky-50 border-sky-500 text-sky-850'
                              : 'border-stone-200 text-stone-600 bg-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PRODUCT IMAGE SECTION */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div className="h-9 w-9 bg-white rounded-full border border-stone-150 flex items-center justify-center shadow-inner mb-2">
                    <Upload className="h-4 w-4 text-emerald-600 animate-pulse" />
                  </div>
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Product Listing Image</h3>
                  <p className="text-stone-500 text-[11px] max-w-sm mt-0.5 leading-relaxed">
                    Provide a visual photo of the listed item. You can upload a file, paste an image link, or pick from our high-fidelity student templates.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Option A: Upload or Enter URL */}
                  <div className="space-y-3">
                    <div>
                      <span className="block text-[10px] font-black text-stone-500 uppercase tracking-wide mb-1.5">Option 1: Upload Photo File</span>
                      <label className="inline-flex px-4 py-2 bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 rounded-xl text-xs font-extrabold shadow-xs cursor-pointer transition-all gap-1.5 items-center">
                        {productUploading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-600" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5 text-stone-500" />
                            <span>Select Local File</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          disabled={productUploading}
                          onChange={(e) => e.target.files?.[0] && handleProductImageUpload(e.target.files[0])} 
                        />
                      </label>
                    </div>

                    <div>
                      <span className="block text-[10px] font-black text-stone-500 uppercase tracking-wide mb-1.5">Option 2: Direct Image Link</span>
                      <input 
                        type="url"
                        placeholder="https://example.com/item-photo.jpg"
                        value={newProductImgUrl}
                        onChange={(e) => setNewProductImgUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-stone-900 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Option B: Match Campus Presets */}
                  <div className="border-t md:border-t-0 md:border-l border-stone-200/80 pt-4 md:pt-0 md:pl-4 space-y-2">
                    <span className="block text-[10px] font-black text-stone-500 uppercase tracking-wide">Option 3: Quick Campus Templates</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: '📚 Study Books', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=350' },
                        { label: '💻 Electronics', url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=350' },
                        { label: '🔬 Lab Tool/Coat', url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=350' },
                        { label: '🚲 Cycle/Rider', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=350' },
                        { label: '🎒 Sports Gear', url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=350' },
                        { label: '🎨 Stationery', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=350' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setNewProductImgUrl(preset.url);
                            triggerToast(`Applied local ${preset.label} preview sample!`, "info");
                          }}
                          className={`py-1.5 px-2 bg-white hover:bg-stone-50 border rounded-lg text-[10px] font-bold text-left transition-all truncate flex items-center gap-1.5 cursor-pointer ${
                            newProductImgUrl === preset.url 
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                              : 'border-stone-200 text-stone-700'
                          }`}
                        >
                          <span className="truncate">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Preview Display */}
                {newProductImgUrl && (
                  <div className="pt-3 border-t border-stone-200/60 flex items-center gap-3 bg-white p-3 rounded-xl">
                    <img 
                      src={newProductImgUrl} 
                      alt="Listing preview" 
                      className="h-16 w-20 object-cover rounded-lg border border-stone-150 shadow-sm shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] font-extrabold text-stone-900 truncate">Image Preview Loaded Successfully</span>
                      <span className="block text-[10px] text-stone-500 truncate leading-tight mt-0.5">{newProductImgUrl}</span>
                      <button 
                        type="button"
                        onClick={() => setNewProductImgUrl('')}
                        className="text-[9px] font-bold text-rose-600 hover:underline mt-1 block"
                      >
                        Reset Image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
                <button
                  type="button"
                  onClick={() => setNavState('marketplace')}
                  className="px-5 py-2.5 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold shadow-sm hover:bg-stone-50 cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={listingLoading || productUploading}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-850 disabled:bg-stone-400 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {listingLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <CheckCircle className="h-4 w-4" />}
                  <span>List Campus Item Now</span>
                </button>
              </div>

            </form>
          </div>
        )}

        {/* VIEW 4: MY DASHBOARD */}
        {navState === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Student Profile Overview Card */}
            <div className="bg-white border border-stone-200/60 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 shrink-0">
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 text-xs font-bold border border-stone-200 hover:bg-stone-50 text-stone-800 rounded-xl shadow-sm cursor-pointer transition-all flex items-center gap-1.5 bg-white"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Bio details signature */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
                <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-2xl uppercase border-2 border-emerald-300 shadow-md transform hover:rotate-3 transition-transform duration-200">
                  {currentProfile?.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">{currentProfile?.name}</h2>
                  <p className="text-stone-500 text-xs mt-0.5 font-medium">{currentProfile?.email}</p>
                  
                  {/* Detailed branch semesters info */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mt-3">
                    <span className="px-2.5 py-1 bg-stone-100 border border-stone-200 text-stone-800 text-[10px] font-extrabold rounded-lg">
                      {currentProfile?.college_name ? currentProfile.college_name.split('; ')[0] : ''}
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-lg">
                      {currentProfile?.branch}
                    </span>
                    <span className="px-2.5 py-1 bg-sky-50 border border-sky-100 text-sky-850 text-[10px] font-extrabold rounded-lg">
                      Semester {currentProfile?.semester}
                    </span>
                    {currentProfile?.college_name?.includes('; Validity: ') && (
                      <span className={`px-2.5 py-1 border text-[10px] font-extrabold rounded-lg ${checkIDValidity(currentProfile.college_name.split('; Validity: ')[1]).isValid ? 'bg-indigo-50 border-indigo-100 text-indigo-800' : 'bg-rose-50 border-rose-100 text-rose-750 font-black'}`}>
                        Validity: {currentProfile.college_name.split('; Validity: ')[1]}
                      </span>
                    )}
                  </div>

                  {currentProfile?.mobile_number && (
                    <div className="flex items-center justify-center md:justify-start gap-1 text-[11px] font-semibold text-stone-600 mt-2">
                      <Phone className="h-3.5 w-3.5 text-stone-400" />
                      <span>{currentProfile.mobile_number}</span>
                    </div>
                  )}

                </div>
              </div>

              {/* Gated verification sticker & Ratings average details */}
              <div className="text-center md:text-right shrink-0 flex flex-col items-center md:items-end gap-3 pt-4 md:pt-0">
                {(() => {
                  const dashboardValidity = currentProfile?.college_name?.includes('; Validity: ')
                    ? currentProfile.college_name.split('; Validity: ')[1]
                    : '';
                  const isDashboardValid = checkIDValidity(dashboardValidity).isValid;
                  
                  return !isDashboardValid ? (
                    <div className="flex items-center gap-1.5 text-rose-750 bg-rose-50 border-2 border-rose-350 py-1.5 px-3 rounded-full text-[11px] font-black uppercase tracking-wider animate-pulse shadow-sm">
                      <span className="text-rose-500 font-extrabold">⚠️</span>
                      <span>STUDENT ID NOT VALID</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-full text-[11px] font-black uppercase tracking-wider">
                      <CheckCircle className="h-4 w-4" />
                      <span>Student ID Verified</span>
                    </div>
                  );
                })()}
                
                {/* ID Thumbnail Preview */}
                {currentProfile?.id_card_url && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-bold">Linked College ID:</span>
                    <img 
                      src={currentProfile.id_card_url} 
                      alt="Student ID Preview" 
                      className="h-8 w-12 object-cover rounded-md border border-stone-250 cursor-zoom-in"
                      onClick={() => window.open(currentProfile.id_card_url, '_blank')}
                      title="View full ID document"
                    />
                  </div>
                )}
                
                <button 
                  onClick={handleSignOut}
                  className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100/50 py-1 px-3 rounded-lg hover:bg-rose-100 hover:text-rose-700 transition"
                >
                  Log out
                </button>
              </div>

            </div>

            {/* Dashboard Gated Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Product selling/renting metrics (Seller Area) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-150 pb-2">
                  <h3 className="text-sm font-black text-stone-900 tracking-tight flex items-center gap-1.5">
                    <ThumbsUp className="h-4 w-4 text-emerald-600" />
                    <span>My Offerings & Listed Items</span>
                  </h3>
                  <span className="text-stone-500 font-bold text-xs">
                    {products.filter(p => p.seller_id === currentUser.id).length} Active Listings
                  </span>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {products.filter(p => p.seller_id === currentUser.id).length === 0 ? (
                    <div className="py-8 text-center text-stone-400 bg-white rounded-2xl border border-stone-150 flex flex-col items-center">
                      <ShoppingBag className="h-8 w-8 text-stone-250 mb-2" />
                      <span className="text-xs font-semibold text-stone-500">You are not selling anything yet</span>
                    </div>
                  ) : (
                    products.filter(p => p.seller_id === currentUser.id).map((p) => {
                      const isAvailable = p.status === 'available';
                      return (
                        <div key={p.id} className="bg-white border border-stone-200/50 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm relative">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 bg-stone-100 rounded-xl overflow-hidden shrink-0 border border-stone-150 relative flex items-center justify-center">
                              {getProductImageUrl(p) ? (
                                <img 
                                  src={getProductImageUrl(p)} 
                                  alt={p.title} 
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const placeholderEl = e.currentTarget.parentElement?.querySelector('.fallback-placeholder-span');
                                    if (placeholderEl) {
                                      placeholderEl.classList.remove('hidden');
                                    }
                                  }}
                                />
                              ) : null}
                              <div className={`fallback-placeholder-span absolute inset-0 flex items-center justify-center bg-stone-150 text-stone-400 text-[8px] font-black uppercase text-center ${getProductImageUrl(p) ? 'hidden' : ''}`}>
                                N/A
                              </div>
                              {!isAvailable && (
                                <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center z-10">
                                  <span className="text-[8px] text-white font-bold tracking-widest uppercase">
                                    {p.status}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-extrabold text-stone-900 truncate tracking-tight">{p.title}</h4>
                              <p className="text-[10px] text-emerald-800 font-bold mt-0.5">
                                ₹{p.price} <span className="text-[9px] text-stone-500">({p.type})</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isAvailable ? (
                              <button
                                onClick={() => updateProductStatus(p.id, p.type === 'rent' ? 'rented' : 'sold')}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-100 text-[10px] font-black rounded-lg cursor-pointer"
                              >
                                Mark Sold
                              </button>
                            ) : (
                              <button
                                onClick={() => updateProductStatus(p.id, 'available')}
                                className="px-2.5 py-1 bg-sky-50 text-sky-850 hover:bg-sky-100 border border-sky-100 text-[10px] font-black rounded-lg cursor-pointer"
                              >
                                Relist Available
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleRemoveProduct(p.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer border border-rose-100/50"
                              title="Delete Item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Gated purchases & rentals section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-150 pb-2">
                  <h3 className="text-sm font-black text-stone-900 tracking-tight flex items-center gap-1.5">
                    <Bookmark className="h-4 w-4 text-emerald-600" />
                    <span>My Purchased & Rented Goods</span>
                  </h3>
                  <span className="text-stone-500 font-bold text-xs">
                    {products.filter(p => p.buyer_id === currentUser.id).length} Items Received
                  </span>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {products.filter(p => p.buyer_id === currentUser.id).length === 0 ? (
                    <div className="py-8 text-center text-stone-400 bg-white rounded-2xl border border-stone-150 flex flex-col items-center">
                      <Bookmark className="h-8 w-8 text-stone-250 mb-2" />
                      <span className="text-xs font-semibold text-stone-500">No purchases or active rentals found</span>
                    </div>
                  ) : (
                    products.filter(p => p.buyer_id === currentUser.id).map((p) => {
                      return (
                        <div key={p.id} className="bg-white border border-stone-200/50 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm relative">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 bg-stone-100 rounded-xl overflow-hidden shrink-0 border border-stone-150 flex items-center justify-center relative">
                              {getProductImageUrl(p) ? (
                                <img 
                                  src={getProductImageUrl(p)} 
                                  alt={p.title} 
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const placeholderEl = e.currentTarget.parentElement?.querySelector('.fallback-placeholder-span');
                                    if (placeholderEl) {
                                      placeholderEl.classList.remove('hidden');
                                    }
                                  }}
                                />
                              ) : null}
                              <div className={`fallback-placeholder-span absolute inset-0 flex items-center justify-center bg-stone-150 text-stone-400 text-[8px] font-black uppercase text-center ${getProductImageUrl(p) ? 'hidden' : ''}`}>
                                N/A
                              </div>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-extrabold text-stone-900 truncate tracking-tight">{p.title}</h4>
                              <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
                                Verified Seller: <strong className="text-stone-850 font-bold">{p.seller?.name || 'Peer Student'}</strong>
                              </p>
                            </div>
                          </div>

                          <div>
                            <button
                              onClick={() => {
                                setRatingProduct(p);
                                setStarsProduct(5);
                                setStarsAttitude(5);
                                setStarsBehavior(5);
                                setRatingComment('');
                              }}
                              className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-black rounded-lg cursor-pointer shadow-sm flex items-center gap-1 animate-pulse"
                            >
                              <Star className="h-3 w-3 fill-amber-305 text-amber-305" />
                              <span>Rate Seller</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-stone-200/50 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-stone-400 text-xs">
            © 2026 CampusCart Premium Applet. All rights reserved. Secured and managed under Gated Student LDAP Domain. Powered by InsForge.
          </p>
        </div>
      </footer>

      {/* LIGHTBOX DRAWER 1: SELECTED MARKETPLACE PRODUCT DETAILS */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative animate-fade-in">
            
            {/* Close Button overlay */}
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-4 z-10 p-1.5 bg-white/80 border hover:bg-white rounded-full text-stone-700 shadow-md transition"
            >
              <X className="h-4.5 w-4.5 font-bold" />
            </button>

            {/* Stage product view */}
            <div className="aspect-[16/9] bg-stone-100 overflow-hidden relative flex items-center justify-center">
              {getProductImageUrl(selectedProduct) ? (
                <img 
                  src={getProductImageUrl(selectedProduct)} 
                  alt={selectedProduct.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const placeholderEl = e.currentTarget.parentElement?.querySelector('.fallback-placeholder-span');
                    if (placeholderEl) {
                      placeholderEl.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <div className={`fallback-placeholder-span absolute inset-0 flex flex-col items-center justify-center bg-stone-100/50 text-stone-500 ${getProductImageUrl(selectedProduct) ? 'hidden' : ''}`}>
                <ShoppingBag className="h-12 w-12 text-stone-300 mb-2" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-stone-400">No Custom Photo Uploaded</span>
              </div>
              <div className="absolute bottom-4 left-4 flex gap-1.5 z-10">
                <span className="px-3 py-1 bg-stone-950/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                  Price: ₹{selectedProduct.price} {selectedProduct.type === 'rent' ? `/${selectedProduct.rent_period}` : ''}
                </span>
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider uppercase">
                  Category: {selectedProduct.category}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <h3 className="text-lg font-black text-stone-950 leading-tight tracking-tight">{selectedProduct.title}</h3>
                <p className="text-xs text-stone-500 mt-2 font-semibold">Listed on: {new Date(selectedProduct.created_at).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-stone-600 text-sm mt-3 leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
              </div>

              {/* Verified Seller Campus coordinates section */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col sm:flex-row justify-between gap-4 shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Seller Coordinates</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-sm uppercase">
                      {selectedProduct.seller?.name?.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-black text-stone-900 leading-none">
                        {selectedProduct.seller?.name || 'Verified Students'}
                      </span>
                      <p className="text-[10px] text-stone-500 mt-0.5 font-medium leading-none">
                        {selectedProduct.seller?.college_name} • {selectedProduct.seller?.branch}
                      </p>
                    </div>
                  </div>
                  
                  {selectedProduct.seller?.mobile_number && (
                    <div className="flex items-center gap-1.5 text-stone-600 font-semibold text-[11px] mt-3">
                      <Phone className="h-3.5 w-3.5 text-stone-400" />
                      <span>{selectedProduct.seller.mobile_number}</span>
                    </div>
                  )}

                  {/* Compulsory Seller Student ID Card Display */}
                  {selectedProduct.seller?.id_card_url ? (
                    <div className="mt-3 bg-white p-2 border border-stone-200 rounded-xl shadow-xs">
                      <div className="text-[9px] font-black uppercase text-emerald-800 tracking-wider mb-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified Student ID Card
                      </div>
                      <img 
                        src={selectedProduct.seller.id_card_url} 
                        alt={`${selectedProduct.seller.name}'s Student ID`}
                        referrerPolicy="no-referrer"
                        className="h-20 w-32 object-cover rounded-lg border border-stone-150 shadow-inner bg-stone-50 cursor-zoom-in hover:scale-105 transition-transform duration-200"
                        onClick={() => window.open(selectedProduct.seller?.id_card_url, '_blank')}
                        title="Click to view full student ID card"
                      />
                    </div>
                  ) : (
                    <div className="mt-3 bg-rose-50 text-rose-800 p-2 text-[10px] font-bold rounded-lg border border-rose-100 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>No Student ID attached</span>
                    </div>
                  )}
                </div>

                {/* Ratings aggregation container */}
                <div className="sm:text-right flex flex-col justify-between items-start sm:items-end">
                  <div>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Seller Reputation</span>
                    <div className="flex items-center gap-1 mt-1.5">
                      {sellerAverageRating.total > 0 ? (
                        <>
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          <span className="text-sm font-black text-stone-900 leading-none">
                            {sellerAverageRating.avgOverall.toFixed(1)} <span className="text-[10px] font-bold text-stone-400">({sellerAverageRating.total} ratings)</span>
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-stone-500">Unrated Peer</span>
                      )}
                    </div>
                  </div>

                  {sellerAverageRating.total > 0 && (
                    <div className="flex flex-col text-[10px] text-stone-500 font-semibold mt-2 space-y-0.5">
                      <span>Item Quality: {sellerAverageRating.avgProduct.toFixed(1)}/5.0</span>
                      <span>Product behavior: {sellerAverageRating.avgBehavior.toFixed(1)}/5.0</span>
                      <span>Sellers' Attitude: {sellerAverageRating.avgAttitude.toFixed(1)}/5.0</span>
                    </div>
                  )}
                </div>

              </div>
              
              {/* Product detailed reviews area */}
              {selectedSellerRatings.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-150">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Detailed Feedback Log</h4>
                  <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-1">
                    {selectedSellerRatings.map((rat) => (
                      <div key={rat.id} className="p-2.5 bg-stone-50/50 border border-stone-150 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between font-bold text-[10px]">
                          <span className="text-stone-700">Buyer review</span>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span>{((rat.product_rating + rat.attitude_rating + rat.behavior_rating)/3).toFixed(1)}</span>
                          </div>
                        </div>
                        {rat.comment && <p className="text-stone-600 font-medium">{rat.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Detail Drawer Bottom Action buttons */}
            <div className="p-4 bg-stone-50 border-t border-stone-200/50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="px-5 py-2 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>

              {selectedProduct.seller_id === currentUser.id ? (
                <button 
                  onClick={() => handleRemoveProduct(selectedProduct.id)}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remove Listing</span>
                </button>
              ) : selectedProduct.status === 'available' ? (
                <>
                  <button 
                    onClick={() => startProductChat(selectedProduct)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Contact Seller to Deal</span>
                  </button>
                </>
              ) : (
                <button 
                  disabled
                  className="px-5 py-2 bg-stone-300 text-stone-500 rounded-xl text-xs font-bold cursor-not-allowed uppercase"
                >
                  Not Available
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* POPUP LIGHTBOX MODAL 2: RATE THE TRANSACTION / SELLER FEEDBACK */}
      {ratingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 relative animate-fade-in space-y-5">
            <div>
              <h3 className="text-base font-black text-stone-950 leading-tight">Rate Seller & Product</h3>
              <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                Provide transparent feedback with campus peers for transaction on <br/>
                <strong className="text-emerald-800 font-bold">"{ratingProduct.title}"</strong>.
              </p>
            </div>

            <form onSubmit={submitSellerRating} className="space-y-4">
              
              {/* Product or item quality stars */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Product Quality (1-5 Stars)</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(starIdx => (
                    <button
                      key={starIdx}
                      type="button"
                      onClick={() => setStarsProduct(starIdx)}
                      className="p-1 focus:outline-none"
                    >
                      <Star className={`h-6 w-6 transition-all ${
                        starIdx <= starsProduct ? 'fill-amber-500 text-amber-500 scale-105' : 'text-stone-300'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Seller's attitude stars */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Seller's Attitude & Cooperativeness (1-5 Stars)</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(starIdx => (
                    <button
                      key={starIdx}
                      type="button"
                      onClick={() => setStarsAttitude(starIdx)}
                      className="p-1 focus:outline-none"
                    >
                      <Star className={`h-6 w-6 transition-all ${
                        starIdx <= starsAttitude ? 'fill-amber-500 text-amber-500 scale-105' : 'text-stone-300'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Communication/Behavior stars */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Sellers' Overall Behavior (1-5 Stars)</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(starIdx => (
                    <button
                      key={starIdx}
                      type="button"
                      onClick={() => setStarsBehavior(starIdx)}
                      className="p-1 focus:outline-none"
                    >
                      <Star className={`h-6 w-6 transition-all ${
                        starIdx <= starsBehavior ? 'fill-amber-500 text-amber-500 scale-105' : 'text-stone-300'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">Add Comment (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Transparent review, item is exactly as described!"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl text-stone-950 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setRatingProduct(null)}
                  className="px-4 py-2 border border-stone-200 text-stone-750 text-xs font-bold rounded-xl hover:bg-stone-50 transition cursor-pointer"
                >
                  Skip Feedback
                </button>
                <button
                  type="submit"
                  disabled={ratingLoading}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-850 text-white text-xs font-black rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {ratingLoading ? <Loader2 className="h-3 w-3 animate-spin"/> : <CheckCircle className="h-3.5 w-3.5" />}
                  <span>Submit Quality Log</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* POPUP LIGHTBOX MODAL 3: DELETE CONFIRMATION */}
      {productToRemove && (
        <div className="fixed inset-0 z-55 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-stone-900">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-stone-250 shadow-2xl p-6 relative space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            
            <div className="text-center">
              <h3 className="text-sm font-black text-stone-950">Remove Listing?</h3>
              <p className="text-stone-500 text-xs mt-1.5 leading-relaxed">
                Are you sure you want to completely remove <strong className="text-stone-800 font-bold">"{productToRemove.title}"</strong> from CampusCart? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToRemove(null)}
                className="flex-1 py-1.5 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl hover:bg-stone-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveProductConfirmed}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

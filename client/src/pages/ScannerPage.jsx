import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  X,
  IndianRupee,
  Layers,
  Calendar,
  Check,
  Package,
  Trash2,
  ShoppingBag,
  Info
} from 'lucide-react';
import { visionService } from '../services/visionService';
import { usePantry } from '../context/PantryContext';
import { getQuickFutureDate } from '../utils/dateUtils';
import { AvocadoDoodle, LemonDoodle, SparkleStarDoodle } from '../components/common/KawaiiDoodles';

const CATEGORIES = [
  'Produce',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Bakery',
  'Pantry & Grains',
  'Canned & Packaged',
  'Snacks & Sweets',
  'Beverages',
  'Frozen',
  'Condiments & Spices',
  'Other'
];

const STORAGE_LOCATIONS = ['Fridge', 'Freezer', 'Pantry', 'Countertop'];
const COMMON_UNITS = ['pcs', 'kg', 'g', 'liters', 'ml', 'packs', 'cans', 'loaves', 'bottles', 'boxes', 'bunch'];

export const ScannerPage = () => {
  const { addItem } = usePantry();

  // Image states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);

  // Detected multi-item list state
  const [detectedItems, setDetectedItems] = useState([]);

  // Batch saving states
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(null);

  // Live Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // File input refs
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Convert File to base64 Data URL and load preview
  const handleFileProcess = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setScanError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setScanError('Image file size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    setScanError(null);
    setDetectedItems([]);
    setSaveSuccessBanner(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setSelectedImage(dataUrl);
      setImagePreview(dataUrl);
    };
    reader.onerror = () => {
      setScanError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Start live webcam modal
  const handleStartCamera = async () => {
    setScanError(null);
    setIsCameraOpen(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsCameraOpen(false);
        if (nativeCameraInputRef.current) {
          nativeCameraInputRef.current.click();
        }
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('[ScannerPage] getUserMedia failed or was rejected:', err);
      setIsCameraOpen(false);
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.click();
      }
    }
  };

  // Capture photo from live webcam video element
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCameraStream();
    setIsCameraOpen(false);

    setSelectedImage(dataUrl);
    setImagePreview(dataUrl);
    setDetectedItems([]);
    setScanError(null);
    setSaveSuccessBanner(null);
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
  };

  // Trigger Groq Vision Scan for multiple items
  const handleScanImage = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setScanError(null);
    setSaveSuccessBanner(null);

    try {
      const items = await visionService.scanGrocery(selectedImage);
      const list = Array.isArray(items) ? items : [items];

      if (list.length === 0) {
        setScanError('No grocery items could be identified in this image. Please try a clearer photo or add items manually.');
        return;
      }

      // Initialize items with UI state
      const initializedItems = list.map((item, idx) => ({
        id: item.id || `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: item.name || 'Grocery Item',
        category: item.category || 'Produce',
        quantity: item.quantity !== undefined ? String(item.quantity) : '1',
        unit: item.unit || 'pcs',
        price_per_unit: item.price_per_unit ? String(item.price_per_unit) : '',
        storage_location: item.storage_location || 'Fridge',
        expiry_date: item.expiry_date || getQuickFutureDate(item.estimated_days || 7),
        estimated_days: item.estimated_days || 7,
        confidence: item.confidence || 'High',
        is_uncertain: Boolean(item.is_uncertain),
        notes: item.notes || '',
        isSaved: false,
        isSaving: false,
        saveError: null,
      }));

      setDetectedItems(initializedItems);
    } catch (err) {
      console.error('[ScannerPage] Scan error:', err);
      setScanError(err.message || 'Unable to detect grocery items from this photo. Please try another image or angle.');
    } finally {
      setIsScanning(false);
    }
  };

  // Handle updates to an individual item's fields
  const handleItemFieldChange = (id, field, value) => {
    setDetectedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // If user changed expiry date, clear error if any
        if (field === 'expiry_date' || field === 'name') {
          updated.saveError = null;
        }

        // If user actively edited uncertain item's name/quantity, mark uncertainty addressed
        if (field === 'name' && value.trim() && value.trim() !== 'Grocery Item') {
          updated.is_uncertain = false;
        }

        return updated;
      })
    );
  };

  // Quick preset helper for an item's expiry date
  const handleItemPresetExpiry = (id, days) => {
    setDetectedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          expiry_date: getQuickFutureDate(days),
          estimated_days: days,
        };
      })
    );
  };

  // Remove an item from the detected list
  const handleRemoveItem = (id) => {
    setDetectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Add a manual item to the list
  const handleAddManualItem = () => {
    const newItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      category: 'Produce',
      quantity: '1',
      unit: 'pcs',
      price_per_unit: '',
      storage_location: 'Fridge',
      expiry_date: getQuickFutureDate(7),
      estimated_days: 7,
      confidence: 'High',
      is_uncertain: false,
      notes: '',
      isSaved: false,
      isSaving: false,
      saveError: null,
    };
    setDetectedItems((prev) => [...prev, newItem]);
  };

  // Save a single detected item to Supabase inventory
  const handleSaveSingleItem = async (id) => {
    const item = detectedItems.find((i) => i.id === id);
    if (!item) return;

    if (!item.name.trim()) {
      setDetectedItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, saveError: 'Item name is required' } : i))
      );
      return;
    }

    if (!item.expiry_date) {
      setDetectedItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, saveError: 'Expiry date is required' } : i))
      );
      return;
    }

    // Set item saving state
    setDetectedItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isSaving: true, saveError: null } : i))
    );

    try {
      const priceVal = item.price_per_unit !== '' && !isNaN(parseFloat(item.price_per_unit))
        ? parseFloat(item.price_per_unit)
        : null;

      const payload = {
        name: item.name.trim(),
        category: item.category || 'Other',
        quantity: parseFloat(item.quantity) || 1,
        unit: item.unit || 'pcs',
        price_per_unit: priceVal,
        storage_location: item.storage_location || 'Fridge',
        expiry_date: item.expiry_date,
        purchase_date: new Date().toISOString().split('T')[0],
        notes: item.notes ? item.notes.trim() : null,
        status: 'active',
      };

      await addItem(payload);

      setDetectedItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isSaving: false, isSaved: true, saveError: null } : i))
      );

      setSaveSuccessBanner({
        message: `"${item.name.trim()}" saved to your pantry!`,
        count: 1,
      });
    } catch (err) {
      console.error('[ScannerPage] Save single item error:', err);
      setDetectedItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isSaving: false, saveError: err.message || 'Failed to save item' } : i))
      );
    }
  };

  // Save all detected items to Supabase inventory as separate rows
  const handleSaveAllToPantry = async () => {
    const unsavedItems = detectedItems.filter((i) => !i.isSaved);
    if (unsavedItems.length === 0) return;

    // Validate that all items have names
    let hasValidationError = false;
    setDetectedItems((prev) =>
      prev.map((item) => {
        if (!item.isSaved && !item.name.trim()) {
          hasValidationError = true;
          return { ...item, saveError: 'Item name is required' };
        }
        if (!item.isSaved && !item.expiry_date) {
          hasValidationError = true;
          return { ...item, saveError: 'Expiry date is required' };
        }
        return item;
      })
    );

    if (hasValidationError) {
      setScanError('Please enter valid product names and expiry dates for all items before saving.');
      return;
    }

    setIsSavingAll(true);
    setScanError(null);
    setSaveProgress({ current: 0, total: unsavedItems.length });

    let savedCount = 0;
    const errors = [];

    for (let index = 0; index < unsavedItems.length; index++) {
      const item = unsavedItems[index];

      // Mark current item as saving
      setDetectedItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isSaving: true, saveError: null } : i))
      );

      try {
        const priceVal = item.price_per_unit !== '' && !isNaN(parseFloat(item.price_per_unit))
          ? parseFloat(item.price_per_unit)
          : null;

        const payload = {
          name: item.name.trim(),
          category: item.category || 'Other',
          quantity: parseFloat(item.quantity) || 1,
          unit: item.unit || 'pcs',
          price_per_unit: priceVal,
          storage_location: item.storage_location || 'Fridge',
          expiry_date: item.expiry_date,
          purchase_date: new Date().toISOString().split('T')[0],
          notes: item.notes ? item.notes.trim() : null,
          status: 'active',
        };

        await addItem(payload);

        savedCount++;
        setSaveProgress({ current: savedCount, total: unsavedItems.length });

        // Mark as saved
        setDetectedItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isSaving: false, isSaved: true, saveError: null } : i))
        );
      } catch (err) {
        console.error(`[ScannerPage] Error saving item ${item.name}:`, err);
        errors.push(`${item.name}: ${err.message || 'Save failed'}`);

        setDetectedItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isSaving: false, saveError: err.message || 'Save failed' } : i))
        );
      }
    }

    setIsSavingAll(false);

    if (savedCount > 0) {
      setSaveSuccessBanner({
        message: `Successfully added ${savedCount} grocery item${savedCount > 1 ? 's' : ''} to your pantry inventory as separate rows!`,
        count: savedCount,
      });
    }

    if (errors.length > 0) {
      setScanError(`Some items could not be saved: ${errors.join(', ')}`);
    }
  };

  // Reset scanner to scan another image
  const handleResetScanner = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setDetectedItems([]);
    setScanError(null);
    setSaveSuccessBanner(null);
    setIsSavingAll(false);
  };

  const unsavedCount = detectedItems.filter((i) => !i.isSaved).length;
  const savedCount = detectedItems.filter((i) => i.isSaved).length;
  const uncertainCount = detectedItems.filter((i) => i.is_uncertain).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Hidden file & camera inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && handleFileProcess(e.target.files[0])}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={nativeCameraInputRef}
        onChange={(e) => e.target.files && handleFileProcess(e.target.files[0])}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1E2E24] flex items-center gap-2">
            <span>AI Grocery Vision Scanner</span>
            <span className="text-xs px-3 py-1 rounded-full bg-[#DCEBDD] text-[#315C45] font-display font-semibold border border-[#c2dec5] flex items-center gap-1.5">
              <SparkleStarDoodle className="w-3.5 h-3.5" fill="#315C45" />
              <span>Basket Detection Station</span>
            </span>
          </h1>
          <p className="text-sm text-[#343A35] mt-1 font-display font-normal">
            Scan single groceries or your entire market haul. Chef Pal identifies distinct products individually so you can review and save them to your pantry!
          </p>
        </div>

        {imagePreview && (
          <button
            onClick={handleResetScanner}
            className="self-start sm:self-auto btn-mint text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Scan Another Basket</span>
          </button>
        )}
      </div>

      {/* Error Banner */}
      {scanError && (
        <div className="p-4 rounded-2xl bg-[#FEE8E2] border-2 border-[#F8C8BD] text-[#C05435] text-xs flex items-start gap-3 animate-shake font-display">
          <AlertCircle className="w-5 h-5 text-[#C05435] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-[#A8381D]">Scanner Notice</p>
            <p className="mt-0.5 leading-relaxed">{scanError}</p>
          </div>
          <button
            onClick={() => setScanError(null)}
            className="text-[#C05435] hover:text-[#7A2410] p-1 font-bold cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Banner */}
      {saveSuccessBanner && (
        <div className="p-5 rounded-3xl bg-[#DCEBDD] border-2 border-[#c2dec5] text-[#315C45] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-sm font-display">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#315C45] text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Groceries Safely Tucked in Pantry!</h4>
              <p className="text-sm text-[#315C45] mt-0.5 font-medium">
                {saveSuccessBanner.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleResetScanner}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white text-[#315C45] border-2 border-[#EADDC7] hover:bg-[#FFF9EF] transition-all cursor-pointer"
            >
              Scan More Groceries
            </button>
            <Link
              to="/pantry"
              className="btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
            >
              <span>View Pantry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Upload / Preview Area */}
      {!imagePreview ? (
        /* Cute Modern Scanning Station Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`card-pinterest border-2 border-dashed transition-all p-8 sm:p-12 text-center cursor-pointer relative overflow-hidden bg-gradient-to-b from-[#FFFDF9] via-[#FFF9EF] to-[#F3C7AE]/15 ${
            isDragging
              ? 'border-[#315C45] bg-[#DCEBDD]/40 shadow-pinterest-hover scale-[1.01]'
              : 'border-[#EADDC7] hover:border-[#315C45] hover:bg-[#FFFDF9]'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          {/* Subtle Decorative Tape */}
          <div className="washi-tape-sage -top-2.5 left-10 hidden sm:block">AI Basket Vision 🧺</div>
          <div className="washi-tape-peach -top-2.5 right-10 hidden sm:block">Drag & Drop 📷</div>

          {/* 3D Market Basket Illustration Hero */}
          <div className="relative mb-5 mx-auto w-24 h-24 sm:w-28 sm:h-28">
            <div className="w-full h-full rounded-3xl overflow-hidden border-3 border-[#EADDC7] shadow-md bg-white">
              <img
                src="/assets/3d_market_basket.jpg"
                alt="3D Grocery Basket"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform"
              />
            </div>
            <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#F4D98A] border-2 border-white flex items-center justify-center text-sm shadow-sm animate-bounce">
              ✨
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-display font-bold text-[#1E2E24] mb-1.5">
            Drop your grocery basket photo here
          </h3>
          <p className="text-sm sm:text-base text-[#343A35] max-w-md mx-auto mb-6 font-display font-normal">
            Snap fresh fruits, veggies, cartons, or your full shopping haul. Chef Pal identifies distinct products individually!
          </p>

          <div
            className="flex flex-wrap items-center justify-center gap-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary flex items-center gap-2 text-sm px-6 py-3 cursor-pointer shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Basket Picture</span>
            </button>
            <button
              type="button"
              onClick={handleStartCamera}
              className="btn-secondary flex items-center gap-2 text-sm px-6 py-3 cursor-pointer shadow-sm"
            >
              <Camera className="w-4 h-4 text-[#315C45]" />
              <span>Take Fresh Photo</span>
            </button>
          </div>

          <p className="text-xs text-[#66736A] mt-6 font-display font-medium">
            Supports JPEG, PNG, and WebP photos up to 10MB • Auto-detects expiry recommendations
          </p>
        </div>
      ) : (
        /* Image Preview & Scanner Controls */
        <div className="space-y-6">
          <div className="card-kawaii p-6 bg-white border-2 border-[#EADDC7]/80 shadow-kawaii-card overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Image Preview Container with Scanner Laser effect */}
              <div className="md:col-span-5 relative rounded-2xl overflow-hidden bg-slate-900 aspect-square max-h-72 flex items-center justify-center shadow-inner group">
                <img
                  src={imagePreview}
                  alt="Grocery upload preview"
                  className="w-full h-full object-cover"
                />

                {/* Animated Laser Scan Bar */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce" />
                    <div className="absolute inset-0 bg-emerald-500/10 backdrop-brightness-110 animate-pulse" />
                  </div>
                )}

                {/* Overlaid quick actions */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 font-medium">
                  <span>Photo Ready</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="hover:underline font-semibold"
                  >
                    Change Image
                  </button>
                </div>
              </div>

              {/* Action Side Panel */}
              <div className="md:col-span-7 flex flex-col justify-center space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#315C45] bg-[#DCEBDD] px-3 py-1 rounded-full border border-[#c2dec5]">
                    Step 1: Visual Multi-Item Detection
                  </span>
                  <h3 className="text-xl font-display font-semibold text-[#1E2E24] mt-2.5">
                    Detect Distinct Grocery Products
                  </h3>
                  <p className="text-sm text-[#343A35] mt-1.5 leading-relaxed font-normal">
                    Our AI vision scanner detects every distinct item in this image individually.
                    It will never group them into generic bundles, giving each product its own name, recommended storage, and shelf-life estimate.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleScanImage}
                    disabled={isScanning}
                    className="btn-primary flex items-center justify-center gap-2 text-sm px-7 py-3 cursor-pointer disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Chef Pal is Scanning Basket...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#F4D98A]" />
                        <span>{detectedItems.length > 0 ? 'Re-scan Basket' : 'Scan My Basket'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="btn-secondary text-sm px-5 py-3 cursor-pointer"
                  >
                    Upload Different Photo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Detected Products Section (Editable List & Table) */}
          {detectedItems.length > 0 && (
            <div className="card-kawaii p-6 bg-white border-2 border-[#c2dec5] shadow-kawaii-card space-y-6 animate-fade-in relative overflow-hidden">
              <div className="w-1.5 bg-[#315C45] absolute left-0 top-0 bottom-0" />

              {/* Section Header with Summary Counts & Action Buttons */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EADDC7]/70 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#DCEBDD] text-[#315C45] flex items-center justify-center shrink-0 border border-[#c2dec5]">
                      <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h3 className="text-base font-display font-bold text-[#1E2E24] flex items-center gap-2">
                        <span>Detected Basket Goodies</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#DCEBDD] text-[#315C45] font-display font-bold border border-[#c2dec5]">
                          {detectedItems.length} {detectedItems.length === 1 ? 'Product' : 'Products'} Found
                        </span>
                      </h3>
                      <p className="text-sm text-[#526056] font-display font-medium">
                        Review, edit details, and click "Save All to Pantry" to tuck them away!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 cursor-pointer font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Grocery</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAllToPantry}
                    disabled={isSavingAll || unsavedCount === 0}
                    className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2 cursor-pointer disabled:opacity-50 font-semibold"
                  >
                    {isSavingAll ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          Saving All ({saveProgress.current}/{saveProgress.total})...
                        </span>
                      </>
                    ) : unsavedCount === 0 ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>All Items Saved</span>
                      </>
                    ) : (
                      <>
                        <Package className="w-3.5 h-3.5" />
                        <span>Save All to Pantry ({unsavedCount})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Uncertainty Warning Alert if any items need review */}
              {uncertainCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold">Review Recommended: </span>
                    <span>
                      {uncertainCount} item{uncertainCount > 1 ? 's have' : ' has'} approximate names or quantities marked with{' '}
                      <span className="font-bold underline">Needs Review</span>. Please verify before saving.
                    </span>
                  </div>
                </div>
              )}

              {/* List of Detected Products */}
              <div className="space-y-4">
                {detectedItems.map((item, index) => {
                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 rounded-3xl border-2 transition-all ${
                        item.isSaved
                          ? 'bg-[#DCEBDD]/30 border-[#c2dec5] shadow-xs'
                          : item.is_uncertain
                          ? 'bg-[#FFF9EF] border-[#F4D98A] shadow-sm'
                          : 'card-pinterest bg-white border-[#EADDC7] hover:border-[#315C45] shadow-xs'
                      }`}
                    >
                      {/* Item Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-2xl bg-[#DCEBDD] text-[#315C45] font-bold text-xs flex items-center justify-center border border-[#c2dec5] shadow-xs">
                            {index + 1}
                          </span>
                          <span className="font-display font-bold text-base text-[#1E2E24]">
                            {item.name || 'Unnamed Product'}
                          </span>

                          {/* Saved or Status Badges */}
                          {item.isSaved ? (
                            <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-[#DCEBDD] text-[#315C45] border border-[#c2dec5] flex items-center gap-1 shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Saved to Pantry</span>
                            </span>
                          ) : item.is_uncertain ? (
                            <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-[#FFF9EF] text-[#D97B5B] border border-[#F4D98A] flex items-center gap-1 shadow-xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-[#D97B5B]" />
                              <span>Needs Review</span>
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FFF9EF] text-[#315C45] border border-[#EADDC7] flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#315C45]" />
                              <span>{item.confidence} Confidence</span>
                            </span>
                          )}
                        </div>

                        {/* Card Actions: Remove Button */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded-lg text-[#66736A] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove this item"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Error notice for this specific item if invalid */}
                      {item.saveError && (
                        <p className="text-xs text-rose-600 font-medium mb-3">
                          ⚠️ {item.saveError}
                        </p>
                      )}

                      {/* Editable Fields Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        {/* Name */}
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-bold text-[#343A35] uppercase tracking-wider mb-1">
                            Product Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            disabled={item.isSaved}
                            value={item.name}
                            onChange={(e) => handleItemFieldChange(item.id, 'name', e.target.value)}
                            placeholder="e.g. Gala Apples"
                            className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold text-[#1E2E24] bg-white placeholder:text-[#88968C] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 ${
                              !item.name.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-[#EADDC7]'
                            }`}
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-xs font-bold text-[#343A35] uppercase tracking-wider mb-1">
                            Category
                          </label>
                          <select
                            disabled={item.isSaved}
                            value={item.category}
                            onChange={(e) => handleItemFieldChange(item.id, 'category', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#EADDC7] text-sm text-[#343A35] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Storage Location */}
                        <div>
                          <label className="block text-xs font-bold text-[#343A35] uppercase tracking-wider mb-1">
                            Storage
                          </label>
                          <select
                            disabled={item.isSaved}
                            value={item.storage_location}
                            onChange={(e) => handleItemFieldChange(item.id, 'storage_location', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#EADDC7] text-sm text-[#343A35] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                          >
                            {STORAGE_LOCATIONS.map((loc) => (
                              <option key={loc} value={loc}>
                                {loc}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity & Unit */}
                        <div>
                          <label className="block text-xs font-bold text-[#343A35] uppercase tracking-wider mb-1">
                            Estimated Qty <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              disabled={item.isSaved}
                              value={item.quantity}
                              onChange={(e) => handleItemFieldChange(item.id, 'quantity', e.target.value)}
                              className="w-20 px-3 py-2 rounded-xl border border-[#EADDC7] text-sm text-[#343A35] font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                            />
                            <select
                              disabled={item.isSaved}
                              value={item.unit}
                              onChange={(e) => handleItemFieldChange(item.id, 'unit', e.target.value)}
                              className="flex-1 px-2.5 py-2 rounded-xl border border-[#EADDC7] text-sm text-[#343A35] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                            >
                              {COMMON_UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Expiry Date with quick presets */}
                        <div className="lg:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-[#343A35] uppercase tracking-wider">
                              Expiry Date <span className="text-rose-500">*</span>
                            </label>
                            {!item.isSaved && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-[#66736A] font-semibold">Presets:</span>
                                <button
                                  type="button"
                                  onClick={() => handleItemPresetExpiry(item.id, 3)}
                                  className="px-2 py-0.5 rounded-full bg-[#FFF9EF] hover:bg-[#DCEBDD] text-[#315C45] border border-[#EADDC7] font-bold text-xs cursor-pointer"
                                >
                                  +3d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleItemPresetExpiry(item.id, 7)}
                                  className="px-2 py-0.5 rounded-full bg-[#FFF9EF] hover:bg-[#DCEBDD] text-[#315C45] border border-[#EADDC7] font-bold text-xs cursor-pointer"
                                >
                                  +7d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleItemPresetExpiry(item.id, 14)}
                                  className="px-2 py-0.5 rounded-full bg-[#FFF9EF] hover:bg-[#DCEBDD] text-[#315C45] border border-[#EADDC7] font-bold text-xs cursor-pointer"
                                >
                                  +14d
                                </button>
                              </div>
                            )}
                          </div>
                          <input
                            type="date"
                            disabled={item.isSaved}
                            value={item.expiry_date}
                            onChange={(e) => handleItemFieldChange(item.id, 'expiry_date', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#EADDC7] text-sm text-[#343A35] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                          />
                        </div>

                        {/* Price per unit (Optional ₹) */}
                        <div>
                          <label className="block text-xs font-bold text-[#343A35] uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Price / Unit</span>
                            <span className="text-xs text-[#66736A] font-medium lowercase">opt</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#66736A] text-sm font-bold select-none">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={item.isSaved}
                              placeholder="e.g. 60"
                              value={item.price_per_unit}
                              onChange={(e) => handleItemFieldChange(item.id, 'price_per_unit', e.target.value)}
                              className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#EADDC7] text-sm text-[#343A35] placeholder:text-[#88968C] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Notes / Tips & Single Save Button */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            disabled={item.isSaved}
                            value={item.notes}
                            onChange={(e) => handleItemFieldChange(item.id, 'notes', e.target.value)}
                            placeholder="Condition, ripeness, or notes (optional)"
                            className="w-full px-3 py-1.5 text-xs text-[#343A35] rounded-lg border border-[#EADDC7] bg-white placeholder:text-[#88968C] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {!item.isSaved ? (
                            <button
                              type="button"
                              onClick={() => handleSaveSingleItem(item.id)}
                              disabled={item.isSaving || isSavingAll}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {item.isSaving ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Save This Item</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-100/60">
                              <Check className="w-3.5 h-3.5" />
                              <span>Item saved successfully</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-[#526056] font-medium">
                  <span>{unsavedCount} item{unsavedCount !== 1 ? 's' : ''} ready to save.</span>{' '}
                  {savedCount > 0 && (
                    <span className="text-emerald-700 font-semibold">({savedCount} already saved)</span>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Grocery</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAllToPantry}
                    disabled={isSavingAll || unsavedCount === 0}
                    className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2 cursor-pointer disabled:opacity-50 font-semibold"
                  >
                    {isSavingAll ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving All to Pantry...</span>
                      </>
                    ) : unsavedCount === 0 ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>All Items in Pantry</span>
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4" />
                        <span>Save All to Pantry ({unsavedCount})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <div className="card-kawaii p-6 bg-[#DCEBDD]/30 border-2 border-[#c2dec5] shadow-sm">
        <h4 className="text-xs font-bold text-[#315C45] uppercase tracking-wider mb-2 flex items-center gap-2 font-display">
          <Sparkles className="w-4 h-4 text-[#315C45]" />
          <span>How Multi-Product Vision Detection Works</span>
        </h4>
        <ul className="text-sm text-[#343A35] space-y-2 list-disc pl-4 font-normal leading-relaxed">
          <li><strong>Distinct Product Detection:</strong> Detects every individual fruit, vegetable, packaged grocery, or dairy product separately. Never bundles multiple items into "Grocery Assortment".</li>
          <li><strong>Editable Review Table:</strong> You can edit product names, modify quantities, adjust storage locations, or delete any unwanted item before saving.</li>
          <li><strong>One-Click "Save All to Pantry":</strong> Saves each detected product as its own separate item directly into your pantry inventory.</li>
          <li><strong>Uncertainty Review:</strong> Any items with ambiguous quantities or low confidence are clearly flagged with "Needs Review" so you never have invented or guessed values in your pantry.</li>
        </ul>
      </div>

      {/* Live Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-lg w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Live Grocery Camera</span>
              </h3>
              <button
                onClick={handleCloseCamera}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-8 border border-white/30 rounded-2xl pointer-events-none flex items-center justify-center">
                <span className="text-[11px] text-white/60 bg-black/40 px-2.5 py-1 rounded-full">
                  Position groceries in frame
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleCloseCamera}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

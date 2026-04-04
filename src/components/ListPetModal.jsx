import React, { useEffect, useState } from 'react';
import { X, UploadCloud, Rocket, Zap, Plus, Trash2, AlertTriangle, LogIn } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import { startCheckout } from '../utils/payments';
import usePaymentConfig from '../hooks/usePaymentConfig';
import styles from './ListPetModal.module.css';
import { MARKETPLACES, getMarketplaceByPath } from '../config/marketplace';

const DETAIL_SECTIONS = {
  pets: [
    'Personality',
    'Medical History',
    'Vaccination Record',
    'Genetic Profile',
    'Genealogy',
    'Fun Facts',
  ],
  livestock: [
    'Breeding Program',
    'Herd Health & Vaccines',
    'Registration & Papers',
    'Feed Program',
    'Handling & Temperament',
    'Pickup / Haul Terms',
  ],
  supplies: [
    'Condition Notes',
    'Included Equipment',
    'Usage History',
    'Dimensions & Fit',
    'Pickup / Shipping',
    'Storage Notes',
  ],
};

const DETAIL_PLACEHOLDERS = {
  'Personality': 'Share behavior, energy level, and what kind of home is the best match.',
  'Medical History': 'Add treatment history, known conditions, and any important vet notes.',
  'Vaccination Record': 'List vaccine dates, boosters, and supporting records.',
  'Genetic Profile': 'Describe lineage, testing, or breed-specific traits buyers should know.',
  'Genealogy': 'Summarize parentage, pedigree background, or registration history.',
  'Fun Facts': 'Add standout traits that help the listing feel specific and real.',
  'Breeding Program': 'Explain bloodlines, breeding status, calving/lambing history, or program goals.',
  'Herd Health & Vaccines': 'List vaccination protocol, herd health work, vet checks, and testing.',
  'Registration & Papers': 'Describe registry status, transfer paperwork, and tags or branded IDs.',
  'Feed Program': 'Summarize ration, pasture setup, supplements, and current condition program.',
  'Handling & Temperament': 'Describe disposition, chute history, halter work, and loading behavior.',
  'Pickup / Haul Terms': 'Explain pickup windows, haul support, shipping options, and buyer expectations.',
  'Condition Notes': 'Call out cosmetic wear, defects, and what is included.',
  'Included Equipment': 'List bundled parts, accessories, or add-ons that come with the item.',
  'Usage History': 'Describe how often the item was used and in what environment.',
  'Dimensions & Fit': 'Share measurements, compatibility, or capacity details.',
  'Pickup / Shipping': 'Explain pickup, freight, or local delivery options clearly.',
  'Storage Notes': 'Mention shelf life, storage conditions, or maintenance guidance.',
};

const LIVESTOCK_SPECIES_OPTIONS = [
  'Beef Cattle',
  'Dairy Cattle',
  'Equine',
  'Goats',
  'Sheep',
  'Swine',
  'Poultry',
  'Alpacas & Llamas',
  'Rabbits',
  'Specialty Livestock',
];

const LIVESTOCK_GENDER_OPTIONS = [
  'Female',
  'Male',
  'Mixed Lot',
  'Pair',
  'Breeding Group',
];

const LIVESTOCK_STOCK_CLASS_OPTIONS = [
  'Lightweight',
  'Midweight',
  'Heavyweight',
  'Mature Stock',
  'Registered Breeding Stock',
];

const createDefaultAuctionCloseDate = () => {
  const closeDate = new Date();
  closeDate.setDate(closeDate.getDate() + 7);
  closeDate.setMinutes(0, 0, 0);
  return new Date(closeDate.getTime() - closeDate.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const createInitialForm = ({ isLivestock, isSupplies }) => ({
  petName: '',
  species: isLivestock ? 'Beef Cattle' : isSupplies ? 'Grooming' : 'Dog',
  breed: '',
  gender: isLivestock ? 'Mixed Lot' : 'Male',
  size: isLivestock ? 'Midweight' : 'Medium',
  description: '',
  price: '',
  location: '',
  phone: '',
  email: '',
  vaccinated: false,
  neutered: false,
  listingType: isLivestock ? 'auction' : 'fixed',
  lotSize: '1',
  allowPartialSale: false,
  reservePrice: '',
  auctionEndsAt: isLivestock ? createDefaultAuctionCloseDate() : '',
  condition: 'New',
  bulkQuantity: '1',
});

const ListPetModal = ({ isOpen, onClose }) => {
  const { isAuthenticated, register } = useAuth();
  const { configured: paymentsConfigured } = usePaymentConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [selectedMonetize, setSelectedMonetize] = useState('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Auth fields for inline registration
  const [showInlineAuth, setShowInlineAuth] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const [selectedMarketplace, setSelectedMarketplace] = useState(() => {
    return getMarketplaceByPath(location.pathname).label;
  });

  const isLivestock = selectedMarketplace === 'Livestock';
  const isSupplies = selectedMarketplace === 'Supplies';
  const marketplace = selectedMarketplace;

  const detailSections = isLivestock
    ? DETAIL_SECTIONS.livestock
    : isSupplies
      ? DETAIL_SECTIONS.supplies
      : DETAIL_SECTIONS.pets;

  const [form, setForm] = useState(() => createInitialForm({ isLivestock, isSupplies }));
  const [dob, setDob] = useState('');
  const [activeCategories, setActiveCategories] = useState([]);
  const [categoryNotes, setCategoryNotes] = useState({});
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--; months += 12;
    }
    if (today.getDate() < birthDate.getDate()) { months--; if (months < 0) months = 11; }
    if (years === 0 && months === 0) return 'Less than a month';
    let ageStr = '';
    if (years > 0) ageStr += `${years} ${years === 1 ? 'Year' : 'Years'}`;
    if (months > 0) ageStr += `${years > 0 ? ', ' : ''}${months} ${months === 1 ? 'Month' : 'Months'}`;
    return ageStr.trim();
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.petName || (!form.breed && !isSupplies) || !form.description || !form.location) {
        return toast.error('Please fill in all required fields');
      }
      if (isLivestock) {
        if (!Number.isFinite(Number(form.lotSize)) || Number(form.lotSize) < 1) {
          return toast.error('Enter a valid lot size for this livestock listing.');
        }
        if (form.listingType === 'auction') {
          if (!form.auctionEndsAt) {
            return toast.error('Set a future close date for this auction lot.');
          }
          const auctionCloseTime = new Date(form.auctionEndsAt);
          if (Number.isNaN(auctionCloseTime.getTime()) || auctionCloseTime.getTime() <= Date.now()) {
            return toast.error('Auction close time must be in the future.');
          }
          if (form.reservePrice && Number(form.reservePrice) < Number(form.price || 0)) {
            return toast.error('Reserve price should be at or above the starting bid.');
          }
        }
      }
      if (form.description.trim().length < 40) {
        return toast.error('Add a more complete description so buyers understand health, condition, or handoff details.');
      }
    }
    if (step === 3 && imageFiles.length < 1) {
      return toast.error('Add at least one real photo before submitting a listing.');
    }
    setStep(step + 1);
  };
  const handleBack = () => setStep(step - 1);
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 7) {
      return toast.error('Maximum 7 images allowed');
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, { id: Date.now() + Math.random(), url: reader.result }]);
        setImageFiles(prev => [...prev, file]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id, index) => {
    setImages(images.filter(img => img.id !== id));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const toggleCategory = (cat) => {
    if (activeCategories.includes(cat)) {
      setActiveCategories(activeCategories.filter(c => c !== cat));
    } else {
      setActiveCategories([...activeCategories, cat]);
    }
  };

  const handleInlineRegister = async () => {
    if (!authName || !authEmail || !authPassword) {
      return toast.error('Please fill in all account fields');
    }
    if (authPassword.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    try {
      await register(authName, authEmail, authPassword, form.location);
      setShowInlineAuth(false);
      toast.success('Account created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  const resetFormState = () => {
    setStep(1);
    setForm(createInitialForm({ isLivestock, isSupplies }));
    setDob('');
    setActiveCategories([]);
    setCategoryNotes({});
    setImages([]);
    setImageFiles([]);
    setSelectedMonetize('none');
    setShowInlineAuth(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const newMarketplace = location.pathname === '/livestock' ? 'Livestock' : location.pathname === '/supplies' ? 'Supplies' : 'Pets';
    setSelectedMarketplace(newMarketplace);
    const isLv = newMarketplace === 'Livestock';
    const isSup = newMarketplace === 'Supplies';
    setStep(1);
    setForm(createInitialForm({ isLivestock: isLv, isSupplies: isSup }));
    setDob('');
    setActiveCategories([]);
    setCategoryNotes({});
    setImages([]);
    setImageFiles([]);
    setSelectedMonetize('none');
    setShowInlineAuth(false);
  }, [isOpen, location.pathname]);

  if (!isOpen) return null;

  const finishAndPublish = async () => {
    // Listings require an account because the API stores them against the owner.
    if (!isAuthenticated && !showInlineAuth) {
      setShowInlineAuth(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const age = calculateAge(dob) || 'Unknown';
      const resolvedListingType = isLivestock ? form.listingType : 'fixed';
      const fullDescription = [
        form.description,
        ...activeCategories.map(cat => categoryNotes[cat] ? `\n\n${cat}: ${categoryNotes[cat]}` : '')
      ].join('');

      const formData = new FormData();
      formData.append('title', form.petName);
      formData.append('petName', form.petName);
      formData.append('species', form.species);
      formData.append('breed', form.breed || marketplace);
      formData.append('age', age);
      formData.append('gender', form.gender);
      formData.append('size', form.size);
      formData.append('description', fullDescription);
      formData.append('price', form.price || '0');
      formData.append('location', form.location);
      formData.append('category', marketplace.toLowerCase());
      formData.append('listingType', resolvedListingType);
      
      // Multi-sector fields
      if (isLivestock) {
        formData.append('lotSize', form.lotSize);
        formData.append('allowPartialSale', String(form.allowPartialSale));
        if (resolvedListingType === 'auction') {
          formData.append('reservePrice', form.reservePrice);
          formData.append('auctionEndsAt', form.auctionEndsAt);
        }
      } else if (isSupplies) {
        formData.append('condition', form.condition);
        formData.append('bulkQuantity', form.bulkQuantity);
      }

      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      const { data: createdListing } = await api.post('/listings', formData);
      const requiresReview = createdListing.status === 'pending_review' || createdListing.moderation?.requiresReview;

      if (requiresReview) {
        toast('Listing submitted for review. It will stay private until approved by staff.', { icon: '🛡️' });
      } else {
        toast.success('Listing published! 🎉');
      }
      resetFormState();
      onClose();

      if (selectedMonetize === 'none' || requiresReview) {
        if (requiresReview && selectedMonetize !== 'none') {
          toast('Boost checkout stays off until the listing is approved and live.', { icon: 'ℹ️' });
        }
        navigate('/dashboard?tab=listings');
        return;
      }

      if (!paymentsConfigured) {
        toast('Listing published. Paid promotion was skipped because Stripe is not connected yet.', { icon: 'ℹ️' });
        navigate('/dashboard?tab=listings');
        return;
      }

      try {
        await startCheckout({
          type: 'boost',
          amount: selectedMonetize === 'urgent' ? 50 : 15,
          description: `${createdListing.petName || createdListing.title} listing boost`,
          metadata: {
            listingId: createdListing.id,
            boostType: selectedMonetize,
          },
          successPath: '/dashboard',
          cancelPath: '/dashboard?tab=listings&action=boost',
        });
      } catch (checkoutError) {
        if (checkoutError.response?.status === 401) {
          navigate(`/login?redirect=${encodeURIComponent('/dashboard?tab=listings&action=boost')}`);
          return;
        }
        toast.error(checkoutError.response?.data?.error || 'Listing published, but boost checkout could not start.');
        navigate('/dashboard?tab=listings&action=boost');
      }
    } catch (err) {
      const issues = err.response?.data?.issues;
      toast.error(Array.isArray(issues) && issues.length ? issues[0] : (err.response?.data?.error || 'Failed to publish listing'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalBg} onClick={onClose} />
      <div className={styles.modalContent}>
        
        <div className={styles.header}>
          <h2 className={styles.title}>
            {step === 1 && "Basic Details"}
            {step === 2 && (isLivestock ? 'Lot Details' : "Additional Info")}
            {step === 3 && "Add Photos (Max 7)"}
            {step === 4 && (isLivestock ? 'Promote Your Lot' : "Boost Your Listing")}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Guest warning */}
        {!isAuthenticated && (
          <div className={styles.guestWarning}>
            <AlertTriangle size={18} />
            <span>You need an account to publish a listing so buyers can reach you and you can manage billing safely.</span>
            <button onClick={() => { onClose(); navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`); }} className={styles.guestLoginBtn}>
              <LogIn size={14} /> Sign In
            </button>
          </div>
        )}

        <div className={styles.body}>
          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <div className={styles.formGrid}>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>What are you listing? *</label>
                <select
                  value={selectedMarketplace}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedMarketplace(val);
                    const isLv = val === 'Livestock';
                    const isSup = val === 'Supplies';
                    setForm(createInitialForm({ isLivestock: isLv, isSupplies: isSup }));
                    setActiveCategories([]);
                    setCategoryNotes({});
                  }}
                >
                  <option value="Pets">Pet</option>
                  <option value="Livestock">Livestock</option>
                  <option value="Supplies">Supplies</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>
                  {isLivestock ? 'Lot Name / Tag *' : isSupplies ? 'Item Title *' : 'Pet Name *'}
                </label>
                <input
                  type="text"
                  placeholder={isLivestock ? "e.g. Angus Heifers - Lot 12" : isSupplies ? "e.g. Industrial Soap" : "e.g. Luna"}
                  value={form.petName}
                  onChange={(e) => updateForm('petName', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>{isLivestock ? 'Livestock Category *' : isSupplies ? 'Supply Category *' : 'Animal Type *'}</label>
                <select value={form.species} onChange={(e) => updateForm('species', e.target.value)}>
                  {isLivestock ? (
                    <>
                      {LIVESTOCK_SPECIES_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </>
                  ) : isSupplies ? (
                    <>
                      <option>Hygiene</option><option>Grooming</option><option>Healthcare</option><option>Feeding</option><option>Other</option>
                    </>
                  ) : (
                    <>
                      <option>Dog</option><option>Cat</option><option>Bird</option><option>Reptile</option><option>Small Animal</option><option>Other</option>
                    </>
                  )}
                </select>
              </div>

              {/* Conditional: Breed (Hide for Supplies) */}
              {!isSupplies && (
                <div className={styles.inputGroup}>
                  <label>{isLivestock ? 'Breed / Program *' : 'Breed / Morph *'}</label>
                  <input type="text" placeholder={isLivestock ? 'e.g. Registered Black Angus' : 'e.g. Ball Python'} value={form.breed} onChange={(e) => updateForm('breed', e.target.value)} />
                </div>
              )}

              {/* Conditional: Age/DOB (Hide for Supplies) */}
              {!isSupplies && (
                <>
                  <div className={styles.inputGroup}>
                    <label>{isLivestock ? 'Birth Date / Approximate DOB' : 'Date of Birth'}</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>{isLivestock ? 'Approximate Age' : 'Current Age'}</label>
                    <input type="text" readOnly placeholder="Auto-calculated" value={calculateAge(dob)} style={{ backgroundColor: 'var(--color-surface-hover)', cursor: 'not-allowed' }} />
                  </div>
                </>
              )}

              {/* Conditional: Gender (Hide for Supplies) */}
              {!isSupplies && (
                <div className={styles.inputGroup}>
                  <label>{isLivestock ? 'Sex / Lot Makeup' : 'Gender'}</label>
                  <select value={form.gender} onChange={(e) => updateForm('gender', e.target.value)}>
                    {isLivestock ? (
                      <>
                        {LIVESTOCK_GENDER_OPTIONS.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </>
                    ) : (
                      <>
                        <option>Male</option><option>Female</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Conditional: Size/Condition */}
              <div className={styles.inputGroup}>
                <label>{isSupplies ? 'Condition' : isLivestock ? 'Weight / Class' : 'Size'}</label>
                {isSupplies ? (
                  <select value={form.condition} onChange={(e) => updateForm('condition', e.target.value)}>
                    <option>New</option><option>Used - Like New</option><option>Used - Good</option><option>Refurbished</option>
                  </select>
                ) : (
                  <select value={form.size} onChange={(e) => updateForm('size', e.target.value)}>
                    {isLivestock ? (
                      <>
                        {LIVESTOCK_STOCK_CLASS_OPTIONS.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </>
                    ) : (
                      <>
                        <option>Small</option><option>Medium</option><option>Large</option><option>Extra Large</option>
                      </>
                    )}
                  </select>
                )}
              </div>

              {/* Pricing Section - Dynamic for Auctions */}
              <div className={styles.inputGroup}>
                <label>
                  {isLivestock ? (form.listingType === 'auction' ? 'Opening Bid ($)' : 'Asking Price ($)') :
                   isSupplies ? 'Market Price ($)' : 'Rehoming Fee ($)'}
                </label>
                <input type="number" placeholder="0 for free" value={form.price} onChange={(e) => updateForm('price', e.target.value)} />
                <span className={styles.note}>
                  {isLivestock
                    ? (form.listingType === 'auction'
                      ? 'Set the opening bid buyers see first. Reserve stays private until it is met.'
                      : 'Use a direct sale price when you want offers instead of timed bidding.')
                    : paymentsConfigured
                      ? 'Buyer checkout runs through Stripe-hosted billing when you are ready to accept payment.'
                      : 'Publish now. Paid checkout stays disabled until Stripe billing is connected.'}
                </span>
              </div>

              {/* Livestock Specific: Listing Type */}
              {isLivestock && (
                <div className={styles.inputGroup}>
                  <label>Sale Format</label>
                  <select
                    value={form.listingType}
                    onChange={(e) => {
                      const nextListingType = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        listingType: nextListingType,
                        auctionEndsAt: nextListingType === 'auction'
                          ? (prev.auctionEndsAt || createDefaultAuctionCloseDate())
                          : prev.auctionEndsAt,
                      }));
                    }}
                  >
                    <option value="auction">Timed Auction</option>
                    <option value="fixed">Fixed Price Sale</option>
                  </select>
                </div>
              )}

              {isLivestock && (
                <div className={styles.inputGroup}>
                  <label>Lot Size (Head) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.lotSize}
                    onChange={(e) => updateForm('lotSize', e.target.value)}
                  />
                  <span className={styles.note}>Use the actual head count in this lot so buyers understand scale immediately.</span>
                </div>
              )}

              {isLivestock && form.listingType === 'auction' && (
                <>
                  <div className={styles.inputGroup}>
                    <label>Reserve Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.reservePrice}
                      onChange={(e) => updateForm('reservePrice', e.target.value)}
                      placeholder="Optional floor price"
                    />
                    <span className={styles.note}>Leave blank for a no-reserve auction, or set a minimum acceptable bid.</span>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Auction Close Time *</label>
                    <input
                      type="datetime-local"
                      value={form.auctionEndsAt}
                      onChange={(e) => updateForm('auctionEndsAt', e.target.value)}
                    />
                    <span className={styles.note}>Timed lots close automatically at this date and time.</span>
                  </div>
                </>
              )}

              {isLivestock && (
                <div className={styles.inputGroup}>
                  <label>Lot Terms</label>
                  <div className={styles.checkboxRow}>
                    <label className={styles.checkboxOption}>
                      <input
                        type="checkbox"
                        checked={form.allowPartialSale}
                        onChange={(e) => updateForm('allowPartialSale', e.target.checked)}
                      />
                      Allow split-lot inquiries
                    </label>
                  </div>
                </div>
              )}

              {/* Supplies Specific: Bulk Quantity */}
              {isSupplies && (
                <div className={styles.inputGroup}>
                  <label>Bulk Quantity</label>
                  <input type="number" min="1" value={form.bulkQuantity} onChange={(e) => updateForm('bulkQuantity', e.target.value)} />
                </div>
              )}

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Description *</label>
                <textarea
                  rows={3}
                  placeholder={
                    isLivestock
                      ? 'Describe bloodlines, herd health, disposition, lot makeup, reserve terms, and pickup details...'
                      : isSupplies
                        ? 'Describe condition, compatibility, quantity, and delivery details...'
                        : 'Describe temperament, care history, health details, and ideal placement...'
                  }
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Location *</label>
                <input type="text" placeholder="e.g. Austin, TX" value={form.location} onChange={(e) => updateForm('location', e.target.value)} />
              </div>

              {/* Conditional: Health (Only for Pets/Livestock) */}
              {!isSupplies && (
                <div className={styles.inputGroup}>
                  <label>{isLivestock ? 'Program Details' : 'Health Records'}</label>
                  <div className={styles.checkboxRow}>
                    <label className={styles.checkboxOption}>
                      <input type="checkbox" checked={form.vaccinated} onChange={(e) => updateForm('vaccinated', e.target.checked)} />
                      {isLivestock ? 'Vaccination records ready' : 'Vaccinated'}
                    </label>
                    <label className={styles.checkboxOption}>
                      <input type="checkbox" checked={form.neutered} onChange={(e) => updateForm('neutered', e.target.checked)} />
                      {isLivestock ? 'Breeding quality lot' : 'Spayed/Neutered'}
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Optional Categories */}
          {step === 2 && (
            <div className={styles.optionalSection}>
              <p className={styles.sectionDesc}>
                {isLivestock
                  ? 'Strong livestock lots close better when buyers can review health program, registration, handling, and haul terms up front.'
                  : isSupplies
                    ? 'Detailed product notes reduce low-intent questions and help buyers commit faster.'
                    : 'Listings with rich details get 3x more serious inquiries.'}
              </p>
              <div className={styles.pillContainer}>
                {detailSections.map(cat => (
                  <button 
                    key={cat}
                    className={`${styles.pillBtn} ${activeCategories.includes(cat) ? styles.pillActive : ''}`}
                    onClick={() => toggleCategory(cat)}
                  >
                    {activeCategories.includes(cat) ? <X size={14} /> : <Plus size={14} />}
                    {cat}
                  </button>
                ))}
              </div>
              <div className={styles.dynamicFields}>
                {activeCategories.map(cat => (
                  <div key={cat} className={styles.dynamicGroup}>
                    <div className={styles.dynamicHeader}>
                      <label>{cat}</label>
                      <button className={styles.removeCatBtn} onClick={() => toggleCategory(cat)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <textarea 
                      placeholder={DETAIL_PLACEHOLDERS[cat] || `Provide details about ${cat.toLowerCase()}...`}
                      rows={3}
                      value={categoryNotes[cat] || ''}
                      onChange={(e) => setCategoryNotes(prev => ({ ...prev, [cat]: e.target.value }))}
                    />
                  </div>
                ))}
                {activeCategories.length === 0 && (
                  <div className={styles.emptyCategories}>
                    <p>{isLivestock ? 'Select a section above to document the lot clearly for auction buyers.' : 'Select a category above to add details.'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Photos */}
          {step === 3 && (
            <div className={styles.photoStep}>
              <div className={styles.photoGrid}>
                {images.map((img, i) => (
                  <div key={img.id} className={styles.photoCard}>
                    <img src={img.url} alt={`Upload ${i+1}`} className={styles.photoPreview} />
                    <button className={styles.photoRemoveBtn} onClick={() => removeImage(img.id, i)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {images.length < 7 && (
                  <label className={styles.photoUploadBtn}>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                    <UploadCloud size={24} />
                    <span>Upload</span>
                  </label>
                )}
              </div>
              <p className={styles.note} style={{ textAlign: 'center', marginTop: '16px' }}>
                {isLivestock
                  ? 'Clear pen, pasture, or chute photos help bidders judge condition and lot makeup faster.'
                  : 'Clear, well-lit photos help your listing get more attention.'}
              </p>
            </div>
          )}

          {/* STEP 4: Monetize / Boost */}
          {step === 4 && (
          <div className={styles.boostSection}>
              <p className={styles.sectionDesc}>
                Choose a promotion level for this listing. Boosts add a badge and 7-day promotion metadata after checkout, but exact marketplace ranking depends on current demand.
              </p>
              {/* Inline auth for guests */}
              {!isAuthenticated && showInlineAuth && (
                <div className={styles.inlineAuth}>
                  <h3>Create an account to publish</h3>
                  <p>Your listing needs an owner account for messages, dashboard access, and payment history.</p>
                  <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                      <label>Full Name</label>
                      <input type="text" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Email</label>
                      <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Password</label>
                      <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Min 6 characters" />
                    </div>
                  </div>
                  <button className={`btn btn-primary ${styles.fullWidthBtn}`} onClick={handleInlineRegister} style={{ marginTop: '16px' }}>
                    Create Account & Publish
                  </button>
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button onClick={() => { onClose(); navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary-dark)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Already have an account? Sign in
                    </button>
                  </div>
                </div>
              )}

              {(isAuthenticated || !showInlineAuth) && (
                <>
                  <div className={`${styles.boostOption} ${selectedMonetize === 'none' ? styles.boostActive : ''}`}
                    onClick={() => setSelectedMonetize('none')}>
                    <h3>Free Listing</h3>
                    <p>
                      {isLivestock ? 'Standard auction visibility. Your lot will appear in the livestock feed.' : 
                       isSupplies ? 'Standard market visibility. Your products will appear in search results.' : 
                       'Standard visibility with no paid promotion attached.'}
                    </p>
                    <span className={styles.boostPrice}>$0</span>
                  </div>
                  <div className={`${styles.boostOption} ${selectedMonetize === 'featured' ? styles.boostActive : ''}`}
                    onClick={() => setSelectedMonetize('featured')}>
                    <div className={styles.boostBadge}><Rocket size={16} /> Recommended</div>
                    <h3>
                      {isLivestock ? 'Featured Auction Listing' :
                       isSupplies ? 'Featured Supply Listing' :
                       'Featured Listing'}
                    </h3>
                    <p>
                      {isLivestock ? 'Adds featured styling and a 7-day promotion badge to this auction.' :
                       isSupplies ? 'Adds featured styling and a 7-day promotion badge to this supply listing.' :
                       'Adds featured styling and a 7-day promotion badge to this listing.'}
                    </p>
                    <span className={styles.boostPrice}>$15</span>
                  </div>
                  <div className={`${styles.boostOption} ${selectedMonetize === 'urgent' ? styles.boostActive : ''}`}
                    onClick={() => setSelectedMonetize('urgent')}>
                    <div className={styles.boostBadge}><Zap size={16} /> Fastest</div>
                    <h3>
                      {isLivestock ? 'Urgent Auction Listing' :
                       isSupplies ? 'Urgent Supply Listing' :
                       'Urgent Listing'}
                    </h3>
                    <p>
                      {isLivestock ? 'Adds urgent styling and a 7-day promotion badge for time-sensitive auctions.' :
                       isSupplies ? 'Adds urgent styling and a 7-day promotion badge for time-sensitive supply listings.' :
                       'Adds urgent styling and a 7-day promotion badge for time-sensitive listings.'}
                    </p>
                    <span className={styles.boostPrice}>$50</span>
                  </div>
                  <p className={styles.boostNote}>
                    The paid tiers differ by emphasis and price. They do not guarantee a specific rank, so use the tier that matches how quickly you want the listing to stand out.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <div className={styles.stepIndicator}>
            {[1,2,3,4].map(s => (
              <div key={s} className={`${styles.stepDot} ${s === step ? styles.stepDotActive : ''} ${s < step ? styles.stepDotDone : ''}`} />
            ))}
          </div>
          <div className={styles.footerActions}>
            {step > 1 && <button className="btn btn-secondary" onClick={handleBack}>Back</button>}
            {step < 4 ? (
              <button className="btn btn-primary" onClick={handleNext}>Continue</button>
            ) : (
              !(showInlineAuth && !isAuthenticated) && (
                <button className="btn btn-primary" onClick={finishAndPublish} disabled={isSubmitting}>
                  {isSubmitting ? 'Publishing...' : 'Publish Listing'}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListPetModal;

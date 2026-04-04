import React, { useState } from 'react';
import { X, UploadCloud, Rocket, Zap, Plus, Trash2, Image as ImageIcon, AlertTriangle, LogIn } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import { startCheckout } from '../utils/payments';
import usePaymentConfig from '../hooks/usePaymentConfig';
import styles from './ListPetModal.module.css';

const OPTIONAL_CATEGORIES = [
  'Personality', 'Medical History', 'Vaccination Record', 
  'Genetic Profile', 'Genealogy', 'Fun Facts'
];

const createInitialForm = ({ isLivestock, isSupplies }) => ({
  petName: '',
  species: isLivestock ? 'Cattle' : isSupplies ? 'Grooming' : 'Dog',
  breed: '',
  gender: 'Male',
  size: 'Medium',
  description: '',
  price: '',
  location: '',
  phone: '',
  email: '',
  vaccinated: false,
  neutered: false,
  listingType: isLivestock ? 'auction' : 'fixed',
  lotSize: 'Single',
  reservePrice: '',
  auctionEndsAt: '',
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

  // Form state
  const isLivestock = location.pathname === '/livestock';
  const isSupplies = location.pathname === '/supplies';
  const marketplace = isLivestock ? 'Livestock' : isSupplies ? 'Supplies' : 'Pets';

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

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!form.petName || (!form.breed && !isSupplies) || !form.description || !form.location) {
        return toast.error('Please fill in all required fields');
      }
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
    if (authPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
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

  const finishAndPublish = async () => {
    // Listings require an account because the API stores them against the owner.
    if (!isAuthenticated && !showInlineAuth) {
      setShowInlineAuth(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const age = calculateAge(dob) || 'Unknown';
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
      formData.append('listingType', form.listingType);
      
      // Multi-sector fields
      if (isLivestock) {
        formData.append('lotSize', form.lotSize);
        if (form.listingType === 'auction') {
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

      toast.success('Listing published! 🎉');
      resetFormState();
      onClose();

      if (selectedMonetize === 'none') {
        navigate('/dashboard');
        return;
      }

      if (!paymentsConfigured) {
        toast('Listing published. Paid boosts stay disabled until Stripe is connected.', { icon: 'ℹ️' });
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
      toast.error(err.response?.data?.error || 'Failed to publish listing');
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
            {step === 2 && "Additional Info"}
            {step === 3 && "Add Photos (Max 7)"}
            {step === 4 && "Boost Your Listing"}
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
              <div className={styles.inputGroup}>
                <label>
                  {isLivestock ? 'Animal Name / ID *' : isSupplies ? 'Item Title *' : 'Pet Name *'}
                </label>
                <input 
                  type="text" 
                  placeholder={isLivestock ? "e.g. Angus #42" : isSupplies ? "e.g. Industrial Soap" : "e.g. Luna"} 
                  value={form.petName} 
                  onChange={(e) => updateForm('petName', e.target.value)} 
                />
              </div>

              <div className={styles.inputGroup}>
                <label>{isSupplies ? 'Supply Category *' : 'Animal Type *'}</label>
                <select value={form.species} onChange={(e) => updateForm('species', e.target.value)}>
                  {isLivestock ? (
                    <>
                      <option>Cattle</option><option>Horses</option><option>Poultry</option><option>Sheep/Goats</option><option>Swine</option><option>Other</option>
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
                  <label>{isLivestock ? 'Breed / Genetics *' : 'Breed / Morph *'}</label>
                  <input type="text" placeholder="e.g. Black Angus" value={form.breed} onChange={(e) => updateForm('breed', e.target.value)} />
                </div>
              )}

              {/* Conditional: Age/DOB (Hide for Supplies) */}
              {!isSupplies && (
                <>
                  <div className={styles.inputGroup}>
                    <label>Date of Birth</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Current Age</label>
                    <input type="text" readOnly placeholder="Auto-calculated" value={calculateAge(dob)} style={{ backgroundColor: 'var(--color-surface-hover)', cursor: 'not-allowed' }} />
                  </div>
                </>
              )}

              {/* Conditional: Gender (Hide for Supplies) */}
              {!isSupplies && (
                <div className={styles.inputGroup}>
                  <label>Gender / Mixed</label>
                  <select value={form.gender} onChange={(e) => updateForm('gender', e.target.value)}>
                    <option>Male</option><option>Female</option><option>Mixed Lot</option>
                  </select>
                </div>
              )}

              {/* Conditional: Size/Condition */}
              <div className={styles.inputGroup}>
                <label>{isSupplies ? 'Condition' : 'Size'}</label>
                {isSupplies ? (
                  <select value={form.condition} onChange={(e) => updateForm('condition', e.target.value)}>
                    <option>New</option><option>Used - Like New</option><option>Used - Good</option><option>Refurbished</option>
                  </select>
                ) : (
                  <select value={form.size} onChange={(e) => updateForm('size', e.target.value)}>
                    <option>Small</option><option>Medium</option><option>Large</option><option>Extra Large</option>
                  </select>
                )}
              </div>

              {/* Pricing Section - Dynamic for Auctions */}
              <div className={styles.inputGroup}>
                <label>
                  {isLivestock ? (form.listingType === 'auction' ? 'Starting Bid ($)' : 'Price ($)') : 
                   isSupplies ? 'Market Price ($)' : 'Rehoming Fee ($)'}
                </label>
                <input type="number" placeholder="0 for free" value={form.price} onChange={(e) => updateForm('price', e.target.value)} />
                <span className={styles.note}>
                  {paymentsConfigured
                    ? 'Buyer checkout runs through Stripe-hosted billing when you are ready to accept payment.'
                    : 'Publish now. Paid checkout stays disabled until Stripe billing is connected.'}
                </span>
              </div>

              {/* Livestock Specific: Listing Type */}
              {isLivestock && (
                <div className={styles.inputGroup}>
                  <label>Listing Format</label>
                  <select value={form.listingType} onChange={(e) => updateForm('listingType', e.target.value)}>
                    <option value="auction">Live Auction</option>
                    <option value="fixed">Fixed Price Sale</option>
                  </select>
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
                <textarea rows={3} placeholder={isLivestock ? "Describe pedigrees, records..." : "Product details..."} value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
              </div>

              <div className={styles.inputGroup}>
                <label>Location *</label>
                <input type="text" placeholder="e.g. Austin, TX" value={form.location} onChange={(e) => updateForm('location', e.target.value)} />
              </div>

              {/* Conditional: Health (Only for Pets/Livestock) */}
              {!isSupplies && (
                <div className={styles.inputGroup}>
                  <label>Health Records</label>
                  <div style={{ display: 'flex', gap: '16px', paddingTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.vaccinated} onChange={(e) => updateForm('vaccinated', e.target.checked)} />
                      {isLivestock ? 'Records Available' : 'Vaccinated'}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.neutered} onChange={(e) => updateForm('neutered', e.target.checked)} />
                      {isLivestock ? 'Breeding Quality' : 'Spayed/Neutered'}
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
                Listings with rich details get 3x more serious inquiries.
              </p>
              <div className={styles.pillContainer}>
                {OPTIONAL_CATEGORIES.map(cat => (
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
                      placeholder={`Provide details about their ${cat.toLowerCase()}...`}
                      rows={3}
                      value={categoryNotes[cat] || ''}
                      onChange={(e) => setCategoryNotes(prev => ({ ...prev, [cat]: e.target.value }))}
                    />
                  </div>
                ))}
                {activeCategories.length === 0 && (
                  <div className={styles.emptyCategories}>
                    <p>Select a category above to add details.</p>
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
                Clear, well-lit photos help your listing get 5x more attention.
              </p>
            </div>
          )}

          {/* STEP 4: Monetize / Boost */}
          {step === 4 && (
            <div className={styles.boostSection}>
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
                       'Standard visibility. Your listing will appear in search results.'}
                    </p>
                    <span className={styles.boostPrice}>$0</span>
                  </div>
                  <div className={`${styles.boostOption} ${selectedMonetize === 'featured' ? styles.boostActive : ''}`}
                    onClick={() => setSelectedMonetize('featured')}>
                    <div className={styles.boostBadge}><Rocket size={16} /> Recommended</div>
                    <h3>
                      {isLivestock ? 'Elite Auction Placement' : 
                       isSupplies ? 'Premium Shelf Space' : 
                       'Featured Listing'}
                    </h3>
                    <p>
                      {isLivestock ? 'Featured styling plus priority placement near the top of the livestock feed for 7 days.' : 
                       isSupplies ? 'Featured styling plus stronger placement near the top of the supplies feed for 7 days.' : 
                       'Featured styling plus stronger placement near the top of pet search results for 7 days.'}
                    </p>
                    <span className={styles.boostPrice}>$15</span>
                  </div>
                  <div className={`${styles.boostOption} ${selectedMonetize === 'urgent' ? styles.boostActive : ''}`}
                    onClick={() => setSelectedMonetize('urgent')}>
                    <div className={styles.boostBadge}><Zap size={16} /> Fastest</div>
                    <h3>
                      {isLivestock ? 'Global Breeder Blast' : 
                       isSupplies ? 'Wholesale Network Blast' : 
                       'Urgent Network Blast'}
                    </h3>
                    <p>
                      {isLivestock ? 'Expanded feature treatment with an urgent badge and top-feed visibility for 7 days.' : 
                       isSupplies ? 'Expanded feature treatment with stronger wholesale visibility for 7 days.' : 
                       'Expanded feature treatment with stronger local visibility and an urgent badge for 7 days.'}
                    </p>
                    <span className={styles.boostPrice}>$50</span>
                  </div>
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

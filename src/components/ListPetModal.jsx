import React, { useState } from 'react';
import { X, UploadCloud, Rocket, Zap, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import styles from './ListPetModal.module.css';

const OPTIONAL_CATEGORIES = [
  'Personality', 
  'Medical History', 
  'Vaccination Record', 
  'Genetic Profile', 
  'Genealogy', 
  'Fun Facts'
];

const ListPetModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [selectedMonetize, setSelectedMonetize] = useState('none');
  
  // State for dynamic categories
  const [activeCategories, setActiveCategories] = useState([]);

  // State for mock images
  const [images, setImages] = useState([]);
  
  // State for Date of Birth
  const [dob, setDob] = useState('');

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    if (today.getDate() < birthDate.getDate()) {
       months--;
       if (months < 0) {
         months = 11;
       }
    }
    
    if (years === 0 && months === 0) return 'Less than a month';
    let ageStr = '';
    if (years > 0) ageStr += `${years} ${years === 1 ? 'Year' : 'Years'}`;
    if (months > 0) ageStr += `${years > 0 ? ', ' : ''}${months} ${months === 1 ? 'Month' : 'Months'}`;
    return ageStr.trim();
  };

  if (!isOpen) return null;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);
  
  const finishAndPublish = () => {
    alert(`Listing prepared! Checkout option: ${selectedMonetize}\nImages uploaded: ${images.length}`);
    setStep(1);
    setActiveCategories([]);
    setImages([]);
    onClose();
  };

  const toggleCategory = (cat) => {
    if (activeCategories.includes(cat)) {
      setActiveCategories(activeCategories.filter(c => c !== cat));
    } else {
      setActiveCategories([...activeCategories, cat]);
    }
  };

  const removeCategory = (cat) => {
    setActiveCategories(activeCategories.filter(c => c !== cat));
  };

  const mockUploadImage = () => {
    if (images.length >= 7) return;
    setImages([...images, { id: Date.now(), url: `https://fakeimg.pl/200x200/e2e8f0/64748b?text=Image+${images.length + 1}` }]);
  };

  const removeImage = (id) => {
    setImages(images.filter(img => img.id !== id));
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

        <div className={styles.body}>
          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Pet Name</label>
                <input type="text" placeholder="e.g. Luna" />
              </div>
              <div className={styles.inputGroup}>
                <label>Animal Type</label>
                <select>
                  <option>Dog</option>
                  <option>Cat</option>
                  <option>Bird</option>
                  <option>Reptile</option>
                  <option>Other</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Breed / Morph</label>
                <input type="text" placeholder="e.g. Bearded Dragon" />
              </div>
              <div className={styles.inputGroup}>
                <label>Date of Birth</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <label>Current Age</label>
                <input type="text" readOnly placeholder="Auto-calculated from DOB" value={calculateAge(dob)} style={{ backgroundColor: 'var(--color-surface-hover)', cursor: 'not-allowed' }} />
              </div>
              <div className={styles.inputGroup}>
                <label>Rehoming Fee ($)</label>
                <input type="number" placeholder="Enter amount or 0 for free" />
                <span className={styles.note}>Payments secured via Escrow.</span>
              </div>
              
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>General Description</label>
                <textarea rows={3} placeholder="Tell us a little bit about this pet..."></textarea>
              </div>

              <div className={styles.inputGroup}>
                <label>Location (City, State)</label>
                <input type="text" placeholder="e.g. Austin, TX" />
              </div>
              <div>{/* Empty spacer for grid */}</div>

              {/* Contact Information */}
              <div className={styles.inputGroup}>
                <label>Phone Number</label>
                <input type="tel" placeholder="(555) 555-5555" />
              </div>
              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <input type="email" placeholder="you@example.com" />
              </div>
            </div>
          )}

          {/* STEP 2: Optional Categories */}
          {step === 2 && (
            <div className={styles.optionalSection}>
              <p className={styles.sectionDesc}>
                Listings with rich details get 3x more serious inquiries. Add any sections you'd like to include below:
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
                      <button className={styles.removeCatBtn} onClick={() => removeCategory(cat)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <textarea 
                      placeholder={`Provide details about their ${cat.toLowerCase()}...`}
                      rows={3}
                    />
                  </div>
                ))}
                
                {activeCategories.length === 0 && (
                  <div className={styles.emptyCategories}>
                    <p>Select a category above to add specific details to your pet's profile.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Photos */}
          {step === 3 && (
            <div className={styles.uploadSection}>
               <div className={styles.uploadMetrics}>
                 <span>Uploaded: <strong>{images.length}/7</strong></span>
               </div>
               
               <div className={styles.imageGrid}>
                 {images.map(img => (
                   <div key={img.id} className={styles.imageThumb}>
                     <img src={img.url} alt="Uploaded preview" />
                     <button className={styles.removeImgBtn} onClick={() => removeImage(img.id)}>
                       <X size={14} />
                     </button>
                   </div>
                 ))}
                 
                 {images.length < 7 && (
                   <button className={styles.uploadTrigger} onClick={mockUploadImage}>
                     <ImageIcon size={28} className={styles.uploadIcon} />
                     <span>Add Photo</span>
                   </button>
                 )}
               </div>
               
               {images.length === 0 && (
                 <div className={styles.uploadEmptyState}>
                   <UploadCloud size={48} className={styles.uploadIconLarge} />
                   <p>Click "Add Photo" to upload up to 7 images of your pet.</p>
                 </div>
               )}
            </div>
          )}

          {/* STEP 4: Monetization */}
          {step === 4 && (
            <div className={styles.monetizeOptions}>
              <div 
                className={`${styles.monetizeCard} ${selectedMonetize === 'none' ? styles.monetizeCardActive : ''}`}
                onClick={() => setSelectedMonetize('none')}
              >
                <div className={styles.radioContainer}>
                  <div className={`${styles.radio} ${selectedMonetize === 'none' ? styles.radioSelected : ''}`} />
                  <div>
                    <h4>Standard Verification (Free)</h4>
                    <p>Listed normally in the gallery. Direct messaging requires buyers to pay a $2 Serious Inquiry fee.</p>
                  </div>
                </div>
              </div>

              <div 
                className={`${styles.monetizeCard} ${styles.premiumCard} ${selectedMonetize === 'boost' ? styles.monetizeCardActive : ''}`}
                onClick={() => setSelectedMonetize('boost')}
              >
                <div className={styles.premiumBanner}>Popular</div>
                <div className={styles.radioContainer}>
                  <div className={`${styles.radio} ${styles.radioPremium} ${selectedMonetize === 'boost' ? styles.radioSelected : ''}`} />
                  <div>
                    <h4 className={styles.premiumText}><Rocket size={16} /> Premium Boost ($15)</h4>
                    <p>Pin your listing to the top of searches and feature it on the homepage for 7 days. Add a premium gold border.</p>
                  </div>
                </div>
              </div>

              <div 
                className={`${styles.monetizeCard} ${styles.blastCard} ${selectedMonetize === 'blast' ? styles.monetizeCardActive : ''}`}
                onClick={() => setSelectedMonetize('blast')}
              >
                <div className={styles.radioContainer}>
                  <div className={`${styles.radio} ${styles.radioBlast} ${selectedMonetize === 'blast' ? styles.radioSelected : ''}`} />
                  <div>
                    <h4 className={styles.blastText}><Zap size={16} /> Urgent Network Blast ($50)</h4>
                    <p>We will immediately send an email/SMS blast with your pet's profile to verified users in a 50-mile radius.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 1 ? (
             <button className="btn btn-secondary" onClick={handleBack}>Back</button>
          ) : (
             <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          )}

          {step < 4 ? (
             <button className="btn btn-primary" onClick={handleNext} disabled={step === 3 && images.length === 0}>
               Next Step
             </button>
          ) : (
             <button className="btn btn-premium" onClick={finishAndPublish}>
               {selectedMonetize === 'none' ? 'Publish Listing' : 'Proceed to Checkout'}
             </button>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default ListPetModal;

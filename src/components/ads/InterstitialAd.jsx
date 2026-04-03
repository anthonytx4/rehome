const InterstitialAd = ({ isOpen, onClose }) => {
  if (isOpen && typeof onClose === 'function') {
    onClose();
  }
  return null;
};

export default InterstitialAd;

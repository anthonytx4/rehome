/**
 * Mask an email address for privacy (e.g. anthonytx4@gmail.com -> a********4@gmail.com)
 * @param {string} email 
 * @returns {string}
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  
  const [user, domain] = email.split('@');
  if (!domain) return email;
  
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  
  return `${user[0]}${'*'.repeat(user.length - 2)}${user[user.length - 1]}@${domain}`;
};

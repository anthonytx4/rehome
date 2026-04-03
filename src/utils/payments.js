import api from '../api/client';

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);
const normalizeMembershipTier = (tier) => (tier === 'royal' ? 'breeder' : tier || 'breeder');

export async function startCheckout({
  type,
  amount,
  description,
  metadata = {},
  successPath = '/dashboard',
  cancelPath = '/dashboard',
}) {
  const res = await api.post('/payments/checkout', {
    type,
    amount,
    description,
    metadata,
    successPath,
    cancelPath,
  });

  const destination = res.data.url || res.data.redirectUrl;
  if (destination) {
    if (isAbsoluteUrl(destination)) {
      window.location.assign(destination);
    } else {
      window.location.assign(destination);
    }
  }

  return res.data;
}

export function startMembershipCheckout({ tier = 'breeder', amount = 25, cancelPath = '/' } = {}) {
  return startCheckout({
    type: 'membership',
    amount,
    description: 'Verified Breeder Membership',
    metadata: { tier: normalizeMembershipTier(tier) },
    successPath: '/dashboard',
    cancelPath,
  });
}

export async function startBillingPortal() {
  const res = await api.post('/payments/portal');
  const destination = res.data.url;
  if (destination) {
    window.location.assign(destination);
  }
  return res.data;
}

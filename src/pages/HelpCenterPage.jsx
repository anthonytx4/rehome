import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BadgeCheck, FileText, HeartHandshake, ShieldCheck, MessageSquareWarning } from 'lucide-react';
import styles from './HelpCenterPage.module.css';

const FAQS = [
  {
    question: 'How does Rehome keep conversations safer?',
    answer: 'Opening messages stay on-platform. Buyers and sellers should confirm identity, records, and handoff details before sharing any off-platform contact or payment information.',
  },
  {
    question: 'When should a listing be reviewed before going live?',
    answer: 'Listings can be held for review when they look incomplete, mention risky payment or contact methods, or include claims that need a closer moderation check.',
  },
  {
    question: 'Should I pay before I see the animal or goods?',
    answer: 'No. Verify identity, health or condition records, pickup terms, and what is included before sending money. Use on-platform payment tools only when they are clearly enabled and working.',
  },
  {
    question: 'What makes a listing high quality?',
    answer: 'Use recent photos, a specific location, accurate breed or item details, clear pricing, honest health or condition notes, and transparent pickup or delivery expectations.',
  },
];

const QUICK_GUIDES = [
  {
    icon: <ShieldCheck size={20} />,
    title: 'Safe Rehoming',
    copy: 'Verify ownership, review records, meet responsibly, and keep payment expectations clear before handoff.',
  },
  {
    icon: <FileText size={20} />,
    title: 'Listing Standards',
    copy: 'Every listing should have meaningful photos, a real location, transparent pricing, and specific condition or health details.',
  },
  {
    icon: <MessageSquareWarning size={20} />,
    title: 'Fraud Prevention',
    copy: 'Avoid off-platform payment handles, rushed deposits, mystery shipping promises, or contact requests that bypass the marketplace.',
  },
];

const SAFETY_CHECKLIST = [
  'Confirm the seller or buyer is the real person you are dealing with before sharing private information.',
  'Ask for vaccination, veterinary, breeding, ownership, or condition records when those details matter.',
  'Use a public, appropriate handoff plan and document what is included in the exchange.',
  'Treat urgent pressure, wire requests, crypto, gift cards, or “ship anywhere” promises as warning signs.',
  'Do not rely on badges or copy alone. Verify the listing, the person, and the terms yourself.',
];

const LISTING_STANDARDS = [
  'Include at least one recent image that matches the actual animal or goods being listed.',
  'Write a description that covers temperament, care needs, condition, health notes, or what is included.',
  'Use an accurate location and honest pricing. Explain lot size, reserve price, or handoff terms when relevant.',
  'Do not imply shipping, escrow protection, or breeder verification unless that exact feature is live and true.',
];

const PROHIBITED_BEHAVIOR = [
  'Requests for off-platform payment before trust is established.',
  'Phone numbers, email addresses, messaging-app handles, or external links in risky first-contact outreach.',
  'Misleading health, ownership, pedigree, condition, or shipping claims.',
  'Listings that appear abusive, exploitative, prohibited by law, or unsafe for animal welfare.',
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

const HelpCenterPage = () => {
  return (
    <div className={styles.page}>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Help Center</p>
          <h1>Trust, safety, and marketplace guidance for responsible rehoming.</h1>
          <p className={styles.subtitle}>
            Use this guide to create stronger listings, spot risky behavior early, and understand what a production-ready marketplace flow should look like on Rehome.
          </p>
          <div className={styles.heroActions}>
            <Link to="/privacy#trust-safety" className="btn btn-primary">Read Trust Policy</Link>
            <Link to="/register" className="btn btn-secondary">Create an Account</Link>
          </div>
        </div>

      </section>

      <section className={styles.guidesGrid}>
        {QUICK_GUIDES.map((guide) => (
          <article key={guide.title} className={styles.guideCard}>
            <div className={styles.guideIcon}>{guide.icon}</div>
            <h2>{guide.title}</h2>
            <p>{guide.copy}</p>
          </article>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <HeartHandshake size={20} />
          <h2>Safe Rehoming Checklist</h2>
        </div>
        <div className={styles.listGrid}>
          {SAFETY_CHECKLIST.map((item) => (
            <div key={item} className={styles.listCard}>
              <BadgeCheck size={18} />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <FileText size={20} />
          <h2>Listing Quality Standards</h2>
        </div>
        <div className={styles.twoColumn}>
          <div className={styles.panel}>
            <h3>What every listing should include</h3>
            <ul className={styles.bulletList}>
              {LISTING_STANDARDS.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className={styles.panel}>
            <h3>What Rehome may hold for review</h3>
            <ul className={styles.bulletList}>
              {PROHIBITED_BEHAVIOR.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <ShieldCheck size={20} />
          <h2>Frequently Asked Questions</h2>
        </div>
        <div className={styles.faqList}>
          {FAQS.map((item) => (
            <article key={item.question} className={styles.faqItem}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.bottomCta}>
        <h2>Need policy details too?</h2>
        <p>Pair this help guide with the live privacy, payment, and marketplace policy page before you accept any high-trust or high-value transactions.</p>
        <div className={styles.heroActions}>
          <Link to="/privacy" className="btn btn-primary">Open Privacy & Terms</Link>
          <Link to="/" className="btn btn-secondary">Browse Listings</Link>
        </div>
      </section>
    </div>
  );
};

export default HelpCenterPage;

import React, { useState } from 'react';

interface ScamType {
  icon: string;
  title: string;
  description: string;
  examples: string[];
  whatToDo: string;
}

const SCAM_TYPES: ScamType[] = [
  {
    icon: '🎣',
    title: 'Phishing Emails',
    description: 'Fake emails pretending to be from a company you trust, like your bank or Amazon.',
    examples: [
      '"Your account has been suspended. Click here to verify."',
      '"Unusual activity detected. Sign in now to secure your account."',
    ],
    whatToDo: 'Never click links in suspicious emails. Go directly to the company\'s website by typing the address yourself.',
  },
  {
    icon: '⏰',
    title: 'Urgency Scams',
    description: 'Emails that pressure you to act immediately, hoping you won\'t have time to think.',
    examples: [
      '"Act within 24 hours or your account will be closed!"',
      '"URGENT: Final notice — pay now to avoid legal action."',
    ],
    whatToDo: 'Real companies give you time to respond. If something feels urgent, call the company directly to verify.',
  },
  {
    icon: '🏦',
    title: 'Fake Banking Emails',
    description: 'Emails that look like they come from your bank, asking for personal or financial information.',
    examples: [
      '"Please update your banking details to continue service."',
      '"Your transaction of ₹50,000 is pending. Click to confirm."',
    ],
    whatToDo: 'Banks never ask for passwords, PINs, or OTPs via email. Call your bank directly if concerned.',
  },
  {
    icon: '🎁',
    title: 'Prize & Lottery Scams',
    description: 'Emails claiming you\'ve won money or a prize you never entered for.',
    examples: [
      '"Congratulations! You\'ve won $1,000,000 in our international lottery!"',
      '"You\'ve been selected for an exclusive gift. Claim now!"',
    ],
    whatToDo: 'You can\'t win a lottery you didn\'t enter. These are always scams. Delete the email.',
  },
  {
    icon: '👤',
    title: 'Impersonation',
    description: 'Someone pretending to be a person or organization you know to trick you.',
    examples: [
      'An email from "Microsoft Support" with a Gmail address.',
      'A message from "IRS" asking you to pay a fine in gift cards.',
    ],
    whatToDo: 'Check the sender\'s email address carefully. Contact the real person or company through known channels.',
  },
  {
    icon: '🔑',
    title: 'Password & OTP Theft',
    description: 'Emails designed to steal your login information or one-time passwords.',
    examples: [
      '"Enter your OTP here to verify your identity."',
      '"Your password is expiring. Click here to update it."',
    ],
    whatToDo: 'Never share OTPs or passwords with anyone. No legitimate service asks for these by email.',
  },
  {
    icon: '💰',
    title: 'Payment Scams',
    description: 'Requests for money through unusual methods like gift cards, wire transfers, or cryptocurrency.',
    examples: [
      '"Please purchase 3 Google Play gift cards and send us the codes."',
      '"Transfer the amount to this UPI ID immediately."',
    ],
    whatToDo: 'Legitimate companies never request payment through gift cards or direct transfers. Ask a family member first.',
  },
];

/** Scam education page with interactive cards */
export function Education() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-display font-bold text-xl text-text-primary dark:text-text-primary-dark">
          Learn About Scams
        </h2>
        <p className="font-body text-sm text-text-secondary dark:text-text-secondary-dark mt-1">
          Tap on a scam type to learn more and stay protected.
        </p>
      </div>

      {/* Scam type cards */}
      <div className="space-y-2.5">
        {SCAM_TYPES.map((scam, index) => (
          <ScamCard
            key={index}
            scam={scam}
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
            index={index}
          />
        ))}
      </div>

      {/* Emergency section */}
      <div className="card bg-gradient-to-br from-high-50 to-dangerous-50
                     dark:from-high/10 dark:to-dangerous/10 border border-high/20">
        <h3 className="font-display font-bold text-base text-high-dark dark:text-high mb-2">
          🆘 Think You've Been Scammed?
        </h3>
        <ul className="space-y-2.5">
          <li className="font-body text-sm text-text-primary dark:text-text-primary-dark flex items-start gap-2">
            <span className="flex-shrink-0">1️⃣</span>
            <span>Don't panic. Stop communicating with the scammer.</span>
          </li>
          <li className="font-body text-sm text-text-primary dark:text-text-primary-dark flex items-start gap-2">
            <span className="flex-shrink-0">2️⃣</span>
            <span>Change your passwords immediately if you shared any.</span>
          </li>
          <li className="font-body text-sm text-text-primary dark:text-text-primary-dark flex items-start gap-2">
            <span className="flex-shrink-0">3️⃣</span>
            <span>Call your bank if you shared financial information.</span>
          </li>
          <li className="font-body text-sm text-text-primary dark:text-text-primary-dark flex items-start gap-2">
            <span className="flex-shrink-0">4️⃣</span>
            <span>Report the scam to your local cyber crime authority.</span>
          </li>
          <li className="font-body text-sm text-text-primary dark:text-text-primary-dark flex items-start gap-2">
            <span className="flex-shrink-0">5️⃣</span>
            <span>Tell a trusted family member or friend what happened.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function ScamCard({
  scam,
  isExpanded,
  onToggle,
  index,
}: {
  scam: ScamType;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <div
      className="card cursor-pointer transition-all duration-200 animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onToggle}
      role="button"
      aria-expanded={isExpanded}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{scam.icon}</span>
          <h3 className="font-display font-bold text-sm text-text-primary dark:text-text-primary-dark">
            {scam.title}
          </h3>
        </div>
        <span
          className={`text-text-secondary dark:text-text-secondary-dark transform transition-transform
                     duration-200 text-xs ${isExpanded ? 'rotate-90' : ''}`}
        >
          ▶
        </span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 space-y-3 animate-slide-down">
          <p className="font-body text-sm text-text-secondary dark:text-text-secondary-dark">
            {scam.description}
          </p>

          <div>
            <p className="font-display font-semibold text-xs text-text-primary dark:text-text-primary-dark mb-1.5">
              Examples:
            </p>
            {scam.examples.map((ex, i) => (
              <p
                key={i}
                className="font-body text-xs italic text-text-secondary dark:text-text-secondary-dark
                          pl-3 border-l-2 border-suspicious/30 mb-1.5"
              >
                {ex}
              </p>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-safe-50 dark:bg-safe/10 border border-safe/20">
            <p className="font-display font-semibold text-xs text-safe-dark dark:text-safe mb-1">
              ✅ What to do:
            </p>
            <p className="font-body text-xs text-text-primary dark:text-text-primary-dark">
              {scam.whatToDo}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

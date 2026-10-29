/**
 * HelpSection
 *
 * Sub-sections (all based on real project information — nothing invented):
 *
 * 1. Patent Submission Guidelines  — derived from README workflow + role docs
 * 2. User Manual                   — not available; clearly marked placeholder
 * 3. Frequently Asked Questions    — based on actual portal workflow
 * 4. Contact Information           — no real contact exists in project; shown
 *                                    as "not yet configured" placeholders
 * 5. Report a Technical Issue      — local-only form (no email backend exists);
 *                                    labelled clearly as "copies to clipboard"
 * 6. About                         — real app name, version, tech stack
 * 7. Application version           — read from APP_CONFIG.appVersion (constants.js)
 *
 * Rules enforced:
 *   - No invented phone numbers, email addresses, or support URLs.
 *   - Every link goes to a real destination or is disabled with an explanation.
 *   - Unavailable resources are shown with a dashed placeholder, not hidden.
 */

import { useState } from 'react'
import {
  FileText,
  BookOpen,
  HelpCircle,
  Mail,
  AlertTriangle,
  Info,
  ChevronDown,
  Users,
  CheckCircle,
  Tag,
  Cpu,
  Phone,
  MapPin,
  ClipboardCopy,
  Globe,
} from 'lucide-react'
import { APP_CONFIG } from '../../utils/constants'
import './HelpSection.css'

// ── Data ────────────────────────────────────────────────────────────────────

const SUBMISSION_STEPS = [
  {
    title: 'Create a Patent Application',
    desc: 'Log in as an Applicant and click "New Patent Application" from the Dashboard. Fill in the invention title, description, category, and co-inventor details.',
  },
  {
    title: 'Upload Technical Disclosure',
    desc: 'Attach supporting documents (PDF, DOCX) that describe the invention. You may also upload the signed NDA at this stage.',
  },
  {
    title: 'Submit for Review',
    desc: 'Once all mandatory fields and documents are complete, click "Submit". The application moves to the Scrutinizer queue.',
  },
  {
    title: 'Scrutiny Stage',
    desc: 'A Scrutinizer reviews the disclosure, may request corrections or clarifications, and can forward the application to a Consultant for technical evaluation.',
  },
  {
    title: 'Consultant Evaluation',
    desc: 'The assigned Consultant assesses novelty and recommends approval or rejection. You can track the status and any remarks from your Dashboard.',
  },
  {
    title: 'Final Decision',
    desc: 'The Scrutinizer or Admin issues the final Approved or Rejected status. Approved applications proceed to formal patent filing outside this portal.',
  },
]

const ROLES_INFO = [
  {
    title: 'Applicant',
    desc: 'Students and Faculty who submit patent applications and track their progress.',
  },
  {
    title: 'Scrutinizer',
    desc: 'Internal IP Cell reviewers who validate applications and coordinate evaluations.',
  },
  {
    title: 'Consultant',
    desc: 'Patent attorneys or external experts who assess technical novelty.',
  },
  {
    title: 'Admin',
    desc: 'IP Cell coordinators who manage users, departments, and assignments.',
  },
]

const FAQS = [
  {
    q: 'Who can submit a patent application?',
    a: 'Any registered Applicant — student or faculty — can submit a patent application. You must be registered with a valid institutional email address ending in @sjec.ac.in.',
  },
  {
    q: 'What file formats are accepted for document uploads?',
    a: 'The portal accepts PDF and DOCX files. Ensure your disclosure document, supporting files, and NDA are in one of these formats before uploading.',
  },
  {
    q: 'Why is my application stuck in "Under Scrutiny"?',
    a: 'The Scrutinizer may be reviewing your application or awaiting clarification. Check the Remarks section on your patent detail page — reviewers can leave comments requesting corrections or additional information.',
  },
  {
    q: 'Can I edit my application after submitting it?',
    a: 'Once submitted, the application is locked for editing. You may add additional supporting documents. If corrections are required, the Scrutinizer will return the application to Draft status.',
  },
  {
    q: 'How do I know which Consultant is reviewing my patent?',
    a: 'Once your application is forwarded to a Consultant, the assigned consultant\'s name appears on your patent detail page. You will also receive an in-app notification.',
  },
  {
    q: 'I forgot my password. How do I reset it?',
    a: 'Use the "Security & Password" section under Settings to change your password if you are logged in. If you cannot log in, contact your IP Cell administrator to have your password reset.',
  },
  {
    q: 'Are notifications sent by email?',
    a: 'Currently only in-app notifications are supported. Email delivery is planned for a future release. You can configure which in-app notifications you receive under Settings → Notifications.',
  },
  {
    q: 'How are patent IDs generated?',
    a: 'Patent IDs are generated automatically using the format: SJEC-{DEPT}-{YEAR}-{SEQUENCE}. The department code is derived from the applicant\'s registered department.',
  },
]

const ISSUE_CATEGORIES = [
  'Login or authentication problem',
  'Cannot submit application',
  'Document upload failing',
  'Notification not received',
  'Wrong information displayed',
  'Permission or access denied',
  'Other technical issue',
]

// ── FAQ accordion item ──────────────────────────────────────────────────────

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="help-faq__item">
      <button
        type="button"
        className="help-faq__question"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {question}
        <ChevronDown
          size={16}
          className={`help-faq__chevron${open ? ' help-faq__chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && <p className="help-faq__answer">{answer}</p>}
    </div>
  )
}

// ── Report Issue form ───────────────────────────────────────────────────────

function ReportIssueCard() {
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [copied, setCopied]   = useState(false)

  const handleCopy = () => {
    if (!description.trim()) return
    const text = `Issue Category: ${category || 'Not specified'}\n\nDescription:\n${description.trim()}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3500)
    })
  }

  return (
    <div className="help-card">
      <div className="help-card__heading">
        <div className="help-card__heading-icon"><AlertTriangle size={17} /></div>
        <div className="help-card__heading-text">
          <h3>Report a Technical Issue</h3>
          <p>Describe the problem so the administrator can investigate.</p>
        </div>
      </div>
      <div className="help-card__body">
        {/* Notice — no backend email exists */}
        <div className="help-unavailable" style={{ marginBottom: 16 }}>
          <Info size={14} className="help-unavailable__icon" />
          <span>
            Automated issue submission is not configured. Use this form to compose your
            report, then copy it and send it directly to your IP Cell administrator.
          </span>
        </div>

        <div className="help-report-form">
          <div className="help-report-field">
            <label htmlFor="issue-category">Issue Category</label>
            <select
              id="issue-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">— Select a category —</option>
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="help-report-field">
            <label htmlFor="issue-desc">Description</label>
            <textarea
              id="issue-desc"
              placeholder="Describe the issue in detail — what you were doing, what you expected, and what actually happened."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {copied && (
            <div className="help-report__sent" role="status">
              <CheckCircle size={15} /> Report copied to clipboard. Paste it into an email to your administrator.
            </div>
          )}

          <p className="help-report__notice">
            <Info size={12} style={{ flexShrink: 0, marginTop: 2 }} />
            Clicking "Copy Report" copies the issue text to your clipboard so you can paste it into an email or message.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn--primary btn--medium"
              onClick={handleCopy}
              disabled={!description.trim()}
            >
              <ClipboardCopy size={14} /> Copy Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Contact card ────────────────────────────────────────────────────────────

function ContactCard() {
  return (
    <div className="help-card">
      <div className="help-card__heading">
        <div className="help-card__heading-icon"><Mail size={17} /></div>
        <div className="help-card__heading-text">
          <h3>Contact Information</h3>
          <p>Reach the IP Cell for application support or queries.</p>
        </div>
      </div>
      <div className="help-card__body">
        <div className="help-contact-row">
          <div className="help-contact-row__icon"><Mail size={16} /></div>
          <div className="help-contact-row__info">
            <p className="help-contact-row__label">Email</p>
            <p className="help-contact-row__value help-contact-row__value--placeholder">
              Contact email not yet configured — ask your administrator.
            </p>
          </div>
        </div>

        <div className="help-contact-row">
          <div className="help-contact-row__icon"><Phone size={16} /></div>
          <div className="help-contact-row__info">
            <p className="help-contact-row__label">Phone</p>
            <p className="help-contact-row__value help-contact-row__value--placeholder">
              Phone number not yet configured.
            </p>
          </div>
        </div>

        <div className="help-contact-row">
          <div className="help-contact-row__icon"><MapPin size={16} /></div>
          <div className="help-contact-row__info">
            <p className="help-contact-row__label">Office</p>
            <p className="help-contact-row__value help-contact-row__value--placeholder">
              Office location not yet configured.
            </p>
          </div>
        </div>

        <div className="help-contact-row">
          <div className="help-contact-row__icon"><Globe size={16} /></div>
          <div className="help-contact-row__info">
            <p className="help-contact-row__label">Website</p>
            <p className="help-contact-row__value help-contact-row__value--placeholder">
              Portal website URL not yet configured.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── About card ──────────────────────────────────────────────────────────────

function AboutCard() {
  return (
    <div className="help-card">
      <div className="help-card__heading">
        <div className="help-card__heading-icon"><Info size={17} /></div>
        <div className="help-card__heading-text">
          <h3>About This Portal</h3>
          <p>Application details and technology information.</p>
        </div>
      </div>
      <div className="help-card__body">
        <div className="help-about">
          <div className="help-about__logo-row">
            <div className="help-about__logo-pill">SJ</div>
            <div>
              <p className="help-about__app-name">{APP_CONFIG.appName}</p>
              <p className="help-about__tagline">
                Role-based IP Cell portal for college patent management
              </p>
            </div>
          </div>

          <div className="help-about__meta">
            <div className="help-about__meta-row">
              <span className="help-about__meta-label">Version</span>
              <span className="help-about__meta-value">
                <span className="help-version-badge">
                  <Tag size={11} /> v{APP_CONFIG.appVersion}
                </span>
              </span>
            </div>
            <div className="help-about__meta-row">
              <span className="help-about__meta-label">Purpose</span>
              <span className="help-about__meta-value">
                Manage patent applications from submission through scrutiny, consultant
                evaluation, and final decision for SJEC's Intellectual Property Cell.
              </span>
            </div>
            <div className="help-about__meta-row">
              <span className="help-about__meta-label">User Roles</span>
              <span className="help-about__meta-value">
                Applicant · Scrutinizer · Consultant · Admin
              </span>
            </div>
            <div className="help-about__meta-row">
              <span className="help-about__meta-label">Tech Stack</span>
              <span className="help-about__meta-value">
                <div className="help-about__stack-chips">
                  {['Django 4.2', 'DRF', 'SimpleJWT', 'React 18', 'Vite', 'SQLite / PostgreSQL'].map((t) => (
                    <span key={t} className="help-about__chip">{t}</span>
                  ))}
                </div>
              </span>
            </div>
            <div className="help-about__meta-row">
              <span className="help-about__meta-label">Environment</span>
              <span className="help-about__meta-value">
                {import.meta.env.VITE_ENV || 'development'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

function HelpSection() {
  return (
    <div>
      <div className="help-section__header">
        <h2>Help &amp; Support</h2>
        <p>Submission guidelines, FAQs, contact information, and details about this portal.</p>
      </div>

      {/* 1. Submission Guidelines */}
      <div className="help-card">
        <div className="help-card__heading">
          <div className="help-card__heading-icon"><FileText size={17} /></div>
          <div className="help-card__heading-text">
            <h3>Patent Submission Guidelines</h3>
            <p>Follow these steps to submit your patent application successfully.</p>
          </div>
        </div>
        <div className="help-card__body">
          <ol className="help-steps">
            {SUBMISSION_STEPS.map((step, i) => (
              <li key={i} className="help-step">
                <span className="help-step__number">{i + 1}</span>
                <div className="help-step__content">
                  <p className="help-step__title">{step.title}</p>
                  <p className="help-step__desc">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="help-role-grid" style={{ marginTop: 20 }}>
            {ROLES_INFO.map((r) => (
              <div key={r.title} className="help-role-card">
                <p className="help-role-card__title"><Users size={12} />{r.title}</p>
                <p className="help-role-card__desc">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. User Manual — not available */}
      <div className="help-card">
        <div className="help-card__heading">
          <div className="help-card__heading-icon"><BookOpen size={17} /></div>
          <div className="help-card__heading-text">
            <h3>User Manual</h3>
            <p>Detailed documentation for all portal features.</p>
          </div>
        </div>
        <div className="help-card__body">
          <div className="help-unavailable">
            <Info size={14} className="help-unavailable__icon" />
            <span>
              A user manual has not been published for this portal yet. Please refer to
              the submission guidelines above or contact your IP Cell administrator for
              assistance.
            </span>
          </div>
        </div>
      </div>

      {/* 3. FAQs */}
      <div className="help-card">
        <div className="help-card__heading">
          <div className="help-card__heading-icon"><HelpCircle size={17} /></div>
          <div className="help-card__heading-text">
            <h3>Frequently Asked Questions</h3>
            <p>Answers to common questions about using the portal.</p>
          </div>
        </div>
        <div className="help-card__body">
          <div className="help-faq">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </div>

      {/* 4. Contact */}
      <ContactCard />

      {/* 5. Report Issue */}
      <ReportIssueCard />

      {/* 6 & 7. About + Version */}
      <AboutCard />
    </div>
  )
}

export default HelpSection

import { ClipboardCheck, FileText, GraduationCap, Lightbulb, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import './AboutPage.css'

const portalFeatures = [
  {
    icon: FileText,
    title: 'Submit applications',
    text: 'Students and faculty can record an invention, add inventors, and submit a complete patent application.',
  },
  {
    icon: ClipboardCheck,
    title: 'Coordinate review',
    text: 'The IP Cell can scrutinize disclosures, request revisions, and move strong applications through review.',
  },
  {
    icon: ShieldCheck,
    title: 'Track every step',
    text: 'Keep application documents, decisions, remarks, and status history together in one dependable workspace.',
  },
]

function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-page__hero">
        <div className="about-page__hero-copy">
          <p className="about-page__eyebrow">Excellence since 2002</p>
          <h1>Best engineering college in Mangalore</h1>
          <h2 className="about-page__hero-college-name">St. Joseph Engineering College</h2>
          <p className="about-page__lead">
            Empowering future engineers through quality education, innovative learning,
            and a clear path for research and intellectual property.
          </p>
          <div className="about-page__hero-actions">
            <Link to="/login" className="about-page__cta">Sign in to the portal</Link>
            <a href="#purpose" className="about-page__cta about-page__cta--secondary">Explore the workflow</a>
          </div>
        </div>
        <div className="about-page__hero-media">
          <img src="/photos/About.png" alt="St. Joseph Engineering College campus" />
        </div>
      </section>

      <section className="about-page__college" aria-labelledby="college-heading">
        <div className="about-page__section-heading">
          <span className="about-page__icon"><GraduationCap size={22} /></span>
          <div>
            <p className="about-page__eyebrow">About the college</p>
            <h2 id="college-heading">A place for engineering, research, and responsible innovation.</h2>
          </div>
        </div>
        <div className="about-page__college-copy">
          <p>
            St. Joseph Engineering College, Mangaluru, is an autonomous institution committed
            to engineering education, applied research, and the development of solutions that
            serve society. The college creates an environment where students, faculty, and
            industry partners can turn thoughtful work into meaningful outcomes.
          </p>
          <p>
            This portal supports that mission by giving the college Intellectual Property Cell
            a consistent way to manage disclosures and patent applications from first submission
            through scrutiny, consultation, and filing readiness.
          </p>
        </div>
      </section>

      <section className="about-page__purpose" id="purpose" aria-labelledby="purpose-heading">
        <div className="about-page__section-heading">
          <span className="about-page__icon"><Lightbulb size={22} /></span>
          <div>
            <p className="about-page__eyebrow">What this website is for</p>
            <h2 id="purpose-heading">One workspace for the college patent lifecycle.</h2>
          </div>
        </div>
        <div className="about-page__features">
          {portalFeatures.map(({ icon: Icon, title, text }) => (
            <article className="about-page__feature" key={title}>
              <span className="about-page__feature-icon"><Icon size={20} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AboutPage

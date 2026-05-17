import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

const FOOTER_LINKS = {
  Shop: [
    { label: 'All Products', to: '/shop' },
    { label: 'Clothing', to: '/shop?category=clothing' },
    { label: 'Gadgets', to: '/shop?category=gadgets' },
    { label: 'Tech', to: '/shop?category=tech' },
  ],
  Account: [
    { label: 'Sign In', to: '/login' },
    { label: 'Register', to: '/register' },
    { label: 'My Orders', to: '/orders' },
    { label: 'Profile', to: '/profile' },
  ],
  Info: [
    { label: 'About', to: '#' },
    { label: 'Shipping Policy', to: '#' },
    { label: 'Returns', to: '#' },
    { label: 'Contact', to: '#' },
  ],
}

/**
 * Site footer with link columns and marquee strip.
 */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Marquee strip */}
      <div className={styles.marqueeWrapper} aria-hidden="true">
        <div className={styles.marquee}>
          {Array(6).fill('NOVUS — FASHION MEETS TECHNOLOGY — FREE SHIPPING OVER $150 — ').map((t, i) => (
            <span key={i} className={styles.marqueeItem}>{t}</span>
          ))}
        </div>
      </div>

      <div className={styles.inner}>
        {/* Brand */}
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>NOVUS</Link>
          <p className={styles.tagline}>
            Where editorial fashion meets<br />cutting-edge technology.
          </p>
          <div className={styles.socials}>
            {['IG', 'TW', 'TK', 'YT'].map((s) => (
              <a key={s} href="#" className={styles.social} aria-label={s}>{s}</a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title} className={styles.column}>
            <h3 className={styles.columnTitle}>{title}</h3>
            <ul className={styles.linkList}>
              {links.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className={styles.link}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} NOVUS. All rights reserved.</span>
        <span>Built with React + Vite</span>
      </div>
    </footer>
  )
}

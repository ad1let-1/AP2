import { Link } from 'react-router-dom'
import styles from './AdminPageHeader.module.css'

export default function AdminPageHeader({ title, breadcrumbs = [], action }) {
  return (
    <div className={styles.header}>
      <div>
        {breadcrumbs.length > 0 && (
          <nav className={styles.breadcrumbs}>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className={styles.crumbItem}>
                {crumb.to ? (
                  <Link to={crumb.to} className={styles.crumbLink}>{crumb.label}</Link>
                ) : (
                  <span className={styles.crumbCurrent}>{crumb.label}</span>
                )}
                {i < breadcrumbs.length - 1 && (
                  <span className={styles.crumbSep}>/</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className={styles.title}>{title}</h1>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}

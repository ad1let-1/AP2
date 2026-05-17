import { useState } from 'react'
import { motion } from 'framer-motion'
import PageTransition from '../components/ui/PageTransition'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { useUpdateProfile } from '../hooks/useAuth'
import styles from './ProfilePage.module.css'

/**
 * User profile page with editable info and account stats.
 */
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })

  const updateMutation = useUpdateProfile()

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate(form, { onSuccess: () => setEditing(false) })
  }

  return (
    <PageTransition>
      <div className="container">
        <h1 className={styles.pageTitle}>My Profile</h1>

        <div className={styles.layout}>
          {/* ---- Profile card ---- */}
          <motion.div
            className={styles.profileCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.avatar}>
              <span className={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <h2 className={styles.userName}>{user?.name}</h2>
            <p className={styles.userEmail}>{user?.email}</p>

            <div className={styles.stats}>
              {[
                { label: 'Member Since', value: '2026' },
                { label: 'Total Orders', value: '—' },
                { label: 'Wishlist', value: '—' },
              ].map(({ label, value }) => (
                <div key={label} className={styles.stat}>
                  <span className={styles.statValue}>{value}</span>
                  <span className={styles.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ---- Edit form ---- */}
          <motion.div
            className={styles.editSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className={styles.editHeader}>
              <h2 className={styles.sectionTitle}>Account Details</h2>
              {!editing && (
                <button
                  className={styles.editBtn}
                  onClick={() => setEditing(true)}
                  id="profile-edit-btn"
                >
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                  id="profile-name"
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
                <Input
                  id="profile-email"
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
                <div className={styles.formActions}>
                  <Button type="submit" variant="primary" isLoading={updateMutation.isPending} id="profile-save-btn">
                    Save Changes
                  </Button>
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className={styles.infoRows}>
                {[
                  { label: 'Name', value: user?.name },
                  { label: 'Email', value: user?.email },
                  { label: 'Password', value: '••••••••••' },
                ].map(({ label, value }) => (
                  <div key={label} className={styles.infoRow}>
                    <span className={styles.infoLabel}>{label}</span>
                    <span className={styles.infoValue}>{value || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}

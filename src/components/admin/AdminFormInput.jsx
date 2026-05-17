import styles from './AdminFormInput.module.css'

export default function AdminFormInput({
  label,
  id,
  error,
  hint,
  className,
  type = 'text',
  textarea = false,
  ...props
}) {
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div className={`${styles.group} ${className || ''}`}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <Tag
        id={id}
        type={textarea ? undefined : type}
        className={`${styles.input} ${error ? styles.invalid : ''} ${textarea ? styles.textarea : ''}`}
        {...props}
      />
      {hint && !error && <p className={styles.hint}>{hint}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}

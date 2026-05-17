import { forwardRef } from 'react'
import styles from './Input.module.css'

/**
 * Styled input component with label and error state.
 *
 * @param {{
 *   label?: string,
 *   error?: string,
 *   id: string,
 *   type?: string,
 *   placeholder?: string,
 *   className?: string,
 * }} props
 */
const Input = forwardRef(function Input(
  { label, error, id, className = '', ...rest },
  ref
) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`${styles.input} ${error ? styles.hasError : ''}`}
        {...rest}
      />
      {error && (
        <span className={styles.errorMsg} role="alert">
          {error}
        </span>
      )}
    </div>
  )
})

export default Input

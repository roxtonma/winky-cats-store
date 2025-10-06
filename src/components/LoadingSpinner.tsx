import styles from './styles/LoadingSpinner.module.css'

export default function LoadingSpinner() {
  return (
    <div className={styles.spinner} aria-label="Loading">
      <div className={styles.spinnerCircle}></div>
    </div>
  )
}

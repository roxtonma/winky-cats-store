import styles from './styles/AmazonDisclosure.module.css'

export function AmazonDisclosure() {
  return (
    <div className={styles.disclosure}>
      <div className={styles.icon}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className={styles.text}>
        As Amazon Associates we earn from qualifying purchases. Products are
        sold by Amazon and all purchases are subject to Amazon&apos;s terms and conditions.
      </p>
    </div>
  )
}

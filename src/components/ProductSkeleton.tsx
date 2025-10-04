import styles from './ProductSkeleton.module.css'

export default function ProductSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImage}></div>
      <div className={styles.skeletonTitle}></div>
      <div className={styles.skeletonDescription}></div>
      <div className={styles.skeletonDescription} style={{ width: '60%' }}></div>
      <div className={styles.skeletonFooter}>
        <div className={styles.skeletonPrice}></div>
        <div className={styles.skeletonButton}></div>
      </div>
    </div>
  )
}

export function ProductSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </>
  )
}

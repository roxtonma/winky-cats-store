'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/supabase';
import { AmazonProduct } from '@/types/amazon';
import { ImageLightbox } from './ImageLightbox';
import { ProductCustomizationModal } from './ProductCustomizationModal';
import styles from './styles/HorizontalScrollCards.module.css';

type HorizontalScrollCardsProps = {
  title: string;
  type: 'regular' | 'affiliate';
  products: Product[] | AmazonProduct[];
  onAddToCart?: (product: Product, selectedVariant?: { size?: string; colorName?: string; images?: string[] }) => void;
  defaultCurrency?: string;
};

export function HorizontalScrollCards({
  title,
  type,
  products,
  onAddToCart,
  defaultCurrency = '₹',
}: HorizontalScrollCardsProps) {
  const isRegular = type === 'regular';

  // Lightbox state for affiliate products
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxProductName, setLightboxProductName] = useState('');

  // Modal state for regular products
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const openLightbox = (images: string[], index: number, productName: string) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxProductName(productName);
    setLightboxOpen(true);
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleAddToCart = (product: Product, selectedVariant: { size?: string; colorName?: string; images?: string[] }) => {
    if (onAddToCart) {
      onAddToCart(product, selectedVariant);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <Link
          href={isRegular ? '/products' : '/associates'}
          className={styles.viewAll}
        >
          View All
        </Link>
      </div>

      <div className={styles.scrollContainer}>
        <div className={styles.scrollContent}>
          {products.map((product) => {
            if (isRegular) {
              const regularProduct = product as Product;
              const image = regularProduct.images?.[0];

              return (
                <div key={regularProduct.id} className={styles.card}>
                  {image && image.trim() && (
                    <div className={styles.imageContainer}>
                      <Image
                        src={image}
                        alt={regularProduct.name}
                        fill
                        sizes="(max-width: 768px) 280px, 320px"
                        style={{ objectFit: 'cover' }}
                        className={styles.image}
                      />
                      {regularProduct.compare_at_price && regularProduct.compare_at_price > regularProduct.price && (
                        <span className={styles.badge}>
                          {Math.round(((regularProduct.compare_at_price - regularProduct.price) / regularProduct.compare_at_price) * 100)}% OFF
                        </span>
                      )}
                    </div>
                  )}

                  <div className={styles.cardContent}>
                    <h3 className={styles.productName}>{regularProduct.name}</h3>

                    <div className={styles.priceRow}>
                      <span className={styles.price}>{defaultCurrency}{regularProduct.price}</span>
                      {regularProduct.compare_at_price && regularProduct.compare_at_price > regularProduct.price && (
                        <span className={styles.comparePrice}>{defaultCurrency}{regularProduct.compare_at_price}</span>
                      )}
                    </div>

                    <button
                      onClick={() => openProductModal(regularProduct)}
                      className={styles.addButton}
                      disabled={regularProduct.inventory_quantity === 0}
                    >
                      {regularProduct.inventory_quantity === 0 ? 'Out of Stock' : 'View More'}
                    </button>
                  </div>
                </div>
              );
            } else {
              const affiliateProduct = product as AmazonProduct;
              const affiliateImage = affiliateProduct.images?.[0];

              return (
                <div key={affiliateProduct.asin} className={styles.card}>
                  {affiliateImage && affiliateImage.trim() && (
                    <div
                      className={styles.imageContainer}
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(affiliateProduct.images, 0, affiliateProduct.name);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Image
                        src={affiliateImage}
                        alt={affiliateProduct.name}
                        fill
                        sizes="(max-width: 768px) 280px, 320px"
                        style={{ objectFit: 'cover' }}
                        className={styles.image}
                      />
                      {affiliateProduct.originalPrice && affiliateProduct.price && affiliateProduct.originalPrice > affiliateProduct.price && (
                        <span className={styles.badge}>
                          {Math.round(((affiliateProduct.originalPrice - affiliateProduct.price) / affiliateProduct.originalPrice) * 100)}% OFF
                        </span>
                      )}
                      <span className={styles.affiliateBadge}>Amazon</span>
                    </div>
                  )}

                  <div className={styles.cardContent}>
                    <h3 className={styles.productName}>{affiliateProduct.name}</h3>

                    <div className={styles.priceRow}>
                      <span className={styles.price}>
                        {defaultCurrency}{affiliateProduct.price}
                      </span>
                      {affiliateProduct.originalPrice && affiliateProduct.originalPrice > (affiliateProduct.price || 0) && (
                        <span className={styles.comparePrice}>
                          {defaultCurrency}{affiliateProduct.originalPrice}
                        </span>
                      )}
                    </div>

                    <a
                      href={affiliateProduct.affiliateLink}
                      target="_blank"
                      rel="sponsored nofollow noreferrer"
                      className={styles.viewAmazonButton}
                    >
                      View on Amazon
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Image Lightbox for affiliate products */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        productName={lightboxProductName}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Product Customization Modal for regular products */}
      <ProductCustomizationModal
        product={selectedProduct}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </section>
  );
}

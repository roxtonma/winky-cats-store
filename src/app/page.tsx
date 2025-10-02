import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <main>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1rem',
            color: 'var(--text-primary)'
          }}>
            Welcome to Winky-Cats Store! ✨
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Your one-stop shop for custom print-on-demand apparel and accessories
          </p>
        </div>

        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '600',
            marginBottom: '2rem',
            textAlign: 'center',
            color: 'var(--text-primary)'
          }}>
            Featured Categories
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              transition: 'transform 0.2s ease'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
                T-Shirts & Apparel
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Custom printed t-shirts, hoodies, and apparel for every style
              </p>
            </div>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              transition: 'transform 0.2s ease'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
                Accessories
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Bags, mugs, and other custom accessories with your designs
              </p>
            </div>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              transition: 'transform 0.2s ease'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
                Custom Designs
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Upload your artwork and create unique personalized products
              </p>
            </div>
          </div>
        </section>

        <section style={{ textAlign: 'center' }}>
          <Link href="/products" style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: 'white',
            padding: '1rem 2.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            borderRadius: '12px',
            display: 'inline-block',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: '0 4px 12px rgba(167, 139, 250, 0.3)'
          }}>
            Shop All Products
          </Link>
        </section>
      </main>
    </div>
  );
}

/**
 * Parse Qikink mockup filename and extract metadata
 * Pattern: {View}_{ViewNumber}_c_{ColorID}.jpg
 * Example: Front_1_c_1.jpg -> { view: 'Front', viewNumber: 1, colorId: '1' }
 */
export type MockupMetadata = {
  view: string
  viewNumber: number
  colorId: string
  filename: string
  url: string
}

export type ColorVariantGroup = {
  colorId: string
  images: MockupMetadata[]
  frontImage?: MockupMetadata
  backImage?: MockupMetadata
}

/**
 * Parse a mockup filename
 */
export function parseMockupFilename(filename: string, baseUrl?: string): MockupMetadata | null {
  // Pattern: Front_1_c_1.jpg or Back_2_c_10.jpg
  const match = filename.match(/^(\w+)_(\d+)_c_(\d+)\.(jpg|png)$/i)

  if (!match) {
    return null
  }

  const [, view, viewNumber, colorId] = match

  return {
    view,
    viewNumber: parseInt(viewNumber, 10),
    colorId,
    filename,
    url: baseUrl ? `${baseUrl}/${filename}` : filename
  }
}

/**
 * Group mockup images by color ID
 */
export function groupMockupsByColor(mockups: MockupMetadata[]): Map<string, ColorVariantGroup> {
  const groups = new Map<string, ColorVariantGroup>()

  for (const mockup of mockups) {
    if (!groups.has(mockup.colorId)) {
      groups.set(mockup.colorId, {
        colorId: mockup.colorId,
        images: []
      })
    }

    const group = groups.get(mockup.colorId)!
    group.images.push(mockup)

    // Identify front and back views
    if (mockup.view.toLowerCase() === 'front') {
      group.frontImage = mockup
    } else if (mockup.view.toLowerCase() === 'back') {
      group.backImage = mockup
    }
  }

  return groups
}

/**
 * Process a directory of mockup files and organize by color
 */
export function processMockupDirectory(filenames: string[], baseUrl?: string): ColorVariantGroup[] {
  const mockups: MockupMetadata[] = []
  let sizeChartFile: string | null = null

  for (const filename of filenames) {
    // Skip default.jpg and zip files
    if (filename === 'default.jpg' || filename.endsWith('.zip')) {
      continue
    }

    // Capture size_chart file
    if (filename.toLowerCase().includes('size_chart')) {
      sizeChartFile = filename
      continue
    }

    const metadata = parseMockupFilename(filename, baseUrl)
    if (metadata) {
      mockups.push(metadata)
    }
  }

  const groups = groupMockupsByColor(mockups)

  // Add size chart to each color group if it exists
  if (sizeChartFile && baseUrl) {
    const sizeChartUrl = `${baseUrl}/${sizeChartFile}`
    groups.forEach(group => {
      group.images.push({
        view: 'SizeChart',
        viewNumber: 999,
        colorId: group.colorId,
        filename: sizeChartFile!,
        url: sizeChartUrl
      })
    })
  }

  // Convert to array and sort by color ID
  return Array.from(groups.values()).sort((a, b) =>
    parseInt(a.colorId) - parseInt(b.colorId)
  )
}

/**
 * Get all image URLs for a specific color variant
 */
export function getColorVariantImages(group: ColorVariantGroup): string[] {
  // Order: Front first, then Back, then any others
  const ordered: MockupMetadata[] = []

  if (group.frontImage) ordered.push(group.frontImage)
  if (group.backImage) ordered.push(group.backImage)

  // Add any other views
  const others = group.images.filter(
    img => img !== group.frontImage && img !== group.backImage
  )
  ordered.push(...others)

  return ordered.map(img => img.url)
}

/**
 * Map Qikink color IDs to actual color names and hex values
 * You'll need to populate this based on Qikink's color mapping
 */
export const QIKINK_COLOR_MAP: Record<string, { name: string; hex: string }> = {
  '1': { name: 'White', hex: '#FFFFFF' },
  '3': { name: 'Black', hex: '#000000' },
  '4': { name: 'Grey', hex: '#6b7280' },
  '9': { name: 'Navy', hex: '#1e3a8a' },
  '10': { name: 'Red', hex: '#dc2626' },
  '25': { name: 'Maroon', hex: '#7f1d1d' },
  '41': { name: 'Olive Green', hex: '#6b7c3e' },
  '43': { name: 'Yellow', hex: '#eab308' },
  '45': { name: 'Pink', hex: '#ec4899' },
  '49': { name: 'Lavender', hex: '#c4b5fd' },
  '52': { name: 'Coral', hex: '#ff7f7f' },
  '53': { name: 'Mint', hex: '#98d8c8' },
  '54': { name: 'Baby Blue', hex: '#a7c7e7' },
}

/**
 * Get color info for a color ID
 */
export function getColorInfo(colorId: string): { name: string; hex: string } {
  return QIKINK_COLOR_MAP[colorId] || { name: `Color ${colorId}`, hex: '#cccccc' }
}

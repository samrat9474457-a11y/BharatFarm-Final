// ============================================
// COMPREHENSIVE CROPS DATABASE
// ============================================
// Real Indian crops with hardcoded Unsplash images
// so they always display (no API call required)

const CROPS_DATABASE = {
    // ═══════════════════════════════════════════
    // VEGETABLES (10)
    // ═══════════════════════════════════════════
    tomato: {
        commonName: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        category: 'vegetable',
        climate: 'Warm, sunlight (6-8 hours daily)',
        soil: 'Well-drained, fertile loamy soil',
        duration: '60-80 days',
        wateringFrequency: 'Regular, 3-4 times weekly',
        harvesting: 'June to September (Summer harvest)',
        imageKeywords: 'tomato red vegetable garden fresh',
        imageUrl: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400&q=80'
    },
    potato: {
        commonName: 'Potato',
        scientificName: 'Solanum tuberosum',
        category: 'vegetable',
        climate: 'Cool season, 15-25°C',
        soil: 'Loose, well-aerated sandy loam',
        duration: '90-120 days',
        wateringFrequency: 'Regular, weekly once',
        harvesting: 'October to March',
        imageKeywords: 'potato vegetable harvest farm',
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80'
    },
    onion: {
        commonName: 'Onion',
        scientificName: 'Allium cepa',
        category: 'vegetable',
        climate: 'Cool to moderate, 13-24°C',
        soil: 'Well-drained fertile loamy soil',
        duration: '120-150 days',
        wateringFrequency: 'Moderate, once in 2 weeks',
        harvesting: 'March to May',
        imageKeywords: 'onion bulb vegetable market',
        imageUrl: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80'
    },
    carrot: {
        commonName: 'Carrot',
        scientificName: 'Daucus carota',
        category: 'vegetable',
        climate: 'Cool season, 15-20°C',
        soil: 'Loose, well-drained sandy soil',
        duration: '70-90 days',
        wateringFrequency: 'Light irrigation, weekly',
        harvesting: 'October to January',
        imageKeywords: 'carrots harvest root vegetable bunch',
        imageUrl: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400&q=80'
    },
    cabbage: {
        commonName: 'Cabbage',
        scientificName: 'Brassica oleracea',
        category: 'vegetable',
        climate: 'Cool season, 15-22°C',
        soil: 'Fertile loamy soil with organic matter',
        duration: '90-120 days',
        wateringFrequency: 'Regular, 2-3 times weekly',
        harvesting: 'November to February',
        imageKeywords: 'cabbage green vegetable fresh',
        imageUrl: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&q=80'
    },
    spinach: {
        commonName: 'Spinach',
        scientificName: 'Spinacia oleracea',
        category: 'vegetable',
        climate: 'Cool season, 10-20°C',
        soil: 'Rich, well-draining fertile soil',
        duration: '40-50 days',
        wateringFrequency: 'Regular, light watering',
        harvesting: 'October to March',
        imageKeywords: 'spinach fresh green leaves vegetable',
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80'
    },
    brinjal: {
        commonName: 'Brinjal (Eggplant)',
        scientificName: 'Solanum melongena',
        category: 'vegetable',
        climate: 'Warm humid, 25-30°C',
        soil: 'Well-drained fertile loamy soil',
        duration: '120-150 days',
        wateringFrequency: 'Regular, 4-5 times weekly',
        harvesting: 'July to December',
        imageKeywords: 'eggplant purple brinjal vegetable',
        imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80'
    },
    cauliflower: {
        commonName: 'Cauliflower',
        scientificName: 'Brassica oleracea var. botrytis',
        category: 'vegetable',
        climate: 'Cool season, 10-21°C',
        soil: 'Well-drained fertile loamy soil',
        duration: '90-120 days',
        wateringFrequency: 'Regular, 2-3 times weekly',
        harvesting: 'December to February',
        imageKeywords: 'cauliflower white vegetable fresh',
        imageUrl: 'https://images.unsplash.com/photo-1568584711271-6c929fb49b60?w=400&q=80'
    },
    okra: {
        commonName: "Okra (Lady's Finger)",
        scientificName: 'Abelmoschus esculentus',
        category: 'vegetable',
        climate: 'Warm, 20-30°C',
        soil: 'Well-drained loamy soil',
        duration: '50-60 days',
        wateringFrequency: 'Regular, 3-4 times weekly',
        harvesting: 'June to September',
        imageKeywords: 'okra bhindi pods green vegetable',
        imageUrl: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&q=80'
    },
    capsicum: {
        commonName: 'Capsicum (Bell Pepper)',
        scientificName: 'Capsicum annuum',
        category: 'vegetable',
        climate: 'Warm, 21-29°C',
        soil: 'Well-drained fertile loamy soil',
        duration: '90-150 days',
        wateringFrequency: 'Regular, 2-3 times weekly',
        harvesting: 'September to May',
        imageKeywords: 'bell pepper capsicum red green vegetable',
        imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80'
    },

    // ═══════════════════════════════════════════
    // FRUITS (10)
    // ═══════════════════════════════════════════
    mango: {
        commonName: 'Mango',
        scientificName: 'Mangifera indica',
        category: 'fruit',
        climate: 'Warm tropical, 24-30°C',
        soil: 'Well-drained loamy to sandy soil',
        duration: 'Perennial (5-7 years to first yield)',
        wateringFrequency: 'Moderate, seasonal irrigation',
        harvesting: 'April to June',
        imageKeywords: 'mango fruit',
        imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80'
    },
    banana: {
        commonName: 'Banana',
        scientificName: 'Musa sapientum',
        category: 'fruit',
        climate: 'Warm humid, 20-30°C',
        soil: 'Rich fertile well-drained soil',
        duration: 'Perennial (9-12 months per cycle)',
        wateringFrequency: 'High, frequent irrigation',
        harvesting: 'Year-round (5-7 months after planting)',
        imageKeywords: 'banana fruit',
        imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80'
    },
    apple: {
        commonName: 'Apple',
        scientificName: 'Malus domestica',
        category: 'fruit',
        climate: 'Cool temperate, 10-20°C',
        soil: 'Well-drained fertile loamy soil',
        duration: 'Perennial (3-4 years to first yield)',
        wateringFrequency: 'Moderate, regular irrigation',
        harvesting: 'September to November',
        imageKeywords: 'apple fruit',
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80'
    },
    papaya: {
        commonName: 'Papaya',
        scientificName: 'Carica papaya',
        category: 'fruit',
        climate: 'Warm tropical, 22-26°C',
        soil: 'Well-drained sandy loamy soil',
        duration: 'Perennial (8-10 months to first yield)',
        wateringFrequency: 'Moderate, regular irrigation',
        harvesting: 'Year-round (peak June-July)',
        imageKeywords: 'papaya fruit',
        imageUrl: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400&q=80'
    },
    guava: {
        commonName: 'Guava',
        scientificName: 'Psidium guajava',
        category: 'fruit',
        climate: 'Warm tropical, 23-28°C',
        soil: 'Well-drained soil, tolerates poor soil',
        duration: 'Perennial (3-4 years to first yield)',
        wateringFrequency: 'Moderate, occasional irrigation',
        harvesting: 'September to November',
        imageKeywords: 'guava fruit',
        imageUrl: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=400&q=80'
    },
    orange: {
        commonName: 'Orange',
        scientificName: 'Citrus sinensis',
        category: 'fruit',
        climate: 'Subtropical, 15-30°C',
        soil: 'Well-drained fertile loamy soil',
        duration: 'Perennial (3-4 years to first yield)',
        wateringFrequency: 'Moderate, regular irrigation',
        harvesting: 'December to February',
        imageKeywords: 'orange citrus fruit',
        imageUrl: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80'
    },
    grapes: {
        commonName: 'Grapes',
        scientificName: 'Vitis vinifera',
        category: 'fruit',
        climate: 'Temperate to subtropical, 15-25°C',
        soil: 'Well-drained loamy to clayey soil',
        duration: 'Perennial (2-3 years to first yield)',
        wateringFrequency: 'Moderate, regular irrigation',
        harvesting: 'April to June',
        imageKeywords: 'grapes fruit',
        imageUrl: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80'
    },
    pomegranate: {
        commonName: 'Pomegranate',
        scientificName: 'Punica granatum',
        category: 'fruit',
        climate: 'Subtropical, 20-30°C',
        soil: 'Well-drained loamy to sandy soil',
        duration: 'Perennial (2-3 years to first yield)',
        wateringFrequency: 'Low to moderate irrigation',
        harvesting: 'September to November',
        imageKeywords: 'pomegranate fruit',
        imageUrl: 'https://images.unsplash.com/photo-1615485291084-e2f09740e12e?w=400&q=80'
    },
    watermelon: {
        commonName: 'Watermelon',
        scientificName: 'Citrullus lanatus',
        category: 'fruit',
        climate: 'Warm, 25-35°C',
        soil: 'Well-drained sandy loamy soil',
        duration: '70-100 days',
        wateringFrequency: 'High, frequent irrigation',
        harvesting: 'April to June',
        imageKeywords: 'watermelon fruit',
        imageUrl: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400&q=80'
    },
    pineapple: {
        commonName: 'Pineapple',
        scientificName: 'Ananas comosus',
        category: 'fruit',
        climate: 'Warm tropical, 22-28°C',
        soil: 'Well-drained sandy loamy soil',
        duration: 'Perennial (16-18 months to first yield)',
        wateringFrequency: 'Moderate, regular irrigation',
        harvesting: 'December to March',
        imageKeywords: 'pineapple fruit',
        imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80'
    },

    // ═══════════════════════════════════════════
    // CEREALS (5)
    // ═══════════════════════════════════════════
    rice: {
        commonName: 'Rice',
        scientificName: 'Oryza sativa',
        category: 'cereal',
        climate: 'Tropical/Subtropical, 21-37°C',
        soil: 'Clayey/Alluvial soil (water-retentive)',
        duration: '120-150 days',
        wateringFrequency: 'High, flooded fields',
        harvesting: 'October to November',
        imageKeywords: 'rice paddy grain field harvest',
        imageUrl: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80'
    },
    wheat: {
        commonName: 'Wheat',
        scientificName: 'Triticum aestivum',
        category: 'cereal',
        climate: 'Cool/Dry, 15-25°C',
        soil: 'Well-drained loamy soil',
        duration: '120-140 days',
        wateringFrequency: 'Moderate, 4-5 irrigations',
        harvesting: 'March to April',
        imageKeywords: 'wheat grain field golden crop',
        imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80'
    },
    maize: {
        commonName: 'Maize (Corn)',
        scientificName: 'Zea mays',
        category: 'cereal',
        climate: 'Warm, 21-37°C',
        soil: 'Well-drained fertile loamy soil',
        duration: '90-120 days',
        wateringFrequency: 'Moderate, 4-6 irrigations',
        harvesting: 'September to October',
        imageKeywords: 'corn maize field green crop India',
        imageUrl: 'https://images.unsplash.com/photo-1601593768799-76f7d35aa27c?w=400&q=80'
    },
    barley: {
        commonName: 'Barley',
        scientificName: 'Hordeum vulgare',
        category: 'cereal',
        climate: 'Cool, 15-22°C',
        soil: 'Well-drained loamy soil',
        duration: '110-130 days',
        wateringFrequency: 'Low, 2-3 irrigations',
        harvesting: 'March to April',
        imageKeywords: 'barley grain cereal crop field',
        imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&q=80'
    },
    oats: {
        commonName: 'Oats',
        scientificName: 'Avena sativa',
        category: 'cereal',
        climate: 'Cool season, 10-20°C',
        soil: 'Well-drained loamy soil',
        duration: '90-110 days',
        wateringFrequency: 'Low, rainfall dependent',
        harvesting: 'March to April',
        imageKeywords: 'oats cereal grain crop',
        imageUrl: 'https://images.unsplash.com/photo-1614314107768-6018061b5b72?w=400&q=80'
    },

    // ═══════════════════════════════════════════
    // OILSEEDS (4)
    // ═══════════════════════════════════════════
    mustard: {
        commonName: 'Mustard',
        scientificName: 'Brassica juncea',
        category: 'oilseed',
        climate: 'Cool/Dry, 15-25°C',
        soil: 'Well-drained loamy soil',
        duration: '90-110 days',
        wateringFrequency: 'Low, 2-3 irrigations',
        harvesting: 'February to March',
        imageKeywords: 'mustard yellow flower field oilseed',
        imageUrl: 'https://images.unsplash.com/photo-1593280359364-5d8b7e245d8f?w=400&q=80'
    },
    soybean: {
        commonName: 'Soybean',
        scientificName: 'Glycine max',
        category: 'oilseed',
        climate: 'Warm, 20-30°C',
        soil: 'Well-drained loamy soil',
        duration: '95-120 days',
        wateringFrequency: 'Moderate, 4-6 irrigations',
        harvesting: 'October to November',
        imageKeywords: 'soybean pod plant crop oilseed',
        imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80'
    },
    sunflower: {
        commonName: 'Sunflower',
        scientificName: 'Helianthus annuus',
        category: 'oilseed',
        climate: 'Warm, 20-30°C',
        soil: 'Well-drained loamy to sandy soil',
        duration: '80-100 days',
        wateringFrequency: 'Moderate, 4-5 irrigations',
        harvesting: 'August to September',
        imageKeywords: 'sunflower yellow bloom flower field',
        imageUrl: 'https://images.unsplash.com/photo-1470509037663-253d62d56bb7?w=400&q=80'
    },
    groundnut: {
        commonName: 'Groundnut (Peanut)',
        scientificName: 'Arachis hypogaea',
        category: 'oilseed',
        climate: 'Warm, 24-28°C',
        soil: 'Well-drained loamy sandy soil',
        duration: '90-120 days',
        wateringFrequency: 'Moderate, 4-5 irrigations',
        harvesting: 'September to October',
        imageKeywords: 'peanut groundnut crop oilseed',
        imageUrl: 'https://images.unsplash.com/photo-1567449303183-ae0d6ed1498e?w=400&q=80'
    }
};

// Function to get crops by category
function getCropsByCategory(category) {
    return Object.entries(CROPS_DATABASE)
        .filter(([key, crop]) => crop.category === category || category === 'all')
        .map(([key, crop]) => ({ id: key, ...crop }));
}

// Function to search crops
function searchCrops(query) {
    const q = query.toLowerCase();
    return Object.entries(CROPS_DATABASE)
        .filter(([key, crop]) =>
            crop.commonName.toLowerCase().includes(q) ||
            crop.scientificName.toLowerCase().includes(q) ||
            key.toLowerCase().includes(q)
        )
        .map(([key, crop]) => ({ id: key, ...crop }));
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CROPS_DATABASE, getCropsByCategory, searchCrops };
}
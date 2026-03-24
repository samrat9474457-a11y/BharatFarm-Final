// ============================================
// MARKETPLACE DATA — 42 Visually Unique Items (Agmarknet / eNAM Reference Prices, March 2026)
// ============================================

const MARKETPLACE_CATEGORIES = [
    { id: 'all', name: 'All', icon: 'fa-th-large' },
    { id: 'vegetables', name: 'Vegetables', icon: 'fa-carrot' },
    { id: 'fruits', name: 'Fruits', icon: 'fa-apple-alt' },
    { id: 'grains', name: 'Grains & Pulses', icon: 'fa-seedling' },
    { id: 'machinery', name: 'Machinery', icon: 'fa-tractor' },
    { id: 'seeds', name: 'Seeds & Fertilizers', icon: 'fa-vial' }
];

// Unsplash image pool by category (verified working IDs)
const IMG = {
    tomato: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&q=75',
    potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=75',
    spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=75',
    cauliflower: 'https://images.unsplash.com/photo-1613743983303-b3e89f8a2b80?w=600&q=75',
    capsicum: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&q=75',
    cabbage: 'https://images.unsplash.com/photo-1603049404411-13c2ca81a316?q=80&w=1182&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    pumpkin: 'https://images.unsplash.com/photo-1509622905150-fa66d3906e09?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    cucumber: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&q=75',
    carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    brinjal: 'https://images.unsplash.com/photo-1659261111792-66709e46d53d?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    ladyfinger: 'https://images.unsplash.com/photo-1664289242854-e99d345cfa92?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    bittergourd: 'https://images.unsplash.com/photo-1676994174279-102e0abff98f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    ginger: 'https://images.unsplash.com/photo-1603431777782-912e3b76f60d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    garlic: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&q=75',
    greenpea: 'https://images.unsplash.com/photo-1690023628368-6c2f8ffbbd9b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    mango: 'https://plus.unsplash.com/premium_photo-1674382739389-338645e7dd8c?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=75',
    apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=75',
    guava: 'https://images.unsplash.com/photo-1689996647099-a7a0b67fd2f6?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    watermelon: 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?w=600&q=75',
    grapes: 'https://images.unsplash.com/photo-1625499940894-8796928bf9c4?q=80&w=710&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    orange: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    pomegranate: 'https://plus.unsplash.com/premium_photo-1668076515507-c5bc223c99a4?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    papaya: 'https://images.unsplash.com/photo-1581242335635-ce8631489ac5?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    lemon: 'https://images.unsplash.com/photo-1590502593747-42a996133562?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    strawberry: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=75',
    coconut: 'https://images.unsplash.com/photo-1603779046675-2eccbab9b982?q=80&w=733&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    pineapple: 'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=600&q=75',
    rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=75',
    wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=75',
    maize: 'https://images.unsplash.com/photo-1649251037465-72c9d378acb6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    dal: 'https://images.unsplash.com/photo-1702041357314-db5826c96f04?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    soybean: 'https://images.unsplash.com/photo-1728931340275-430196814dc5?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    groundnut: 'https://images.unsplash.com/photo-1724058663142-e6e1a5e89f2d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    sesame: 'https://images.unsplash.com/photo-1599014100622-578963fc3f96?q=80&w=766&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    mustard: 'https://images.unsplash.com/photo-1599193804298-455ae09448ca?q=80&w=784&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seeds: 'https://plus.unsplash.com/premium_photo-1722945635992-8eda6a907978?q=80&w=1060&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    fertilizer: 'https://images.unsplash.com/photo-1710223221719-6251cb1b5c5b?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tractor: 'https://images.unsplash.com/photo-1614977645540-7abd88ba8e56?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJhY3RvcnxlbnwwfHwwfHx8MA%3D%3D',
    pump: 'https://images.unsplash.com/photo-1655874837055-7adc909ae602?q=80&w=1113&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    sprayer: 'https://images.unsplash.com/photo-1713989326689-ae906a3c0688?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};

function p(id, name, cat, price, unit, qty, loc, farmer, phone, img, ver) {
    const d = phone.replace(/\D/g, '');
    return {
        id: `p${id}`, name, category: cat, price, unit,
        quantity: qty, location: loc, farmerName: farmer,
        contact: `+91 ${phone}`, whatsapp: `91${d}`,
        image: img, verified: ver, createdAt: '2026-03-07'
    };
}

const MARKETPLACE_PRODUCTS = [
    // ── VEGETABLES (17 items) ──────────────────────────────────────────────
    p(1, 'Fresh Organic Tomatoes', 'vegetables', 25, 'kg', '500 kg', 'Hooghly, WB', 'Raju Mondal', '9831200001', IMG.tomato, true),
    p(2, 'Premium Cauliflower', 'vegetables', 28, 'kg', '300 kg', 'N 24 Parganas, WB', 'Gopal Das', '9831200002', IMG.cauliflower, false),
    p(3, 'Desi Red Onion (Nasik)', 'vegetables', 22, 'kg', '2 tonnes', 'Nashik, MH', 'Sunil Patil', '9822300001', IMG.onion, true),
    p(4, 'Kufri Jyoti Potato', 'vegetables', 18, 'kg', '1 tonne', 'Agra, UP', 'Ram Singh', '9415400001', IMG.potato, true),
    p(5, 'Baby Spinach (Palak)', 'vegetables', 30, 'kg', '200 kg', 'Pune, MH', 'Meena Kadam', '9822300002', IMG.spinach, false),
    p(6, 'Green Capsicum', 'vegetables', 55, 'kg', '400 kg', 'Ooty, TN', 'K. Muthusamy', '9443700001', IMG.capsicum, true),
    p(7, 'Green Cabbage (Patta Gobi)', 'vegetables', 15, 'kg', '600 kg', 'Shimla, HP', 'Desh Raj', '9418800001', IMG.cabbage, true),
    p(8, 'Desi Pumpkin (Kaddu)', 'vegetables', 12, 'kg', '800 kg', 'Varanasi, UP', 'Mohan Yadav', '9415400002', IMG.pumpkin, false),
    p(9, 'Field Cucumber (Kheera)', 'vegetables', 20, 'kg', '350 kg', 'Lucknow, UP', 'Ajay Kumar', '9415400003', IMG.cucumber, true),
    p(10, 'Nantes Carrot', 'vegetables', 35, 'kg', '250 kg', 'Patiala, PB', 'Gurpreet Singh', '9814500001', IMG.carrot, true),
    p(11, 'Round Brinjal (Baingan)', 'vegetables', 18, 'kg', '400 kg', 'Guntur, AP', 'V. Reddy', '9440800001', IMG.brinjal, false),
    p(12, 'Tender Lady Finger (Bhindi)', 'vegetables', 40, 'kg', '300 kg', 'Kolkata, WB', 'Tapan Biswas', '9831200003', IMG.ladyfinger, true),
    p(13, 'Bitter Gourd (Karela)', 'vegetables', 35, 'kg', '200 kg', 'Mysuru, KA', 'B. Narayanan', '9449800001', IMG.bittergourd, true),
    p(14, 'Raw Ginger (Adrak)', 'vegetables', 80, 'kg', '500 kg', 'Kollam, KL', 'Rajan Nair', '9947100001', IMG.ginger, true),
    p(15, 'Multi-clove Garlic (Lehsun)', 'vegetables', 100, 'kg', '400 kg', 'Kota, RJ', 'Ramesh Vaishnav', '9414800001', IMG.garlic, false),
    p(16, 'Fresh Green Peas', 'vegetables', 60, 'kg', '300 kg', 'Amritsar, PB', 'Harjit Kaur', '9814500002', IMG.greenpea, true),
    p(20, 'Sweet Corn (Makka)', 'vegetables', 30, 'kg', '600 kg', 'Davangere, KA', 'Shivanna H.', '9449800002', IMG.maize, true),

    // ── FRUITS (13 items) ─────────────────────────────────────────────────
    p(31, 'Alphonso Mangoes (GI Tagged)', 'fruits', 250, 'kg', '300 kg', 'Ratnagiri, MH', 'Vishwas Panse', '9822300005', IMG.mango, true),
    p(33, 'Himachali Apple (Royal)', 'fruits', 180, 'kg', '400 kg', 'Shimla, HP', 'Vinod Chauhan', '9418800003', IMG.apple, true),
    p(34, 'G9 Banana (Robusta)', 'fruits', 28, 'kg', '2 tonnes', 'Jalgaon, MH', 'Dinesh Patil', '9822300006', IMG.banana, true),
    p(36, 'Seedless Watermelon', 'fruits', 15, 'kg', '3 tonnes', 'Kurnool, AP', 'M. Krishna Rao', '9440800003', IMG.watermelon, true),
    p(37, 'Black Grapes (Sharad)', 'fruits', 90, 'kg', '1 tonne', 'Sangli, MH', 'Ashok Desai', '9822300007', IMG.grapes, true),
    p(39, 'Nagpur Orange (Mandarin)', 'fruits', 60, 'kg', '1 tonne', 'Nagpur, MH', 'Suresh Pande', '9822300009', IMG.orange, true),
    p(40, 'Pomegranate (Bhagwa)', 'fruits', 160, 'kg', '500 kg', 'Solapur, MH', 'Nitin Shaha', '9822300010', IMG.pomegranate, true),
    p(41, 'Papaya (Red Lady)', 'fruits', 25, 'kg', '1 tonne', 'Krishnagiri, TN', 'Chellaraj P.', '9443700005', IMG.papaya, false),
    p(42, 'Kagzi Lemon', 'fruits', 55, 'kg', '600 kg', 'Bikaner, RJ', 'Chetan Sharma', '9414800004', IMG.lemon, true),
    p(43, 'Guava (L-49 Allahabad)', 'fruits', 35, 'kg', '800 kg', 'Prayagraj, UP', 'Durgesh Tripathi', '9415400004', IMG.guava, true),
    p(44, 'Strawberry (Winter Dawn)', 'fruits', 300, 'kg', '200 kg', 'Mahabaleshwar, MH', 'Priti Pawar', '9822300011', IMG.strawberry, true),
    p(45, 'Tender Coconut', 'fruits', 30, 'piece', '1000 pcs', 'Bengaluru, KA', 'K. Malar', '9449800004', IMG.coconut, false),
    p(46, 'Pineapple (Kew Variety)', 'fruits', 30, 'piece', '500 pcs', 'Jorhat, AS', 'Rituraj Bora', '9435400001', IMG.pineapple, true),

    // ── GRAINS & PULSES (7 items) ────────────────────────────────────────
    p(53, 'Sona Masoori Rice', 'grains', 65, 'kg', '2 tonnes', 'Krishna, AP', 'P. Venkateswarlu', '9440800005', IMG.rice, true),
    p(56, 'Sharbati Wheat (MP)', 'grains', 2800, 'quintal', '15 quintals', 'Sehore, MP', 'Vikram Chouhan', '9425600001', IMG.wheat, true),
    p(62, 'Arhar Dal (Toor)', 'grains', 7500, 'quintal', '5 quintals', 'Gulbarga, KA', 'Nagaraj K.', '9449800009', IMG.dal, true),
    p(68, 'Soybean (Yellow)', 'grains', 4500, 'quintal', '15 quintals', 'Ujjain, MP', 'Dilip Patel', '9425600004', IMG.soybean, true),
    p(69, 'Groundnut (Runner)', 'grains', 5800, 'quintal', '10 quintals', 'Junagadh, GJ', 'Haresh Patel', '9824500002', IMG.groundnut, true),
    p(71, 'Mustard (Desi Yellow)', 'grains', 5500, 'quintal', '10 quintals', 'Alwar, RJ', 'Suresh Gurjar', '9414800006', IMG.mustard, true),
    p(72, 'Sesame Seeds (White)', 'grains', 9000, 'quintal', '5 quintals', 'Rajkot, GJ', 'Kishore Makwana', '9824500003', IMG.sesame, true),

    // ── SEEDS & FERTILIZERS (2 items) ────────────────────────────────────
    p(77, 'Hybrid Tomato Seeds (PKM-1)', 'seeds', 1200, 'kg', '50 kg', 'Coimbatore, TN', 'R. Krishnamurthy', '9443700007', IMG.seeds, true),
    p(83, 'NPK 19-19-19 Fertilizer', 'seeds', 1400, 'kg', '500 kg', 'Bengaluru, KA', 'Sri Agro Corp', '9449800012', IMG.fertilizer, true),

    // ── MACHINERY (3 items) ──────────────────────────────────────────────
    p(91, 'Mahindra 575 DI Tractor', 'machinery', 650000, 'piece', '1 unit', 'Ludhiana, PB', 'Kiran Agro Deals', '9814500006', IMG.tractor, true),
    p(97, 'Diesel Water Pump (5HP)', 'machinery', 18000, 'piece', '5 units', 'Agra, UP', 'Ganesh Pump House', '9415400008', IMG.pump, false),
    p(99, 'Knapsack Sprayer (16L)', 'machinery', 2800, 'piece', '20 units', 'Bhopal, MP', 'Param Agro Store', '9425600007', IMG.sprayer, true),
];
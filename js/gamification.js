// ============================================
// THE BHARATFARM GAMIFICATION ENGINE
// ============================================
// Core mechanics for User Levels, XP, and Achievements

const G_STORAGE_KEY = 'bharatfarm_gamification_state';
const LEADERBOARD_KEY = 'bharatfarm_leaderboard';

// Default State (no coins — XP is the only metric)
const DEFAULT_G_STATE = {
    user_id: "bf_local_user",
    level: 1,
    xp: 0,
    badges: [],
    completed_quizzes: [], // array of quiz IDs
    streak_days: 1,
    last_active: new Date().toISOString().split('T')[0],
    total_scans: 0,
    total_chat_msgs: 0
};

// Level Thresholds (XP required for each level)
// Level 1: 0, Level 2: 100, Level 3: 300, Level 4: 600, Level 5: 1000...
function getXPForNextLevel(currentLevel) {
    if (currentLevel === 1) return 100;
    if (currentLevel === 2) return 300;
    if (currentLevel === 3) return 600;
    if (currentLevel === 4) return 1000;
    if (currentLevel === 5) return 1500;
    return currentLevel * 400; // Generic formula for higher levels
}

// ── SIMULATED LEADERBOARD DATA ──────────────────────────
// Since users are stored in localStorage (no central DB), we generate
// realistic sample farmers to populate the leaderboard alongside the real user.
const SIMULATED_FARMERS = [
    { name: "Ramesh Kumar", xp: 1820 },
    { name: "Sunita Devi", xp: 1540 },
    { name: "Arjun Patel", xp: 1360 },
    { name: "Lakshmi Bai", xp: 1100 },
    { name: "Mahesh Singh", xp: 980 },
    { name: "Priya Sharma", xp: 840 },
    { name: "Vikram Yadav", xp: 720 },
    { name: "Anita Reddy", xp: 650 },
    { name: "Rajesh Verma", xp: 530 },
    { name: "Kavita Nair", xp: 410 },
    { name: "Suresh Gupta", xp: 350 },
    { name: "Deepa Joshi", xp: 280 },
    { name: "Bhaskar Das", xp: 220 },
    { name: "Meena Kumari", xp: 150 },
    { name: "Gopal Mishra", xp: 90 }
];

// Build leaderboard by merging simulated farmers with the real user
function getLeaderboard() {
    const currentUser = JSON.parse(localStorage.getItem('bharatfarm_current_user') || '{}');
    const userName = currentUser.name || "You";
    const state = window.bfGamification ? window.bfGamification.state : { xp: 0 };

    // Combine simulated farmers with the real user
    const allEntries = [
        ...SIMULATED_FARMERS.map(f => ({ name: f.name, xp: f.xp, isUser: false })),
        { name: userName, xp: state.xp, isUser: true }
    ];

    // Sort by XP descending
    allEntries.sort((a, b) => b.xp - a.xp);

    // Assign ranks (1-indexed)
    allEntries.forEach((entry, idx) => {
        entry.rank = idx + 1;
    });

    return allEntries;
}

// ── CORE ENGINE ─────────────────────────────────────────

class GamificationEngine {
    constructor() {
        this.state = this.loadState();
        this.achievementsData = [];
        this.checkInitialStreak();
        // Fire event that engine is ready
        document.dispatchEvent(new CustomEvent('gamificationReady', { detail: this.state }));
    }

    loadState() {
        try {
            const stored = localStorage.getItem(G_STORAGE_KEY);
            if (stored) {
                const parsed = { ...DEFAULT_G_STATE, ...JSON.parse(stored) };
                // Remove leftover coins field from old saves (clean migration)
                delete parsed.coins;
                return parsed;
            }
        } catch(e) {
            console.error("Error loading gamification state", e);
        }
        return { ...DEFAULT_G_STATE };
    }

    saveState() {
        localStorage.setItem(G_STORAGE_KEY, JSON.stringify(this.state));
        document.dispatchEvent(new CustomEvent('gamificationUpdated', { detail: this.state }));
    }

    // Call this to load external achievements config
    async loadAchievements() {
        if(this.achievementsData.length > 0) return;
        try {
            const res = await fetch('/data/achievements.json');
            if(res.ok) {
                this.achievementsData = await res.json();
            } else {
                console.warn("Failed to load achievements.json");
            }
        } catch(e) {
            console.error("Achievements load error:", e);
        }
    }

    // ── STREAK LOGIC ──────────────────────────────────────

    checkInitialStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastActive = this.state.last_active;
        
        if (today !== lastActive) {
            const todayDate = new Date(today);
            const lastDate = new Date(lastActive);
            const diffTime = Math.abs(todayDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays === 1) {
                this.state.streak_days += 1;
                console.log(`[Gamification] Streak increased to ${this.state.streak_days}!`);
                // Streak bonus XP (replaces old coin bonus)
                setTimeout(() => this.addXP(25, "Daily Login Streak"), 2000);
            } else if (diffDays > 1) {
                console.log(`[Gamification] Streak reset to 1.`);
                this.state.streak_days = 1;
            }
            this.state.last_active = today;
            this.saveState();
            this.checkStreakAchievements();
        }
    }

    // ── REWARDS LOGIC ─────────────────────────────────────

    addXP(amount, reason = "Action") {
        if(amount <= 0) return;
        this.state.xp += amount;
        console.log(`[Gamification] +${amount} XP (${reason}). Total XP: ${this.state.xp}`);
        
        // Show UX Toast
        if(window.showGamificationToast) {
            window.showGamificationToast('xp', amount, reason);
        }

        this.checkLevelUp();
        this.saveState();
    }

    checkLevelUp() {
        let leveledUp = false;
        let reqXP = getXPForNextLevel(this.state.level);
        
        while (this.state.xp >= reqXP) {
            this.state.level += 1;
            leveledUp = true;
            console.log(`[Gamification] LEVEL UP! Now Level ${this.state.level}`);
            
            // Level up bonus XP (replaces old coin reward)
            this.addXP(this.state.level * 5, `Level ${this.state.level} Bonus`);
            
            reqXP = getXPForNextLevel(this.state.level);
        }
        
        if(leveledUp && window.showLevelUpModal) {
            window.showLevelUpModal(this.state.level);
        }
    }

    async unlockBadge(badgeId) {
        if (this.state.badges.includes(badgeId)) return; // Already unlocked
        
        await this.loadAchievements();
        const badgeDef = this.achievementsData.find(b => b.id === badgeId);
        
        this.state.badges.push(badgeId);
        console.log(`[Gamification] Badge Unlocked: ${badgeDef ? badgeDef.title : badgeId}`);
        
        if (badgeDef) {
            this.addXP(badgeDef.xp_reward, `Unlocked: ${badgeDef.title}`);
            if(window.showBadgeUnlockModal) {
                window.showBadgeUnlockModal(badgeDef);
            }
        }
        this.saveState();
    }

    recordQuizCompletion(quizId, scorePct) {
        if(!this.state.completed_quizzes.includes(quizId)) {
            this.state.completed_quizzes.push(quizId);
            this.saveState();
            
            // Check quiz achievements
            if(this.state.completed_quizzes.length === 1) this.unlockBadge("quiz_beginner");
            if(this.state.completed_quizzes.length >= 8) this.unlockBadge("quiz_master");
        }
    }

    // Specific Action Hooks
    trackScan() {
        this.state.total_scans = (this.state.total_scans || 0) + 1;
        this.addXP(10, "Leaf Scan Analysis");
        if(this.state.total_scans === 1) this.unlockBadge("first_scan");
        this.saveState();
    }

    trackChat() {
        this.state.total_chat_msgs = (this.state.total_chat_msgs || 0) + 1;
        if(this.state.total_chat_msgs === 1) {
            this.unlockBadge("chatbot_first");
            this.addXP(20, "First AI Chat");
        }
        this.saveState();
    }

    checkStreakAchievements() {
        if(this.state.streak_days >= 3) this.unlockBadge("streak_3");
        if(this.state.streak_days >= 7) this.unlockBadge("streak_7");
    }
}

// Initialize Global Engine
window.bfGamification = new GamificationEngine();

// Export commonly used helpers directly to window for easy inline HTML usage
window.addGamificationXP = (amt, reason) => window.bfGamification.addXP(amt, reason);

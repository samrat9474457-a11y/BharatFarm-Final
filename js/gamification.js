// ============================================
// THE BHARATFARM GAMIFICATION ENGINE
// ============================================
// Core mechanics for User Levels, XP, Coins, and Achievements

const G_STORAGE_KEY = 'bharatfarm_gamification_state';

// Default State
const DEFAULT_G_STATE = {
    user_id: "bf_local_user",
    coins: 0,
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
                return { ...DEFAULT_G_STATE, ...JSON.parse(stored) };
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
                // If fetching relative fails (like in live server), try to use fallback
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
            // Check if it's exactly the next day
            const todayDate = new Date(today);
            const lastDate = new Date(lastActive);
            const diffTime = Math.abs(todayDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays === 1) {
                this.state.streak_days += 1;
                // Reward Daily Login
                console.log(`[Gamification] Streak increased to ${this.state.streak_days}!`);
                setTimeout(() => this.addXP(20, "Daily Login Streak"), 2000);
                setTimeout(() => this.addCoins(5, "Daily Login Bonus"), 2500);
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
        
        // Show UX Toast (Expects GSAP Animations defined elsewhere)
        if(window.showGamificationToast) {
            window.showGamificationToast('xp', amount, reason);
        }

        this.checkLevelUp();
        this.saveState();
    }

    addCoins(amount, reason = "Action") {
        if(amount <= 0) return;
        this.state.coins += amount;
        console.log(`[Gamification] +${amount} Coins (${reason}). Total Coins: ${this.state.coins}`);
        
        // Show UX Toast
        if(window.showGamificationToast) {
            window.showGamificationToast('coin', amount, reason);
        }
        
        this.saveState();
    }

    checkLevelUp() {
        let leveledUp = false;
        let reqXP = getXPForNextLevel(this.state.level);
        
        while (this.state.xp >= reqXP) {
            this.state.level += 1;
            leveledUp = true;
            console.log(`[Gamification] LEVEL UP! Now Level ${this.state.level}`);
            
            // Level up reward
            this.addCoins(this.state.level * 10, `Level ${this.state.level} Bonus`);
            
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
        // Don't spam XP for every message to prevent abuse, maybe cap it or only give small amount
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
window.addGamificationCoins = (amt, reason) => window.bfGamification.addCoins(amt, reason);

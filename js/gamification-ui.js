// ============================================
// GAMIFICATION UI & GSAP ANIMATIONS
// ============================================
// XP-based progression with leaderboard (no coins)

let currentActiveQuiz = null;

// Interval ID for the countdown timer (so we can clear it)
let quizCountdownInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    // Listen for state changes from the engine
    document.addEventListener('gamificationReady', (e) => updateGamificationCard(e.detail));
    document.addEventListener('gamificationUpdated', (e) => updateGamificationCard(e.detail));
    
    // If engine loaded before DOM, manually pull state
    if(window.bfGamification) {
        updateGamificationCard(window.bfGamification.state);
    }

    // On page load, check if user already took quiz today and update button
    updateQuizButtonState();
});

// ── DAILY QUIZ DATE CHECK HELPERS ─────────────────────────

// Returns true if user already attempted the quiz today
function hasAttemptedQuizToday() {
    const last = localStorage.getItem('lastQuizAttempt');
    if (!last) return false;

    // Compare only the date portion (ignoring time)
    const lastDate = new Date(last).toDateString();
    const today = new Date().toDateString();
    return lastDate === today;
}

// Save the current timestamp as the last quiz attempt
function saveQuizAttemptTimestamp() {
    localStorage.setItem('lastQuizAttempt', new Date().toISOString());
}

// Returns milliseconds remaining until midnight
function msUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // next midnight
    return midnight - now;
}

// Formats milliseconds into "Xh Ym Zs" string
function formatCountdown(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}

// ── UPDATE QUIZ BUTTON STATE ──────────────────────────────
// Disables or enables the quiz button and shows countdown if needed
function updateQuizButtonState() {
    const btn = document.getElementById('gami-daily-btn-wrapper');
    const btnText = document.getElementById('gami-daily-btn');
    const countdownEl = document.getElementById('quiz-countdown');

    if (!btn || !btnText) return;

    // Clear any existing countdown interval
    if (quizCountdownInterval) {
        clearInterval(quizCountdownInterval);
        quizCountdownInterval = null;
    }

    if (hasAttemptedQuizToday()) {
        // ── BLOCK: Already attempted today ──
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btnText.textContent = 'Already attempted today';

        // Show countdown to next quiz availability
        if (countdownEl) {
            countdownEl.style.display = 'block';
            function tick() {
                const remaining = msUntilMidnight();
                countdownEl.textContent = `Next quiz in: ${formatCountdown(remaining)}`;
            }
            tick();
            quizCountdownInterval = setInterval(tick, 1000);
        }
    } else {
        // ── ALLOW: New day, quiz available ──
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btnText.textContent = 'Take Daily Quiz';

        if (countdownEl) {
            countdownEl.style.display = 'none';
            countdownEl.textContent = '';
        }
    }
}

// ── GAMIFICATION CARD UI UPDATE ───────────────────────────

function updateGamificationCard(state) {
    const lvlEl = document.getElementById('gami-level');
    const xpText = document.getElementById('gami-xp-text');
    const xpBar = document.getElementById('gami-xp-fill');
    const totalXpEl = document.getElementById('gami-total-xp');

    if(!lvlEl) return; // Not on a page with the widget

    lvlEl.textContent = `Lvl ${state.level}`;

    // Update total XP display (replaces old coin counter)
    if(totalXpEl) {
        if(totalXpEl.textContent !== String(state.xp)) {
            gsap.to(totalXpEl, { scale: 1.3, color: '#3498db', duration: 0.2, yoyo: true, repeat: 1 });
            totalXpEl.textContent = state.xp;
        }
    }

    const nextXP = getXPForNextLevel(state.level);
    if(xpText) xpText.textContent = `${state.xp} / ${nextXP} XP`;

    // Progress towards next milestone
    const progressPct = Math.min((state.xp / nextXP) * 100, 100);
    
    if(xpBar) {
        gsap.to(xpBar, { width: `${progressPct}%`, duration: 1, ease: 'power2.out' });
    }

    // Refresh quiz button state
    updateQuizButtonState();

    // Update leaderboard rank display on dashboard
    updateDashboardRank();
}

// ── DASHBOARD RANK DISPLAY ────────────────────────────────
// Shows user's current rank on the dashboard gamification card
function updateDashboardRank() {
    const rankEl = document.getElementById('gami-rank');
    if (!rankEl || typeof getLeaderboard !== 'function') return;

    const leaderboard = getLeaderboard();
    const userEntry = leaderboard.find(e => e.isUser);
    if (userEntry) {
        rankEl.textContent = `#${userEntry.rank}`;
    }
}

// ── DAILY QUIZ LOGIC ──────────────────────────────────────

async function openDailyQuiz() {
    // Check if user already took the quiz today
    if (hasAttemptedQuizToday()) {
        alert("You have already taken today's quiz! Come back tomorrow for a new one.");
        updateQuizButtonState();
        return;
    }

    try {
        const res = await fetch('/api/quizzes');
        const json = await res.json();
        if(!json.success) return alert("Quizzes unavailable.");

        const quizzes = json.data;
        const state = window.bfGamification.state;
        
        // Find a quiz the user hasn't completed
        const available = quizzes.filter(q => !state.completed_quizzes.includes(q.id));
        
        if(available.length === 0) {
            alert("Amazing! You've completed all current agricultural quizzes. Check back later for more!");
            return;
        }

        // Pick a random available quiz
        currentActiveQuiz = available[Math.floor(Math.random() * available.length)];
        renderQuizModal(currentActiveQuiz);
        
    } catch(e) {
        console.error("Quiz load error", e);
    }
}

function renderQuizModal(quiz) {
    const modal = document.getElementById('quizModal');
    if(!modal) return;

    document.getElementById('qm-topic').textContent = quiz.topic;
    document.getElementById('qm-difficulty').textContent = quiz.difficulty.toUpperCase();
    document.getElementById('qm-xp').textContent = `+${quiz.xp_reward} XP`;
    document.getElementById('qm-question').textContent = quiz.question;

    const optsContainer = document.getElementById('qm-options');
    optsContainer.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];
    quiz.options.forEach((opt, idx) => {
        const div = document.createElement('div');
        div.className = 'quiz-option';
        div.dataset.index = idx;
        div.innerHTML = `<span class="opt-letter">${letters[idx]}</span> <span class="opt-text">${opt}</span>`;
        div.onclick = () => selectQuizAnswer(idx, div);
        optsContainer.appendChild(div);
    });

    // Hide footer and leaderboard initially
    document.getElementById('qm-footer').style.display = 'none';
    const lbSection = document.getElementById('qm-leaderboard');
    if (lbSection) lbSection.style.display = 'none';
    
    // GSAP Show
    modal.style.display = 'flex';
    gsap.to(modal, { opacity: 1, duration: 0.3 });
    gsap.fromTo('.quiz-modal-content', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
}

function selectQuizAnswer(selectedIndex, element) {
    if(!currentActiveQuiz) return;
    
    const isCorrect = selectedIndex === currentActiveQuiz.correct_index;
    const allOptions = document.querySelectorAll('.quiz-option');
    
    // Disable further clicks
    allOptions.forEach(opt => opt.onclick = null);

    if (isCorrect) {
        element.classList.add('selected-correct');
        gsap.to(element, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 });
        
        // XP reward for correct answer
        window.bfGamification.addXP(currentActiveQuiz.xp_reward, "Quiz Answered Correctly");
        window.bfGamification.recordQuizCompletion(currentActiveQuiz.id, 100);
        
        document.getElementById('qm-explanation-text').innerHTML = `<strong>Correct!</strong> <br/> ${currentActiveQuiz.explanation}`;
    } else {
        element.classList.add('selected-wrong');
        gsap.to(element, { x: [-10, 10, -10, 10, 0], duration: 0.4 });
        
        // Highlight correct one
        allOptions[currentActiveQuiz.correct_index].classList.add('correct-reveal');
        
        // Consolation XP for attempting
        window.bfGamification.addXP(Math.floor(currentActiveQuiz.xp_reward * 0.2), "Quiz Attempt");
        window.bfGamification.recordQuizCompletion(currentActiveQuiz.id, 0);

        document.getElementById('qm-explanation-text').innerHTML = `<strong>Incorrect.</strong> <br/> ${currentActiveQuiz.explanation}`;
    }

    // Save quiz attempt timestamp
    saveQuizAttemptTimestamp();
    updateQuizButtonState();

    // Show explanation footer
    const footer = document.getElementById('qm-footer');
    footer.style.display = 'flex';
    gsap.fromTo(footer, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.5 });

    // Show leaderboard after a short delay
    setTimeout(() => showQuizLeaderboard(), 800);
}

// ── LEADERBOARD UI (shown inside quiz modal after answering) ──

function showQuizLeaderboard() {
    const lbSection = document.getElementById('qm-leaderboard');
    if (!lbSection || typeof getLeaderboard !== 'function') return;

    const leaderboard = getLeaderboard();
    const userEntry = leaderboard.find(e => e.isUser);
    const top10 = leaderboard.slice(0, 10);

    // Build leaderboard HTML
    let html = `
        <div class="lb-header">
            <i class="fas fa-trophy"></i> Leaderboard
        </div>
        <div class="lb-user-rank">
            Your Rank: <strong>#${userEntry ? userEntry.rank : '—'}</strong>
            <span class="lb-user-xp">${userEntry ? userEntry.xp : 0} XP</span>
        </div>
        <div class="lb-list">
    `;

    top10.forEach(entry => {
        // Medal icons for top 3
        let medalIcon = '';
        if (entry.rank === 1) medalIcon = '<span class="lb-medal gold">🥇</span>';
        else if (entry.rank === 2) medalIcon = '<span class="lb-medal silver">🥈</span>';
        else if (entry.rank === 3) medalIcon = '<span class="lb-medal bronze">🥉</span>';
        else medalIcon = `<span class="lb-rank-num">#${entry.rank}</span>`;

        const isUserClass = entry.isUser ? 'lb-row-user' : '';

        html += `
            <div class="lb-row ${isUserClass}">
                ${medalIcon}
                <span class="lb-name">${entry.name}${entry.isUser ? ' (You)' : ''}</span>
                <span class="lb-xp">${entry.xp} XP</span>
            </div>
        `;
    });

    // If user is NOT in top 10, show their position separately
    if (userEntry && userEntry.rank > 10) {
        // Show nearby ranks (±2 users around the user)
        const userIdx = leaderboard.findIndex(e => e.isUser);
        const nearby = leaderboard.slice(Math.max(0, userIdx - 2), userIdx + 3);

        html += `<div class="lb-separator">···</div>`;
        nearby.forEach(entry => {
            const isUserClass = entry.isUser ? 'lb-row-user' : '';
            html += `
                <div class="lb-row ${isUserClass}">
                    <span class="lb-rank-num">#${entry.rank}</span>
                    <span class="lb-name">${entry.name}${entry.isUser ? ' (You)' : ''}</span>
                    <span class="lb-xp">${entry.xp} XP</span>
                </div>
            `;
        });
    }

    html += `</div>`; // close lb-list

    lbSection.innerHTML = html;
    lbSection.style.display = 'block';
    gsap.fromTo(lbSection, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
}

function closeQuizModal() {
    const modal = document.getElementById('quizModal');
    gsap.to('.quiz-modal-content', { y: 50, opacity: 0, duration: 0.3 });
    gsap.to(modal, { opacity: 0, duration: 0.3, onComplete: () => {
        modal.style.display = 'none';
        currentActiveQuiz = null;
    }});
}

// ── FLOATING TOASTS (XP only) ─────────────────────────────

window.showGamificationToast = function(type, amount, reason) {
    // XP popup disabled per user request
    return;
};

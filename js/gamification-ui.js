// ============================================
// GAMIFICATION UI & GSAP ANIMATIONS
// ============================================

let currentActiveQuiz = null;

document.addEventListener('DOMContentLoaded', () => {
    // Listen for state changes from the engine
    document.addEventListener('gamificationReady', (e) => updateGamificationCard(e.detail));
    document.addEventListener('gamificationUpdated', (e) => updateGamificationCard(e.detail));
    
    // If engine loaded before DOM, manually pull state
    if(window.bfGamification) {
        updateGamificationCard(window.bfGamification.state);
    }
});

function updateGamificationCard(state) {
    // Try to find elements on the dashboard
    const lvlEl = document.getElementById('gami-level');
    const coinEl = document.getElementById('gami-coins');
    const xpText = document.getElementById('gami-xp-text');
    const xpBar = document.getElementById('gami-xp-fill');

    if(!lvlEl) return; // Not on a page with the widget

    lvlEl.textContent = `Lvl ${state.level}`;
    
    // Animate coin counter if changed
    if(coinEl.textContent !== String(state.coins)) {
        gsap.to(coinEl, { scale: 1.3, color: '#f1c40f', duration: 0.2, yoyo: true, repeat: 1 });
        coinEl.textContent = state.coins;
    }

    const nextXP = getXPForNextLevel(state.level);
    xpText.textContent = `${state.xp} / ${nextXP} XP`;

    // Calculate percentage
    let previousLevelXP = state.level === 1 ? 0 : getXPForNextLevel(state.level - 1);
    // Actually, simple calculation: percentage of current level
    let currentLevelXP = state.xp;
    if(state.level > 1) {
        // Technically, XP is cumulative.
        // Wait, if xp = 150, and level 2 req is 300.
    }
    // Let's keep it simple: Progress towards next milestone
    const progressPct = Math.min((state.xp / nextXP) * 100, 100);
    
    if(xpBar) {
        gsap.to(xpBar, { width: `${progressPct}%`, duration: 1, ease: 'power2.out' });
    }
}

// ── DAILY QUIZ LOGIC ──────────────────────────────────────

async function openDailyQuiz() {
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
    document.getElementById('qm-xp').textContent = `+${quiz.xp_reward}`;
    document.getElementById('qm-coin').textContent = `+${quiz.coin_reward}`;
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

    document.getElementById('qm-footer').style.display = 'none';
    
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
        // Play success anim
        gsap.to(element, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 });
        
        // Reward
        window.bfGamification.addXP(currentActiveQuiz.xp_reward, "Quiz Answered Correctly");
        window.bfGamification.addCoins(currentActiveQuiz.coin_reward, "Quiz Expert");
        window.bfGamification.recordQuizCompletion(currentActiveQuiz.id, 100);
        
        document.getElementById('qm-explanation-text').innerHTML = `<strong>Correct!</strong> <br/> ${currentActiveQuiz.explanation}`;
    } else {
        element.classList.add('selected-wrong');
        // Shake
        gsap.to(element, { x: [-10, 10, -10, 10, 0], duration: 0.4 });
        
        // Highlight correct one
        allOptions[currentActiveQuiz.correct_index].classList.add('correct-reveal');
        
        // Consolation reward
        window.bfGamification.addXP(Math.floor(currentActiveQuiz.xp_reward * 0.2), "Quiz Attempt");
        window.bfGamification.recordQuizCompletion(currentActiveQuiz.id, 0);

        document.getElementById('qm-explanation-text').innerHTML = `<strong>Incorrect.</strong> <br/> ${currentActiveQuiz.explanation}`;
    }

    // Show explanation footer
    const footer = document.getElementById('qm-footer');
    footer.style.display = 'flex';
    gsap.fromTo(footer, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.5 });
}

function closeQuizModal() {
    const modal = document.getElementById('quizModal');
    gsap.to('.quiz-modal-content', { y: 50, opacity: 0, duration: 0.3 });
    gsap.to(modal, { opacity: 0, duration: 0.3, onComplete: () => {
        modal.style.display = 'none';
        currentActiveQuiz = null;
    }});
}

// ── FLOATING TOASTS (XP & COINS) ─────────────────────────

window.showGamificationToast = function(type, amount, reason) {
    // XP popup disabled per user request
    return;

    const toast = document.createElement('div');
    toast.className = 'g-toast';
    
    let iconHTML = '';
    if(type === 'xp') iconHTML = '<i class="fas fa-star g-toast-icon xp"></i>';
    if(type === 'coin') iconHTML = '<i class="fas fa-coins g-toast-icon coin"></i>';
    if(type === 'badge') iconHTML = '<i class="fas fa-award g-toast-icon badge"></i>';

    toast.innerHTML = `
        ${iconHTML}
        <div class="g-toast-content">
            <h4>+${amount} ${type.toUpperCase()}</h4>
            <p>${reason}</p>
        </div>
    `;

    container.appendChild(toast);

    // Randomize slight entry angle for dynamic feel
    const startY = 50 + (Math.random() * 20);
    const endY = -100 - (Math.random() * 50);

    const tl = gsap.timeline({ onComplete: () => toast.remove() });
    tl.fromTo(toast, 
        { y: startY, scale: 0.5, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }
    )
    .to(toast, { y: -20, duration: 1.5, ease: 'none' }) // Float up slowly
    .to(toast, { y: endY, opacity: 0, scale: 0.8, duration: 0.4, ease: 'power2.in' }); 
};

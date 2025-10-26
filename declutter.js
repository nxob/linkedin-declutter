(function() {
    'use strict';

    // Prevent multiple instances
    if (window.linkedinDeclutterActive) {
        console.log('LinkedIn Declutter already active');
        return;
    }
    window.linkedinDeclutterActive = true;

    let mutedWords = JSON.parse(localStorage.getItem('linkedinDeclutterMuted') || '[]');

    // Add styles
    const style = document.createElement('style');
    style.id = 'linkedin-declutter-styles';
    style.textContent = `
        .linkedin-declutter-hidden {
            display: none !important;
        }
        .linkedin-declutter-collapsed .comments-comments-list {
            display: none !important;
        }
        .linkedin-declutter-toggle {
            cursor: pointer;
            color: #0a66c2;
            font-size: 14px;
            margin: 8px 0;
            font-weight: 600;
        }
        .linkedin-declutter-toggle:hover {
            text-decoration: underline;
        }
        #linkedin-mute-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
        }
        #linkedin-mute-panel h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
        }
        #linkedin-mute-panel input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-bottom: 8px;
        }
        #linkedin-mute-panel button {
            padding: 8px 16px;
            background: #0a66c2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
        }
        #linkedin-mute-panel button:hover {
            background: #004182;
        }
        #linkedin-mute-list {
            margin-top: 12px;
            max-height: 200px;
            overflow-y: auto;
        }
        .muted-word-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px;
            background: #f3f6f8;
            margin-bottom: 4px;
            border-radius: 4px;
        }
        .muted-word-item button {
            background: #dc3545;
            padding: 4px 8px;
            font-size: 12px;
        }
        #linkedin-mute-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #0a66c2;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
        }
        #linkedin-mute-toggle:hover {
            background: #004182;
        }
        #linkedin-declutter-status {
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10001;
            animation: slideDown 0.3s ease;
        }
        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(-100%); }
            to { transform: translateX(-50%) translateY(0); }
        }
    `;
    
    if (!document.getElementById('linkedin-declutter-styles')) {
        document.head.appendChild(style);
    }

    // Show status notification
    const showStatus = (message) => {
        const existing = document.getElementById('linkedin-declutter-status');
        if (existing) existing.remove();
        
        const status = document.createElement('div');
        status.id = 'linkedin-declutter-status';
        status.textContent = message;
        document.body.appendChild(status);
        
        setTimeout(() => status.remove(), 3000);
    };

    // Create mute panel if it doesn't exist
    if (!document.getElementById('linkedin-mute-panel')) {
        const panel = document.createElement('div');
        panel.id = 'linkedin-mute-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
            <h3>Mute Keywords</h3>
            <input type="text" id="mute-word-input" placeholder="Enter word or phrase...">
            <div>
                <button id="add-mute-word">Add</button>
                <button id="close-mute-panel">Close</button>
            </div>
            <div id="linkedin-mute-list"></div>
        `;

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'linkedin-mute-toggle';
        toggleBtn.textContent = '🔇';
        toggleBtn.title = 'Mute Keywords';

        document.body.appendChild(panel);
        document.body.appendChild(toggleBtn);

        toggleBtn.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('close-mute-panel').addEventListener('click', () => {
            panel.style.display = 'none';
        });

        document.getElementById('add-mute-word').addEventListener('click', addMutedWord);
        document.getElementById('mute-word-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addMutedWord();
        });

        function addMutedWord() {
            const input = document.getElementById('mute-word-input');
            const word = input.value.trim().toLowerCase();
            if (word && !mutedWords.includes(word)) {
                mutedWords.push(word);
                localStorage.setItem('linkedinDeclutterMuted', JSON.stringify(mutedWords));
                input.value = '';
                updateMutedWordsList();
                processAllPosts();
                showStatus(`Muted: "${word}"`);
            }
        }

        function removeMutedWord(word) {
            mutedWords = mutedWords.filter(w => w !== word);
            localStorage.setItem('linkedinDeclutterMuted', JSON.stringify(mutedWords));
            updateMutedWordsList();
            processAllPosts();
            showStatus(`Unmuted: "${word}"`);
        }

        function updateMutedWordsList() {
            const list = document.getElementById('linkedin-mute-list');
            if (mutedWords.length === 0) {
                list.innerHTML = '<div style="text-align:center;color:#999;padding:10px;font-size:14px;">No muted words yet</div>';
                return;
            }
            list.innerHTML = mutedWords.map(word => `
                <div class="muted-word-item">
                    <span>${word}</span>
                    <button data-word="${word}">Remove</button>
                </div>
            `).join('');

            list.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    removeMutedWord(e.target.getAttribute('data-word'));
                });
            });
        }

        updateMutedWordsList();
    }

    // Main declutter function
    function declutterPost(post) {
        if (!post || post.classList.contains('linkedin-declutter-processed')) return;
        post.classList.add('linkedin-declutter-processed');

        const text = post.innerText.toLowerCase();

        // Hide promoted content
        if (text.includes('promoted') || post.querySelector('[data-tracking-control-name*="promoted"]')) {
            post.classList.add('linkedin-declutter-hidden');
            return;
        }

        // Hide "Suggested for you"
        if (text.includes('suggested for you')) {
            post.classList.add('linkedin-declutter-hidden');
            return;
        }

        // Hide congratulations posts
        if (text.match(/congrat|celebrating|new job|work anniversary|started a new position/i)) {
            post.classList.add('linkedin-declutter-hidden');
            return;
        }

        // Hide polls
        if (post.querySelector('.feed-shared-poll') || text.includes('voted on this')) {
            post.classList.add('linkedin-declutter-hidden');
            return;
        }

        // Check for muted words
        for (const word of mutedWords) {
            if (text.includes(word)) {
                post.classList.add('linkedin-declutter-hidden');
                return;
            }
        }

        // Collapse comments
        const commentsSection = post.querySelector('.comments-comments-list');
        if (commentsSection && !post.querySelector('.linkedin-declutter-toggle')) {
            const toggle = document.createElement('div');
            toggle.className = 'linkedin-declutter-toggle';
            toggle.textContent = '▶ Show comments';
            toggle.addEventListener('click', () => {
                post.classList.toggle('linkedin-declutter-collapsed');
                toggle.textContent = post.classList.contains('linkedin-declutter-collapsed')
                    ? '▶ Show comments'
                    : '▼ Hide comments';
            });
            commentsSection.parentElement.insertBefore(toggle, commentsSection);
            post.classList.add('linkedin-declutter-collapsed');
        }
    }

    function processAllPosts() {
        // Remove processed class to reprocess
        document.querySelectorAll('.linkedin-declutter-processed').forEach(post => {
            post.classList.remove('linkedin-declutter-processed', 'linkedin-declutter-hidden');
        });

        // Process feed posts
        document.querySelectorAll('.feed-shared-update-v2, [data-id]').forEach(declutterPost);

        // Hide "People you may know" section
        document.querySelectorAll('[data-tracking-control-name*="people_you_may_know"]').forEach(el => {
            el.closest('.scaffold-finite-scroll__content, .pvs-list__container')?.classList.add('linkedin-declutter-hidden');
        });

        // Hide various suggestion cards
        document.querySelectorAll('.artdeco-card').forEach(card => {
            const text = card.innerText.toLowerCase();
            if (text.includes('people you may know') ||
                text.includes('suggested for you') ||
                text.includes('follow')) {
                card.classList.add('linkedin-declutter-hidden');
            }
        });
    }

    // Initial processing
    processAllPosts();
    showStatus('✨ LinkedIn Feed Decluttered!');

    // Watch for new content
    if (!window.linkedinDeclutterObserver) {
        window.linkedinDeclutterObserver = new MutationObserver(() => {
            processAllPosts();
        });

        window.linkedinDeclutterObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Periodic check for dynamically loaded content
    if (!window.linkedinDeclutterInterval) {
        window.linkedinDeclutterInterval = setInterval(processAllPosts, 2000);
    }

    console.log('LinkedIn Feed Declutter: Active (v1.0)');
})();

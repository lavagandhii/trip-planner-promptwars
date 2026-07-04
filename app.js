    const popularDestinations = [
        "Kyoto, Japan", "Tokyo, Japan", "Paris, France", "Rome, Italy", 
        "New York City, USA", "Bali, Indonesia", "Reykjavik, Iceland", 
        "Cape Town, South Africa", "Machu Picchu, Peru", "Queenstown, New Zealand",
        "Goa, India", "Jaipur, India", "New Delhi, India", "Kerala, India"
    ];

    /**
     * Debounce utility to prevent high-frequency DOM/event churn
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait duration in ms
     */
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    const destInput = document.getElementById('destination');
    const autoList = document.getElementById('autocomplete-list');

    /**
     * Renders autocomplete search items based on input match
     */
    const handleAutocomplete = function() {
        const val = destInput.value;
        autoList.innerHTML = '';
        if (!val) { autoList.style.display = 'none'; return; }
        
        let hasMatches = false;
        popularDestinations.forEach(dest => {
            if (dest.toLowerCase().includes(val.toLowerCase())) {
                hasMatches = true;
                const div = document.createElement('div');
                div.innerHTML = dest.replace(new RegExp(val, "gi"), match => `<strong>${match}</strong>`);
                div.addEventListener('click', function() {
                    destInput.value = dest;
                    autoList.style.display = 'none';
                });
                autoList.appendChild(div);
            }
        });
        autoList.style.display = hasMatches ? 'block' : 'none';
    };

    destInput.addEventListener('input', debounce(handleAutocomplete, 300));

    // Group 2: Keyboard Navigable Autocomplete & Selection
    let currentFocus = -1;
    destInput.addEventListener('keydown', function(e) {
        let items = autoList.getElementsByTagName('div');
        if (e.key === 'ArrowDown') {
            currentFocus++;
            addActive(items);
        } else if (e.key === 'ArrowUp') {
            currentFocus--;
            addActive(items);
        } else if (e.key === 'Enter') {
            if (currentFocus > -1 && items[currentFocus]) {
                e.preventDefault();
                items[currentFocus].click();
            }
        } else if (e.key === 'Escape') {
            autoList.style.display = 'none';
        }
    });

    function addActive(items) {
        if (!items || items.length === 0) return;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].style.backgroundColor = 'var(--accent)';
        items[currentFocus].style.color = 'var(--bg-base)';
        items[currentFocus].scrollIntoView({ block: 'nearest' });
    }

    function removeActive(items) {
        for (let i = 0; i < items.length; i++) {
            items[i].style.backgroundColor = '';
            items[i].style.color = '';
        }
    }

    let currentPlan = null;

    document.getElementById('tripForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorBox = document.getElementById('error-box');
        
        errorBox.style.display = 'none';
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('loader').style.display = 'block';
        document.getElementById('results').style.display = 'none';

        const loaderTexts = ["Consulting local intelligence...", "Anchoring market rates...", "Optimizing transit routing...", "Finalizing bespoke plan..."];
        let loaderIdx = 0;
        const loaderInterval = setInterval(() => {
            loaderIdx = (loaderIdx + 1) % loaderTexts.length;
            document.getElementById('loader-text').innerText = loaderTexts[loaderIdx];
        }, 1500);

        const payload = {
            destination: document.getElementById('destination').value,
            days: document.getElementById('days').value,
            budget: document.getElementById('budget').value,
            travelerType: document.getElementById('travelerType').value,
            preferences: document.getElementById('preferences').value
        };

        try {
            // Netlify Serverless Backend Call
            const response = await fetch('/.netlify/functions/plan-trip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Server connection failed");
            }

            const data = await response.json();
            
            if (data.isValidDestination === false) {
                throw new Error(data.destinationErrorMsg || "Unrecognized destination. Please enter a valid location.");
            }

            currentPlan = data;
            renderPlan();
            
            clearInterval(loaderInterval);
            document.getElementById('loader').style.display = 'none';
            document.getElementById('results').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            clearInterval(loaderInterval);
            showError(`Notice: ${err.message}`);
            document.getElementById('loader').style.display = 'none';
            document.getElementById('generateBtn').disabled = false;
        }
    });

    function showError(msg) {
        const errorBox = document.getElementById('error-box');
        errorBox.textContent = msg;
        errorBox.style.display = 'block';
    }

    /**
     * Sanitizes strings to prevent Cross-Site Scripting (XSS) attacks
     * @param {string} str - String to escape
     * @returns {string} Sanitized string
     */
    function esc(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag));
    }

    function renderPlan() {
        if (!currentPlan) return;
        renderBudget();
        renderItinerary();
        document.getElementById('tips-container').innerHTML = currentPlan.insiderTips.map(t => `<li>${esc(t)}</li>`).join('');
        document.getElementById('packing-container').innerHTML = currentPlan.packingList.map(t => `<li>${esc(t)}</li>`).join('');
        document.getElementById('generateBtn').disabled = false;
    }

    function renderBudget() {
        const b = currentPlan.budgetSummary;
        
        let actLocal = 0, actPrem = 0;
        currentPlan.itinerary.forEach(day => {
            day.activities.forEach(a => {
                if (a.costCategory === 'Local') actLocal += a.costINR;
                else actPrem += a.costINR;
            });
        });

        const totalFood = b.foodLocalINR + b.foodPremiumINR;
        const totalTrans = b.transportLocalINR + b.transportPremiumINR;
        const totalAct = actLocal + actPrem;
        const grandTotal = b.stayTotalINR + totalFood + totalTrans + totalAct;

        if (b.budgetReasoning) {
            document.getElementById('budget-reasoning').textContent = b.budgetReasoning;
        }

        const budgetInput = parseInt(document.getElementById('budget').value, 10);
        const isOverBudget = grandTotal > budgetInput;
        
        let verdictHtml = '';
        if (isOverBudget) {
            verdictHtml = `<span aria-label="Warning: Over Budget" style="background: rgba(217, 119, 87, 0.1); color: var(--tourist-orange); padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-left: 1rem; vertical-align: middle;">⚠ Over Budget</span>`;
        } else {
            verdictHtml = `<span aria-label="Status: Within Budget" style="background: rgba(103, 146, 103, 0.1); color: var(--local-green); padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-left: 1rem; vertical-align: middle;">✓ Within Budget</span>`;
        }

        document.getElementById('budget-container').innerHTML = `
            <div class="budget-card" style="background: rgba(217, 119, 87, 0.05); border-color: rgba(217, 119, 87, 0.2);">
                <div class="budget-title">Total Projected Spend <span style="font-size:0.75rem; opacity:0.7;">(Per Person)</span>${verdictHtml}</div>
                <div class="budget-value" style="color: var(--accent)" aria-label="Total Cost: ${grandTotal} Rupees">₹${grandTotal.toLocaleString()}</div>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">Includes ₹${b.stayTotalINR.toLocaleString()} Accommodation</div>
            </div>
            ${renderChartCard("Dining & Cuisine", b.foodLocalINR, b.foodPremiumINR)}
            ${renderChartCard("Experiences", actLocal, actPrem)}
        `;
    }

    function renderChartCard(title, local, premium) {
        const total = local + premium;
        const localPct = total > 0 ? (local / total) * 100 : 50;
        const premPct = total > 0 ? (premium / total) * 100 : 50;
        
        return `
            <div class="budget-card">
                <div class="budget-title">${title}</div>
                <div class="budget-value">₹${total.toLocaleString()}</div>
                
                <div class="bar-chart-container">
                    <div class="chart-bar">
                        <div class="chart-segment-local" style="width: ${localPct}%"></div>
                        <div class="chart-segment-tourist" style="width: ${premPct}%"></div>
                    </div>
                    <div class="chart-legend">
                        <div class="legend-item"><div class="dot" style="background: var(--local-green)"></div> Local (₹${local.toLocaleString()})</div>
                        <div class="legend-item"><div class="dot" style="background: var(--tourist-orange)"></div> Tourist (₹${premium.toLocaleString()})</div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderItinerary() {
        const container = document.getElementById('itinerary-container');
        container.innerHTML = currentPlan.itinerary.map((day, dayIndex) => {
            const combinedHours = day.activities.reduce((sum, a) => sum + (a.durationHours || 0) + ((a.travelTimeMins || 0)/60), 0);
            const combinedCost = day.activities.reduce((sum, a) => sum + (a.costINR || 0), 0);
            
            // Prioritize AI's own overPackedFlag, fallback to hours > 8 ONLY if AI flagged it, or just use AI flag directly to be safe
            // The user requested: "Use combinedHours > 8 only as a fallback signal, but prioritize the AI's own overPackedFlag reasoning"
            const isOverPacked = day.overPackedFlag === true || (day.overPackedFlag !== false && combinedHours > 8.5);

            let warningHtml = '';
            if (isOverPacked) {
                const lowPri = day.activities.find(a => a.priority === 'Low');
                warningHtml = `
                    <div class="warning-badge" aria-label="Pacing Warning">
                        <span>⚠ Tightly Packed: The AI has flagged this day as potentially exhausting (${combinedHours.toFixed(1)} hrs active).</span>
                        ${lowPri ? `<button class="breathe-btn" onclick="skipActivity(${dayIndex}, '${lowPri.id}')" aria-label="Skip ${esc(lowPri.title)}">Breathing Room (Skip '${esc(lowPri.title)}')</button>` : ''}
                    </div>
                `;
            }

            const daySummaryHtml = `<div style="color: var(--text-secondary); font-family: var(--font-head); font-size: 1.1rem; margin-bottom: 1rem; font-weight: 500;" aria-label="Day Summary">₹${combinedCost.toLocaleString()} · ${combinedHours.toFixed(1)} hrs total</div>`;

            const activitiesHtml = day.activities.map(act => `
                <article class="activity-card" id="${act.id}" onclick="toggleWiki('${esc(act.title)}', this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleWiki('${esc(act.title)}', this);}" role="button" tabindex="0" aria-expanded="false">
                    <div class="act-header">
                        <div>
                            <div class="act-time">${esc(act.timeOfDay)}</div>
                            <div class="act-title">${esc(act.title)}</div>
                        </div>
                        <div class="act-cost">₹${act.costINR.toLocaleString()}</div>
                    </div>
                    <div class="act-meta">
                        <span class="pill" aria-label="Duration">⏱️ ${act.durationHours}H Duration</span>
                        <span class="pill transit" aria-label="Transit Time">🚕 ${act.travelTimeMins}M Transit</span>
                        <span style="color: ${act.costCategory === 'Local' ? 'var(--local-green)' : 'var(--tourist-orange)'}">${esc(act.costCategory)} Experience</span>
                    </div>
                    <div class="wiki-drawer" id="wiki-${act.id}" aria-hidden="true">
                        <!-- Wiki content loads here -->
                    </div>
                </article>
            `).join('');

            return `
                <section class="day-group" aria-labelledby="day-title-${day.day}">
                    <div class="day-indicator"></div>
                    <h3 id="day-title-${day.day}">Day 0${day.day}</h3>
                    <h2 style="margin-bottom: 0.5rem;">${esc(day.theme)}</h2>
                    ${daySummaryHtml}
                    ${warningHtml}
                    <div style="margin-top: 1.5rem;">${activitiesHtml}</div>
                </section>
            `;
        }).join('');
    }

    window.skipActivity = function(dayIndex, activityId) {
        event.stopPropagation(); // Prevent wiki expand on skip
        const day = currentPlan.itinerary[dayIndex];
        const card = document.getElementById(activityId);
        
        // Trigger CSS collapse animation
        if(card) {
            // Set explicit height before collapsing for smooth transition
            card.style.height = card.scrollHeight + 'px';
            // Force reflow
            card.offsetHeight; 
            card.classList.add('collapsing');
        }
        
        setTimeout(() => {
            day.activities = day.activities.filter(a => a.id !== activityId);
            renderPlan();
        }, 400); // Matches CSS transition duration
    };

    // Wikipedia Memory Cache for Instant Re-opening
    const wikiCache = {};

    /**
     * Toggles the Wikipedia Intel Drawer for an activity card
     * @param {string} title - Title of the activity
     * @param {HTMLElement} cardElement - Card element
     */
    window.toggleWiki = async function(title, cardElement) {
        const drawer = cardElement.querySelector('.wiki-drawer');
        
        // If already open, close it
        if (drawer.classList.contains('open')) {
            drawer.classList.remove('open');
            cardElement.setAttribute('aria-expanded', 'false');
            return;
        }

        // Close any other open drawers in the itinerary
        document.querySelectorAll('.wiki-drawer.open').forEach(d => {
            if(d !== drawer) {
                d.classList.remove('open');
                d.parentElement.setAttribute('aria-expanded', 'false');
            }
        });

        // Memory Cache Check: If already fetched, load instantly from memory!
        if (wikiCache[title]) {
            drawer.innerHTML = wikiCache[title];
            drawer.classList.add('open');
            cardElement.setAttribute('aria-expanded', 'true');
            return;
        }

        drawer.innerHTML = `<div class="wiki-text" style="padding: 1rem;">Scanning global databases...</div>`;
        drawer.classList.add('open');
        cardElement.setAttribute('aria-expanded', 'true');

        try {
            // Clean up title for better search (remove generic words)
            let searchTitle = title.replace(/Visit|Tour|Experience|Morning at|Afternoon at|Ride|Walk|Tasting/ig, '').split(',')[0].trim();
            
            // Step 1: Fuzzy search Wikipedia for the closest matching actual page
            const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTitle)}&utf8=&format=json&origin=*`);
            const searchData = await searchRes.json();
            
            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
                drawer.innerHTML = `<div class="wiki-text" style="padding: 1rem;">No specific historical records found for this location.</div>`;
                return;
            }

            // Step 2: Grab the exact title of the top result
            const bestMatchTitle = searchData.query.search[0].title;

            // Step 3: Fetch the summary and image
            const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestMatchTitle)}`);
            
            if (res.status === 404) {
                drawer.innerHTML = `<div class="wiki-text" style="padding: 1rem;">No specific historical records found for this location.</div>`;
                return;
            }

            const data = await res.json();
            
            let imgHtml = '';
            if (data.thumbnail && data.thumbnail.source) {
                imgHtml = `<img src="${data.thumbnail.source}" class="wiki-img" alt="${esc(data.title)}">`;
            }

            const finalHtml = `
                ${imgHtml}
                <div>
                    <div class="wiki-text">${esc(data.extract)}</div>
                    <a href="${data.content_urls.desktop.page}" target="_blank" class="wiki-link">View Full Intel →</a>
                </div>
            `;

            // Save into Memory Cache!
            wikiCache[title] = finalHtml;
            drawer.innerHTML = finalHtml;

        } catch (e) {
            drawer.innerHTML = `<div class="wiki-text" style="padding: 1rem;">Database connection interrupted.</div>`;
        }
    };

    /**
     * Exports the current plan into beautifully formatted Markdown and copies to clipboard
     */
    window.exportItinerary = function() {
        if (!currentPlan) return;
        
        let md = `# Travel Intelligence Briefing: ${destInput.value}\n\n`;
        md += `**Budget Reasoning:** ${currentPlan.budgetSummary.budgetReasoning}\n\n`;
        md += `## Itinerary\n\n`;
        
        currentPlan.itinerary.forEach(day => {
            md += `### Day 0${day.day}: ${day.theme}\n`;
            day.activities.forEach(act => {
                md += `- **${act.timeOfDay}**: ${act.title} (₹${act.costINR}) - ${act.durationHours}h [${act.costCategory}]\n`;
            });
            md += `\n`;
        });

        md += `## Insider Tips\n`;
        currentPlan.insiderTips.forEach(t => md += `- ${t}\n`);
        md += `\n## Packing List\n`;
        currentPlan.packingList.forEach(p => md += `- ${p}\n`);

        navigator.clipboard.writeText(md).then(() => {
            const btn = document.getElementById('exportBtn');
            const orig = btn.innerText;
            btn.innerText = '✓ Copied to Clipboard!';
            setTimeout(() => btn.innerText = orig, 2500);
        }).catch(err => {
            alert('Failed to copy. Here is your markdown:\n\n' + md);
        });
    };

const { describe, it } = require('node:test');
const assert = require('assert');

// 1. HTML Sanitizer Function
function esc(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag));
}

// 2. Budget Verdict Calculation
function checkBudget(grandTotal, userBudget) {
    return grandTotal > userBudget;
}

// 3. Pace Check Flag Logic
function isOverPacked(overPackedFlag, combinedHours) {
    return overPackedFlag === true || (overPackedFlag !== false && combinedHours > 8.5);
}

// 4. Payload Validation
function validatePayload(destination, days, budget) {
    if (!destination || typeof destination !== 'string' || destination.trim().length === 0 || destination.length > 100) return false;
    const parsedDays = parseInt(days, 10);
    if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 14) return false;
    const parsedBudget = parseInt(budget, 10);
    if (isNaN(parsedBudget) || parsedBudget < 1000 || parsedBudget > 10000000) return false;
    return true;
}

describe('WanderMind AI Unit & Integration Test Suite', () => {

    it('should sanitize HTML input strings to prevent XSS attacks', () => {
        assert.strictEqual(esc("Normal text"), "Normal text");
        assert.strictEqual(esc("<script>alert('xss')</script>"), "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
    });

    it('should accurately calculate budget verdict (over/under user cap)', () => {
        assert.strictEqual(checkBudget(35000, 40000), false); // Within budget
        assert.strictEqual(checkBudget(45000, 40000), true);  // Over budget
    });

    it('should evaluate pace check warnings prioritizing AI flags', () => {
        assert.strictEqual(isOverPacked(true, 7.0), true);   // Explicit AI flag
        assert.strictEqual(isOverPacked(undefined, 9.0), true); // High hours fallback
        assert.strictEqual(isOverPacked(false, 6.0), false);  // Relaxed day
    });

    it('should validate backend API payloads strictly', () => {
        assert.strictEqual(validatePayload("Tokyo, Japan", "3", "40000"), true);
        assert.strictEqual(validatePayload("", "3", "40000"), false);
        assert.strictEqual(validatePayload("Kyoto", "20", "40000"), false);
        assert.strictEqual(validatePayload("Kyoto", "3", "100"), false);
    });

});

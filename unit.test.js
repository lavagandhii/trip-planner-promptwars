const assert = require('assert');

// 1. Test HTML Sanitizer (esc function)
function esc(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag));
}

try {
    console.log("Running HTML Sanitizer Tests...");
    assert.strictEqual(esc("Normal text"), "Normal text", "Should return normal text unchanged");
    assert.strictEqual(esc("<script>alert('xss')</script>"), "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;", "Should escape dangerous HTML tags");
    console.log("✅ HTML Sanitizer Tests Passed");

    console.log("Running Budget Math Logic Tests...");
    const userBudget = 40000;
    
    // Scenario 1: Under budget
    const grandTotalUnder = 35000;
    const isOverBudgetUnder = grandTotalUnder > userBudget;
    assert.strictEqual(isOverBudgetUnder, false, "Should correctly flag as within budget");

    // Scenario 2: Over budget
    const grandTotalOver = 45000;
    const isOverBudgetOver = grandTotalOver > userBudget;
    assert.strictEqual(isOverBudgetOver, true, "Should correctly flag as over budget");
    console.log("✅ Budget Math Logic Tests Passed");

    console.log("Running Pace Check Logic Tests...");
    // Scenario 1: AI flags it
    let combinedHours = 7.0;
    let overPackedFlag = true;
    let isOverPacked = overPackedFlag === true || (overPackedFlag !== false && combinedHours > 8.5);
    assert.strictEqual(isOverPacked, true, "Should flag if AI explicitly says true");

    // Scenario 2: High hours fallback
    combinedHours = 9.0;
    overPackedFlag = undefined;
    isOverPacked = overPackedFlag === true || (overPackedFlag !== false && combinedHours > 8.5);
    assert.strictEqual(isOverPacked, true, "Should fallback to flagging if > 8.5 hours");

    // Scenario 3: Normal day
    combinedHours = 6.0;
    overPackedFlag = false;
    isOverPacked = overPackedFlag === true || (overPackedFlag !== false && combinedHours > 8.5);
    assert.strictEqual(isOverPacked, false, "Should not flag a normal relaxed day");
    console.log("✅ Pace Check Logic Tests Passed");

    console.log("Running Backend Payload Validation Tests...");
    function validatePayload(destination, days, budget) {
        if (!destination || typeof destination !== 'string' || destination.trim().length === 0 || destination.length > 100) return false;
        const parsedDays = parseInt(days, 10);
        if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 14) return false;
        const parsedBudget = parseInt(budget, 10);
        if (isNaN(parsedBudget) || parsedBudget < 1000 || parsedBudget > 10000000) return false;
        return true;
    }

    assert.strictEqual(validatePayload("Tokyo, Japan", "3", "40000"), true, "Valid payload should pass");
    assert.strictEqual(validatePayload("", "3", "40000"), false, "Empty destination should fail");
    assert.strictEqual(validatePayload("Kyoto", "20", "40000"), false, "Days > 14 should fail");
    assert.strictEqual(validatePayload("Kyoto", "3", "100"), false, "Budget < 1000 should fail");
    console.log("✅ Backend Payload Validation Tests Passed");

    console.log("All minimal smoke tests passed successfully.");
} catch (error) {
    console.error("❌ Test Failed:", error.message);
    process.exit(1);
}

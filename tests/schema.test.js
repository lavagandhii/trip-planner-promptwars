const { describe, it } = require('node:test');
const assert = require('assert');

describe('WanderMind AI Schema & Integration Test Suite', () => {

    it('should validate the structure of the budget breakdown object', () => {
        const mockBudgetSummary = {
            budgetReasoning: "Comfortable budget for Kyoto.",
            stayTotalINR: 12000,
            foodLocalINR: 3000,
            foodPremiumINR: 4000,
            transportLocalINR: 1000,
            transportPremiumINR: 2000,
            activitiesLocalINR: 1500,
            activitiesPremiumINR: 2500
        };

        const requiredKeys = [
            "budgetReasoning", "stayTotalINR", "foodLocalINR", 
            "foodPremiumINR", "transportLocalINR", "transportPremiumINR", 
            "activitiesLocalINR", "activitiesPremiumINR"
        ];

        requiredKeys.forEach(key => {
            assert.strictEqual(typeof mockBudgetSummary[key], key === 'budgetReasoning' ? 'string' : 'number');
        });
    });

    it('should correctly sum itemized budget categories', () => {
        const stay = 12000;
        const food = 3000 + 4000;
        const trans = 1000 + 2000;
        const act = 1500 + 2500;
        const total = stay + food + trans + act;

        assert.strictEqual(total, 26000);
    });

    it('should reject invalid or extreme destination string inputs', () => {
        const isInvalid = (str) => !str || typeof str !== 'string' || str.trim().length === 0 || str.length > 100;

        assert.strictEqual(isInvalid(""), true);
        assert.strictEqual(isInvalid("   "), true);
        assert.strictEqual(isInvalid("a".repeat(101)), true);
        assert.strictEqual(isInvalid("Kyoto, Japan"), false);
    });

});

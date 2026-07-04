/**
 * Netlify Serverless Handler for Travel Planning with Gemini AI (v3 Final Release)
 * @param {Object} event - HTTP event object
 * @param {Object} context - Execution context
 * @returns {Object} HTTP response containing JSON itinerary or error
 */
exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { destination, days, budget, travelerType, preferences } = JSON.parse(event.body);

        // Security & Payload Validation Layer
        if (!destination || typeof destination !== 'string' || destination.trim().length === 0 || destination.length > 100) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid destination format. Must be 1-100 characters." }) };
        }
        const parsedDays = parseInt(days, 10);
        if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 14) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid duration. Duration must be between 1 and 14 days." }) };
        }
        const parsedBudget = parseInt(budget, 10);
        if (isNaN(parsedBudget) || parsedBudget < 1000 || parsedBudget > 10000000) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid budget. Must be between ₹1,000 and ₹1,00,00,000." }) };
        }

        if (!process.env.GEMINI_API_KEY) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Server missing API key. Please configure GEMINI_API_KEY in Netlify." })
            };
        }

        const promptText = `
        Act as an elite travel agent with 30 years of experience.
        Plan a trip to: ${destination}
        Duration: ${days} days
        Traveler: ${travelerType}
        Per Person Budget: ₹${budget} INR
        Preferences: ${preferences || 'None'}

        CRITICAL VALIDATION:
        Determine if '${destination}' is a valid, real-world travel destination. If it is nonsense (e.g., 'asdfghjkl') or impossible (e.g., 'Mars', 'Sun'), set isValidDestination to false and provide a destinationErrorMsg. 
        If isValidDestination is false, you do NOT need to fill out the rest of the itinerary accurately, just return empty arrays.

        CRITICAL GROUNDING RULES FOR PRICES:
        - ALL COSTS AND BUDGETS MUST BE CALCULATED STRICTLY ON A PER-PERSON BASIS. Do NOT multiply costs for families/groups. The user wants to see the cost for ONE person in that unit.
        - You MUST determine realistic base anchors for the SPECIFIC destination requested (${destination}). For example, a local meal in Paris costs vastly more than in Bali.
        - Mentally calculate these contextual anchors (e.g. average budget hotel split cost, local meal, taxi split cost) for ${destination}.
        - Use those contextual anchors to calculate realistic costs, but OUTPUT ALL FINAL VALUES IN ₹ INR for the user's convenience.
        - Ensure the total itemized budget does NOT exceed the Per Person Budget of ₹${budget}.
        - Provide a 'budgetReasoning' paragraph explaining the financial reality of this trip (e.g. "₹40,000 is a very comfortable per-person budget for Bali, allowing for premium stays and private transport, but would be extremely tight for Paris...").
        
        PACE CHECK RULE (CRITICAL):
        - For each activity, estimate travelTimeMins (travel time from the PREVIOUS location, or from the hotel for the first activity).
        - If the total durationHours of activities in a day PLUS total travelTimeMins (converted to hours) exceeds 8 hours, set overPackedFlag to true.
        - Always provide at least one 'Low' priority activity per day that can be safely skipped.

        Return ONLY a JSON matching the provided schema. No markdown wrapping. Give unique string IDs to each activity (e.g., 'd1-a1').
        `;

        const responseSchema = {
            type: "object",
            properties: {
                isValidDestination: { type: "boolean" },
                destinationErrorMsg: { type: "string" },
                itinerary: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            day: { type: "number" },
                            theme: { type: "string" },
                            overPackedFlag: { type: "boolean" },
                            activities: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        timeOfDay: { type: "string" },
                                        title: { type: "string" },
                                        durationHours: { type: "number" },
                                        travelTimeMins: { type: "number" },
                                        costINR: { type: "number" },
                                        costCategory: { type: "string", enum: ["Local", "Premium/Tourist"] },
                                        priority: { type: "string", enum: ["High", "Medium", "Low"] }
                                    },
                                    required: ["id", "timeOfDay", "title", "durationHours", "travelTimeMins", "costINR", "costCategory", "priority"]
                                }
                            }
                        },
                        required: ["day", "theme", "overPackedFlag", "activities"]
                    }
                },
                insiderTips: { type: "array", items: { type: "string" } },
                packingList: { type: "array", items: { type: "string" } },
                budgetSummary: {
                    type: "object",
                    properties: {
                        budgetReasoning: { type: "string" },
                        stayTotalINR: { type: "number" },
                        foodLocalINR: { type: "number" },
                        foodPremiumINR: { type: "number" },
                        transportLocalINR: { type: "number" },
                        transportPremiumINR: { type: "number" },
                        activitiesLocalINR: { type: "number" },
                        activitiesPremiumINR: { type: "number" }
                    },
                    required: ["budgetReasoning", "stayTotalINR", "foodLocalINR", "foodPremiumINR", "transportLocalINR", "transportPremiumINR", "activitiesLocalINR", "activitiesPremiumINR"]
                }
            },
            required: ["isValidDestination", "itinerary", "insiderTips", "packingList", "budgetSummary"]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema
                }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            return { statusCode: 500, body: JSON.stringify({ error: err.error?.message || "API request failed" }) };
        }

        const data = await response.json();
        const jsonString = data.candidates[0].content.parts[0].text;
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: jsonString
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

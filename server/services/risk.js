export function calculateRiskScore(user, enrollment) {
    const NOW = new Date();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const daysSince = (dateStr) => {
        if (!dateStr) return 999;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 999;
        return Math.floor((NOW - d) / MS_PER_DAY);
    };

    // Progress is 0.0–1.0 from Thinkific, normalise to 0–100
    const rawProgress = parseFloat(enrollment.percentage_completed) || 0;
    const progressPct = rawProgress <= 1.0 ? Math.round(rawProgress * 100) : Math.round(rawProgress);

    // PRIMARY: Completion percentage (60% of score)
    // High completion = low risk. 100% = 0 risk points. 0% = 60 risk points.
    const completionRisk = (1 - progressPct / 100) * 60;

    // SECONDARY: Login recency (25% of score)
    const daysSinceLogin = daysSince(user.last_sign_in_at);
    const loginRisk = Math.min(daysSinceLogin, 21) / 21 * 25;

    // TERTIARY: Activity stagnation (15% of score)
    const daysSinceActivity = daysSince(enrollment.updated_at);
    const stagnationRisk = Math.min(daysSinceActivity, 21) / 21 * 15;

    const totalScore = Math.round(completionRisk + loginRisk + stagnationRisk);
    const cappedScore = Math.min(Math.max(totalScore, 0), 100);

    // Category thresholds — based on COMPLETION PERCENTAGE primarily
    let category;
    if (progressPct >= 75) {
        // High completion: only Attention if completely inactive for 3+ weeks
        category = cappedScore >= 80 ? 'Attention' : 'Healthy';
    } else if (progressPct < 30) {
        // Low completion: always at least Attention, Critical if also inactive
        category = cappedScore >= 55 ? 'Critical' : 'Attention';
    } else {
        // Mid-range (30–74%): standard thresholds
        if (cappedScore >= 65) category = 'Critical';
        else if (cappedScore >= 35) category = 'Attention';
        else category = 'Healthy';
    }

    return {
        score: cappedScore,
        category,
        breakdown: {
            completion: Math.round(completionRisk),
            login: Math.round(loginRisk),
            stagnation: Math.round(stagnationRisk),
            progressPct,
            daysSinceLogin,
            daysSinceActivity
        }
    };
}

export function calculateRiskScore(user, enrollment) {
    const NOW = new Date();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    // Helper: Days since date
    const daysSince = (dateStr) => {
        if (!dateStr) return 999; // Never happened = max risk
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 999;
        return Math.floor((NOW - d) / MS_PER_DAY);
    };

    // 1. Recency (40%) - Last Login
    // Cap at 30 days for max risk
    // If never logged in, max risk
    const daysSinceLogin = daysSince(user.last_sign_in_at);
    // If just created (<7 days) and no login, maybe lesser risk? No, they should login.
    const recencyScore = Math.min(daysSinceLogin, 30) / 30 * 40;

    // 2. Stagnation (30%) - Last Progress (Enrollment Updated At)
    const daysSinceActivity = daysSince(enrollment.updated_at);
    const stagnationScore = Math.min(daysSinceActivity, 30) / 30 * 30;

    // 3. Completion (20%) - Inverse of Progress
    // 0% progress = 20 risk, 100% progress = 0 risk
    const progress = parseFloat(enrollment.percentage_completed) || 0; // 0.0 to 1.0
    const completionScore = (1.0 - progress) * 20;

    // 4. Enrollment Age (10%) - Old enrollments are riskier
    // Cap at 90 days (3 months)
    const daysEnrolled = daysSince(enrollment.started_at || enrollment.created_at);
    const ageScore = Math.min(daysEnrolled, 90) / 90 * 10;

    // TOTAL SCORE
    const totalScore = Math.round(recencyScore + stagnationScore + completionScore + ageScore);
    const cappedScore = Math.min(Math.max(totalScore, 0), 100);

    // Category
    let category = 'Healthy';
    if (cappedScore >= 70) category = 'Critical';
    else if (cappedScore >= 40) category = 'Attention';

    return {
        score: cappedScore,
        category,
        breakdown: {
            recency: Math.round(recencyScore),
            stagnation: Math.round(stagnationScore),
            completion: Math.round(completionScore),
            age: Math.round(ageScore),
            daysSinceLogin,
            daysSinceActivity
        }
    };
}

const calculateGoalProjections = (goals) => {
    let projections = {};
    const MAX_MONTHS = 1200; // 100 years max loop
    
    let state = goals.map(g => {
        let normalizedMonthly = g.contributionAmount || 0;
        if (g.contributionFrequency === 'weekly') normalizedMonthly *= 4.3333;
        else if (g.contributionFrequency === 'biweekly') normalizedMonthly *= 2.1666;
        else if (g.contributionFrequency === 'yearly') normalizedMonthly /= 12;

        return {
            id: g.id,
            remaining: Math.max(0, g.targetAmount - (g.currentAmount || 0)),
            monthly: normalizedMonthly,
            finished: false,
            hitMonth: null
        };
    });

    for (let month = 1; month <= MAX_MONTHS; month++) {
        let allFinished = true;
        let rolledOverCashThisMonth = 0;

        for (let i = 0; i < state.length; i++) {
            let g = state[i];
            
            if (g.remaining <= 0) {
                if (!g.finished) {
                    g.finished = true;
                    // It hit prior to this simulation month
                    g.hitMonth = month - 1; 
                }
                rolledOverCashThisMonth += g.monthly;
                continue;
            }

            allFinished = false;
            let totalToAdd = g.monthly + rolledOverCashThisMonth;
            
            if (totalToAdd > 0) {
                 if (g.remaining <= totalToAdd) {
                     let leftover = totalToAdd - g.remaining;
                     g.remaining = 0;
                     g.finished = true;
                     g.hitMonth = month;
                     rolledOverCashThisMonth = leftover; 
                 } else {
                     g.remaining -= totalToAdd;
                     rolledOverCashThisMonth = 0; 
                 }
            } else {
                 rolledOverCashThisMonth = 0;
            }
        }

        if (allFinished) break;
    }

    state.forEach(g => {
        if (g.hitMonth === null || g.hitMonth === 0) {
             projections[g.id] = g.remaining <= 0 ? 'Reached 🎉' : 'N/A';
        } else {
             const d = new Date('2026-04-05T00:00:00'); // mocked current date
             d.setMonth(d.getMonth() + g.hitMonth);
             projections[g.id] = 'Hit by ' + d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) + ' (months from now: '+g.hitMonth+')';
        }
    });

    return projections;
};

// Scenario: "Priority 2 would be Aug 2026"
// Aug 2026 from April 2026 is exactly 4 months.
// Let's create a goal scenario that makes Priority 2 take 4 months.
// Wait, if he contributes to Goal 1 and Goal 2 concurrently? Let's check both ways.
let goals = [
    {id: '1', targetAmount: 200, currentAmount: 0, contributionAmount: 100, contributionFrequency: 'monthly'},
    {id: '2', targetAmount: 800, currentAmount: 0, contributionAmount: 200, contributionFrequency: 'monthly'}
];

console.log(calculateGoalProjections(goals));

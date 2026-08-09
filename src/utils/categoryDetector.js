export const detectPseudoCategory = (tx) => {
    if (!tx) return 'Uncategorized';
    
    if (tx.category && typeof tx.category === 'string' && tx.category.endsWith(' ')) {
        const trimmed = tx.category.trim();
        if (trimmed === 'Subscriptions' || trimmed === 'PSEUDO_SUBSCRIPTIONS') return 'PSEUDO_SUBSCRIPTIONS';
        if (trimmed === 'Gas & Fuel' || trimmed === 'PSEUDO_GAS') return 'PSEUDO_GAS';
        if (trimmed === 'Ride Share' || trimmed === 'PSEUDO_RIDE_SHARE') return 'PSEUDO_RIDE_SHARE';
        if (trimmed === 'Groceries' || trimmed === 'PSEUDO_GROCERIES') return 'PSEUDO_GROCERIES';
        if (trimmed === 'Hygiene & Household' || trimmed === 'PSEUDO_HYGIENE_HOUSEHOLD') return 'PSEUDO_HYGIENE_HOUSEHOLD';
        return trimmed;
    }
    
    const merchant = (tx.merchant_name || tx.name || '').toLowerCase();
    
    if (merchant.includes('exxon') || merchant.includes('shell') || merchant.includes('chevron') || merchant.includes('wawa') || merchant.includes('bp ') || merchant.includes('sunoco') || merchant.includes('speedway') || merchant.includes('quik') || merchant.includes('pilot') || merchant.includes('gas') || merchant.includes('fuel')) {
        return 'PSEUDO_GAS';
    }
    if (merchant.includes('uber') || merchant.includes('lyft') || merchant.includes('taxi') || merchant.includes('cab')) {
        return 'PSEUDO_RIDE_SHARE';
    }
    if (merchant.includes('walmart') || merchant.includes('kroger') || merchant.includes('target') || merchant.includes('publix') || merchant.includes('safeway') || merchant.includes('trader joe') || merchant.includes('whole food') || merchant.includes('aldi') || merchant.includes('wegmans') || merchant.includes('h-e-b') || merchant.includes('meijer') || merchant.includes('food lion') || merchant.includes('costco') || merchant.includes("sam's club") || merchant.includes('bjs') || merchant.includes('grocery') || merchant.includes('supermarket')) {
        return 'PSEUDO_GROCERIES';
    }
    if (merchant.includes('cvs') || merchant.includes('walgreens') || merchant.includes('rite aid') || merchant.includes('sephora') || merchant.includes('ulta') || merchant.includes('bath & body') || merchant.includes('home depot') || merchant.includes("lowe's") || merchant.includes('ace hardware') || merchant.includes('ikea') || merchant.includes('bed bath') || merchant.includes('pharmacy') || merchant.includes('drugstore') || merchant.includes('sally beauty') || merchant.includes('mac cosmetics')) {
        return 'PSEUDO_HYGIENE_HOUSEHOLD';
    }
    if (merchant.includes('netflix') || merchant.includes('spotify') || merchant.includes('hulu') || merchant.includes('disney+') || merchant.includes('apple') || merchant.includes('amazon prime') || merchant.includes('hbomax') || merchant.includes('peacock') || merchant.includes('paramount') || merchant.includes('gym')) {
        return 'PSEUDO_SUBSCRIPTIONS';
    }
    
    const cat = tx.category;
    if (typeof cat === 'string') return cat.trim();
    if (Array.isArray(cat)) return cat[0] ? cat[0].trim() : 'Uncategorized';
    return 'Uncategorized';
};

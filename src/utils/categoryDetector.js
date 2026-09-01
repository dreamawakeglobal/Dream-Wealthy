export const detectPseudoCategory = (tx) => {
    if (!tx) return 'Uncategorized';
    
    // Explicit manual overrides or split child transactions ALWAYS take priority over merchant name guessing!
    if (tx.isSplitChild || (tx.category && typeof tx.category === 'string' && tx.category.endsWith(' '))) {
        const trimmed = typeof tx.category === 'string' ? tx.category.trim() : (Array.isArray(tx.category) ? (tx.category[0] || '').trim() : 'Uncategorized');
        if (trimmed === 'Subscriptions' || trimmed === 'PSEUDO_SUBSCRIPTIONS') return 'PSEUDO_SUBSCRIPTIONS';
        if (trimmed === 'Gas & Fuel' || trimmed === 'PSEUDO_GAS') return 'PSEUDO_GAS';
        if (trimmed === 'Ride Share' || trimmed === 'PSEUDO_RIDE_SHARE') return 'PSEUDO_RIDE_SHARE';
        if (trimmed === 'Groceries' || trimmed === 'PSEUDO_GROCERIES') return 'PSEUDO_GROCERIES';
        if (trimmed === 'Hygiene & Household' || trimmed === 'PSEUDO_HYGIENE_HOUSEHOLD') return 'PSEUDO_HYGIENE_HOUSEHOLD';
        return trimmed || 'Uncategorized';
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

export const getFilterLabel = (filterId) => {
    if (!filterId) return '🏷️ Uncategorized';
    if (filterId === 'PSEUDO_GAS') return '⛽️ Gas & Fuel';
    if (filterId === 'PSEUDO_RIDE_SHARE') return '🚗 Ride Share';
    if (filterId === 'PSEUDO_GROCERIES') return '🛒 Groceries';
    if (filterId === 'PSEUDO_HYGIENE_HOUSEHOLD') return '🧼 Hygiene & Household';
    if (filterId === 'PSEUDO_SUBSCRIPTIONS') return '🔄 Subscriptions';
    if (filterId === 'All') return '🌎 All';
    
    // Format the backend string: replace underscores with spaces and title case
    const formattedName = filterId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
        
    const lower = filterId.toLowerCase();
    if (lower.includes('food') || lower.includes('drink') || lower.includes('dining') || lower.includes('restaurant')) return `🍔 ${formattedName}`;
    if (lower.includes('travel') || lower.includes('airline') || lower.includes('hotel')) return `✈️ ${formattedName}`;
    if (lower.includes('shop') || lower.includes('retail') || lower.includes('clothing')) return `🛍️ ${formattedName}`;
    if (lower.includes('transfer') || lower.includes('payment') || lower.includes('credit card')) return `💳 ${formattedName}`;
    if (lower.includes('health') || lower.includes('medical') || lower.includes('doctor')) return `🏥 ${formattedName}`;
    if (lower.includes('service') || lower.includes('subscription')) return `⚙️ ${formattedName}`;
    if (lower.includes('entertainment') || lower.includes('recreation')) return `🎟️ ${formattedName}`;
    if (lower.includes('auto') || lower.includes('car') || lower.includes('transport')) return `🚙 ${formattedName}`;
    if (lower.includes('utility') || lower.includes('bills')) return `⚡️ ${formattedName}`;
    if (lower.includes('personal') || lower.includes('care')) return `💅 ${formattedName}`;
    if (lower.includes('education') || lower.includes('school')) return `🎓 ${formattedName}`;
    if (lower.includes('home') || lower.includes('rent') || lower.includes('mortgage')) return `🏠 ${formattedName}`;
    if (lower.includes('income') || lower.includes('salary') || lower.includes('paycheck')) return `💵 ${formattedName}`;
    
    return `🏷️ ${formattedName}`;
};

export const mapUserExpenseToPlaidCategory = (name) => {
    if (!name) return 'Uncategorized';
    const n = name.toLowerCase();

    // Isolated Pseudo-Categories specifically preventing Sub-Category bleeding!
    if (n === 'gas' || n === 'gas station' || n === 'fuel' || n === 'petrol') {
        return 'PSEUDO_GAS';
    }
    if (n === 'uber' || n === 'lyft' || n === 'ride share' || n === 'rideshare' || n === 'taxi') {
        return 'PSEUDO_RIDE_SHARE';
    }
    if (n === 'groceries' || n === 'grocery' || n === 'supermarket') {
        return 'PSEUDO_GROCERIES';
    }
    if (n.includes('hygiene') || n.includes('household') || n.includes('supplies') || n.includes('toiletr') || n.includes('cleaning')) {
        return 'PSEUDO_HYGIENE_HOUSEHOLD';
    }
    if (n.includes('subscription') || n.includes('streaming') || n.includes('membership')) {
        return 'PSEUDO_SUBSCRIPTIONS';
    }

    // Food & Dining (Excluding Groceries!)
    if (n.includes('food') || n.includes('din') || n.includes('restaurant') || n.includes('coffee') || n.includes('snack') || n.includes('drink')) {
        return 'FOOD_AND_DRINK';
    }
    // Transit & General Travel (Excluding Gas & Ride Shifts)
    if (n.includes('transit') || n.includes('car') || n.includes('auto') || n.includes('transport') || n.includes('flight') || n.includes('travel') || n.includes('train') || n.includes('bus')) {
        return 'TRANSPORTATION';
    }
    // Shopping & Retail
    if (n.includes('shop') || n.includes('amazon') || n.includes('cloth') || n.includes('retail') || n.includes('merch') || n.includes('supplies')) {
        return 'GENERAL_MERCHANDISE';
    }
    // Entertainment
    if (n.includes('fun') || n.includes('movie') || n.includes('concert') || n.includes('game') || n.includes('entertain') || n.includes('event')) {
        return 'ENTERTAINMENT';
    }
    // Personal Care
    if (n.includes('care') || n.includes('hair') || n.includes('salon') || n.includes('spa') || n.includes('health') || n.includes('gym')) {
        return 'PERSONAL_CARE';
    }
    // Home Improvement
    if (n.includes('home') || n.includes('house') || n.includes('hardware') || n.includes('furniture') || n.includes('repair')) {
        return 'HOME_IMPROVEMENT';
    }
    // Utilities & Bills
    if (n.includes('util') || n.includes('bill') || n.includes('electric') || n.includes('water') || n.includes('rent') || n.includes('internet')) {
        return 'RENT_AND_UTILITIES';
    }
    // Bank Fees
    if (n.includes('fee') || n.includes('bank') || n.includes('charge')) {
        return 'BANK_FEES';
    }

    return name;
};

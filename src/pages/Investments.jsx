import React, { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../SoundContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { TrendingUp, Plus, Target, DollarSign, GripVertical, Trash2, Search, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useFinancialContext } from '../FinancialContext';
import { supabase } from '../supabaseClient';
import { AnimateOnScroll } from '../components/ui/AnimateOnScroll';
import investmentsHeaderImg from '../assets/investments-header.png';
import './Investments.css';

// Base Initial State structure
const INITIAL_ASSET_CLASSES = {
    Stocks: [
        { id: 's1', symbol: 'AAPL', name: 'Apple Inc.', logo: 'https://logo.clearbit.com/apple.com', price: 0, change: 0 },
        { id: 's2', symbol: 'MSFT', name: 'Microsoft Corp.', logo: 'https://logo.clearbit.com/microsoft.com', price: 0, change: 0 },
        { id: 's3', symbol: 'NVDA', name: 'NVIDIA Corp.', logo: 'https://logo.clearbit.com/nvidia.com', price: 0, change: 0 },
        { id: 's4', symbol: 'AMZN', name: 'Amazon.com Inc.', logo: 'https://logo.clearbit.com/amazon.com', price: 0, change: 0 },
        { id: 's5', symbol: 'META', name: 'Meta Platforms Inc.', logo: 'https://logo.clearbit.com/meta.com', price: 0, change: 0 },
        { id: 's6', symbol: 'GOOGL', name: 'Alphabet Inc.', logo: 'https://logo.clearbit.com/abc.xyz', price: 0, change: 0 },
        { id: 's7', symbol: 'TSLA', name: 'Tesla Inc.', logo: 'https://logo.clearbit.com/tesla.com', price: 0, change: 0 },
        { id: 's8', symbol: 'BRK.B', name: 'Berkshire Hathaway', logo: 'https://logo.clearbit.com/berkshirehathaway.com', price: 0, change: 0 },
        { id: 's9', symbol: 'LLY', name: 'Eli Lilly and Co.', logo: 'https://logo.clearbit.com/lilly.com', price: 0, change: 0 },
        { id: 's10', symbol: 'AVGO', name: 'Broadcom Inc.', logo: 'https://logo.clearbit.com/broadcom.com', price: 0, change: 0 },
    ],
    Crypto: [
        { id: 'c1', symbol: 'BTC', name: 'Bitcoin', apiId: 'bitcoin', price: 0, change: 0 },
        { id: 'c2', symbol: 'ETH', name: 'Ethereum', apiId: 'ethereum', price: 0, change: 0 },
        { id: 'c3', symbol: 'USDT', name: 'Tether', apiId: 'tether', price: 0, change: 0 },
        { id: 'c4', symbol: 'BNB', name: 'BNB', apiId: 'binancecoin', price: 0, change: 0 },
        { id: 'c5', symbol: 'XRP', name: 'XRP', apiId: 'ripple', price: 0, change: 0 },
        { id: 'c6', symbol: 'USDC', name: 'USDC', apiId: 'usd-coin', price: 0, change: 0 },
        { id: 'c7', symbol: 'SOL', name: 'Solana', apiId: 'solana', price: 0, change: 0 },
        { id: 'c8', symbol: 'TRX', name: 'TRON', apiId: 'tron', price: 0, change: 0 },
        { id: 'c9', symbol: 'FIGR_HELOC', name: 'Figure Heloc', apiId: 'figure-heloc', price: 0, change: 0 },
        { id: 'c10', symbol: 'DOGE', name: 'Dogecoin', apiId: 'dogecoin', price: 0, change: 0 },
        { id: 'c11', symbol: 'WBT', name: 'WhiteBIT Coin', apiId: 'whitebit', price: 0, change: 0 },
        { id: 'c12', symbol: 'USDS', name: 'USDS', apiId: 'usds', price: 0, change: 0 },
        { id: 'c13', symbol: 'ADA', name: 'Cardano', apiId: 'cardano', price: 0, change: 0 },
        { id: 'c14', symbol: 'BCH', name: 'Bitcoin Cash', apiId: 'bitcoin-cash', price: 0, change: 0 },
        { id: 'c15', symbol: 'LEO', name: 'LEO Token', apiId: 'leo-token', price: 0, change: 0 },
        { id: 'c16', symbol: 'HYPE', name: 'Hyperliquid', apiId: 'hyperliquid', price: 0, change: 0 },
        { id: 'c17', symbol: 'XMR', name: 'Monero', apiId: 'monero', price: 0, change: 0 },
        { id: 'c18', symbol: 'LINK', name: 'Chainlink', apiId: 'chainlink', price: 0, change: 0 },
        { id: 'c19', symbol: 'USDE', name: 'Ethena USDe', apiId: 'ethena-usde', price: 0, change: 0 },
        { id: 'c20', symbol: 'CC', name: 'Canton', apiId: 'canton-network', price: 0, change: 0 },
        { id: 'c21', symbol: 'XLM', name: 'Stellar', apiId: 'stellar', price: 0, change: 0 },
        { id: 'c22', symbol: 'USD1', name: 'USD1', apiId: 'usd1-wlfi', price: 0, change: 0 },
        { id: 'c23', symbol: 'RAIN', name: 'Rain', apiId: 'rain', price: 0, change: 0 },
        { id: 'c24', symbol: 'DAI', name: 'Dai', apiId: 'dai', price: 0, change: 0 },
        { id: 'c25', symbol: 'PYUSD', name: 'PayPal USD', apiId: 'paypal-usd', price: 0, change: 0 },
        { id: 'c26', symbol: 'LTC', name: 'Litecoin', apiId: 'litecoin', price: 0, change: 0 },
        { id: 'c27', symbol: 'HBAR', name: 'Hedera', apiId: 'hedera-hashgraph', price: 0, change: 0 },
        { id: 'c28', symbol: 'AVAX', name: 'Avalanche', apiId: 'avalanche-2', price: 0, change: 0 },
        { id: 'c29', symbol: 'ZEC', name: 'Zcash', apiId: 'zcash', price: 0, change: 0 },
        { id: 'c30', symbol: 'SUI', name: 'Sui', apiId: 'sui', price: 0, change: 0 },
        { id: 'c31', symbol: 'SHIB', name: 'Shiba Inu', apiId: 'shiba-inu', price: 0, change: 0 },
        { id: 'c32', symbol: 'CRO', name: 'Cronos', apiId: 'crypto-com-chain', price: 0, change: 0 },
        { id: 'c33', symbol: 'TON', name: 'Toncoin', apiId: 'the-open-network', price: 0, change: 0 },
        { id: 'c34', symbol: 'WLFI', name: 'World Liberty Financial', apiId: 'world-liberty-financial', price: 0, change: 0 },
        { id: 'c35', symbol: 'XAUT', name: 'Tether Gold', apiId: 'tether-gold', price: 0, change: 0 },
        { id: 'c36', symbol: 'DOT', name: 'Polkadot', apiId: 'polkadot', price: 0, change: 0 },
        { id: 'c37', symbol: 'PAXG', name: 'PAX Gold', apiId: 'pax-gold', price: 0, change: 0 },
        { id: 'c38', symbol: 'UNI', name: 'Uniswap', apiId: 'uniswap', price: 0, change: 0 },
        { id: 'c39', symbol: 'M', name: 'MemeCore', apiId: 'memecore', price: 0, change: 0 },
        { id: 'c40', symbol: 'MNT', name: 'Mantle', apiId: 'mantle', price: 0, change: 0 },
        { id: 'c41', symbol: 'BUIDL', name: 'BlackRock USD Institutional Digital Liquidity Fund', apiId: 'blackrock-usd-institutional-digital-liquidity-fund', price: 0, change: 0 },
        { id: 'c42', symbol: 'USYC', name: 'Circle USYC', apiId: 'hashnote-usyc', price: 0, change: 0 },
        { id: 'c43', symbol: 'USDG', name: 'Global Dollar', apiId: 'global-dollar', price: 0, change: 0 },
        { id: 'c44', symbol: 'NEAR', name: 'NEAR Protocol', apiId: 'near', price: 0, change: 0 },
        { id: 'c45', symbol: 'USDF', name: 'Falcon USD', apiId: 'falcon-finance', price: 0, change: 0 },
        { id: 'c46', symbol: 'TAO', name: 'Bittensor', apiId: 'bittensor', price: 0, change: 0 },
        { id: 'c47', symbol: 'ASTER', name: 'Aster', apiId: 'aster-2', price: 0, change: 0 },
        { id: 'c48', symbol: 'AAVE', name: 'Aave', apiId: 'aave', price: 0, change: 0 },
        { id: 'c49', symbol: 'SKY', name: 'Sky', apiId: 'sky', price: 0, change: 0 },
        { id: 'c50', symbol: 'PI', name: 'Pi Network', apiId: 'pi-network', price: 0, change: 0 },
    ],
    Commodities: [
        { id: 'co1', symbol: 'GLD', name: 'SPDR Gold Trust', price: 0, change: 0 },
        { id: 'co2', symbol: 'SLV', name: 'iShares Silver Trust', price: 0, change: 0 },
        { id: 'co3', symbol: 'USO', name: 'United States Oil Fund', price: 0, change: 0 },
        { id: 'co4', symbol: 'PDBC', name: 'Invesco Optimum Yield Diversified', price: 0, change: 0 },
        { id: 'co5', symbol: 'GSG', name: 'iShares S&P GSCI Commodity-Indexed Trust', price: 0, change: 0 },
    ]
};

const CHART_COLORS = ['#4FA3F7', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E', '#06B6D4', '#EAB308'];

// Custom Candlestick Shape for Recharts Bar
const CustomCandle = (props) => {
    const { x, y, width, height, payload } = props;
    const isGrowing = payload.open <= payload.close;
    const color = isGrowing ? '#26a69a' : '#ef5350'; // TradingView Green and Red

    // Calculate ratio to determine wick height in pixels
    const priceDiff = Math.abs(payload.open - payload.close);
    const ratio = priceDiff > 0 ? height / priceDiff : 0;

    // Calculate wick offsets
    const topWickPixel = ratio > 0 ? (payload.high - Math.max(payload.open, payload.close)) * ratio : 0;
    const bottomWickPixel = ratio > 0 ? (Math.min(payload.open, payload.close) - payload.low) * ratio : 0;

    return (
        <g stroke={color} fill={color} strokeWidth="1.5">
            {/* Top Wick */}
            <path d={`M${x + width / 2},${y} v-${Math.abs(topWickPixel)}`} />
            {/* Candle Body */}
            <rect x={x} y={y} width={width} height={Math.max(height, 1)} />
            {/* Bottom Wick */}
            <path d={`M${x + width / 2},${y + Math.max(height, 1)} v${Math.abs(bottomWickPixel)}`} />
        </g>
    );
};

const Investments = () => {
    const { portfolio, setPortfolio, plaidAccounts } = useFinancialContext();
    const { expenseBorderColor, theme } = useTheme();
    const { playPop } = useSound();

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#FF0000', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;
    const [selectedClass, setSelectedClass] = useState('Stocks');
    const [assetClasses, setAssetClasses] = useState(INITIAL_ASSET_CLASSES);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchPopup, setShowSearchPopup] = useState(false);
    const [chartTimeframe, setChartTimeframe] = useState('24H');

    // Custom Asset State
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customAsset, setCustomAsset] = useState({ name: '', price: '', quantity: '', assetClass: 'Stock' });

    const handleAddCustom = () => {
        if (!customAsset.name || !customAsset.price || !customAsset.quantity) return;
        setPortfolio(prev => [...prev, {
            id: crypto.randomUUID(),
            symbol: customAsset.name.toUpperCase().slice(0, 10),
            name: customAsset.name,
            price: Number(customAsset.price), // Volatile, deleted on save by store.js
            change: 0,
            quantity: Number(customAsset.quantity),
            avgPrice: Number(customAsset.price), // Persisted indefinitely 
            assetClass: customAsset.assetClass || 'Custom',
            apiId: null
        }]);
        setIsAddingCustom(false);
        setCustomAsset({ name: '', price: '', quantity: '', assetClass: 'Stock' });
    };

    // --- API Data Fetching ---
    React.useEffect(() => {
        let isMounted = true;

        const fetchPrices = async () => {
            setIsLoadingData(true);
            try {
                let updatedAssets = [...INITIAL_ASSET_CLASSES[selectedClass]];

                if (selectedClass === 'Crypto') {
                    // Fetch from CoinGecko via Supabase Edge Function
                    const cryptoIds = updatedAssets.map(a => a.apiId).filter(Boolean).join(',');
                    if (cryptoIds) {
                        const { data, error } = await supabase.functions.invoke('fetch-market-data', {
                            body: { action: 'coingecko_price', payload: { ids: cryptoIds } }
                        });
                        if (error) throw error;

                        if (data) {
                            updatedAssets = updatedAssets.map(asset => {
                                if (data[asset.apiId] && typeof data[asset.apiId].usd === 'number') {
                                    const change = data[asset.apiId].usd_24h_change;
                                    return {
                                        ...asset,
                                        price: data[asset.apiId].usd,
                                        change: typeof change === 'number' ? Number(change.toFixed(2)) : 0
                                    };
                                }
                                return asset;
                            });
                        }
                    }
                } else {
                    // Fetch from Finnhub (Stocks and Commodities) via proxy
                    const assetsToFetch = updatedAssets.slice(0, 10);

                    const fetches = assetsToFetch.map(async (asset) => {
                        try {
                            const { data, error } = await supabase.functions.invoke('fetch-market-data', {
                                body: { action: 'finnhub_quote', payload: { symbol: asset.symbol } }
                            });
                            if (error || data?.error) throw new Error(error?.message || data?.error);
                            
                            // c = Current price, d = Change, dp = Percent change
                            if (data && typeof data.c === 'number' && data.c !== 0) {
                                return {
                                    ...asset,
                                    price: data.c,
                                    change: typeof data.dp === 'number' ? Number(data.dp.toFixed(2)) : 0
                                };
                            }
                            return asset;
                        } catch (e) {
                            console.warn(`Failed to fetch ${asset.symbol}:`, e);
                            return asset;
                        }
                    });

                    const fetchedResults = await Promise.all(fetches);

                    updatedAssets = updatedAssets.map(asset => {
                        const found = fetchedResults.find(f => f.id === asset.id);
                        return found ? found : asset;
                    });
                }

                if (isMounted) {
                    setAssetClasses(prev => ({
                        ...prev,
                        [selectedClass]: updatedAssets
                    }));
                }
            } catch (err) {
                console.error("Failed to load asset prices:", err);
            } finally {
                if (isMounted) setIsLoadingData(false);
            }
        };

        fetchPrices();

        // Optional: Polling every 60s
        const interval = setInterval(fetchPrices, 60000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [selectedClass]);

    // --- Debounced Search Fetching ---
    React.useEffect(() => {
        let isMounted = true;

        // If empty query, skip search & revert to defaults
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowSearchPopup(false);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        setIsLoadingData(true);

        const debounceTimer = setTimeout(async () => {
            try {
                let currentSearchResults = [];

                if (selectedClass === 'Crypto') {
                    // Search CoinGecko via Edge Function
                    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
                        body: { action: 'coingecko_search', payload: { query: searchQuery } }
                    });
                    if (error) throw error;

                    if (data.coins && data.coins.length > 0) {
                        const topCoins = data.coins.slice(0, 10);
                        const cryptoIds = topCoins.map(c => c.id).join(',');

                        // Fetch prices via Edge Function
                        const { data: priceData, error: priceError } = await supabase.functions.invoke('fetch-market-data', {
                            body: { action: 'coingecko_price', payload: { ids: cryptoIds } }
                        });
                        if (priceError) throw priceError;

                        currentSearchResults = topCoins.map(coin => ({
                            id: `c_${coin.id}`,
                            symbol: coin.symbol.toUpperCase(),
                            name: coin.name,
                            apiId: coin.id,
                            price: priceData[coin.id]?.usd || 0,
                            change: Number((priceData[coin.id]?.usd_24h_change || 0).toFixed(2))
                        }));
                    }
                } else {
                    // Search Finnhub via Edge proxy
                    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
                        body: { action: 'finnhub_search', payload: { query: searchQuery } }
                    });
                    if (error || data?.error) throw new Error(error?.message || data?.error);

                    if (data.result && data.result.length > 0) {
                        let filteredResults = data.result;
                        if (selectedClass === 'Stocks') {
                            filteredResults = filteredResults.filter(r => r.type === "Common Stock");
                        }
                        const topResults = filteredResults.slice(0, 10);

                        const fetches = topResults.map(async (searchHit) => {
                            try {
                                const { data: quoteData, error: quoteError } = await supabase.functions.invoke('fetch-market-data', {
                                    body: { action: 'finnhub_quote', payload: { symbol: searchHit.symbol } }
                                });
                                if (quoteError || quoteData?.error) throw new Error("Quote failed");
                                
                                return {
                                    id: `s_${searchHit.symbol}`,
                                    symbol: searchHit.symbol,
                                    name: searchHit.description,
                                    price: quoteData.c || 0,
                                    change: Number((quoteData.dp || 0).toFixed(2))
                                };
                            } catch {
                                return null;
                            }
                        });

                        const fetchedPrices = await Promise.all(fetches);
                        currentSearchResults = fetchedPrices.filter(item => item !== null && item.price > 0);
                    }
                }

                if (isMounted) {
                    setSearchResults(currentSearchResults);
                    setShowSearchPopup(true);
                }
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                if (isMounted) {
                    setIsSearching(false);
                    setIsLoadingData(false);
                }
            }
        }, 500); // 500ms debounce

        return () => {
            isMounted = false;
            clearTimeout(debounceTimer);
        };
    }, [searchQuery, selectedClass]);

    const clearSearch = () => {
        setSearchQuery('');
        setShowSearchPopup(false);
    };

    // --- Drag & Drop Handlers ---
    const handleDragStart = (e, asset) => {
        e.dataTransfer.setData('application/json', JSON.stringify(asset));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        try {
            const assetData = JSON.parse(e.dataTransfer.getData('application/json'));

            // Check if already in portfolio
            if (portfolio.some(p => p.symbol === assetData.symbol)) {
                return; // Prevent duplicates
            }

            setPortfolio(prev => [...prev, {
                id: crypto.randomUUID(),
                symbol: assetData.symbol,
                name: assetData.name,
                price: assetData.price,
                change: assetData.change,
                quantity: 1,
                avgPrice: assetData.price || 0,
                assetClass: selectedClass,
                apiId: assetData.apiId || null
            }]);
        } catch (err) {
            console.error("Failed to drop asset", err);
        }
    };

    // --- Portfolio Management ---
    const updateQuantity = (id, newQuantity) => {
        const qty = parseFloat(newQuantity) || 0;
        setPortfolio(prev => prev.map(p => p.id === id ? { ...p, quantity: qty } : p));
    };

    const updateAvgPrice = (id, newPrice) => {
        const price = parseFloat(newPrice) || 0;
        setPortfolio(prev => prev.map(p => p.id === id ? { ...p, avgPrice: price } : p));
    };

    const removeFromPortfolio = (id) => {
        setPortfolio(prev => prev.filter(p => p.id !== id));
    };

    // --- Derived Data ---
    const totalPortfolioValue = useMemo(() => {
        return portfolio.reduce((total, holding) => {
            let liveAsset = assetClasses.Stocks.find(a => a.symbol === holding.symbol) ||
                assetClasses.Crypto.find(a => a.symbol === holding.symbol) ||
                assetClasses.Commodities.find(a => a.symbol === holding.symbol);
            const currentPrice = liveAsset ? liveAsset.price : (holding.price !== undefined ? holding.price : (holding.avgPrice || 0));
            return total + (currentPrice * holding.quantity);
        }, 0);
    }, [portfolio, assetClasses]);

    const chartData = useMemo(() => {
        return portfolio.map(holding => {
            let liveAsset = assetClasses.Stocks.find(a => a.symbol === holding.symbol) ||
                assetClasses.Crypto.find(a => a.symbol === holding.symbol) ||
                assetClasses.Commodities.find(a => a.symbol === holding.symbol);
            const currentPrice = liveAsset ? liveAsset.price : (holding.price !== undefined ? holding.price : (holding.avgPrice || 0));
            return {
                name: holding.symbol,
                value: Number((currentPrice * holding.quantity).toFixed(2))
            };
        }).filter(d => d.value > 0);
    }, [portfolio, assetClasses]);

    // Simulated Candlestick data for Portfolio (supports 24H, 1M, 1Y)
    const candleData = useMemo(() => {
        if (totalPortfolioValue === 0) return [];

        let currentTotal = totalPortfolioValue;

        // Approximate weighted change from live data
        let totalChangeWeighted = 0;
        portfolio.forEach(holding => {
            let liveAsset = assetClasses.Stocks.find(a => a.symbol === holding.symbol) ||
                assetClasses.Crypto.find(a => a.symbol === holding.symbol) ||
                assetClasses.Commodities.find(a => a.symbol === holding.symbol);
            const chg = liveAsset ? liveAsset.change : (holding.change !== undefined ? holding.change : 0);
            const hPrice = holding.price !== undefined ? holding.price : (holding.avgPrice || 0);
            const val = (liveAsset ? liveAsset.price : hPrice) * holding.quantity;
            totalChangeWeighted += (chg * val);
        });
        const dailyChangePercent = currentTotal > 0 ? totalChangeWeighted / currentTotal : 0;

        // Timeframe config
        const config = {
            '24H': { numCandles: 48, intervalMs: 30 * 60 * 1000, changeMult: 1, volatility: 0.008, formatTime: (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            '1M': { numCandles: 30, intervalMs: 24 * 60 * 60 * 1000, changeMult: 8, volatility: 0.015, formatTime: (d) => d.toLocaleDateString([], { month: 'short', day: 'numeric' }) },
            '1Y': { numCandles: 52, intervalMs: 7 * 24 * 60 * 60 * 1000, changeMult: 40, volatility: 0.025, formatTime: (d) => d.toLocaleDateString([], { month: 'short', day: 'numeric' }) },
        };

        const { numCandles, intervalMs, changeMult, volatility, formatTime } = config[chartTimeframe];

        // Scale the total change based on timeframe
        const totalChangePercent = dailyChangePercent * changeMult;
        let startTotal = currentTotal / (1 + (totalChangePercent / 100));

        const data = [];
        const now = new Date();
        let price = startTotal;
        const totalDelta = currentTotal - startTotal;
        const stepDelta = totalDelta / numCandles;

        for (let i = 0; i < numCandles; i++) {
            const time = new Date(now.getTime() - (numCandles - 1 - i) * intervalMs);

            const open = price;
            let close = i === numCandles - 1 ? currentTotal : open + stepDelta + (Math.random() - 0.5) * (currentTotal * volatility);

            // Random noise/swings to simulate a realistic volatile market
            if (open > 0 && Math.random() > 0.8) {
                close = open - stepDelta * (Math.random() * 2);
            }

            const high = Math.max(open, close) + Math.random() * (currentTotal * (volatility * 0.6));
            const low = Math.max(0, Math.min(open, close) - Math.random() * (currentTotal * (volatility * 0.6)));

            data.push({
                time: formatTime(time),
                open,
                close,
                high,
                low,
                candles: [Math.min(open, close), Math.max(open, close)]
            });
            price = close;
        }
        return data;
    }, [totalPortfolioValue, portfolio, assetClasses, chartTimeframe]);

    return (
        <div className="page-container animate-fade-in investments-page">
            <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '-30px', marginTop: '-60px' }}>
                <img src={investmentsHeaderImg} alt="Investments Dashboard Header" className="investments-header-logo" style={{ height: '540px', objectFit: 'contain', marginBottom: '-40px' }} loading="lazy" />
                <p className="page-subtitle">Track and allocate your long-term wealth assets as part of your total financial portfolio.</p>
            </div>

            {/* Top: Portfolio Performance Tracker */}
            <AnimateOnScroll delay={0.1}>
                <div className="portfolio-bottom-chart" style={{ marginBottom: '32px' }}>
                    <Card glass style={{ padding: '32px' }} className={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 className="panel-title" style={{ margin: 0 }}>Portfolio Performance</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {['24H', '1M', '1Y'].map(tf => (
                                    <button
                                        key={tf}
                                        onClick={() => setChartTimeframe(tf)}
                                        style={{
                                            padding: '6px 16px',
                                            borderRadius: '8px',
                                            border: chartTimeframe === tf ? 'none' : '1px solid var(--surface-border)',
                                            background: chartTimeframe === tf ? 'var(--primary)' : 'transparent',
                                            color: chartTimeframe === tf ? 'white' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ height: '350px', width: '100%', borderRadius: '12px' }}>
                            {candleData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={candleData} margin={{ top: 20, right: 40, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={true} />
                                        <XAxis
                                            dataKey="time"
                                            stroke={theme === 'dark' ? '#F8FAFC' : '#1E293B'}
                                            tick={{ fill: theme === 'dark' ? '#F8FAFC' : '#1E293B', fontSize: 12, fontWeight: 'bold' }}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            orientation="right"
                                            domain={['auto', 'auto']}
                                            stroke={theme === 'dark' ? '#F8FAFC' : '#1E293B'}
                                            tick={{ fill: theme === 'dark' ? '#F8FAFC' : '#1E293B', fontSize: 12, fontWeight: 'bold' }}
                                            tickFormatter={(val) => val >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val.toFixed(0)}`}
                                        />
                                        <RechartsTooltip
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                                            contentStyle={{ borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--surface)', fontSize: '0.9rem' }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const d = payload[0].payload;
                                                    const isGrowing = d.close >= d.open;
                                                    const cColor = isGrowing ? '#26a69a' : '#ef5350';

                                                    return (
                                                        <div className="custom-tooltip" style={{ background: 'var(--surface)', padding: '12px', border: '1px solid var(--surface-border)', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                                                            <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</p>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.9rem' }}>
                                                                <div><span style={{ color: 'var(--text-muted)' }}>O: </span> {d.open.toFixed(2)}</div>
                                                                <div><span style={{ color: 'var(--text-muted)' }}>H: </span> {d.high.toFixed(2)}</div>
                                                                <div><span style={{ color: 'var(--text-muted)' }}>L: </span> {d.low.toFixed(2)}</div>
                                                                <div><span style={{ color: 'var(--text-muted)' }}>C: </span> <span style={{ color: cColor }}>{d.close.toFixed(2)}</span></div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="candles" shape={<CustomCandle />} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-chart-state text-muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    Add assets to see historical simulation
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </AnimateOnScroll>

            {/* Bottom: Market Drawer, Holdings & Total Value */}
            <div className="dashboard-panels investments-layout">
                <AnimateOnScroll delay={0.1} className="asset-sidebar">
                    <Card glass className={`sidebar-card ${expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}`}>
                        <div className="sidebar-header">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3>Market Drawer</h3>
                                <select
                                    className="asset-class-dropdown"
                                    value={selectedClass}
                                    onChange={(e) => {
                                        setSelectedClass(e.target.value);
                                        clearSearch(); // Reset search when switching classes
                                    }}
                                >
                                    {Object.keys(INITIAL_ASSET_CLASSES).map(ac => (
                                        <option key={ac} value={ac}>{ac}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="search-bar-container">
                                <Input
                                    placeholder={`Search ${selectedClass}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => { if (searchQuery.trim()) setShowSearchPopup(true); }}
                                    leftIcon={Search}
                                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                    className="asset-search-input"
                                />
                                {searchQuery && (
                                    <button type="button" onClick={clearSearch} className="btn-icon text-muted" style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                                        <X size={14} />
                                    </button>
                                )}

                                {/* Floating Search Results Pop-up */}
                                {showSearchPopup && searchQuery.trim() && (
                                    <div className="search-popup animate-fade-in">
                                        {isSearching ? (
                                            <div className="text-muted text-center" style={{ padding: '16px 0' }}>Searching...</div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="text-muted text-center" style={{ padding: '16px 0' }}>No results found</div>
                                        ) : (
                                            searchResults.map(asset => (
                                                <div
                                                    key={asset.id}
                                                    className="draggable-asset"
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, asset)}
                                                >
                                                    <div className="drag-handle"><GripVertical size={16} /></div>
                                                    <div className="asset-info">
                                                        <div className="asset-symbol">{asset.symbol}</div>
                                                        <div className="asset-name text-muted">{asset.name}</div>
                                                    </div>
                                                    <div className="asset-price-col">
                                                        <div className="asset-price">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                        <div className={`asset-change ${asset.change >= 0 ? 'positive' : 'negative'}`}>
                                                            {asset.change >= 0 ? '+' : ''}{asset.change}%
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="asset-list">
                            {isLoadingData ? (
                                <div style={{ padding: '8px' }}>
                                    <SkeletonLoader type="list" count={5} />
                                </div>
                            ) : (
                                assetClasses[selectedClass].map(asset => (
                                    <div
                                        key={asset.id}
                                        className="draggable-asset"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, asset)}
                                    >
                                        <div className="drag-handle"><GripVertical size={16} /></div>
                                        <div className="asset-info">
                                            <div className="asset-symbol">{asset.symbol}</div>
                                            <div className="asset-name text-muted">{asset.name}</div>
                                        </div>
                                        <div className="asset-price-col">
                                            <div className="asset-price">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            <div className={`asset-change ${asset.change >= 0 ? 'positive' : 'negative'}`}>
                                                {asset.change >= 0 ? '+' : ''}{asset.change}%
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </AnimateOnScroll>

                {/* Center: Dropzone & Holdings */}
                <AnimateOnScroll delay={0.2} className="portfolio-dropzone-container">
                    <Card
                        glass
                        className={`dropzone-card ${portfolio.length === 0 ? 'empty' : ''} ${expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}`.trim()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <div className="dropzone-header">
                            <h3 className="panel-title">Your Holdings</h3>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button 
                                    onClick={() => { playPop(); setIsAddingCustom(true); }} 
                                    style={{
                                        background: activeColor || 'var(--accent-primary)',
                                        color: activeColor ? ((expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white') : 'white',
                                        padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600
                                    }}
                                >
                                    + Add Custom Asset
                                </button>
                                <span className="badge glass-badge">{portfolio.length} Assets</span>
                            </div>
                        </div>

                        <Modal
                            isOpen={isAddingCustom}
                            onClose={() => setIsAddingCustom(false)}
                            silent={true}
                            useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                            transparentOverlay={true}
                            clearBlur={true}
                            customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                            containerStyle={{ maxWidth: '500px', borderRadius: '24px' }}
                            title={(() => {
                                const activeColor = {
                                    blue: '#4FA3F7', white: '#ffffff', black: '#000000',
                                    red: '#FF0000', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
                                    yellow: '#eab308', orange: '#f97316'
                                }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7');
                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
                                        Add <span style={{ color: activeColor }}>Custom Asset</span>
                                    </div>
                                );
                            })()}
                        >
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Asset Type</label>
                                        <select 
                                            className="dream-input"
                                            value={customAsset.assetClass}
                                            onChange={e => setCustomAsset({...customAsset, assetClass: e.target.value})}
                                            style={{ cursor: 'pointer', appearance: 'none' }}
                                        >
                                            <option value="Stock">Stock / Equity</option>
                                            <option value="Crypto">Crypto</option>
                                            <option value="Real Estate">Real Estate</option>
                                            <option value="Business Equity">Business Equity</option>
                                            <option value="Savings Bank Account">Savings Bank Account</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Asset Name</label>
                                        <Input 
                                            placeholder="e.g. Real Estate, Startup Equity..." 
                                            value={customAsset.name} 
                                            onChange={e => setCustomAsset({...customAsset, name: e.target.value})}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Current Price / Value</label>
                                            <Input 
                                                type="number" step="any" min="0"
                                                placeholder="0.00" 
                                                value={customAsset.price} 
                                                onChange={e => setCustomAsset({...customAsset, price: e.target.value})}
                                                icon={<DollarSign size={16} />}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Quantity Owned</label>
                                            <Input 
                                                type="number" step="any" min="0"
                                                placeholder="0" 
                                                value={customAsset.quantity} 
                                                onChange={e => setCustomAsset({...customAsset, quantity: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={handleAddCustom} variant="primary" style={{ width: '100%', marginTop: '8px', padding: '14px', borderRadius: '12px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontWeight: 600, fontSize: '1rem', boxShadow: '0 4px 12px rgba(0, 150, 255, 0.3)' }}>
                                    <Plus size={20} style={{ marginRight: '8px' }}/> Add To Portfolio
                                </Button>
                            </div>
                        </Modal>

                        {portfolio.length === 0 ? (
                            <div className="empty-dropzone-state">
                                <Target size={48} className="text-muted" style={{ opacity: 0.5, marginBottom: '16px' }} />
                                <p>Drag and drop assets here from the Market Drawer.</p>
                            </div>
                        ) : (
                            <div className="holdings-list">
                                {portfolio.map(holding => {
                                    // Find the live asset data to ensure prices are up to date
                                    let liveAsset = assetClasses.Stocks.find(a => a.symbol === holding.symbol) ||
                                        assetClasses.Crypto.find(a => a.symbol === holding.symbol) ||
                                        assetClasses.Commodities.find(a => a.symbol === holding.symbol);

                                    const displayPrice = liveAsset ? liveAsset.price : (holding.price !== undefined ? holding.price : (holding.avgPrice || 0));
                                    const totalValue = displayPrice * holding.quantity;
                                    const costBasis = (holding.avgPrice || 0) * holding.quantity;
                                    const pnl = costBasis > 0 ? totalValue - costBasis : 0;
                                    const pnlPercent = costBasis > 0 ? ((pnl / costBasis) * 100).toFixed(2) : 0;

                                    // Safely detect logos (Explicit Stock Clearbit URL, or Coincap icon resolution)
                                    let logoUrl = null;
                                    let isCrypto = !!assetClasses.Crypto.find(a => a.symbol === holding.symbol);
                                    if (liveAsset && liveAsset.logo) {
                                        logoUrl = liveAsset.logo;
                                    } else if (isCrypto) {
                                        logoUrl = `https://assets.coincap.io/assets/icons/${holding.symbol.toLowerCase()}@2x.png`;
                                    }

                                    return (
                                        <div key={holding.id} className="holding-item animate-fade-in">
                                            <button onClick={() => removeFromPortfolio(holding.id)} className="btn-icon danger remove-btn" title="Remove Asset">
                                                <Trash2 size={14} />
                                            </button>
                                            
                                            <div className="holding-identity" style={{ alignItems: 'center' }}>
                                                <div style={{ position: 'relative', width: '44px', height: '44px', marginBottom: '8px' }}>
                                                    {/* Fallback Letter Avatar */}
                                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', zIndex: 1 }}>
                                                        {holding.symbol.charAt(0).toUpperCase()}
                                                    </div>
                                                    {/* Primary Hotlink Image (Overlays on top, fades out safely if 404 block arises) */}
                                                    {logoUrl && (
                                                        <img 
                                                            src={logoUrl} 
                                                            alt={holding.symbol} 
                                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain', background: 'white', border: '1px solid rgba(0,0,0,0.1)', padding: '4px', zIndex: 2, transition: 'opacity 0.2s ease' }}
                                                            onError={e => { e.target.style.opacity = 0; }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="holding-symbol">{holding.symbol}</div>
                                                {holding.assetClass && !['Stocks', 'Commodities'].includes(holding.assetClass) && (
                                                    <div style={{ fontSize: '0.65rem', padding: '2px 8px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', marginTop: '2px', color: 'var(--text-secondary)', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        {holding.assetClass}
                                                    </div>
                                                )}
                                                <div className="holding-price text-muted" style={{ marginTop: '4px' }}>${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            </div>

                                            <div className="holding-controls">
                                                <div className="qty-input-wrapper">
                                                    <label>Qty:</label>
                                                    <input
                                                        type="number" step="any" min="0" value={holding.quantity}
                                                        onChange={(e) => updateQuantity(holding.id, e.target.value)}
                                                        className="qty-input"
                                                    />
                                                </div>

                                                <div className="qty-input-wrapper">
                                                    <label>Avg Cost:</label>
                                                    <input
                                                        type="number" step="any" min="0" value={holding.avgPrice || ''}
                                                        onChange={(e) => updateAvgPrice(holding.id, e.target.value)}
                                                        className="qty-input" placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            <div className="holding-value">
                                                <span className="holding-total-worth">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                {costBasis > 0 && (
                                                    <span className="holding-pnl" style={{ color: pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                        {pnl >= 0 ? '+' : ''}{pnlPercent}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </AnimateOnScroll>

                {/* Right: Total Value */}
                <AnimateOnScroll delay={0.3} className="portfolio-viz-container">
                    <Card glass className={`viz-card ${expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}`}>
                        <h3 className="panel-title">Total Value</h3>
                        <h2 className="panel-hero-number text-gradient" style={{ textAlign: 'center', margin: '0 0 24px 0' }}>
                            ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>

                        <div className="chart-wrapper flex-1">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            formatter={(value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                            contentStyle={{ borderRadius: '12px', border: 'none', background: 'var(--surface-dropdown)' }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-chart-state text-muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    Add assets to see distribution
                                </div>
                            )}
                        </div>
                    </Card>
                </AnimateOnScroll>
            </div>
        </div >
    );
};

export default Investments;

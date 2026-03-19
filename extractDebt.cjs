const fs = require('fs');

const path = './src/pages/Expenses.jsx';
const targetPath = './src/features/expenses/components/DebtDestroyer.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const imports = `import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Flame, Wind, CloudRain, AlertTriangle, Car, GraduationCap, Home, HeartPulse, CreditCard, Clock, CheckCircle2, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { AnimatedNumber } from '../../../components/ui/AnimatedNumber';
import { AnimateOnScroll } from '../../../components/ui/AnimateOnScroll';
import { useSound } from '../../../SoundContext';

export const DebtDestroyer = ({ trackedDebts, setTrackedDebts, expenseBorderColor }) => {
    const { playCheck } = useSound();
`;

const logic = lines.slice(303, 581).join('\n');
const jsx = lines.slice(909, 1522).join('\n');

const result = imports + '\n' + logic + '\n\n    return (\n        <div className="debt-destroyer-container">\n' + jsx + '\n        </div>\n    );\n};\n';

fs.writeFileSync(targetPath, result);

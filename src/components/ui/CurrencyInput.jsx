import React, { useState, useEffect } from 'react';
import { Input } from './Input';

export const CurrencyInput = ({ value, onChange, onBlur, raw = false, ...props }) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        // Only format if we have a valid numeric string/number that isn't actively being typed out (like trailing decimals)
        if (value !== undefined && value !== null && value !== '') {
            const strVal = String(value);
            
            // Check if our current display mathematically matches to avoid overriding active typing 
            // (e.g. user typed "100.", we don't want to force "100" and erase their decimal)
            const cleanDisplay = displayValue.replace(/[^0-9.-]/g, '');
            if (displayValue && cleanDisplay === strVal) {
                return; 
            }
            if (Number(cleanDisplay) === Number(strVal) && cleanDisplay.endsWith('.')) {
                return;
            }
            
            const num = Number(strVal);
            if (!isNaN(num)) {
                const parts = strVal.split('.');
                const decimals = parts.length > 1 ? '.' + parts[1] : '';
                const isNegative = num < 0;
                const integerPart = Math.abs(Number(parts[0])).toLocaleString('en-US');
                setDisplayValue((isNegative ? '-$' : '$') + integerPart + decimals);
            }
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const handleChange = (e) => {
        let val = e.target.value;
        
        if (val === '' || val === '$') {
            setDisplayValue('');
            if (onChange) onChange({ target: { name: props.name, value: '' } });
            return;
        }

        // Strip everything except numbers, decimal point, and negative sign
        let cleanVal = val.replace(/[^0-9.-]/g, '');
        
        const parts = cleanVal.split('.');
        if (parts.length > 2) {
            cleanVal = parts[0] + '.' + parts.slice(1).join('');
        }

        const negativeMatches = cleanVal.match(/-/g);
        let isNegative = negativeMatches && negativeMatches.length > 0 && cleanVal.startsWith('-');
        cleanVal = cleanVal.replace(/-/g, '');

        let formatted = cleanVal;
        if (cleanVal) {
             const numParts = cleanVal.split('.');
             const integerPart = numParts[0] === '' ? '' : Number(numParts[0]).toLocaleString('en-US');
             formatted = (isNegative ? '-$' : '$') + integerPart;
             if (numParts.length > 1) {
                 formatted += '.' + numParts[1].substring(0, 2); // Limit to 2 decimals for currency intuitively
                 cleanVal = numParts[0] + '.' + numParts[1].substring(0, 2);
             }
        } else if (isNegative) {
             formatted = '-$';
        }
        
        setDisplayValue(formatted);

        const rawNumeric = isNegative ? '-' + cleanVal : cleanVal;
        if (onChange) {
            onChange({
                target: {
                    name: props.name,
                    value: rawNumeric
                }
            });
        }
    };

    const blurHandler = (e) => {
        if (displayValue === '$' || displayValue === '-$') {
            setDisplayValue('');
            if (onChange) onChange({ target: { name: props.name, value: '' } });
        }
        if (onBlur) onBlur(e);
    };

    if (raw) {
        return (
            <input
                {...props}
                type="text"
                inputMode="decimal"
                value={displayValue}
                onChange={handleChange}
                onBlur={blurHandler}
            />
        );
    }

    return (
        <Input
            {...props}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onBlur={blurHandler}
        />
    );
};

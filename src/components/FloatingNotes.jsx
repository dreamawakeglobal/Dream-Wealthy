import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StickyNote, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './FloatingNotes.css';

const STORAGE_KEY = 'dream-wealthy-notes';

const getPageName = (pathname) => {
    if (pathname === '/') return 'home';
    return pathname.replace('/', '');
};

const FloatingNotes = () => {
    const location = useLocation();
    const { user } = useAuth();
    const pageName = getPageName(location.pathname);

    // Notes state keyed by page
    const [allNotes, setAllNotes] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch { return {}; }
    });

    const [isOpen, setIsOpen] = useState(false);

    // Dragging state
    const [position, setPosition] = useState({ x: 20, y: 100 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);
    const btnRef = useRef(null);

    const currentNote = allNotes[pageName] || '';

    // Save to localStorage whenever notes change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotes));
    }, [allNotes]);

    const updateNote = (text) => {
        setAllNotes(prev => ({ ...prev, [pageName]: text }));
    };

    // --- Drag Handlers ---
    const startPos = useRef({ x: 0, y: 0 });

    const handlePointerDown = useCallback((e) => {
        isDragging.current = true;
        hasMoved.current = false;
        startPos.current = { x: e.clientX, y: e.clientY };
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [position]);

    const handlePointerMove = useCallback((e) => {
        if (!isDragging.current) return;
        const dx = Math.abs(e.clientX - startPos.current.x);
        const dy = Math.abs(e.clientY - startPos.current.y);
        if (dx > 5 || dy > 5) hasMoved.current = true;
        const newX = Math.max(0, Math.min(window.innerWidth - 144, e.clientX - dragStart.current.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 144, e.clientY - dragStart.current.y));
        setPosition({ x: newX, y: newY });
    }, []);

    const handlePointerUp = useCallback(() => {
        isDragging.current = false;
        // Only toggle notepad if it was a clean click, not a drag
        if (!hasMoved.current) {
            setIsOpen(prev => !prev);
        }
    }, []);

    // Calculate notepad position based on button location
    const getNotepadPosition = () => {
        const pad = 12;
        const noteWidth = 340;
        const noteHeight = 420;

        let left = position.x + 56;
        let top = position.y - noteHeight / 2 + 24;

        // Keep within viewport
        if (left + noteWidth > window.innerWidth - pad) {
            left = position.x - noteWidth - pad;
        }
        if (top < pad) top = pad;
        if (top + noteHeight > window.innerHeight - pad) {
            top = window.innerHeight - noteHeight - pad;
        }

        return { left, top };
    };

    const charCount = currentNote.length;

    if (location.pathname === '/' || !user) return null;

    return (
        <>
            {/* Draggable Button */}
            <button
                ref={btnRef}
                className="floating-notes-btn"
                style={{ left: position.x, top: position.y }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <img src="/notes-icon.png" alt="Notes" style={{ width: 144, height: 144, objectFit: 'contain' }} />
                {currentNote.trim().length > 0 && <span className="note-indicator" />}
            </button>

            {/* Notepad Popup */}
            {isOpen && (
                <div className="floating-notepad" style={getNotepadPosition()}>
                    <div className="floating-notepad-header">
                        <h3>
                            <StickyNote size={16} />
                            Notes
                            <span className="page-badge">{pageName}</span>
                        </h3>
                        <button className="floating-notepad-close" onClick={() => setIsOpen(false)}>
                            <X size={16} />
                        </button>
                    </div>
                    <div className="floating-notepad-body">
                        <textarea
                            value={currentNote}
                            onChange={(e) => updateNote(e.target.value)}
                            placeholder={`Add notes about the ${pageName} page...`}
                            autoFocus
                        />
                    </div>
                    <div className="floating-notepad-footer">
                        <span>{charCount} characters</span>
                        <span>Auto-saved</span>
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingNotes;

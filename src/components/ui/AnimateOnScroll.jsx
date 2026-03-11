import React, { useRef, useState, useEffect } from 'react';

export const AnimateOnScroll = ({
    children,
    className = "",
    delay = 0,
    yOffset = 30,
    duration = 0.5
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                // If the element is now in the viewport
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // Explicitly unobserve it so it NEVER triggers again
                    if (domRef.current) observer.unobserve(domRef.current);
                }
            });
        }, { threshold: 0.1 });

        const currentRef = domRef.current;
        if (currentRef) observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, []);

    return (
        <div
            ref={domRef}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : `translateY(${yOffset}px)`,
                transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
                willChange: 'opacity, transform'
            }}
        >
            {children}
        </div>
    );
};

import React from 'react';

export default function FadeIn({ children, className = "", delay = 0 }) {
    const [isVisible, setIsVisible] = React.useState(false);
    React.useEffect(() => {
        const t = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);
    
    const baseClasses = "transition-all duration-300 ease-out";
    const stateClasses = isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2";
    return (
        <div className={`${baseClasses} ${stateClasses} ${className}`}>
            {children}
        </div>
    )
} 
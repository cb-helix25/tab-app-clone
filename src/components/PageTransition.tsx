import React, { useEffect, useMemo, useRef, useState } from 'react';

type AnimationKind = 'fade' | 'fade-slide';

interface PageTransitionProps {
	currentKey: string | number;
	children: React.ReactNode;
	animation?: AnimationKind; // default: 'fade-slide'
	duration?: number; // ms, default: 320
	easing?: string; // css timing function, default: 'cubic-bezier(0.4, 0, 0.2, 1)'
	className?: string;
	style?: React.CSSProperties;
}

/**
 * PageTransition
 * Lightweight, dependency-free transition wrapper for swapping entire page/views.
 * - Keeps the previous view mounted briefly for an exit animation while the next enters.
 * - Uses opacity + translate transform for smooth GPU-accelerated animations.
 * - Respects reduced motion preferences and disables animations accordingly.
 */
const PageTransition: React.FC<PageTransitionProps> = ({
	currentKey,
	children,
	animation = 'fade-slide',
	duration = 320,
	easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
	className,
	style,
}) => {
	const [prevChild, setPrevChild] = useState<React.ReactNode | null>(null);
	const [prevKey, setPrevKey] = useState<string | number | null>(null);
	const [animating, setAnimating] = useState(false);
	const exitTimerRef = useRef<number | null>(null);
	const lastChildrenRef = useRef<React.ReactNode>(children);
	const lastKeyRef = useRef<string | number>(currentKey);

	// Respect reduced motion
	const prefersReducedMotion = useMemo(() => {
		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
		try {
			return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		} catch {
			return false;
		}
	}, []);

	// When key changes, start transition
	useEffect(() => {
		if (currentKey === lastKeyRef.current) {
			lastChildrenRef.current = children;
			return;
		}

		// Cancel any pending cleanup
		if (exitTimerRef.current) {
			window.clearTimeout(exitTimerRef.current);
			exitTimerRef.current = null;
		}

		// Set previous to last and show new child
		setPrevChild(lastChildrenRef.current);
		setPrevKey(lastKeyRef.current);
		lastChildrenRef.current = children;
		lastKeyRef.current = currentKey;

		if (prefersReducedMotion) {
			// Swap immediately without animation
			setPrevChild(null);
			setAnimating(false);
			return;
		}

		// Animate
		setAnimating(true);
		exitTimerRef.current = window.setTimeout(() => {
			setPrevChild(null);
			setAnimating(false);
			exitTimerRef.current = null;
		}, duration);
	}, [children, currentKey, duration, prefersReducedMotion]);

	useEffect(() => () => {
		if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
	}, []);

	// Styles
	const containerStyle: React.CSSProperties = {
		position: 'relative',
		width: '100%',
			isolation: 'isolate', // Create a new stacking context
			overflow: 'hidden', // Prevent sticky children from escaping during transition
		// Let the entering view define layout height; exiting sits on top absolutely
		...style,
	};

	const commonLayer: React.CSSProperties = {
		width: '100%',
		willChange: 'opacity, transform',
		transitionProperty: 'opacity, transform',
		transitionDuration: `${duration}ms`,
		transitionTimingFunction: easing,
	};

	const enterBase: React.CSSProperties =
		animation === 'fade'
			? { opacity: 0 }
			: { opacity: 0, transform: 'translateY(8px)' };

	const enterActive: React.CSSProperties =
		animation === 'fade'
			? { opacity: 1 }
			: { opacity: 1, transform: 'translateY(0)' };

	const exitBase: React.CSSProperties =
		animation === 'fade'
			? { opacity: 1 }
			: { opacity: 1, transform: 'translateY(0)' };

	const exitActive: React.CSSProperties =
		animation === 'fade'
			? { opacity: 0 }
			: { opacity: 0, transform: 'translateY(-6px)' };

	// During animation we render both: exiting (absolute) + entering (relative).
	// Otherwise render only current child.
	return (
		<div className={className} style={containerStyle}>
			{prevChild && (
				<div
					key={`exit-${prevKey}`}
					style={{
						position: 'absolute',
						inset: 0,
								zIndex: 0, // Ensure exiting view sits below entering view
								pointerEvents: 'none', // Prevent interactions during exit
								contain: 'paint', // Create a paint containment to bound sticky children
						...commonLayer,
						...(animating ? exitActive : exitBase),
					}}
					aria-hidden
				>
					{prevChild}
				</div>
			)}

			<div
				key={`enter-${lastKeyRef.current}`}
				style={{
					position: 'relative',
							zIndex: 1, // Always above the exiting layer
					...commonLayer,
					...(animating ? enterActive : {}),
					...(prevChild && !prefersReducedMotion ? enterBase : {}),
				}}
			>
				{lastChildrenRef.current}
			</div>
		</div>
	);
};

export default PageTransition;


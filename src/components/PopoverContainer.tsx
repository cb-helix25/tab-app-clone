import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import '../app/styles/InfoPopover.css';

interface PopoverContainerProps {
    target: HTMLElement;
    onDismiss: () => void;
    width?: number;
    className?: string;
    children: React.ReactNode;
}

const PopoverContainer: React.FC<PopoverContainerProps> = ({
    target,
    onDismiss,
    width,
    className,
    children,
}) => {
    const modalRef = useRef<HTMLDivElement | null>(null);
    const [modalPos, setModalPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        function updatePosition() {
            if (target && modalRef.current) {
                const iconRect = target.getBoundingClientRect();
                const modalRect = modalRef.current.getBoundingClientRect();

                let left = iconRect.left;
                if (left + modalRect.width > window.innerWidth - 8) {
                    left = window.innerWidth - modalRect.width - 8;
                }
                if (left < 8) left = 8;

                let top = iconRect.bottom + 8;
                if (top + modalRect.height > window.innerHeight - 8) {
                    top = iconRect.top - modalRect.height - 8;
                }
                if (top < 8) top = 8;

                setModalPos({ top, left });
            }
        }

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [target]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onDismiss();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onDismiss]);

    return ReactDOM.createPortal(
        <div className="info-overlay" onClick={onDismiss}>
            <div
                ref={modalRef}
                className={`info-modal${className ? ` ${className}` : ''}`}
                style={{
                    top: modalPos.top,
                    left: modalPos.left,
                    width: width ? width : undefined,
                    maxWidth: width ? width : undefined,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <span className="info-close" onClick={onDismiss} aria-label="Close popover">
                    <FaTimes aria-hidden="true" />
                </span>
                <div className="info-content">{children}</div>
            </div>
        </div>,
        document.body
    );
};

export default PopoverContainer;

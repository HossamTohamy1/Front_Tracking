import React, { useState } from 'react';
import { ContainerService } from '../ContainerService';
import type { ContainerListItemDto } from '../types/containers';

// Matches ContainerStatus enum on backend
const STATUS_OPTIONS = [
    { value: 1, label: 'Closed', color: '#6b7280', icon: '🔒' },
    { value: 2, label: 'Shipped', color: '#1d4ed8', icon: '🚢' },
    { value: 3, label: 'In Transit', color: '#7c3aed', icon: '🌊' },
    { value: 4, label: 'Arrived Port', color: '#d97706', icon: '⚓' },
    { value: 5, label: 'In Customs', color: '#c2410c', icon: '🏛️' },
    { value: 6, label: 'Delivered', color: '#16a34a', icon: '✅' },
];

// Valid transitions — matches backend _validTransitions
const VALID_NEXT: Record<number, number> = {
    1: 2, // Closed → Shipped
    2: 3, // Shipped → InTransit
    3: 4, // InTransit → ArrivedPort
    4: 5, // ArrivedPort → Customs
    5: 6, // Customs → Delivered
};

interface Props {
    container: ContainerListItemDto;
    onClose: () => void;
    onSuccess: (msg: string) => void;
}

const ContainerStatusUpdateModal: React.FC<Props> = ({ container, onClose, onSuccess }) => {
    const nextStatusValue = VALID_NEXT[container.status];
    const nextOption = STATUS_OPTIONS.find((o) => o.value === nextStatusValue);
    const currentOption = STATUS_OPTIONS.find((o) => o.value === container.status);

    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!nextStatusValue) return;
        setLoading(true);
        setError('');
        try {
            const res = await ContainerService.updateStatus(container.id, nextStatusValue, {
                location: location.trim() || undefined,
                description: description.trim() || undefined,
            });
            if (res.isSuccess) {
                onSuccess(
                    `Container moved to ${nextOption?.label}. ` +
                    `All shipments synced automatically ✅`
                );
            } else {
                setError(res.message);
            }
        } catch {
            setError('Failed to update container status.');
        } finally {
            setLoading(false);
        }
    };

    // Terminal state — already delivered
    if (!nextStatusValue || !nextOption) {
        return (
            <div style={overlayStyle} onClick={onClose}>
                <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                    <ModalHeader title="Container Status" onClose={onClose} />
                    <div style={{ padding: '24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                        <div style={{ fontWeight: 700, color: '#14532d', fontSize: 15, marginBottom: 6 }}>
                            Container Delivered
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                            This container has been delivered. No further updates are possible.
                        </div>
                    </div>
                    <ModalFooter onClose={onClose} onSubmit={undefined} loading={false} />
                </div>
            </div>
        );
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <ModalHeader title="Update Container Status" onClose={onClose} />

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {error && (
                        <div style={{
                            padding: '10px 14px', background: '#fef2f2',
                            border: '1px solid #fecaca', borderRadius: 9,
                            fontSize: 13, color: '#dc2626',
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Transition arrow */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 16px', background: '#f9fafb',
                        border: '1px solid #e5e7eb', borderRadius: 12, flexWrap: 'wrap',
                    }}>
                        {/* Current */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: currentOption?.color ?? '#9ca3af',
                            }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                                {currentOption?.icon} {currentOption?.label ?? 'Unknown'}
                            </span>
                        </div>

                        <span style={{ fontSize: 18, color: '#9ca3af' }}>→</span>

                        {/* Next */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '4px 12px', borderRadius: 20,
                            background: `${nextOption.color}15`,
                            border: `1.5px solid ${nextOption.color}40`,
                        }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: nextOption.color }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: nextOption.color }}>
                                {nextOption.icon} {nextOption.label}
                            </span>
                        </div>
                    </div>

                    {/* Info box */}
                    <div style={{
                        padding: '12px 14px',
                        background: '#f0fdf4',
                        border: '1px solid #d1fae5',
                        borderRadius: 10,
                        fontSize: 12.5,
                        color: '#166534',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                    }}>
                        <span style={{ fontSize: 16 }}>🔄</span>
                        <span>
                            Moving this container will <strong>automatically update Tracking and ImportRequest</strong> for all{' '}
                            {container.itemCount} shipment(s) inside.
                        </span>
                    </div>

                    {/* Location field */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>
                            Current Location <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input
                            style={inputStyle}
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Port Said, Egypt"
                        />
                        <span style={{ fontSize: 11.5, color: '#9ca3af' }}>
                            This location will be recorded in the tracking history for each shipment.
                        </span>
                    </div>

                    {/* Description field */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>
                            Notes <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <textarea
                            style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Any details about this status change…"
                        />
                    </div>
                </div>

                <ModalFooter
                    onClose={onClose}
                    loading={loading}
                    onSubmit={handleSubmit}
                    submitLabel={`Move to ${nextOption.label}`}
                    submitColor={nextOption.color}
                />
            </div>
        </div>
    );
};

// ── Shared sub-components ─────────────────────────────────────────────────────

interface ModalHeaderProps { title: string; onClose: () => void; }
const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px 14px', borderBottom: '1px solid #f3f4f6',
    }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#14532d' }}>{title}</h2>
        <button
            onClick={onClose}
            style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ca3af', fontSize: 18, padding: 4, lineHeight: 1, borderRadius: 6,
            }}
        >✕</button>
    </div>
);

interface ModalFooterProps {
    onClose: () => void;
    onSubmit?: () => void;
    loading: boolean;
    submitLabel?: string;
    submitColor?: string;
}
const ModalFooter: React.FC<ModalFooterProps> = ({
    onClose, onSubmit, loading, submitLabel = 'Confirm', submitColor = '#16a34a',
}) => (
    <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 10,
        padding: '14px 24px', borderTop: '1px solid #f3f4f6',
    }}>
        <button
            onClick={onClose}
            disabled={loading}
            style={{
                padding: '8px 18px', borderRadius: 9,
                border: '1.5px solid #e5e7eb', background: '#fff',
                color: '#6b7280', fontSize: 13.5, cursor: 'pointer',
                opacity: loading ? 0.5 : 1,
            }}
        >
            Cancel
        </button>
        {onSubmit && (
            <button
                onClick={onSubmit}
                disabled={loading}
                style={{
                    padding: '8px 20px', borderRadius: 9,
                    border: 'none', background: submitColor,
                    color: '#fff', fontSize: 13.5, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', gap: 7,
                }}
            >
                {loading ? (
                    <>
                        <span style={{
                            width: 12, height: 12, display: 'inline-block',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#fff', borderRadius: '50%',
                            animation: 'csuSpin 0.7s linear infinite',
                        }} />
                        Updating…
                    </>
                ) : submitLabel}
            </button>
        )}
        <style>{`@keyframes csuSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

// ── Shared styles ─────────────────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20, backdropFilter: 'blur(2px)',
};

const modalStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 16,
    width: '100%', maxWidth: 500,
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
    animation: 'csuModalIn 0.2s ease',
};

const inputStyle: React.CSSProperties = {
    padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 9,
    fontSize: 13.5, fontFamily: 'inherit', color: '#111827', outline: 'none',
    background: '#fff', width: '100%', boxSizing: 'border-box' as const,
};

export default ContainerStatusUpdateModal;
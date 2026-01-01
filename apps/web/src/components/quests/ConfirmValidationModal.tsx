import React from 'react';

interface ConfirmValidationModalProps {
    isOpen: boolean;
    points: number;
    isPending: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmValidationModal({
    isOpen,
    points,
    isPending,
    onConfirm,
    onCancel,
}: ConfirmValidationModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onCancel}
        >
            <div
                className="modal"
                style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '400px',
                    width: '90%',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: 700 }}>
                    Confirmer la validation
                </h2>
                <p style={{ marginBottom: '24px', fontSize: '16px', color: '#6B6B6B' }}>
                    Êtes-vous sûr de vouloir valider cette quête ? Vous gagnerez{' '}
                    <strong style={{ color: '#F2B8A3' }}>+{points} points</strong>.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={onCancel}
                        disabled={isPending}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#C8B7E8',
                            color: '#1A1A1A',
                            fontWeight: 600,
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            opacity: isPending ? 0.5 : 1,
                        }}
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onConfirm}
                        disabled={isPending}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#C8EAD3',
                            color: '#1A1A1A',
                            fontWeight: 600,
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            opacity: isPending ? 0.6 : 1,
                        }}
                    >
                        {isPending ? 'Validation...' : '✓ Confirmer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

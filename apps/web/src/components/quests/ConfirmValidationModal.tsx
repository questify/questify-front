import React from 'react';

interface ConfirmValidationModalProps {
    isOpen: boolean;
    points: number;
    isPending: boolean;
    questTitle?: string;
    validationsToday?: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmValidationModal({
    isOpen,
    points,
    isPending,
    questTitle,
    validationsToday = 0,
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
                    borderRadius: '20px',
                    padding: '0',
                    maxWidth: '420px',
                    width: '90%',
                    overflow: 'hidden',
                    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.18)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header gradient */}
                <div style={{
                    background: 'linear-gradient(135deg, #C8B7E8 0%, #9B7DC8 100%)',
                    padding: '28px 32px 24px',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚡</div>
                    <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: 0 }}>
                        Valider la quête
                    </h2>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 32px 28px' }}>
                    {questTitle && (
                        <div style={{
                            backgroundColor: '#F5F2FA',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            marginBottom: '16px',
                            fontWeight: 700,
                            fontSize: '16px',
                            color: '#1A1A1A',
                            textAlign: 'center',
                        }}>
                            {questTitle}
                        </div>
                    )}

                    {/* Points badge */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '12px',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{
                            backgroundColor: '#FFF4E6',
                            border: '2px solid #F2B8A3',
                            borderRadius: '12px',
                            padding: '10px 20px',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '2px' }}>Points gagnés</div>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: '#F2B8A3' }}>+{points} pts</div>
                        </div>

                        {validationsToday > 0 && (
                            <div style={{
                                backgroundColor: '#F0FBF4',
                                border: '2px solid #C8EAD3',
                                borderRadius: '12px',
                                padding: '10px 20px',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '2px' }}>Déjà fait aujourd'hui</div>
                                <div style={{ fontSize: '22px', fontWeight: 700, color: '#5BA073' }}>✓ {validationsToday}×</div>
                            </div>
                        )}
                    </div>

                    <p style={{ textAlign: 'center', color: '#6B6B6B', fontSize: '14px', marginBottom: '24px' }}>
                        Confirmes-tu avoir accompli cette quête ?
                    </p>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isPending}
                            style={{
                                flex: 1,
                                padding: '13px',
                                borderRadius: '10px',
                                border: '2px solid #E5E5E5',
                                backgroundColor: 'white',
                                color: '#6B6B6B',
                                fontWeight: 600,
                                cursor: isPending ? 'not-allowed' : 'pointer',
                                fontSize: '15px',
                            }}
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isPending}
                            style={{
                                flex: 2,
                                padding: '13px',
                                borderRadius: '10px',
                                border: 'none',
                                background: isPending ? '#E0E0E0' : 'linear-gradient(135deg, #C8B7E8 0%, #9B7DC8 100%)',
                                color: isPending ? '#A0A0A0' : 'white',
                                fontWeight: 700,
                                cursor: isPending ? 'not-allowed' : 'pointer',
                                fontSize: '15px',
                                boxShadow: isPending ? 'none' : '0 4px 12px rgba(155, 125, 200, 0.4)',
                            }}
                        >
                            {isPending ? 'Validation...' : '⚡ Valider !'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

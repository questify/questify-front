import React, { useState } from 'react';
import { useAuth } from '@core/contexts/AuthContext';
import toast from 'react-hot-toast';

const AVATAR_EMOJIS = [
    '👤', '😃', '😁', '😊', '😇', '🙂', '🙃',
    '😉', '😌', '😍', '🥰', '😘',
    '😜', '🤪', '🤓', '😎',
    '👨', '👩', '🧑', '👦', '👧', '🧒', '👶', '🧓', '👴', '👵',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
    '🦉', '🦅', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
];

export function SettingsPage() {
    const { user, updateUser } = useAuth();
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Profile form state
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '👤');
    const [startDate, setStartDate] = useState(user?.start_date || '');

    // Helper to get full avatar URL
    const getAvatarUrl = (url: string | undefined): string => {
        if (!url) return '👤';
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) {
            return `http://192.168.1.32:3000${url}`;
        }
        return url;
    };

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSaveProfile = async () => {
        try {
            const { api } = await import('@core/services/api');

            // Update user profile including start date
            const updatedUser = await api.users.updateMe({
                name,
                email,
                avatar_url: avatarUrl || undefined,
                start_date: startDate || undefined,
            });

            updateUser(updatedUser);

            toast.success('Profil mis à jour avec succès');
            setIsEditingProfile(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Erreur lors de la mise à jour du profil');
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        try {
            const { api } = await import('@core/services/api');

            // Call password reset endpoint
            await api.auth.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
            });

            toast.success('Mot de passe modifié avec succès');
            setIsChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Failed to change password:', error);
            toast.error('Erreur lors du changement de mot de passe');
        }
    };

    const handleCancelProfile = () => {
        setName(user?.name || '');
        setEmail(user?.email || '');
        setAvatarUrl(user?.avatar_url || '');
        setStartDate(user?.start_date || '');
        setIsEditingProfile(false);
    };

    const handleCancelPassword = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsChangingPassword(false);
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Veuillez sélectionner une image');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('L\'image ne doit pas dépasser 5 Mo');
            return;
        }

        try {
            setIsUploadingAvatar(true);
            const { api } = await import('@core/services/api');
            const result = await api.users.uploadAvatar(file);

            // Update avatar URL with server URL
            setAvatarUrl(result.avatar_url);
            toast.success('Avatar uploadé avec succès');
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            toast.error('Erreur lors de l\'upload de l\'avatar');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    return (
        <div id="settings" className="page active">
            <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Paramètres ⚙️</h1>
            <p style={{ color: '#6B6B6B', marginBottom: '40px' }}>
                Personnalise ton profil et ton expérience
            </p>

            {/* Profile Section */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3>Informations du profil</h3>
                    {!isEditingProfile && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsEditingProfile(true)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#C8B7E8',
                                color: '#1A1A1A',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            ✏️ Modifier
                        </button>
                    )}
                </div>

                {!isEditingProfile ? (
                    <div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '4px' }}>Nom</div>
                            <div style={{ fontSize: '16px', fontWeight: 600 }}>{user?.name}</div>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '4px' }}>Email</div>
                            <div style={{ fontSize: '16px', fontWeight: 600 }}>{user?.email}</div>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '4px' }}>Avatar</div>
                            {user?.avatar_url && user.avatar_url.startsWith('/') ? (
                                <img
                                    src={getAvatarUrl(user.avatar_url)}
                                    alt="Avatar"
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                <div style={{ fontSize: '32px' }}>
                                    {user?.avatar_url || '👤'}
                                </div>
                            )}
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '4px' }}>
                                Date de début du challenge
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 600 }}>
                                {user?.start_date ? new Date(user.start_date).toLocaleDateString('fr-FR') : 'Non définie'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Nom</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #E5E5E5',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #E5E5E5',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Avatar</label>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                                {avatarUrl && avatarUrl.startsWith('/') ? (
                                    <img
                                        src={getAvatarUrl(avatarUrl)}
                                        alt="Avatar"
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '2px solid #E5E5E5',
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        fontSize: '48px',
                                        width: '64px',
                                        height: '64px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        {avatarUrl || '👤'}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarUpload}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingAvatar}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            border: '2px solid #E5E5E5',
                                            backgroundColor: 'white',
                                            color: '#1A1A1A',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            marginRight: '8px',
                                        }}
                                    >
                                        {isUploadingAvatar ? '📤 Upload...' : '📤 Uploader une image'}
                                    </button>
                                    <button
                                        onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            border: '2px solid #E5E5E5',
                                            backgroundColor: 'white',
                                            color: '#1A1A1A',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        😊 Choisir un emoji
                                    </button>
                                </div>
                            </div>
                            <div style={{ position: 'relative' }}>
                                {isEmojiPickerOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        marginTop: '8px',
                                        padding: '12px',
                                        backgroundColor: 'white',
                                        border: '2px solid #E5E5E5',
                                        borderRadius: '10px',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(10, 1fr)',
                                        gap: '8px',
                                        zIndex: 1000,
                                    }}>
                                        {AVATAR_EMOJIS.map((emoji) => (
                                            <div
                                                key={emoji}
                                                onClick={() => {
                                                    setAvatarUrl(emoji);
                                                    setIsEmojiPickerOpen(false);
                                                }}
                                                style={{
                                                    fontSize: '24px',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    padding: '4px',
                                                    borderRadius: '4px',
                                                    backgroundColor: avatarUrl === emoji ? '#C8B7E8' : 'transparent',
                                                }}
                                            >
                                                {emoji}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label>Date de début du challenge</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #E5E5E5',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                }}
                            />
                            <div style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '8px' }}>
                                Cette date détermine la semaine 1 du plateau et permet de calculer l'avancement
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveProfile}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#C8B7E8',
                                    color: '#1A1A1A',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                💾 Enregistrer
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={handleCancelProfile}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: '2px solid #E5E5E5',
                                    backgroundColor: 'white',
                                    color: '#6B6B6B',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Password Section */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3>Mot de passe</h3>
                    {!isChangingPassword && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsChangingPassword(true)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#C8B7E8',
                                color: '#1A1A1A',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            🔒 Modifier le mot de passe
                        </button>
                    )}
                </div>

                {!isChangingPassword ? (
                    <p style={{ color: '#6B6B6B' }}>
                        Cliquez sur "Modifier le mot de passe" pour changer votre mot de passe
                    </p>
                ) : (
                    <div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Mot de passe actuel</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #E5E5E5',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Nouveau mot de passe</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #E5E5E5',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label>Confirmer le nouveau mot de passe</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #E5E5E5',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleChangePassword}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#C8B7E8',
                                    color: '#1A1A1A',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                🔒 Changer le mot de passe
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={handleCancelPassword}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: '2px solid #E5E5E5',
                                    backgroundColor: 'white',
                                    color: '#6B6B6B',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, ChevronDown, User, Mail, Shield, AlertTriangle } from 'lucide-react'
import { useAppSelector } from '@/lib/redux/hooks'

interface AppInfo {
    client_id: string
    name: string
    description: string
    logo_url?: string
    website_url?: string
    privacy_policy_url?: string
    terms_of_service_url?: string
    developer_name?: string
    developer_website?: string
    is_verified: boolean
    is_first_party: boolean
    trust_level: string
    allowed_scopes: string[]
}

function SSOContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { profile, user, isLoading: authLoading } = useAppSelector((state) => state.auth)

    const [isAuthorizing, setIsAuthorizing] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [fadeIn, setFadeIn] = useState(false)
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
    const [appLoading, setAppLoading] = useState(true)
    const [appError, setAppError] = useState<string | null>(null)

    const clientId = searchParams.get('client_id')
    const redirectUri = searchParams.get('redirect_uri') || ''
    const state = searchParams.get('state') || ''
    const scope = searchParams.get('scope') || 'profile.read profile.email'

    const userName = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.first_name || 'User'
    const userEmail = profile?.email || user?.email || ''
    const userInitial = userName.charAt(0).toUpperCase()

    useEffect(() => {
        setMounted(true)
        setTimeout(() => setFadeIn(true), 50)
    }, [])

    // Fetch app information
    useEffect(() => {
        if (!clientId) {
            setAppError('Missing client_id parameter')
            setAppLoading(false)
            return
        }

        const fetchAppInfo = async () => {
            try {
                setAppLoading(true)
                const response = await fetch(`/api/oauth/app-info?client_id=${encodeURIComponent(clientId)}`)

                if (!response.ok) {
                    const error = await response.json()
                    setAppError(error.error_description || 'Failed to load application information')
                    return
                }

                const data = await response.json()
                setAppInfo(data)
            } catch (error) {
                console.error('Error fetching app info:', error)
                setAppError('Failed to connect to server')
            } finally {
                setAppLoading(false)
            }
        }

        fetchAppInfo()
    }, [clientId])

    useEffect(() => {
        if (mounted && !authLoading && !user) {
            router.push(`/login?returnUrl=${encodeURIComponent(window.location.href)}`)
        }
    }, [mounted, authLoading, user, router])

    useEffect(() => {
        if (showDropdown) {
            const close = () => setShowDropdown(false)
            document.addEventListener('click', close)
            return () => document.removeEventListener('click', close)
        }
        return undefined
    }, [showDropdown])

    const handleContinue = async () => {
        setIsAuthorizing(true)
        try {
            const res = await fetch('/api/oauth/authorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    redirect_uri: redirectUri,
                    scope: scope,
                    state,
                    response_type: 'code'
                })
            })
            const data = await res.json()
            if (data.redirect_uri) {
                window.location.href = data.redirect_uri
            } else if (data.authorization_code) {
                const url = new URL(redirectUri || window.location.origin)
                url.searchParams.set('code', data.authorization_code)
                if (state) url.searchParams.set('state', state)
                window.location.href = url.toString()
            }
        } catch {
            setIsAuthorizing(false)
        }
    }

    const handleCancel = () => {
        if (redirectUri) {
            try {
                const url = new URL(redirectUri)
                url.searchParams.set('error', 'access_denied')
                if (state) url.searchParams.set('state', state)
                window.location.href = url.toString()
            } catch { router.back() }
        } else { router.back() }
    }

    if (!mounted || authLoading || appLoading) {
        return (
            <div className="sso-loading">
                <div className="sso-loading-content">
                    <div className="sso-loading-logo">
                        <span>C</span>
                    </div>
                    <Loader2 className="w-6 h-6 animate-spin sso-spinner" />
                    <p style={{ color: '#a3a3a3', fontSize: '14px', marginTop: '12px' }}>
                        {appLoading ? 'Loading application...' : 'Loading...'}
                    </p>
                </div>
            </div>
        )
    }

    if (appError) {
        return (
            <div className="sso-loading">
                <div className="sso-loading-content">
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#7f1d1d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <AlertTriangle style={{ width: '24px', height: '24px', color: '#fca5a5' }} />
                    </div>
                    <h2 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '8px' }}>
                        Application Error
                    </h2>
                    <p style={{ color: '#a3a3a3', fontSize: '14px', textAlign: 'center', maxWidth: '320px' }}>
                        {appError}
                    </p>
                    <button
                        onClick={() => router.back()}
                        style={{
                            marginTop: '16px',
                            padding: '8px 24px',
                            backgroundColor: '#60a5fa',
                            color: '#0a0a0a',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600
                        }}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    if (!user || !profile || !appInfo) return null

    return (
        <div className={`sso-container ${fadeIn ? 'sso-fade-in' : ''}`}>
            {/* Header */}
            <header className="sso-header">
                <div className="sso-header-logo">
                    <span>C</span>
                </div>
                <span className="sso-header-text">Sign in with CatalystWells</span>
            </header>

            {/* Main Content */}
            <main className="sso-main">
                <div className="sso-card-wrapper">
                    {/* Card */}
                    <div className="sso-card">
                        <div className="sso-card-content">
                            {/* Left Column */}
                            <div className="sso-left-column">
                                {/* App Icon */}
                                <div className="sso-app-icon">
                                    <span>{appInfo.name.charAt(0)}</span>
                                    <div className="sso-verified-badge">
                                        <Shield style={{ width: '12px', height: '12px', color: '#10b981' }} />
                                    </div>
                                </div>

                                {/* Title */}
                                <h1 className="sso-title">
                                    Sign in to {appInfo.name}
                                </h1>

                                {/* App Description */}
                                <p className="sso-description">
                                    {appInfo.description}
                                </p>

                                {/* Account Selector */}
                                <div className="sso-account-selector">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown) }}
                                        className={`sso-account-button ${showDropdown ? 'active' : ''}`}
                                    >
                                        <div className="sso-avatar">
                                            <span>{userInitial}</span>
                                        </div>
                                        <span className="sso-email">{userEmail}</span>
                                        <ChevronDown className={`sso-chevron ${showDropdown ? 'rotate' : ''}`} />
                                    </button>

                                    {/* Dropdown */}
                                    {showDropdown && (
                                        <div className="sso-dropdown">
                                            <div className="sso-dropdown-current">
                                                <div className="sso-dropdown-avatar">
                                                    <span>{userInitial}</span>
                                                </div>
                                                <div className="sso-dropdown-info">
                                                    <p className="sso-dropdown-name">{userName}</p>
                                                    <p className="sso-dropdown-email">{userEmail}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => router.push('/login?switch=true')}
                                                className="sso-dropdown-switch"
                                            >
                                                <div className="sso-dropdown-switch-icon">
                                                    <User style={{ width: '20px', height: '20px', color: '#a3a3a3' }} />
                                                </div>
                                                <span>Use another account</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="sso-right-column">
                                {/* Access Info */}
                                <p className="sso-access-info">
                                    CatalystWells will allow <strong>{appInfo.name}</strong> to access this info about you
                                </p>

                                {/* Permissions */}
                                <div className="sso-permissions">
                                    {/* Name Permission */}
                                    <div className="sso-permission-item">
                                        <div className="sso-permission-icon">
                                            <User style={{ width: '18px', height: '18px', color: '#a3a3a3' }} />
                                        </div>
                                        <div className="sso-permission-text">
                                            <p className="sso-permission-value">{userName}</p>
                                            <p className="sso-permission-label">Name and profile picture</p>
                                        </div>
                                    </div>

                                    {/* Email Permission */}
                                    <div className="sso-permission-item">
                                        <div className="sso-permission-icon">
                                            <Mail style={{ width: '18px', height: '18px', color: '#a3a3a3' }} />
                                        </div>
                                        <div className="sso-permission-text">
                                            <p className="sso-permission-value">{userEmail}</p>
                                            <p className="sso-permission-label">Email address</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Privacy Notice */}
                                <div className="sso-privacy">
                                    <p>
                                        Review {appInfo.name}&apos;s{' '}
                                        <a href="#">Privacy Policy</a>
                                        {' '}and{' '}
                                        <a href="#">Terms of Service</a>
                                        {' '}to understand how {appInfo.name} will process and protect your data.
                                    </p>
                                    <p>
                                        To make changes at any time, go to your{' '}
                                        <a href="/authsso/apps">CatalystWells Account</a>.
                                    </p>
                                    <p>
                                        Learn more about{' '}
                                        <a href="#">Sign in with CatalystWells</a>.
                                    </p>
                                </div>

                                {/* Buttons */}
                                <div className="sso-buttons">
                                    <button
                                        onClick={handleCancel}
                                        disabled={isAuthorizing}
                                        className="sso-button sso-button-cancel"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleContinue}
                                        disabled={isAuthorizing}
                                        className="sso-button sso-button-continue"
                                    >
                                        {isAuthorizing && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {isAuthorizing ? 'Authorizing...' : 'Continue'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trust Badge */}
                    <div className="sso-trust-badge">
                        <Shield style={{ width: '14px', height: '14px', color: '#10b981' }} />
                        <span>Secured by CatalystWells OAuth 2.0</span>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="sso-footer">
                <button className="sso-footer-language">
                    English (United States)
                    <ChevronDown style={{ width: '12px', height: '12px' }} />
                </button>
                <nav className="sso-footer-nav">
                    <a href="#">Help</a>
                    <a href="/privacy">Privacy</a>
                    <a href="/terms">Terms</a>
                </nav>
            </footer>

            {/* Styles */}
            <style jsx>{`
                /* Base Styles */
                .sso-container {
                    min-height: 100vh;
                    background-color: #0a0a0a;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Segoe UI', Roboto, Arial, sans-serif;
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                }

                .sso-fade-in {
                    opacity: 1;
                }

                /* Loading State */
                .sso-loading {
                    min-height: 100vh;
                    background-color: #0a0a0a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .sso-loading-content {
                    text-align: center;
                }

                .sso-loading-logo {
                    width: 48px;
                    height: 48px;
                    margin: 0 auto 16px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6, #10b981, #f59e0b);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }

                .sso-loading-logo span {
                    color: white;
                    font-size: 18px;
                    font-weight: 700;
                }

                .sso-spinner {
                    color: #60a5fa;
                    margin: 0 auto;
                }

                /* Header */
                .sso-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    background-color: #171717;
                    border-bottom: 1px solid #262626;
                    position: sticky;
                    top: 0;
                    z-index: 40;
                    backdrop-filter: blur(10px);
                }

                .sso-header-logo {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6, #10b981, #f59e0b);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
                }

                .sso-header-logo span {
                    color: white;
                    font-size: 11px;
                    font-weight: 700;
                }

                .sso-header-text {
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 500;
                }

                /* Main Content */
                .sso-main {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                }

                .sso-card-wrapper {
                    width: 100%;
                    max-width: 440px;
                }

                .sso-card {
                    background-color: #171717;
                    border-radius: 24px;
                    border: 1px solid #262626;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
                }

                .sso-card-content {
                    display: flex;
                    flex-direction: column;
                }

                /* Left Column (Mobile: Top) */
                .sso-left-column {
                    padding: 32px 24px;
                    border-bottom: 1px solid #262626;
                }

                .sso-app-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, #14b8a6, #0d9488);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 24px;
                    box-shadow: 0 10px 25px -5px rgba(20, 184, 166, 0.4);
                    position: relative;
                }

                .sso-app-icon span {
                    color: white;
                    font-size: 24px;
                    font-weight: 700;
                }

                .sso-verified-badge {
                    position: absolute;
                    bottom: -4px;
                    right: -4px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background-color: #0a0a0a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #171717;
                }

                .sso-title {
                    color: #ffffff;
                    font-size: 28px;
                    font-weight: 400;
                    line-height: 1.2;
                    margin: 0 0 8px 0;
                }

                .sso-description {
                    color: #737373;
                    font-size: 14px;
                    margin: 0 0 24px 0;
                    line-height: 1.5;
                }

                /* Account Selector */
                .sso-account-selector {
                    position: relative;
                }

                .sso-account-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 16px 6px 6px;
                    background-color: #1f1f1f;
                    border: 1px solid #404040;
                    border-radius: 9999px;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: 100%;
                    max-width: 100%;
                }

                .sso-account-button:hover {
                    background-color: #262626;
                }

                .sso-account-button.active {
                    background-color: #262626;
                    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
                }

                .sso-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #7c3aed, #a855f7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.3);
                    flex-shrink: 0;
                }

                .sso-avatar span {
                    color: white;
                    font-size: 13px;
                    font-weight: 600;
                }

                .sso-email {
                    color: #ffffff;
                    font-size: 14px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    flex: 1;
                    text-align: left;
                }

                .sso-chevron {
                    width: 16px;
                    height: 16px;
                    color: #a3a3a3;
                    transition: transform 0.2s;
                    flex-shrink: 0;
                }

                .sso-chevron.rotate {
                    transform: rotate(180deg);
                }

                /* Dropdown */
                .sso-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    background-color: #1f1f1f;
                    border: 1px solid #404040;
                    border-radius: 16px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                    z-index: 50;
                    overflow: hidden;
                    animation: slideDown 0.2s ease-out;
                }

                .sso-dropdown-current {
                    padding: 16px;
                    border-bottom: 1px solid #404040;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .sso-dropdown-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #7c3aed, #a855f7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .sso-dropdown-avatar span {
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                }

                .sso-dropdown-info {
                    flex: 1;
                    min-width: 0;
                }

                .sso-dropdown-name {
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 500;
                    margin: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .sso-dropdown-email {
                    color: #a3a3a3;
                    font-size: 12px;
                    margin: 2px 0 0 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .sso-dropdown-switch {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background-color: transparent;
                    border: none;
                    cursor: pointer;
                    color: #ffffff;
                    transition: background-color 0.15s;
                    text-align: left;
                }

                .sso-dropdown-switch:hover {
                    background-color: #262626;
                }

                .sso-dropdown-switch-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 2px dashed #525252;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .sso-dropdown-switch span {
                    font-size: 14px;
                }

                /* Right Column (Mobile: Bottom) */
                .sso-right-column {
                    padding: 32px 24px;
                }

                .sso-access-info {
                    color: #ffffff;
                    font-size: 16px;
                    margin: 0 0 20px 0;
                    line-height: 1.5;
                }

                .sso-access-info strong {
                    font-weight: 600;
                }

                /* Permissions */
                .sso-permissions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .sso-permission-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 12px;
                    background-color: #1f1f1f;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }

                .sso-permission-item:hover {
                    background-color: #262626;
                    border-color: #404040;
                }

                .sso-permission-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background-color: #262626;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .sso-permission-text {
                    flex: 1;
                    min-width: 0;
                }

                .sso-permission-value {
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 500;
                    margin: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .sso-permission-label {
                    color: #a3a3a3;
                    font-size: 14px;
                    margin: 2px 0 0 0;
                }

                /* Privacy Notice */
                .sso-privacy {
                    color: #a3a3a3;
                    font-size: 14px;
                    line-height: 1.6;
                    margin-bottom: 24px;
                }

                .sso-privacy p {
                    margin: 0 0 12px 0;
                }

                .sso-privacy p:last-child {
                    margin-bottom: 0;
                }

                .sso-privacy a {
                    color: #60a5fa;
                    text-decoration: none;
                    transition: all 0.15s;
                }

                .sso-privacy a:hover {
                    text-decoration: underline;
                }

                /* Buttons */
                .sso-buttons {
                    display: flex;
                    gap: 12px;
                    flex-direction: column;
                }

                .sso-button {
                    height: 44px;
                    padding: 0 28px;
                    font-size: 14px;
                    font-weight: 500;
                    border-radius: 9999px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                }

                .sso-button:disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }

                .sso-button-cancel {
                    color: #60a5fa;
                    background-color: transparent;
                    border: 1px solid #404040;
                }

                .sso-button-cancel:hover:not(:disabled) {
                    background-color: #262626;
                }

                .sso-button-continue {
                    color: #0a0a0a;
                    background-color: #60a5fa;
                    border: none;
                    font-weight: 600;
                    box-shadow: 0 4px 6px -1px rgba(96, 165, 250, 0.3);
                }

                .sso-button-continue:hover:not(:disabled) {
                    background-color: #3b82f6;
                }

                /* Trust Badge */
                .sso-trust-badge {
                    margin-top: 20px;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    color: #737373;
                    font-size: 12px;
                }

                /* Footer */
                .sso-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-top: 1px solid #262626;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .sso-footer-language {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: #a3a3a3;
                    font-size: 12px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                    transition: all 0.15s;
                }

                .sso-footer-language:hover {
                    background-color: #262626;
                    color: #ffffff;
                }

                .sso-footer-nav {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .sso-footer-nav a {
                    color: #a3a3a3;
                    font-size: 12px;
                    text-decoration: none;
                    transition: color 0.15s;
                }

                .sso-footer-nav a:hover {
                    color: #ffffff;
                }

                /* Animations */
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.7;
                    }
                }

                /* Desktop Styles (768px and up) */
                @media (min-width: 768px) {
                    .sso-main {
                        padding: 32px 24px;
                    }

                    .sso-card-wrapper {
                        max-width: 900px;
                    }

                    .sso-card-content {
                        flex-direction: row;
                    }

                    .sso-left-column {
                        width: 380px;
                        border-bottom: none;
                        border-right: 1px solid #262626;
                        padding: 40px;
                    }

                    .sso-title {
                        font-size: 32px;
                    }

                    .sso-right-column {
                        flex: 1;
                        padding: 40px;
                    }

                    .sso-buttons {
                        flex-direction: row;
                    }

                    .sso-button {
                        width: auto;
                    }

                    .sso-button-cancel {
                        order: 1;
                    }

                    .sso-button-continue {
                        order: 2;
                    }

                    .sso-account-button {
                        max-width: 300px;
                    }
                }

                /* Large Desktop (1024px and up) */
                @media (min-width: 1024px) {
                    .sso-left-column {
                        width: 400px;
                    }
                }
            `}</style>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="sso-loading">
            <div className="sso-loading-content">
                <div className="sso-loading-logo">
                    <span>C</span>
                </div>
                <Loader2 className="w-6 h-6 animate-spin sso-spinner" />
            </div>
            <style jsx>{`
                .sso-loading {
                    min-height: 100vh;
                    background-color: #0a0a0a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .sso-loading-content {
                    text-align: center;
                }
                .sso-loading-logo {
                    width: 48px;
                    height: 48px;
                    margin: 0 auto 16px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6, #10b981, #f59e0b);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .sso-loading-logo span {
                    color: white;
                    font-size: 18px;
                    font-weight: 700;
                }
                .sso-spinner {
                    color: #60a5fa;
                    margin: 0 auto;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </div>
    )
}

export default function AuthSSOPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <SSOContent />
        </Suspense>
    )
}

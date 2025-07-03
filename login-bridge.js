console.log('🔗 Solthron Login Bridge loaded');

function detectAndForwardToken() {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token') || urlParams.get('auth_token') || urlParams.get('jwt');
    
    if (urlToken) {
        console.log('🔗 Found token in URL');
        forwardTokenToExtension(urlToken, 'url_parameter');
        return true;
    }
    
    // Check localStorage for various token keys
    const storageKeys = ['authToken', 'auth_token', 'jwt_token', 'solthron_token'];
    for (const key of storageKeys) {
        const token = localStorage.getItem(key);
        if (token && token.length > 20) {
            console.log('💾 Found token in localStorage:', key);
            forwardTokenToExtension(token, `localStorage_${key}`);
            return true;
        }
    }
    
    // Check for Firebase auth data
    const firebaseKeys = Object.keys(localStorage).filter(key => 
        key.includes('firebase') || key.includes('Auth')
    );
    
    for (const key of firebaseKeys) {
        try {
            const value = localStorage.getItem(key);
            if (value && value.startsWith('{')) {
                const data = JSON.parse(value);
                if (data.stsTokenManager?.accessToken) {
                    console.log('🔥 Found Firebase access token');
                    forwardTokenToExtension(data.stsTokenManager.accessToken, 'firebase_storage');
                    return true;
                }
            }
        } catch (e) {
            // Not JSON, continue
        }
    }
    
    return false;
}

function forwardTokenToExtension(token, source) {
    if (!token || token === 'undefined' || token.length < 20) {
        console.log('❌ Invalid token, not forwarding');
        return;
    }
    
    try {
        window.postMessage({
            type: 'SOLTHRON_AUTH_SUCCESS',
            token: token,
            timestamp: Date.now(),
            source: source
        }, '*');
        
        console.log('✅ Token forwarded to extension from:', source);
        showLoginFeedback(source);
        
    } catch (error) {
        console.error('❌ Error forwarding token:', error);
    }
}

function showLoginFeedback(source) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: #4CAF50; color: white; padding: 15px 20px;
        border-radius: 8px; z-index: 10000; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    feedback.innerHTML = `✅ Extension login successful!<br><small>Source: ${source}</small>`;
    document.body.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 5000);
}

// REMOVED: localStorage override (LoginPage.js already handles this)
// This prevents the "originalSetItem already declared" error

// Initialize token detection
function initialize() {
    console.log('🚀 Initializing login bridge...');
    
    if (detectAndForwardToken()) {
        console.log('✅ Token found immediately');
        return;
    }
    
    // Retry detection after delays (for async auth)
    setTimeout(detectAndForwardToken, 2000);
    setTimeout(detectAndForwardToken, 5000);
}

// Start when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Test function for manual testing
window.testExtensionAuth = function(token) {
    console.log('🧪 Manual test triggered');
    if (token) {
        forwardTokenToExtension(token, 'manual_test');
    } else {
        detectAndForwardToken();
    }
};

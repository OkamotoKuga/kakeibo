import React, { useState } from 'react';
import config from './config';

const LoginComponent = ({ onLogin, onClose, onSwitchToSignUp }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = config.API_BASE;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/account/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP ${response.status}: ログインに失敗しました`);
      }

      const data = await response.json();

      if (data.token && data.user) {
        onLogin(data);
      } else {
        setError('ログインレスポンスが不正です');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      
      let errorMessage = 'ログインに失敗しました';
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'サーバーに接続できません。ネットワーク接続を確認してください。';
      } else if (error.message.includes('401')) {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません';
      } else if (error.message.includes('500')) {
        errorMessage = 'サーバーエラーが発生しました。しばらく待ってからお試しください。';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="login-container" style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '400px',
        position: 'relative'
      }}>
        <div className="login-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.5em', 
            color: '#333' 
          }}>
            🔐 ログイン
          </h3>
          <button 
            className="close-btn" 
            onClick={onClose} 
            title="閉じる"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5em',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              📧 メールアドレス
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1em',
                boxSizing: 'border-box'
              }}
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              🔒 パスワード
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="パスワードを入力"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1em',
                boxSizing: 'border-box'
              }}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9em',
              border: '1px solid #ef9a9a'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: isLoading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1em',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {isLoading ? '🔄 ログイン中...' : '🚪 ログイン'}
          </button>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '20px' 
          }}>
            <p style={{ 
              margin: 0, 
              color: '#666' 
            }}>
              アカウントをお持ちでない方は{' '}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4CAF50',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: 'inherit'
                }}
                disabled={isLoading}
              >
                新規登録
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginComponent;

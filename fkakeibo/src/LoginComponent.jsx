import React, { useState } from 'react';

const LoginComponent = ({ onLogin, onClose, onSwitchToSignUp }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      onClose && onClose();
    } catch (error) {
      console.error('ログインエラー:', error);
      let errorMessage = 'ログインに失敗しました';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'このメールアドレスは登録されていません';
          break;
        case 'auth/wrong-password':
          errorMessage = 'パスワードが間違っています';
          break;
        case 'auth/invalid-email':
          errorMessage = '有効なメールアドレスを入力してください';
          break;
        case 'auth/user-disabled':
          errorMessage = 'このアカウントは無効になっています';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'ログイン試行回数が多すぎます。しばらく待ってからお試しください';
          break;
        default:
          errorMessage = error.message || 'ログインに失敗しました';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

      if (data.token && data.user) {
        localStorage.setItem('kakeibo-token', data.token);
        localStorage.setItem('kakeibo-user', JSON.stringify(data.user));
        if (onLogin) {
          onLogin(data.user, data.token);
        }
        if (onClose) {
          onClose();
        }
      } else {
        setError('ログインレスポンスが不正です');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      
      let errorMessage = 'ログインに失敗しました';
      if (error.message.includes('Failed to fetch')) {      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-container">
        <div className="login-header">
          <h3>🔐 ログイン</h3>
          <button className="close-btn" onClick={onClose} title="閉じる">×</button>
        </div>

        <div className="login-content">
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">📧 メールアドレス</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">🔒 パスワード</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="パスワードを入力"
                className="form-input"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                disabled={isLoading}
                className={`login-btn ${isLoading ? 'loading' : ''}`}
              >
                {isLoading ? '🔄 ログイン中...' : '🚀 ログイン'}
              </button>
            </div>

            <div className="signup-link">
              <p>
                アカウントをお持ちでない方は{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignUp}
                  className="link-btn"
                >
                  新規登録
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
                  type="button"
                  onClick={onSwitchToSignUp}
                  className="link-btn"
                >
                  こちらから新規登録
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;

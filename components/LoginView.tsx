import React, { useState } from 'react';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور.');
      return;
    }
    setIsLoading(true);
    const success = await onLogin(username, password);
    if (!success) {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }
    // Note: Do not reset loading on success as the component will unmount.
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white rounded-2xl shadow-xl animate-[slide-up_0.3s_ease-out]">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-800">أهلاً بك</h1>
            <p className="text-slate-500 mt-2">سجل الدخول للمتابعة إلى لوحة التحكم</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 pointer-events-none">
              person
            </span>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 pr-10 text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="اسم المستخدم"
              required
              disabled={isLoading}
            />
          </div>
          <div className="relative">
             <span className="material-symbols-outlined absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 pointer-events-none">
              lock
            </span>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-10 text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="كلمة المرور"
              required
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 flex items-center justify-center disabled:bg-indigo-400"
          >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                'تسجيل الدخول'
            )}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LoginView;

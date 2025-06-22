import { useRouter } from 'next/router';
import React, { useState } from 'react';

interface TwoFactorAuthProps {
  onSuccess?: (token: string) => void;
  onCancel?: () => void;
  redirectUrl?: string;
}

/**
 * Компонент двухфакторной аутентификации в соответствии с ISO 27001
 * Позволяет пользователю ввести код подтверждения, отправленный на телефон или email
 * Для администраторов и менеджеров 2FA является обязательным требованием
 * согласно стандарту ISO 27001 (A.9.4.2 - Безопасные процедуры входа в систему)
 */
const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onSuccess, onCancel, redirectUrl }) => {
  const router = useRouter();
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  // Обработчик изменения кода
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
    if (error) setError(null);
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length < 6) {
      setError('Пожалуйста, введите 6-значный код');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Отправка запроса на проверку кода
      const response = await fetch('/api/security/two-factor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка проверки кода');
      }

      // Если проверка успешна
      if (onSuccess) {
        onSuccess(data.token);
      } else if (redirectUrl) {
        router.push(redirectUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик повторной отправки кода
  const handleResendCode = async () => {
    try {
      setResendDisabled(true);
      setError(null);

      // Отправка запроса на генерацию нового кода
      const response = await fetch('/api/security/two-factor/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки кода');
      }

      // Запускаем обратный отсчет для повторной отправки (60 секунд)
      let timer = 60;
      setCountdown(timer);

      const interval = setInterval(() => {
        timer -= 1;
        setCountdown(timer);

        if (timer <= 0) {
          clearInterval(interval);
          setResendDisabled(false);
          setCountdown(0);
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setResendDisabled(false);
    }
  };

  // Обработчик отмены
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Двухфакторная аутентификация
      </h2>

      <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
        <p className="font-medium">Повышенная безопасность</p>
        <p className="text-sm">
          Двухфакторная аутентификация обеспечивает дополнительный уровень защиты вашей учетной
          записи в соответствии с требованиями ISO 27001.
        </p>
      </div>

      <div className="mb-6 text-center text-gray-600">
        <p>Код подтверждения был отправлен на ваш телефон или email.</p>
        <p>Введите его ниже для продолжения.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            Код подтверждения
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={handleCodeChange}
            placeholder="Введите 6-значный код"
            maxLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
            aria-label="Код двухфакторной аутентификации"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
        )}

        <div className="flex flex-col space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Подтвердить код"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Проверка...
              </span>
            ) : (
              'Подтвердить'
            )}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendDisabled}
            className="text-blue-600 hover:text-blue-800 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            aria-label="Отправить код повторно"
          >
            {resendDisabled
              ? `Повторная отправка через ${countdown} сек.`
              : 'Отправить код повторно'}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-800 transition-colors focus:outline-none text-sm"
            aria-label="Отмена"
          >
            Отмена
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-500 text-center">
        <p>Эта дополнительная мера безопасности соответствует требованиям ISO 27001.</p>
        <p className="mt-1">Если у вас возникли проблемы, обратитесь в службу поддержки.</p>
      </div>
    </div>
  );
};

export default TwoFactorAuth;

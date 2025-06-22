# Впровадження двофакторної аутентифікації згідно ISO 27001

Цей документ містить інструкції щодо налаштування та впровадження двофакторної аутентифікації (2FA) для забезпечення додаткового рівня безпеки згідно з вимогами ISO 27001.

## Загальні принципи

- Двофакторна аутентифікація є обов'язковою для всіх користувачів з доступом до системи
- Використовуються стандартні алгоритми та протоколи (TOTP, FIDO2, WebAuthn)
- Ведеться повний аудит всіх спроб аутентифікації
- Забезпечується резервний доступ у випадку втрати пристрою 2FA

## Налаштування 2FA для GitHub

### 1. Вимога 2FA для організації

1. Перейдіть до налаштувань організації: **Settings > Organizations > [Your Organization]**
2. Виберіть **Authentication security**
3. Увімкніть **Require two-factor authentication for everyone in the organization**
4. Натисніть **Save**

### 2. Налаштування 2FA для індивідуальних акаунтів

1. Перейдіть до налаштувань профілю: **Settings > Account security**
2. Натисніть **Enable two-factor authentication**
3. Виберіть метод 2FA:
   - **TOTP app** (рекомендовано): Використання додатків як Google Authenticator, Authy, Microsoft Authenticator
   - **SMS**: Отримання кодів через SMS (менш безпечний варіант)
   - **Security key**: Використання фізичних ключів безпеки (найбезпечніший варіант)
4. Збережіть резервні коди відновлення у безпечному місці

## Впровадження 2FA в додатку

### 1. Встановлення необхідних залежностей

```bash
npm install speakeasy qrcode
```

### 2. Створення модуля для роботи з 2FA

Створіть файл `lib/twoFactorAuth.ts` з наступним кодом:

```typescript
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

/**
 * Генерує секретний ключ для 2FA
 * @param userId ID користувача
 * @returns Об'єкт з URL для OTP та секретним ключем
 */
export const generateTwoFactorSecret = (userId: string) => {
  const secret = speakeasy.generateSecret({
    name: `TRAE Rules App (${userId})`,
    length: 20,
  });

  return {
    otpAuthUrl: secret.otpauth_url,
    base32: secret.base32,
  };
};

/**
 * Генерує QR-код для налаштування 2FA
 * @param otpAuthUrl URL для OTP
 * @returns Promise з даними QR-коду у форматі Data URL
 */
export const generateQRCode = async (otpAuthUrl: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(otpAuthUrl);
  } catch (error) {
    console.error('Помилка при генерації QR-коду:', error);
    throw error;
  }
};

/**
 * Перевіряє код 2FA
 * @param token Код, введений користувачем
 * @param secret Секретний ключ користувача
 * @returns true, якщо код вірний, false - якщо ні
 */
export const verifyTwoFactorToken = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // Дозволяє невелике відхилення в часі
  });
};

/**
 * Генерує резервні коди відновлення
 * @param count Кількість кодів
 * @returns Масив резервних кодів
 */
export const generateRecoveryCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Генеруємо код формату XXXX-XXXX-XXXX
    const code = `${generateRandomString(4)}-${generateRandomString(4)}-${generateRandomString(4)}`;
    codes.push(code);
  }
  return codes;
};

/**
 * Генерує випадковий рядок заданої довжини
 * @param length Довжина рядка
 * @returns Випадковий рядок
 */
const generateRandomString = (length: number): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
```

### 3. Створення API-ендпоінтів для 2FA

Створіть файл `pages/api/auth/2fa/setup.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import * as Sentry from '@sentry/nextjs';
import {
  generateTwoFactorSecret,
  generateQRCode,
  generateRecoveryCodes,
} from '../../../../lib/twoFactorAuth';
import {
  logSecurityEvent,
  SecurityEventType,
  SecurityEventSeverity,
} from '../../../../lib/securityEventLogger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Перевірка методу запиту
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    // Перевірка аутентифікації
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Генерація секрету для 2FA
    const secret = generateTwoFactorSecret(userId);

    // Генерація QR-коду
    const qrCode = await generateQRCode(secret.otpAuthUrl);

    // Генерація резервних кодів
    const recoveryCodes = generateRecoveryCodes();

    // В реальному додатку тут буде збереження секрету та резервних кодів у базу даних
    // Важливо: секрет повинен бути зашифрований перед збереженням!

    // Логування події безпеки
    logSecurityEvent({
      userId,
      eventType: SecurityEventType.SECURITY_SETTING_CHANGE,
      details: 'Налаштування двофакторної аутентифікації',
      severity: SecurityEventSeverity.WARNING,
      resourceType: 'authentication',
      metadata: {
        action: '2fa_setup_initiated',
      },
    });

    return res.status(200).json({
      success: true,
      secret: secret.base32,
      qrCode,
      recoveryCodes,
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    Sentry.captureException(error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
```

Створіть файл `pages/api/auth/2fa/verify.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import * as Sentry from '@sentry/nextjs';
import { verifyTwoFactorToken } from '../../../../lib/twoFactorAuth';
import {
  logSecurityEvent,
  SecurityEventType,
  SecurityEventSeverity,
} from '../../../../lib/securityEventLogger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Перевірка методу запиту
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    // Перевірка аутентифікації
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Отримання даних з запиту
    const { token, secret } = req.body;

    // Валідація даних
    if (!token || !secret) {
      return res.status(400).json({ success: false, error: 'Missing token or secret' });
    }

    // Перевірка токена
    const isValid = verifyTwoFactorToken(token, secret);

    // Логування події безпеки
    logSecurityEvent({
      userId,
      eventType: isValid ? SecurityEventType.ACCESS_GRANTED : SecurityEventType.ACCESS_DENIED,
      details: `Перевірка коду 2FA: ${isValid ? 'успішно' : 'невдало'}`,
      severity: isValid ? SecurityEventSeverity.INFO : SecurityEventSeverity.WARNING,
      resourceType: 'authentication',
      metadata: {
        action: '2fa_verification',
      },
    });

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid token' });
    }

    // В реальному додатку тут буде оновлення статусу 2FA користувача в базі даних

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    Sentry.captureException(error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
```

## Інтеграція 2FA в процес аутентифікації

### 1. Модифікація процесу входу

Процес входу повинен бути модифікований для підтримки 2FA:

1. Користувач вводить логін та пароль
2. Система перевіряє облікові дані
3. Якщо 2FA активовано для користувача, система запитує код 2FA
4. Користувач вводить код з додатка або SMS
5. Система перевіряє код та надає доступ

### 2. Створення компонента для налаштування 2FA

Створіть компонент `components/TwoFactorSetup.tsx`:

```tsx
import React, { useState } from 'react';
import Image from 'next/image';

type TwoFactorSetupProps = {
  onComplete: (enabled: boolean) => void;
};

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'intro' | 'qrcode' | 'verify' | 'recovery' | 'complete'>(
    'intro'
  );
  const [secret, setSecret] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Функція для ініціалізації налаштування 2FA
  const initSetup = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Помилка при налаштуванні 2FA: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Невідома помилка');
      }

      setSecret(data.secret);
      setQrCode(data.qrCode);
      setRecoveryCodes(data.recoveryCodes);
      setStep('qrcode');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Невідома помилка');
      console.error('Помилка при налаштуванні 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  // Функція для перевірки коду 2FA
  const verifyToken = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token || token.length < 6) {
        throw new Error('Введіть 6-значний код');
      }

      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, secret }),
      });

      if (!response.ok) {
        throw new Error(`Помилка при перевірці коду: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Невірний код');
      }

      setStep('recovery');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Невідома помилка');
      console.error('Помилка при перевірці коду 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  // Функція для завершення налаштування
  const completeSetup = () => {
    setStep('complete');
    onComplete(true);
  };

  // Функція для скасування налаштування
  const cancelSetup = () => {
    onComplete(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-w-md mx-auto">
      {step === 'intro' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Налаштування двофакторної аутентифікації</h2>
          <p>
            Двофакторна аутентифікація додає додатковий рівень безпеки до вашого облікового запису.
          </p>
          <p>Вам знадобиться додаток для аутентифікації, наприклад:</p>
          <ul className="list-disc pl-5">
            <li>Google Authenticator</li>
            <li>Microsoft Authenticator</li>
            <li>Authy</li>
          </ul>
          <div className="flex justify-between mt-4">
            <button
              onClick={cancelSetup}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Скасувати
            </button>
            <button
              onClick={initSetup}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Завантаження...' : 'Продовжити'}
            </button>
          </div>
        </div>
      )}

      {step === 'qrcode' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Сканування QR-коду</h2>
          <p>Відскануйте цей QR-код за допомогою додатка аутентифікації:</p>

          <div className="flex justify-center my-4">
            {qrCode && <Image src={qrCode} alt="QR-код для 2FA" width={200} height={200} />}
          </div>

          <p>Або введіть цей код вручну:</p>
          <div className="bg-gray-100 p-2 rounded-md font-mono text-center break-all">{secret}</div>

          <div className="mt-4">
            <label htmlFor="token" className="block text-sm font-medium text-gray-700">
              Введіть 6-значний код з додатка:
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={e => setToken(e.target.value.replace(/\D/g, '').substring(0, 6))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="123456"
              maxLength={6}
            />
          </div>

          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

          <div className="flex justify-between mt-4">
            <button
              onClick={() => setStep('intro')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Назад
            </button>
            <button
              onClick={verifyToken}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading || token.length !== 6}
            >
              {loading ? 'Перевірка...' : 'Перевірити'}
            </button>
          </div>
        </div>
      )}

      {step === 'recovery' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Резервні коди відновлення</h2>
          <p>
            Збережіть ці коди в безпечному місці. Вони дозволять вам отримати доступ до облікового
            запису, якщо ви втратите доступ до додатка аутентифікації.
          </p>

          <div className="bg-gray-100 p-3 rounded-md">
            <ul className="space-y-1 font-mono text-sm">
              {recoveryCodes.map((code, index) => (
                <li key={index} className="flex justify-between">
                  <span>{code}</span>
                  <span className="text-gray-500">
                    {index + 1}/{recoveryCodes.length}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => setStep('qrcode')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Назад
            </button>
            <button
              onClick={completeSetup}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Завершити налаштування
            </button>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="space-y-4 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold">Двофакторна аутентифікація активована</h2>
          <p>Ваш обліковий запис тепер захищений додатковим рівнем безпеки.</p>
          <button
            onClick={() => onComplete(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-4"
          >
            Готово
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
```

## Відповідність ISO 27001

Впровадження двофакторної аутентифікації відповідає наступним вимогам ISO 27001:

- **A.9.2.1** - Реєстрація та скасування реєстрації користувачів
- **A.9.2.4** - Управління секретною аутентифікаційною інформацією користувачів
- **A.9.3.1** - Використання секретної аутентифікаційної інформації
- **A.9.4.2** - Процедури безпечного входу в систему
- **A.9.4.3** - Система управління паролями

## Додаткові заходи безпеки

- Зберігайте секретні ключі 2FA в зашифрованому вигляді
- Встановіть обмеження на кількість невдалих спроб введення коду 2FA
- Забезпечте механізм відновлення доступу у випадку втрати пристрою 2FA
- Проводьте регулярний аудит спроб аутентифікації
- Навчайте користувачів щодо важливості 2FA та безпечного зберігання резервних кодів

## План впровадження

1. Налаштуйте обов'язкову 2FA для адміністраторів та користувачів з підвищеними привілеями
2. Впровадьте 2FA для всіх інших користувачів з перехідним періодом
3. Проведіть навчання користувачів щодо використання 2FA
4. Налаштуйте моніторинг та аудит спроб аутентифікації
5. Регулярно перевіряйте ефективність 2FA та оновлюйте процедури за необхідності

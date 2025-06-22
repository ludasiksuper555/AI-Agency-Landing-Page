import type { NextApiRequest, NextApiResponse } from 'next';

import { ContactFormData } from '@/src/types/forms';
import { validateContactForm } from '@/src/utils/validation';

type ContactResponse = {
  success: boolean;
  message: string;
  data?: any;
};

type ContactError = {
  success: false;
  message: string;
  errors?: Record<string, string>;
};

/**
 * @swagger
 * /api/contact:
 *   post:
 *     tags:
 *       - contact
 *     summary: Отправка контактной формы
 *     description: Обработка данных контактной формы и отправка уведомлений
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 description: Имя отправителя
 *                 example: "Иван Иванов"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email отправителя
 *                 example: "ivan@example.com"
 *               phone:
 *                 type: string
 *                 description: Телефон отправителя (опционально)
 *                 example: "+7 (999) 123-45-67"
 *               company:
 *                 type: string
 *                 description: Название компании (опционально)
 *                 example: "ООО Пример"
 *               message:
 *                 type: string
 *                 description: Текст сообщения
 *                 example: "Интересует ваш сервис"
 *               subject:
 *                 type: string
 *                 description: Тема сообщения (опционально)
 *                 example: "Запрос информации"
 *     responses:
 *       200:
 *         description: Сообщение успешно отправлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Сообщение успешно отправлено"
 *                 data:
 *                   type: object
 *                   description: Дополнительные данные ответа
 *       400:
 *         description: Ошибка валидации данных
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                   example:
 *                     email: "Некорректный email"
 *                     name: "Имя обязательно"
 *       405:
 *         description: Метод не разрешен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContactResponse | ContactError>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Only POST requests are accepted.',
    });
  }

  try {
    const formData: ContactFormData = req.body;

    // Validate the form data
    const validation = validateContactForm(formData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Send email notification
    // 3. Integrate with CRM
    // 4. Send auto-reply email

    // For now, we'll simulate processing
    console.log('Contact form submission:', {
      name: formData.name,
      email: formData.email,
      company: formData.company,
      subject: formData.subject,
      message: formData.message.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
    });

    // Simulate email sending (replace with actual email service)
    await simulateEmailSending(formData);

    return res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully. We will get back to you soon!',
      data: {
        submittedAt: new Date().toISOString(),
        reference: generateReference(),
      },
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
}

// Simulate email sending - replace with actual email service
async function simulateEmailSending(formData: ContactFormData): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`Email would be sent to admin about contact from ${formData.email}`);
      console.log(`Auto-reply would be sent to ${formData.email}`);
      resolve();
    }, 100);
  });
}

// Generate a simple reference number
function generateReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `REF-${timestamp}-${random}`.toUpperCase();
}

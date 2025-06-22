'use client';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';

import { Button } from '@/src/components/ui';
import { Input } from '@/src/components/ui/Input';
import { Textarea } from '@/src/components/ui/Textarea';
import { Toast } from '@/src/components/ui/Toast';
import { useForm } from '@/src/hooks/useForm';
import { ContactFormData } from '@/src/types/forms';
import { contactFormValidation } from '@/src/utils/validation';

const Contact = () => {
  const { t } = useTranslation('common');

  const initialValues: ContactFormData = {
    name: '',
    email: '',
    phone: '',
    message: '',
    company: '',
    subject: '',
    consent: false,
  };

  const { values, errors, touched, isSubmitting, getFieldProps, handleSubmit, reset } = useForm({
    initialValues,
    validation: contactFormValidation,
    onSubmit: handleFormSubmit,
  });

  async function handleFormSubmit(formData: ContactFormData) {
    try {
      // Відправка даних на сервер
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Помилка відправки форми');
      }

      // Показати повідомлення про успіх
      Toast.success({
        title: t('contact.success.title'),
        message: t('contact.success.message'),
      });

      // Скинути форму
      reset();
    } catch (error) {
      Toast.error({
        title: t('contact.error.title'),
        message: error instanceof Error ? error.message : t('contact.error.message'),
      });
    }
  }

  return (
    <div id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {t('contact.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('contact.description')}</p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-lg shadow-lg p-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    name="name"
                    type="text"
                    label={t('contact.form.name.label')}
                    placeholder={t('contact.form.name.placeholder')}
                    {...getFieldProps('name')}
                    error={touched.name ? errors.name : undefined}
                    required
                  />
                  <Input
                    name="email"
                    type="email"
                    label={t('contact.form.email.label')}
                    placeholder={t('contact.form.email.placeholder')}
                    {...getFieldProps('email')}
                    error={touched.email ? errors.email : undefined}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    name="phone"
                    type="tel"
                    label={t('contact.form.phone.label')}
                    placeholder={t('contact.form.phone.placeholder')}
                    {...getFieldProps('phone')}
                    error={touched.phone ? errors.phone : undefined}
                  />
                  <Input
                    name="company"
                    type="text"
                    label={t('contact.form.company.label')}
                    placeholder={t('contact.form.company.placeholder')}
                    {...getFieldProps('company')}
                    error={touched.company ? errors.company : undefined}
                  />
                </div>

                <Input
                  name="subject"
                  type="text"
                  label={t('contact.form.subject.label')}
                  placeholder={t('contact.form.subject.placeholder')}
                  {...getFieldProps('subject')}
                  error={touched.subject ? errors.subject : undefined}
                />

                <Textarea
                  name="message"
                  label={t('contact.form.message.label')}
                  placeholder={t('contact.form.message.placeholder')}
                  {...getFieldProps('message')}
                  error={touched.message ? errors.message : undefined}
                  rows={5}
                  required
                />

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="consent"
                    name="consent"
                    {...getFieldProps('consent')}
                    checked={values.consent}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="consent" className="text-sm text-gray-600">
                    {t('contact.form.consent.label')}
                  </label>
                </div>
                {touched.consent && errors.consent && (
                  <p className="text-sm text-red-600">{errors.consent}</p>
                )}

                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  size="lg"
                  fullWidth
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? t('contact.form.submitting') : t('contact.form.submit')}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

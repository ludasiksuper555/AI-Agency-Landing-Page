import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// Validation schemas
const ContactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(1).max(1000),
  timestamp: z.number(),
  id: z.string(),
});

const AnalyticsEventSchema = z.object({
  event: z.string(),
  category: z.string(),
  label: z.string().optional(),
  value: z.number().optional(),
  timestamp: z.number(),
  sessionId: z.string(),
  userId: z.string().optional(),
  page: z.string(),
  userAgent: z.string().optional(),
});

const SyncDataSchema = z.object({
  contactForms: z.array(ContactFormSchema).optional(),
  analyticsEvents: z.array(AnalyticsEventSchema).optional(),
  userPreferences: z.record(z.any()).optional(),
  performanceMetrics: z
    .array(
      z.object({
        name: z.string(),
        value: z.number(),
        timestamp: z.number(),
      })
    )
    .optional(),
});

type SyncData = z.infer<typeof SyncDataSchema>;
type ContactForm = z.infer<typeof ContactFormSchema>;
type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// In-memory storage for demo (use database in production)
const pendingContactForms: ContactForm[] = [];
const analyticsEvents: AnalyticsEvent[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request data
    const syncData = SyncDataSchema.parse(req.body);

    const results = {
      contactForms: { processed: 0, errors: [] as string[] },
      analyticsEvents: { processed: 0, errors: [] as string[] },
      userPreferences: { processed: 0, errors: [] as string[] },
      performanceMetrics: { processed: 0, errors: [] as string[] },
    };

    // Process contact forms
    if (syncData.contactForms) {
      for (const form of syncData.contactForms) {
        try {
          await processContactForm(form);
          results.contactForms.processed++;
        } catch (error) {
          console.error('Failed to process contact form:', error);
          results.contactForms.errors.push(
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }
    }

    // Process analytics events
    if (syncData.analyticsEvents) {
      for (const event of syncData.analyticsEvents) {
        try {
          await processAnalyticsEvent(event);
          results.analyticsEvents.processed++;
        } catch (error) {
          console.error('Failed to process analytics event:', error);
          results.analyticsEvents.errors.push(
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }
    }

    // Process user preferences
    if (syncData.userPreferences) {
      try {
        await processUserPreferences(syncData.userPreferences);
        results.userPreferences.processed = 1;
      } catch (error) {
        console.error('Failed to process user preferences:', error);
        results.userPreferences.errors.push(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    // Process performance metrics
    if (syncData.performanceMetrics) {
      for (const metric of syncData.performanceMetrics) {
        try {
          await processPerformanceMetric(metric);
          results.performanceMetrics.processed++;
        } catch (error) {
          console.error('Failed to process performance metric:', error);
          results.performanceMetrics.errors.push(
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }
    }

    console.log('Sync completed:', results);

    return res.status(200).json({
      success: true,
      message: 'Data synchronized successfully',
      results,
    });
  } catch (error) {
    console.error('Sync error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid data format',
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

// Process contact form submission
async function processContactForm(form: ContactForm): Promise<void> {
  // Add to pending forms
  pendingContactForms.push(form);

  // In production, you would:
  // 1. Save to database
  // 2. Send email notification
  // 3. Add to CRM system
  // 4. Trigger webhooks

  console.log('Contact form processed:', {
    id: form.id,
    name: form.name,
    email: form.email,
    timestamp: new Date(form.timestamp).toISOString(),
  });

  // Simulate email sending
  if (process.env.NODE_ENV === 'production') {
    try {
      await sendContactFormEmail(form);
    } catch (error) {
      console.error('Failed to send contact form email:', error);
      // Don't throw - we still want to save the form
    }
  }
}

// Process analytics event
async function processAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  // Add to analytics events
  analyticsEvents.push(event);

  // In production, you would:
  // 1. Send to Google Analytics
  // 2. Save to analytics database
  // 3. Update user behavior tracking

  console.log('Analytics event processed:', {
    event: event.event,
    category: event.category,
    page: event.page,
    timestamp: new Date(event.timestamp).toISOString(),
  });

  // Send to Google Analytics if configured
  if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && typeof window !== 'undefined') {
    try {
      // This would typically be done on the client side
      // Here we're just logging for demonstration
      console.log('Would send to GA:', event);
    } catch (error) {
      console.error('Failed to send to Google Analytics:', error);
    }
  }
}

// Process user preferences
async function processUserPreferences(preferences: Record<string, any>): Promise<void> {
  // In production, you would:
  // 1. Save to user profile in database
  // 2. Update personalization settings
  // 3. Sync with other services

  console.log('User preferences processed:', preferences);
}

// Process performance metric
async function processPerformanceMetric(metric: {
  name: string;
  value: number;
  timestamp: number;
}): Promise<void> {
  // In production, you would:
  // 1. Save to performance monitoring database
  // 2. Send to monitoring services (DataDog, New Relic, etc.)
  // 3. Trigger alerts if thresholds exceeded

  console.log('Performance metric processed:', {
    name: metric.name,
    value: metric.value,
    timestamp: new Date(metric.timestamp).toISOString(),
  });
}

// Send contact form email (placeholder)
async function sendContactFormEmail(form: ContactForm): Promise<void> {
  // In production, integrate with email service (SendGrid, Mailgun, etc.)
  console.log('Sending contact form email for:', form.email);

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Export functions for monitoring
export function getSyncStats() {
  return {
    pendingContactForms: pendingContactForms.length,
    analyticsEvents: analyticsEvents.length,
    lastSync: new Date().toISOString(),
  };
}

export function clearSyncData() {
  pendingContactForms.length = 0;
  analyticsEvents.length = 0;
}

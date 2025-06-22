import { CheckCircle, Copy, ExternalLink, Mail, MessageSquare, Share2 } from 'lucide-react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

/**
 * PWA Share Target Page
 * Handles shared content from other applications
 */

interface SharedData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export default function SharePage() {
  const router = useRouter();
  const [sharedData, setSharedData] = useState<SharedData>({});
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Extract shared data from URL parameters or form data
    const { title, text, url } = router.query;

    setSharedData({
      title: (title as string) || '',
      text: (text as string) || '',
      url: (url as string) || '',
    });
  }, [router.query]);

  const handleCopyToClipboard = async () => {
    const shareText = `${sharedData.title || ''}
${sharedData.text || ''}
${sharedData.url || ''}`;

    try {
      await navigator.clipboard.writeText(shareText.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleSaveToContacts = async () => {
    setProcessing(true);

    try {
      // Here you would typically save to your backend or local storage
      // For demo purposes, we'll simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Save to localStorage as a fallback
      const savedShares = JSON.parse(localStorage.getItem('savedShares') || '[]');
      const newShare = {
        ...sharedData,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      };

      savedShares.push(newShare);
      localStorage.setItem('savedShares', JSON.stringify(savedShares));

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Failed to save shared content:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleShareViaEmail = () => {
    const subject = encodeURIComponent(sharedData.title || 'Shared Content');
    const body = encodeURIComponent(
      `${sharedData.text || ''}

${sharedData.url || ''}

Shared via Trae AI Agency`
    );

    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleShareViaSMS = () => {
    const message = encodeURIComponent(
      `${sharedData.title || ''} ${sharedData.text || ''} ${sharedData.url || ''}`
    );

    window.open(`sms:?body=${message}`);
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Content Saved - Trae AI Agency</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto text-center shadow-lg">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-900 dark:text-green-100">
                Content Saved!
              </CardTitle>
              <CardDescription className="text-green-600 dark:text-green-400">
                Your shared content has been saved successfully.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Share Content - Trae AI Agency</title>
        <meta name="description" content="Share and manage content with Trae AI Agency" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Shared Content
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Manage and share your content
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Shared Content Display */}
              <div className="space-y-4">
                {sharedData.title && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <Input
                      value={sharedData.title}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                )}

                {sharedData.text && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content
                    </label>
                    <Textarea
                      value={sharedData.text}
                      readOnly
                      rows={4}
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                )}

                {sharedData.url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={sharedData.url}
                        readOnly
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(sharedData.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button onClick={handleCopyToClipboard} variant="outline" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>

                <Button
                  onClick={handleSaveToContacts}
                  disabled={processing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {processing ? 'Saving...' : 'Save Content'}
                </Button>

                <Button onClick={handleShareViaEmail} variant="outline" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Share via Email
                </Button>

                <Button onClick={handleShareViaSMS} variant="outline" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Share via SMS
                </Button>
              </div>

              {/* Info Badge */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Badge variant="secondary" className="w-full justify-center py-2">
                  <Share2 className="w-3 h-3 mr-1" />
                  Powered by PWA Share Target
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// Handle POST requests for file sharing
export async function getServerSideProps(context: any) {
  const { req } = context;

  // Handle POST request with form data
  if (req.method === 'POST') {
    // In a real implementation, you would parse multipart/form-data here
    // For now, we'll redirect to the GET version
    return {
      redirect: {
        destination: '/share',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

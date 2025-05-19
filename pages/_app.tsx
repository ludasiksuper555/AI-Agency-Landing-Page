import '../styles/globals.css';
import type { AppProps } from 'next/app';
import ClerkProvider from '../components/ClerkProvider';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
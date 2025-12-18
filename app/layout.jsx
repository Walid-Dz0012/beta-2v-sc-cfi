// social-app-frontend/app/layout.jsx
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'موقع التواصل الاجتماعي',
  description: 'منصة تواصل اجتماعي آمنة',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <main style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          {children}
        </main>
        <footer style={{ 
          textAlign: 'center', 
          padding: '20px', 
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #ddd',
          marginTop: '50px'
        }}>
          <p>© 2024 موقع التواصل الاجتماعي - النسخة التجريبية</p>
        </footer>
      </body>
    </html>
  );
}

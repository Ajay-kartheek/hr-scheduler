import './globals.css';

export const metadata = {
  title: 'HR Scheduler | Shellkode Technologies',
  description: 'AI-powered HR onboarding and pre-boarding automation platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

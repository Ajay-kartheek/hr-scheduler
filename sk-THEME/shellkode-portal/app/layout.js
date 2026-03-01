import './globals.css';

export const metadata = {
  title: 'Shellkode — HR Scheduler',
  description: 'Shellkode HR Portal — Sign in to your workspace',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

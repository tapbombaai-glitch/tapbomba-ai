export const metadata = {
  title: 'Top Bomba AI',
  description: 'AI for Nigerian Business Owners',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{margin:0,background:'#000'}}>{children}</body></html>
}
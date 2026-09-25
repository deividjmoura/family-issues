export default function ExecutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="theme-game min-h-screen">
      {children}
    </div>
  );
}

import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="text-center">
      <h1 className="mb-4 text-2xl font-bold">Verifica tu email</h1>
      <p className="mb-6 text-muted-foreground">
        La verificación de email se habilitará en una próxima fase. Mientras tanto, puedes
        iniciar sesión.
      </p>
      <Link href="/login" className="text-sm hover:underline">
        Ir a iniciar sesión
      </Link>
    </div>
  );
}

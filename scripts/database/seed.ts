// Ejecuta el seed principal de la base de datos.
// `main` se exporta, pero el seed solo se auto-ejecuta cuando es el entrypoint:
// hay que invocarlo explícitamente desde aquí.
import { main } from '../../packages/database/prisma/seed';

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });


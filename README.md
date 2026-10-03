# Frontend Angular

Cliente Angular standalone para LJ Nail Spa. La guia de rutas de interfaz previstas, arquitectura, API y configuracion compartida esta en [la documentacion general](../README.md).

## Componentes principales

- `src/ui/booking/booking.component.*`: flujo de reserva, consulta catalogo/disponibilidad y envio de la reserva.
- `src/ui/admin/login.component.*`: inicio de sesion de administradores.
- `src/ui/admin/dashboard.component.*`: servicios, trabajadoras y horarios semanales.
- `src/ui/admin/appointments.component.*`: listado de reservas y cambios de estado.
- `src/ui/admin/customers.component.*`: directorio y edicion de clientes registrados.
- `src/infraestructure/booking-api.service.ts`: cliente HTTP de catalogo, disponibilidad y reservas.
- `src/infraestructure/admin-api.service.ts`: cliente HTTP administrativo y almacenamiento local del token.

## Estado del router

Las vistas no estan conectadas todavia: `src/ui/app/app.routes.ts` exporta `routes = []`. Las URLs usadas por los enlaces son rutas previstas, no rutas funcionales hasta registrar sus componentes y asociar el `adminGuard` donde corresponda.

## Comandos

```powershell
npm install
npm start
npm run build
npm test
```

El cliente espera la API en `http://localhost:3000`.
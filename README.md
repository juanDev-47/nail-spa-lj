# Frontend Angular

Cliente Angular standalone para LJ Nail Spa. La guia de rutas de interfaz previstas, arquitectura, API y configuracion compartida esta en [la documentacion general](../README.md).

## Componentes principales

- `src/ui/booking/booking.component.*`: flujo de reserva, consulta catalogo/disponibilidad y envio de la reserva.
- `src/ui/privacy/privacy.component.*`: politica de privacidad y canal de contacto para solicitudes sobre datos personales.
- `src/ui/admin/login.component.*`: inicio de sesion de administradores.
- `src/ui/admin/dashboard.component.*`: servicios, trabajadoras y horarios semanales.
- `src/ui/admin/appointments.component.*`: listado de reservas y cambios de estado.
- `src/ui/admin/customers.component.*`: directorio y edicion de clientes registrados.
- `src/infraestructure/booking-api.service.ts`: cliente HTTP de catalogo, disponibilidad y reservas.
- `src/infraestructure/admin-api.service.ts`: cliente HTTP administrativo y almacenamiento local del token.

Al reservar, se solicita un celular colombiano y la autorizacion para recibir la confirmacion por WhatsApp de Siempre Lindas LJ. Si no se puede confirmar el envio, se informa que la cita ya quedo guardada para evitar una reserva duplicada. La configuracion y envio de la plantilla se realizan en el backend.

## Estado del router

Las rutas activas se definen en `src/app.routes.ts`. La politica de privacidad esta disponible en `/politica-de-privacidad` y enlazada desde la reserva. El plazo de conservacion debe ser definido por la responsable y actualizado en la politica.

## Comandos

```powershell
npm install
npm start
npm run build
npm test
```

El cliente espera la API en `http://localhost:3000`.
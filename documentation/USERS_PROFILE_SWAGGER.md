# Documentación de endpoints de perfil de usuario

## Endpoints nuevos

### GET /users/profile

- Descripción: obtiene el perfil del usuario autenticado.
- Protección: requiere `Authorization: Bearer <token>`.
- Devuelve:
  - `id_user`
  - `email`
  - `username`
  - `lastname` (null si no existe)
  - `role` con `id_role` y `type`

#### Respuesta exitosa

```json
{
  "success": true,
  "data": {
    "id_user": 1,
    "email": "admin@andestur.com",
    "username": "admin",
    "lastname": null,
    "role": {
      "id_role": 1,
      "type": "admin"
    }
  }
}
```

#### Errores posibles

- `401` si no hay token o es inválido
- `404` si el usuario autenticado no existe
- `500` si ocurre un error interno

### PUT /users/profile_update

- Descripción: actualiza los datos del usuario autenticado.
- Protector: requiere `Authorization: Bearer <token>`.
- Campos permitidos:
  - `username`
  - `email`
  - `password`

#### Request body

```json
{
  "username": "nuevoUsuario",
  "email": "nuevo@email.com",
  "password": "NuevaPass123!"
}
```

#### Respuesta exitosa

```json
{
  "success": true,
  "data": {
    "id_user": 1,
    "email": "nuevo@email.com",
    "username": "nuevoUsuario",
    "lastname": null,
    "role": {
      "id_role": 1,
      "type": "admin"
    }
  }
}
```

#### Errores posibles

- `400` si no se envían campos válidos
- `401` si no hay token o es inválido
- `404` si el usuario autenticado no existe
- `500` si ocurre un error interno

## Documentación JSDoc / Swagger

Los comentarios JSDoc fueron agregados en `src/controllers/users.controller.js` con la estructura Swagger:

- `@swagger`
- `paths` para `GET /users/profile` y `PUT /users/profile_update`
- definición de respuestas `200`, `400`, `401`, `404`, `500`

## Archivos modificados

- `src/controllers/users.controller.js`
- `src/routes/users.routes.js`
- `src/validations/schemas.js`
- `documentation/USERS_PROFILE_SWAGGER.md`

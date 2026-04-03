# Routing

Routes are defined with an HTTP verb, path, and handler.

## String Handlers

String handlers map to controller methods:

```ts
web.get('/', 'AppController@index');
web.get('/users/:id', 'UserController@show');
```

## Functional Handlers

You can also use inline functions:

```ts
web.get('/health', () => new Response('OK', { status: 200 }));
```

## Path Parameters

Named parameters are available through request params:

```ts
const id = req.params('id');
```

## Recommended Route Layout

- Keep route declarations in src/config/routes/web.ts.
- Group routes by domain when the app grows.
- Keep handlers thin and delegate to services.

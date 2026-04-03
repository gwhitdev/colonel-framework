# Views and Static Files

Colonel uses EJS views with optional layout and partials.

## View Payload Shape

Controllers can return:

```ts
[
  'base/index',
  { titleData: 'Welcome' },
  'base/layouts/main',
  'base/partials/footer',
  'base/partials/title'
]
```

Only template and data are required.

## Layout Composition

Kernel renders:

1. child template
2. footer partial
3. title partial
4. final layout

## Static Files

Static requests are detected using configured prefixes and served from public.

Configure accepted content types in:

- src/config/acceptedStaticContentTypes.ts

Configure static path prefixes in:

- src/config/staticPaths.ts

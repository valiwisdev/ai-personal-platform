import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["drizzle/meta/**"] },
  ...tseslint.configs.recommended,
);

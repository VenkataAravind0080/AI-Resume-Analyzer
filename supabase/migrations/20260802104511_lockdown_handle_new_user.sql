/*
# Lock down handle_new_user trigger function

The `handle_new_user()` function is a SECURITY DEFINER trigger that auto-creates
a profile row when a new auth user signs up. It should ONLY be invoked by the
Postgres trigger on `auth.users`, never directly via the REST API.

## Security changes
- Revoke EXECUTE on `handle_new_user` from `anon` and `authenticated` roles.
  The trigger still fires because triggers run with the function owner's privileges.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

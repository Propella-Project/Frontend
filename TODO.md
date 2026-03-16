# TODO: Replace account/me/ endpoint - REVERTED

1. [x] Initially replaced with `/api/accounts/current_user/`
2. [x] Reverted to `/accounts/me/` per user request (fixes login loop)
3. [x] Verified: authApi.getMe() uses endpoints.auth.me (now original)

Task adjusted complete.
